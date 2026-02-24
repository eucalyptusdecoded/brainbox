const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const { db } = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { compileContext } = require('../utils/compileContext');

const archiver = require('archiver');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const ALLOWED_EXTS = ['.txt', '.pdf', '.docx', '.csv'];
const MAX_TEXT_LENGTH = 500000;

const router = express.Router();
router.use(authMiddleware);

// Rate limiting for AI generation
const generateCooldowns = new Map();
const GENERATE_COOLDOWN_MS = 60 * 1000;

function checkGenerateCooldown(userId) {
  const lastGen = generateCooldowns.get(userId);
  if (lastGen) {
    const elapsed = Date.now() - lastGen;
    if (elapsed < GENERATE_COOLDOWN_MS) {
      return Math.ceil((GENERATE_COOLDOWN_MS - elapsed) / 1000);
    }
  }
  return 0;
}

const MAX_BRAINS_PER_USER = 15;

async function checkBrainLimit(userId) {
  const result = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM brains WHERE user_id = ?',
    args: [userId],
  });
  return result.rows[0].count >= MAX_BRAINS_PER_USER;
}

// Shared AI brain generation logic
async function generateBrainFromAI(userId, userInput) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { error: 'AI generation is not configured', status: 500 };
  }

  const systemPrompt = `You are an AI brain builder for Brainbox, a platform that creates portable AI context files. Given a user's description or document, generate a complete brain with structured sections.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "name": "Short brain name (2-5 words)",
  "description": "One sentence describing what this brain does",
  "sections": [
    {
      "type": "rule",
      "title": "Section title",
      "content": "Detailed section content",
      "priority": 50
    }
  ]
}

Section types and their purposes:
- "rule": Core instructions the AI must follow (e.g. tone of voice, formatting rules, response structure)
- "memory": Facts, knowledge, and context the AI should know (e.g. company info, product details, FAQs)
- "behaviour": How the AI should act and respond (e.g. personality, conversation style, handling edge cases)
- "guardrail": Boundaries and restrictions (e.g. topics to avoid, compliance requirements, safety rules)
- "skill": Specific capabilities or tasks the AI can perform (e.g. writing emails, analysing data, generating reports)

Guidelines:
- Generate 8-15 sections across multiple types for a well-rounded brain
- Each section should have substantive, actionable content (3-8 sentences)
- Priority ranges from 0 (highest) to 100 (lowest), default 50
- Make the content specific and practical, not generic
- Use the context provided to make sections relevant and detailed`;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error('DeepSeek API error:', response.status, errBody);
    return { error: 'AI generation failed. Please try again.', status: 502 };
  }

  const aiResult = await response.json();
  const content = aiResult.choices?.[0]?.message?.content;
  if (!content) {
    return { error: 'AI returned an empty response. Please try again.', status: 502 };
  }

  let parsed;
  try {
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('Failed to parse AI response:', content);
    return { error: 'AI returned an invalid response. Please try again.', status: 502 };
  }

  if (!parsed.name || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    return { error: 'AI returned an incomplete response. Please try again.', status: 502 };
  }

  const VALID_TYPES = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];
  const validSections = parsed.sections.filter(s => VALID_TYPES.includes(s.type) && s.title && s.content);

  const brainId = uuidv4();
  await db.execute({
    sql: 'INSERT INTO brains (id, user_id, name, description) VALUES (?, ?, ?, ?)',
    args: [brainId, userId, parsed.name, parsed.description || null],
  });

  for (const s of validSections) {
    await db.execute({
      sql: 'INSERT INTO brain_sections (id, brain_id, type, title, content, is_active, priority) VALUES (?, ?, ?, ?, ?, 1, ?)',
      args: [uuidv4(), brainId, s.type, s.title, s.content, s.priority ?? 50],
    });
  }

  const result = await db.execute({ sql: 'SELECT * FROM brains WHERE id = ?', args: [brainId] });
  return { brain: result.rows[0] };
}

