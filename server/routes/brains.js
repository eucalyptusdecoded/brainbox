const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const { db } = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { compileContext } = require('../utils/compileContext');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const ALLOWED_EXTS = ['.txt', '.pdf', '.docx', '.csv'];
const MAX_TEXT_LENGTH = 500000;

const router = express.Router();
router.use(authMiddleware);

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
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const id = uuidv4();
    await db.execute({
      sql: 'INSERT INTO brains (id, user_id, name, description) VALUES (?, ?, ?, ?)',
      args: [id, req.user.id, name, description || null],
    });

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

    const sections = await db.execute({
      sql: 'SELECT * FROM brain_sections WHERE brain_id = ? ORDER BY type, priority',
      args: [req.params.id],
    });

    res.json({ ...brain.rows[0], sections: sections.rows });
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

  const filename = path.basename(file.originalname, ext).slice(0, 20);
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
