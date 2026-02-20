require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { initDatabase } = require('./db/database');

const authRoutes = require('./routes/auth');
const brainRoutes = require('./routes/brains');
const sectionRoutes = require('./routes/sections');
const contextRoutes = require('./routes/context');
const keyRoutes = require('./routes/keys');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://brainboxllm.site', 'https://www.brainboxllm.site', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Public API — allow any origin (called by ChatGPT, external services)
app.use('/api/context', cors(), contextRoutes);

// Authenticated app routes
app.use('/api/auth', authRoutes);
app.use('/api/brains', brainRoutes);
app.use('/api/brains/:id/sections', sectionRoutes);
app.use('/api/keys', keyRoutes);

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