// GET /api/brains
router.get('/', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT b.*, COUNT(bs.id) as section_count
            FROM brains b
            LEFT JOIN brain_sections bs ON bs.brain_id = b.id
            WHERE b.user_id = ?
            GROUP BY b.id
            ORDER BY b.updated_at DESC`,
      args: [req.user.id],
    });
    res.json(result.rows);
  } catch (err) {
    console.error('Get brains error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/brains
router.post('/', async (req, res) => {
  try {
    const { name, description, template_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    if (await checkBrainLimit(req.user.id)) {
      return res.status(400).json({ error: `You can have a maximum of ${MAX_BRAINS_PER_USER} brains. Delete an existing brain to create a new one.` });
    }

    const id = uuidv4();
    if (template_id) {
      await db.execute({
        sql: 'INSERT INTO brains (id, user_id, name, description, template_id) VALUES (?, ?, ?, ?, ?)',
        args: [id, req.user.id, name, description || null, template_id],
      });
    } else {
      await db.execute({
        sql: 'INSERT INTO brains (id, user_id, name, description) VALUES (?, ?, ?, ?)',
        args: [id, req.user.id, name, description || null],
      });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM brains WHERE id = ?',
      args: [id],
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create brain error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/brains/import — import a .brainbox JSON file (must be before /:id routes)
const importUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
router.post('/import', importUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    if (await checkBrainLimit(req.user.id)) {
      return res.status(400).json({ error: `You can have a maximum of ${MAX_BRAINS_PER_USER} brains. Delete an existing brain to import a new one.` });
    }

    let data;
    try {
      data = JSON.parse(req.file.buffer.toString('utf-8'));
    } catch {
      return res.status(400).json({ error: 'Invalid file format. Expected a .brainbox JSON file.' });
    }

    if (!data.version || !data.name || !Array.isArray(data.sections)) {
      return res.status(400).json({ error: 'Invalid .brainbox file structure' });
    }

    const VALID_TYPES = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];
    for (const s of data.sections) {
      if (!VALID_TYPES.includes(s.type)) return res.status(400).json({ error: `Invalid section type: ${s.type}` });
      if (!s.title) return res.status(400).json({ error: 'Each section must have a title' });
      if (s.content && s.content.length > 2000) return res.status(400).json({ error: `Section "${s.title}" exceeds 2000 character limit` });
      if (s.title.length > 50) return res.status(400).json({ error: `Section title "${s.title}" exceeds 50 character limit` });
    }

    const imgs = Array.isArray(data.images) ? data.images.slice(0, 10) : [];
    for (const img of imgs) {
      if (!img.url || !img.description) return res.status(400).json({ error: 'Each image must have a url and description' });
      if (img.description.length > 200) return res.status(400).json({ error: `Image description exceeds 200 character limit` });
    }

    const brainId = uuidv4();
    await db.execute({
      sql: 'INSERT INTO brains (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      args: [brainId, req.user.id, data.name, data.description || null],
    });

    for (const s of data.sections) {
      await db.execute({
        sql: 'INSERT INTO brain_sections (id, brain_id, type, title, content, is_active, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [uuidv4(), brainId, s.type, s.title, s.content || '', s.is_active ?? 1, s.priority ?? 50],
      });
    }

    for (const img of imgs) {
      await db.execute({
        sql: 'INSERT INTO brain_images (id, brain_id, url, description, priority) VALUES (?, ?, ?, ?, ?)',
        args: [uuidv4(), brainId, img.url, img.description, img.priority ?? 0],
      });
    }

    const result = await db.execute({ sql: 'SELECT * FROM brains WHERE id = ?', args: [brainId] });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Import brain error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/brains/generate — generate a brain using DeepSeek AI
router.post('/generate', async (req, res) => {
  try {
    const { description, fileContent } = req.body;
    if (!description && !fileContent) {
      return res.status(400).json({ error: 'Provide a description or file content' });
    }

    if (await checkBrainLimit(req.user.id)) {
      return res.status(400).json({ error: `You can have a maximum of ${MAX_BRAINS_PER_USER} brains. Delete an existing brain to create a new one.` });
    }

    const waitSeconds = checkGenerateCooldown(req.user.id);
    if (waitSeconds > 0) {
      return res.status(429).json({ error: `Please wait before generating another brain. Try again in ${waitSeconds} seconds.` });
    }

    const truncated = fileContent && fileContent.length > 30000;
    let userInput = fileContent
      ? `Here is the context document:\n\n${fileContent.slice(0, 30000)}${description ? `\n\nAdditional instructions: ${description}` : ''}`
      : description;
    if (truncated) {
      userInput += '\n\n(Note: The document was truncated to fit within processing limits. The first 30,000 characters were used.)';
    }

    const result = await generateBrainFromAI(req.user.id, userInput);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    generateCooldowns.set(req.user.id, Date.now());
    res.status(201).json(result.brain);
  } catch (err) {
    console.error('Generate brain error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/brains/generate-with-file — generate a brain from an uploaded file
router.post('/generate-with-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (await checkBrainLimit(req.user.id)) {
      return res.status(400).json({ error: `You can have a maximum of ${MAX_BRAINS_PER_USER} brains. Delete an existing brain to create a new one.` });
    }

    const waitSeconds = checkGenerateCooldown(req.user.id);
    if (waitSeconds > 0) {
      return res.status(429).json({ error: `Please wait before generating another brain. Try again in ${waitSeconds} seconds.` });
    }

    const extracted = await extractText(req.file);
    if (extracted.error) {
      return res.status(400).json({ error: extracted.error });
    }

    const description = req.body.description || null;
    const truncated = extracted.text.length > 30000;
    let userInput = `Here is the context document:\n\n${extracted.text.slice(0, 30000)}${description ? `\n\nAdditional instructions: ${description}` : ''}`;
    if (truncated) {
      userInput += '\n\n(Note: The document was truncated to fit within processing limits. The first 30,000 characters were used.)';
    }

    const result = await generateBrainFromAI(req.user.id, userInput);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    generateCooldowns.set(req.user.id, Date.now());
    res.status(201).json(result.brain);
  } catch (err) {
    console.error('Generate brain with file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/brains/:id
router.get('/:id', async (req, res) => {
  try {
    const brain = await db.execute({
      sql: 'SELECT * FROM brains WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id],
    });
    if (brain.rows.length === 0) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const [sections, images] = await Promise.all([
      db.execute({
        sql: 'SELECT * FROM brain_sections WHERE brain_id = ? ORDER BY type, priority',
        args: [req.params.id],
      }),
      db.execute({
        sql: 'SELECT * FROM brain_images WHERE brain_id = ? ORDER BY priority',
        args: [req.params.id],
      }),
    ]);

    res.json({ ...brain.rows[0], sections: sections.rows, images: images.rows });
  } catch (err) {
    console.error('Get brain error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/brains/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;

    const existing = await db.execute({
      sql: 'SELECT * FROM brains WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id],
    });
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    await db.execute({
      sql: 'UPDATE brains SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [name || existing.rows[0].name, description ?? existing.rows[0].description, req.params.id],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM brains WHERE id = ?',
      args: [req.params.id],
    });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update brain error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/brains/:id
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.execute({
      sql: 'SELECT * FROM brains WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id],
    });
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    await db.execute({ sql: 'DELETE FROM brain_sections WHERE brain_id = ?', args: [req.params.id] });
    await db.execute({ sql: 'DELETE FROM api_keys WHERE brain_id = ?', args: [req.params.id] });
    await db.execute({ sql: 'DELETE FROM brains WHERE id = ?', args: [req.params.id] });

    res.json({ message: 'Brain deleted' });
  } catch (err) {
    console.error('Delete brain error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/brains/:id/export — export brain as .brainbox JSON file
router.get('/:id/export', async (req, res) => {
  try {
    const brain = await db.execute({
      sql: 'SELECT * FROM brains WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id],
    });
    if (brain.rows.length === 0) return res.status(404).json({ error: 'Brain not found' });

    const [sections, images] = await Promise.all([
      db.execute({ sql: 'SELECT * FROM brain_sections WHERE brain_id = ? ORDER BY type, priority', args: [req.params.id] }),
      db.execute({ sql: 'SELECT * FROM brain_images WHERE brain_id = ? ORDER BY priority', args: [req.params.id] }),
    ]);

    const payload = {
      version: 1,
      name: brain.rows[0].name,
      description: brain.rows[0].description || '',
      exported_at: new Date().toISOString(),
      sections: sections.rows.map(s => ({
        type: s.type,
        title: s.title,
        content: s.content,
        priority: s.priority,
        is_active: s.is_active,
      })),
      images: images.rows.map(i => ({
        url: i.url,
        description: i.description,
        priority: i.priority,
      })),
    };

    const filename = `${brain.rows[0].name.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-')}.brainbox`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error('Export brain error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/brains/:id/context — download compiled brain context as .txt
router.get('/:id/context', async (req, res) => {
  try {
    const brain = await db.execute({
      sql: 'SELECT * FROM brains WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id],
    });
    if (brain.rows.length === 0) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const sections = await db.execute({
      sql: 'SELECT * FROM brain_sections WHERE brain_id = ?',
      args: [req.params.id],
    });

    const compiled = compileContext(sections.rows);
    const filename = `brainbox-${brain.rows[0].name.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-')}.txt`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(compiled || 'No active context found for this brain.');
  } catch (err) {
    console.error('Download context error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/brains/:id/images/download — download reference images as a zip
router.get('/:id/images/download', async (req, res) => {
  try {
    const brain = await db.execute({
      sql: 'SELECT * FROM brains WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id],
    });
    if (brain.rows.length === 0) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const images = await db.execute({
      sql: 'SELECT * FROM brain_images WHERE brain_id = ? ORDER BY priority ASC',
      args: [req.params.id],
    });
    if (images.rows.length === 0) {
      return res.status(404).json({ error: 'No images found for this brain' });
    }

    const brainName = brain.rows[0].name.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="brainbox-${brainName}-images.zip"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    for (let i = 0; i < images.rows.length; i++) {
      const img = images.rows[i];
      try {
        const response = await fetch(img.url);
        if (!response.ok) continue;
        const contentType = response.headers.get('content-type') || '';
        const ext = contentType.includes('png') ? '.png'
          : contentType.includes('webp') ? '.webp'
          : contentType.includes('gif') ? '.gif'
          : contentType.includes('svg') ? '.svg'
          : '.jpg';
        const safeName = (img.description || `image-${i + 1}`).replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').slice(0, 60);
        const buffer = Buffer.from(await response.arrayBuffer());
        archive.append(buffer, { name: `${safeName}${ext}` });
      } catch (fetchErr) {
        console.error(`Failed to fetch image ${img.url}:`, fetchErr.message);
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error('Download images error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Shared file text extraction helper
async function extractText(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) {
    return { error: `Unsupported file type. Allowed: ${ALLOWED_EXTS.join(', ')}` };
  }

  let text = '';
  if (ext === '.txt' || ext === '.csv') {
    text = file.buffer.toString('utf-8');
  } else if (ext === '.pdf') {
    const parser = new PDFParse({ data: file.buffer });
    const data = await parser.getText();
    text = data.text;
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    text = result.value;
  }

  text = text.trim();
  if (!text) return { error: 'Could not extract any text from this file' };
  if (text.length > MAX_TEXT_LENGTH) {
    return { error: `Extracted text is too large (${Math.round(text.length / 1000)}KB). Maximum is 50KB.` };
  }

  const filename = path.basename(file.originalname, ext).slice(0, 50);
  return { text, filename };
}

// POST /api/brains/:id/extract — extract text from a file without saving
router.post('/:id/extract', upload.single('file'), async (req, res) => {
  try {
    const brain = await db.execute({
      sql: 'SELECT * FROM brains WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id],
    });
    if (brain.rows.length === 0) return res.status(404).json({ error: 'Brain not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const result = await extractText(req.file);
    if (result.error) return res.status(400).json({ error: result.error });

    res.json({ text: result.text, filename: result.filename });
  } catch (err) {
    console.error('Extract error:', err);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// POST /api/brains/:id/upload — upload a file and create a memory section
router.post('/:id/upload', upload.single('file'), async (req, res) => {
  try {
    const brain = await db.execute({
      sql: 'SELECT * FROM brains WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id],
    });
    if (brain.rows.length === 0) return res.status(404).json({ error: 'Brain not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const result = await extractText(req.file);
    if (result.error) return res.status(400).json({ error: result.error });

    const sectionId = uuidv4();
    await db.execute({
      sql: 'INSERT INTO brain_sections (id, brain_id, type, title, content, is_active, priority) VALUES (?, ?, ?, ?, ?, 1, 50)',
      args: [sectionId, req.params.id, 'memory', result.filename, result.text],
    });
    await db.execute({
      sql: 'UPDATE brains SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [req.params.id],
    });

    const section = await db.execute({
      sql: 'SELECT * FROM brain_sections WHERE id = ?',
      args: [sectionId],
    });
    res.status(201).json(section.rows[0]);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

module.exports = router;
