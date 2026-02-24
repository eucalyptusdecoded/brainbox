const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(authMiddleware);

// Rate limiting for AI suggestions
const suggestCooldowns = new Map();
const SUGGEST_COOLDOWN_MS = 30 * 1000;

// Helper: verify brain ownership
async function verifyBrainOwner(brainId, userId) {
  const result = await db.execute({
    sql: 'SELECT id FROM brains WHERE id = ? AND user_id = ?',
    args: [brainId, userId],
  });
  return result.rows.length > 0;
}

// GET /api/brains/:id/sections
router.get('/', async (req, res) => {
  try {
    if (!(await verifyBrainOwner(req.params.id, req.user.id))) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM brain_sections WHERE brain_id = ? ORDER BY type, priority',
      args: [req.params.id],
    });
    res.json(result.rows);
  } catch (err) {
    console.error('Get sections error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/brains/:id/sections/suggest — AI-suggested section content
router.post('/suggest', async (req, res) => {
  try {
    if (!(await verifyBrainOwner(req.params.id, req.user.id))) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const lastSuggest = suggestCooldowns.get(req.user.id);
    if (lastSuggest) {
      const elapsed = Date.now() - lastSuggest;
      if (elapsed < SUGGEST_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((SUGGEST_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({ error: `Please wait before generating another brain. Try again in ${waitSeconds} seconds.` });
      }
    }

    const { type } = req.body;
    const validTypes = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'AI suggestions are not configured' });
    }

    const brain = await db.execute({
      sql: 'SELECT name, description FROM brains WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id],
    });

    const sections = await db.execute({
      sql: 'SELECT type, title FROM brain_sections WHERE brain_id = ? ORDER BY type, priority',
      args: [req.params.id],
    });

    const typeLabels = { rule: 'Rules', memory: 'Memories', behaviour: 'Behaviours', guardrail: 'Guardrails', skill: 'Skills' };
    const grouped = {};
    for (const s of sections.rows) {
      const label = typeLabels[s.type] || s.type;
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(s.title);
    }
    const existingList = Object.entries(grouped)
      .map(([label, titles]) => `${label}: ${titles.join(', ')}`)
      .join('\n') || 'None yet';

    const b = brain.rows[0];
    const systemPrompt = `You are helping build an AI brain in Brainbox. Given the brain's existing context, suggest a single new ${type} section that would complement what already exists.

The brain is called "${b.name}"${b.description ? ` and is described as: "${b.description}"` : ''}.

Existing sections:
${existingList}

Return ONLY valid JSON (no markdown, no code fences):
{
  "title": "Short descriptive title (under 50 chars)",
  "content": "Detailed section content (under 2000 chars)"
}

Guidelines:
- Don't duplicate what already exists
- Make the content specific, actionable, and relevant to this brain's purpose
- For rules: clear constraints the AI must follow
- For memories: specific facts or context
- For behaviours: tone and interaction style guidance
- For guardrails: boundaries and restrictions
- For skills: step-by-step workflows`;

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
          { role: 'user', content: `Suggest a new ${type} section for this brain.` },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('DeepSeek suggest error:', response.status, errBody);
      return res.status(502).json({ error: 'AI suggestion failed. Please try again.' });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({ error: 'AI returned an empty response.' });
    }

    let parsed;
    try {
      const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse AI suggestion:', content);
      return res.status(502).json({ error: 'AI returned an invalid response. Please try again.' });
    }

    if (!parsed.title || !parsed.content) {
      return res.status(502).json({ error: 'AI returned an incomplete response. Please try again.' });
    }

    suggestCooldowns.set(req.user.id, Date.now());
    res.json({ title: parsed.title.slice(0, 50), content: parsed.content.slice(0, 2000) });
  } catch (err) {
    console.error('Suggest section error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/brains/:id/sections
router.post('/', async (req, res) => {
  try {
    if (!(await verifyBrainOwner(req.params.id, req.user.id))) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const { type, title, content, priority } = req.body;
    if (!type || !title) {
      return res.status(400).json({ error: 'type and title are required' });
    }
    if (content && content.length > 2000) {
      return res.status(400).json({ error: 'Content must be 2000 characters or fewer' });
    }

    const validTypes = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    }

    const id = uuidv4();
    await db.execute({
      sql: 'INSERT INTO brain_sections (id, brain_id, type, title, content, priority) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, req.params.id, type, title, content || '', priority ?? 50],
    });

    // Update brain timestamp
    await db.execute({
      sql: 'UPDATE brains SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [req.params.id],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM brain_sections WHERE id = ?',
      args: [id],
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create section error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/brains/:id/sections/:sid
router.put('/:sid', async (req, res) => {
  try {
    if (!(await verifyBrainOwner(req.params.id, req.user.id))) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const { type, title, content, is_active, priority } = req.body;
    if (content && content.length > 2000) {
      return res.status(400).json({ error: 'Content must be 2000 characters or fewer' });
    }

    const existing = await db.execute({
      sql: 'SELECT * FROM brain_sections WHERE id = ? AND brain_id = ?',
      args: [req.params.sid, req.params.id],
    });
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const s = existing.rows[0];
    await db.execute({
      sql: `UPDATE brain_sections SET type = ?, title = ?, content = ?, is_active = ?, priority = ? WHERE id = ?`,
      args: [
        type || s.type,
        title || s.title,
        content ?? s.content,
        is_active !== undefined ? (is_active ? 1 : 0) : s.is_active,
        priority !== undefined ? priority : s.priority,
        req.params.sid,
      ],
    });

    await db.execute({
      sql: 'UPDATE brains SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [req.params.id],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM brain_sections WHERE id = ?',
      args: [req.params.sid],
    });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update section error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/brains/:id/sections/:sid
router.delete('/:sid', async (req, res) => {
  try {
    if (!(await verifyBrainOwner(req.params.id, req.user.id))) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    await db.execute({
      sql: 'DELETE FROM brain_sections WHERE id = ? AND brain_id = ?',
      args: [req.params.sid, req.params.id],
    });

    await db.execute({
      sql: 'UPDATE brains SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [req.params.id],
    });

    res.json({ message: 'Section deleted' });
  } catch (err) {
    console.error('Delete section error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/brains/:id/sections/:sid/toggle
router.patch('/:sid/toggle', async (req, res) => {
  try {
    if (!(await verifyBrainOwner(req.params.id, req.user.id))) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const existing = await db.execute({
      sql: 'SELECT * FROM brain_sections WHERE id = ? AND brain_id = ?',
      args: [req.params.sid, req.params.id],
    });
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const newActive = existing.rows[0].is_active ? 0 : 1;
    await db.execute({
      sql: 'UPDATE brain_sections SET is_active = ? WHERE id = ?',
      args: [newActive, req.params.sid],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM brain_sections WHERE id = ?',
      args: [req.params.sid],
    });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Toggle section error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/brains/:id/sections/:sid/priority
router.patch('/:sid/priority', async (req, res) => {
  try {
    if (!(await verifyBrainOwner(req.params.id, req.user.id))) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const { priority } = req.body;
    if (priority === undefined) {
      return res.status(400).json({ error: 'priority is required' });
    }

    await db.execute({
      sql: 'UPDATE brain_sections SET priority = ? WHERE id = ? AND brain_id = ?',
      args: [priority, req.params.sid, req.params.id],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM brain_sections WHERE id = ?',
      args: [req.params.sid],
    });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update priority error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
