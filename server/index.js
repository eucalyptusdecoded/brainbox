require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'TURSO_URL', 'TURSO_AUTH_TOKEN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./db/database');

const authRoutes = require('./routes/auth');
const brainRoutes = require('./routes/brains');
const sectionRoutes = require('./routes/sections');
const contextRoutes = require('./routes/context');
const keyRoutes = require('./routes/keys');
const imageRoutes = require('./routes/images');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: { error: 'API rate limit exceeded. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: ['https://brainboxllm.site', 'https://www.brainboxllm.site', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(generalLimiter);

// Public API — allow any origin (called by ChatGPT, external services)
app.use('/api/context', cors(), apiLimiter, contextRoutes);

// Auth routes with stricter rate limiting
app.use('/api/auth', authLimiter, authRoutes);

// Authenticated app routes
app.use('/api/brains', brainRoutes);
app.use('/api/brains/:id/sections', sectionRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/brains/:id/images', imageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'brainbox' });
});

// Serve frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Brainbox server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
