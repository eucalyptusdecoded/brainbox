const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(authMiddleware);

const MAX_IMAGES = 10;

// Helper: verify brain ownership
async function verifyBrainOwner(brainId, userId) {
  const result = await db.execute({
    sql: 'SELECT id FROM brains WHERE id = ? AND user_id = ?',
    args: [brainId, userId],
  });
  return result.rows.length > 0;
}

// GET /api/brains/:id/images
router.get('/', async (req, res) => {
  try {
    if (!(await verifyBrainOwner(req.params.id, req.user.id))) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM brain_images WHERE brain_id = ? ORDER BY priority, created_at',
      args: [req.params.id],
    });
    res.json(result.rows);
  } catch (err) {
    console.error('Get images error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/brains/:id/images
router.post('/', async (req, res) => {
  try {
    if (!(await verifyBrainOwner(req.params.id, req.user.id))) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const { url, description, priority } = req.body;
    if (!url || !description) {
      return res.status(400).json({ error: 'url and description are required' });
    }
    if (description.length > 200) {
      return res.status(400).json({ error: 'Description must be 200 characters or fewer' });
    }

    // Check limit
    const countResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM brain_images WHERE brain_id = ?',
      args: [req.params.id],
    });
    if (countResult.rows[0].count >= MAX_IMAGES) {
      return res.status(400).json({ error: `Maximum ${MAX_IMAGES} images per brain` });
    }

    const id = uuidv4();
    await db.execute({
      sql: 'INSERT INTO brain_images (id, brain_id, url, description, priority) VALUES (?, ?, ?, ?, ?)',
      args: [id, req.params.id, url, description, priority || 0],
    });

    await db.execute({
      sql: 'UPDATE brains SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [req.params.id],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM brain_images WHERE id = ?',
      args: [id],
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create image error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/brains/:id/images/:imgId
router.put('/:imgId', async (req, res) => {
  try {
    if (!(await verifyBrainOwner(req.params.id, req.user.id))) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const { url, description, priority } = req.body;
    if (description && description.length > 200) {
      return res.status(400).json({ error: 'Description must be 200 characters or fewer' });
    }

    const existing = await db.execute({
      sql: 'SELECT * FROM brain_images WHERE id = ? AND brain_id = ?',
      args: [req.params.imgId, req.params.id],
    });
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const img = existing.rows[0];
    await db.execute({
      sql: 'UPDATE brain_images SET url = ?, description = ?, priority = ? WHERE id = ?',
      args: [
        url || img.url,
        description || img.description,
        priority !== undefined ? priority : img.priority,
        req.params.imgId,
      ],
    });

    await db.execute({
      sql: 'UPDATE brains SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [req.params.id],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM brain_images WHERE id = ?',
      args: [req.params.imgId],
    });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update image error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/brains/:id/images/:imgId
router.delete('/:imgId', async (req, res) => {
  try {
    if (!(await verifyBrainOwner(req.params.id, req.user.id))) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    await db.execute({
      sql: 'DELETE FROM brain_images WHERE id = ? AND brain_id = ?',
      args: [req.params.imgId, req.params.id],
    });

    await db.execute({
      sql: 'UPDATE brains SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [req.params.id],
    });

    res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
