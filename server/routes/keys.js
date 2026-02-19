const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Generate a random API key: sk_bb_ + 32 alphanumeric chars
function generateApiKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'sk_bb_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(crypto.randomInt(chars.length));
  }
  return key;
}

// GET /api/keys
router.get('/', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT k.id, k.brain_id, k.key_prefix, k.label, k.last_used_at, k.created_at, b.name as brain_name
            FROM api_keys k
            JOIN brains b ON b.id = k.brain_id
            WHERE k.user_id = ?
            ORDER BY k.created_at DESC`,
      args: [req.user.id],
    });
    res.json(result.rows);
  } catch (err) {
    console.error('Get keys error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/keys
router.post('/', async (req, res) => {
  try {
    const { brain_id, label } = req.body;
    if (!brain_id) return res.status(400).json({ error: 'brain_id is required' });

    // Verify brain ownership
    const brain = await db.execute({
      sql: 'SELECT id FROM brains WHERE id = ? AND user_id = ?',
      args: [brain_id, req.user.id],
    });
    if (brain.rows.length === 0) {
      return res.status(404).json({ error: 'Brain not found' });
    }

    const rawKey = generateApiKey();
    const key_hash = await bcrypt.hash(rawKey, 10);
    const key_prefix = rawKey.substring(0, 12);
    const id = uuidv4();

    await db.execute({
      sql: 'INSERT INTO api_keys (id, user_id, brain_id, key_hash, key_prefix, label) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, req.user.id, brain_id, key_hash, key_prefix, label || null],
    });

    // Return the full key ONCE — never again
    res.status(201).json({
      id,
      key: rawKey,
      key_prefix,
      brain_id,
      label: label || null,
      message: 'Save this key now — it will not be shown again.',
    });
  } catch (err) {
    console.error('Create key error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/keys/:id
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.execute({
      sql: 'SELECT id FROM api_keys WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id],
    });
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await db.execute({
      sql: 'DELETE FROM api_keys WHERE id = ?',
      args: [req.params.id],
    });

    res.json({ message: 'API key revoked' });
  } catch (err) {
    console.error('Delete key error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
