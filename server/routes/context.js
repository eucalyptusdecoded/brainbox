const express = require('express');
const { db } = require('../db/database');
const apiKeyMiddleware = require('../middleware/apiKey');
const { compileContext } = require('../utils/compileContext');

const router = express.Router();

// GET /api/context/:brain_id
router.get('/:brain_id', apiKeyMiddleware, async (req, res) => {
  try {
    // Verify the API key is for this brain
    if (req.apiKey.brain_id !== req.params.brain_id) {
      return res.status(403).json({ error: 'API key is not authorized for this brain' });
    }

    const [result, imagesResult] = await Promise.all([
      db.execute({
        sql: 'SELECT * FROM brain_sections WHERE brain_id = ?',
        args: [req.params.brain_id],
      }),
      db.execute({
        sql: 'SELECT * FROM brain_images WHERE brain_id = ? ORDER BY priority',
        args: [req.params.brain_id],
      }),
    ]);

    // Parse optional type filter
    const typesParam = req.query.types;
    const filterTypes = typesParam ? typesParam.split(',').map(t => t.trim()) : null;

    const compiled = compileContext(result.rows, filterTypes, imagesResult.rows);

    if (!compiled) {
      return res.type('text/plain').send('No active context found for this brain.');
    }

    res.type('text/plain').send(compiled);
  } catch (err) {
    console.error('Context endpoint error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
