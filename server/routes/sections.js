const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(authMiddleware);

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

// POST /api/brains/:id/sections
router.post('/', async (req, res) => {
  try {
    if (!(await verifyBrainOwner(req.params.id, req.user.id))) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const { type, title, content, priority } = req.body;
    if (!type || !title || !content) {
      return res.status(400).json({ error: 'type, title, and content are required' });
    }

    const validTypes = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    }

    const id = uuidv4();
    await db.execute({
      sql: 'INSERT INTO brain_sections (id, brain_id, type, title, content, priority) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, req.params.id, type, title, content, priority || 0],
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
