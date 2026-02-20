const bcrypt = require('bcryptjs');
const { db } = require('../db/database');

async function apiKeyMiddleware(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || !key.startsWith('sk_bb_')) {
    return res.status(401).json({ error: 'Missing or invalid API key' });
  }

  const prefix = key.substring(0, 12);

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM api_keys WHERE key_prefix = ?',
      args: [prefix],
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check each matching prefix against the full key hash
    let matched = null;
    for (const row of result.rows) {
      const valid = await bcrypt.compare(key, row.key_hash);
      if (valid) {
        matched = row;
        break;
      }
    }

    if (!matched) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used timestamp
    await db.execute({
      sql: 'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [matched.id],
    });

    req.apiKey = matched;
    next();
  } catch (err) {
    console.error('API key middleware error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = apiKeyMiddleware;
