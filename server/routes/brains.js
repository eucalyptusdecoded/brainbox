const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const authMiddleware = require('../middleware/auth');

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

module.exports = router;
