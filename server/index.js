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

// Server-rendered documentation page (crawlable by LLMs and search engines)
app.get('/documentation', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentation — Brainbox</title>
  <meta name="description" content="Brainbox documentation. Learn how to build portable AI brains that work across ChatGPT, Claude, Gemini, Perplexity, Copilot, and Grok.">
  <meta property="og:title" content="Brainbox Documentation">
  <meta property="og:description" content="Build portable AI brains that work across ChatGPT, Claude, Gemini, Perplexity, Copilot, and Grok.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://brainboxllm.site/documentation">
  <meta property="og:image" content="https://brainboxllm.site/images/brainboxsquare.png">
  <link rel="icon" type="image/png" href="/images/brainboxfavecon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; color: #1A1A1A; background: #FAFAF7; line-height: 1.6; }
    a { color: #FF7A00; text-decoration: none; }
    a:hover { color: #E56E00; }
    .container { max-width: 720px; margin: 0 auto; padding: 0 24px; }
    .header { padding: 16px 0; border-bottom: 1px solid #E5E5E5; background: #fff; }
    .header-inner { display: flex; align-items: center; justify-content: space-between; max-width: 720px; margin: 0 auto; padding: 0 24px; }
    .header img { height: 32px; }
    .header nav a { font-size: 14px; font-weight: 500; margin-left: 24px; }
    .hero { text-align: center; padding: 64px 24px; }
    .hero img { height: 80px; }
    .hero h1 { font-size: 36px; font-weight: 700; margin-top: 24px; }
    .hero p { font-size: 16px; color: #6B6B6B; margin-top: 12px; max-width: 480px; margin-left: auto; margin-right: auto; }
    .btn { display: inline-block; background: #FF7A00; color: #fff; font-weight: 500; padding: 12px 32px; border-radius: 8px; font-size: 16px; margin-top: 24px; }
    .btn:hover { background: #E56E00; color: #fff; }
    section { padding: 48px 0; }
    section + section { border-top: 1px solid #E5E5E5; }
    h2 { font-size: 24px; font-weight: 700; margin-bottom: 16px; }
    h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    p, li { font-size: 15px; color: #4A4A4A; }
    ul, ol { padding-left: 20px; }
    li { margin-bottom: 8px; }
    .card-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 16px; }
    @media (min-width: 640px) { .card-grid { grid-template-columns: 1fr 1fr; } }
    .card { background: #fff; border: 1px solid #E5E5E5; border-radius: 12px; padding: 20px; }
    .card h3 { color: #FF7A00; margin-bottom: 4px; }
    .card p { font-size: 14px; }
    .llm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
    @media (min-width: 640px) { .llm-grid { grid-template-columns: repeat(3, 1fr); } }
    .llm-card { background: #fff; border: 1px solid #E5E5E5; border-radius: 8px; padding: 16px; text-align: center; }
    .llm-card strong { display: block; font-size: 14px; color: #1A1A1A; }
    .llm-card span { font-size: 12px; color: #6B6B6B; }
    .steps { counter-reset: step; list-style: none; padding-left: 0; }
    .steps li { counter-increment: step; padding-left: 36px; position: relative; margin-bottom: 16px; }
    .steps li::before { content: counter(step); position: absolute; left: 0; top: 0; width: 24px; height: 24px; background: #FF7A00; color: #fff; border-radius: 50%; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
    .cta { text-align: center; padding: 64px 24px; }
    .footer { text-align: center; padding: 32px 24px; border-top: 1px solid #E5E5E5; font-size: 13px; color: #6B6B6B; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-inner">
      <a href="/home"><img src="/images/brainboxlong.png" alt="Brainbox"></a>
      <nav>
        <a href="/home">Home</a>
        <a href="/login">Sign In</a>
      </nav>
    </div>
  </div>

  <div class="hero">
    <img src="/images/brainboxlogo.png" alt="Brainbox">
    <h1>Take your AI brain anywhere</h1>
    <p>Build a portable AI brain once and deploy it across every major LLM platform for consistent, personalised output everywhere.</p>
  </div>

  <div class="container">
    <section>
      <h2>What is Brainbox?</h2>
      <p>Brainbox is a platform for building structured AI brains — portable context configurations that tell any AI model who you are, how you work, and what you expect. Instead of re-explaining yourself every time you start a new chat, you build your brain once and deploy it into ChatGPT, Claude, Gemini, Perplexity, Copilot, or Grok. Your AI remembers everything, every time.</p>
    </section>

    <section>
      <h2>Why Brainbox?</h2>
      <ul>
        <li><strong>Portable</strong> — Your brain works across every major LLM. Switch models without losing context.</li>
        <li><strong>Structured</strong> — Five distinct section types give your AI clear, organised instructions instead of one messy prompt.</li>
        <li><strong>Consistent</strong> — Every conversation starts with the same foundation. No more inconsistent AI behaviour.</li>
        <li><strong>Model-agnostic</strong> — Not locked into any single platform. Use the best model for each task.</li>
        <li><strong>Always up to date</strong> — Edit your brain once and every connected LLM picks up the changes.</li>
      </ul>
    </section>

    <section>
      <h2>How It Works</h2>
      <ol class="steps">
        <li><strong>Build your brain</strong> — Create rules, memories, behaviours, guardrails, and skills inside Brainbox. Upload reference images and documents to enrich your context.</li>
        <li><strong>Generate your configuration</strong> — Brainbox compiles your brain into a structured context file optimised for AI consumption. Preview it before deploying.</li>
        <li><strong>Deploy it anywhere</strong> — Connect your brain to any supported LLM platform. Use our step-by-step integration guides for each platform — no coding required.</li>
      </ol>
    </section>

    <section>
      <h2>Brain Anatomy</h2>
      <p>Every brain is made up of five section types. Each type serves a distinct purpose, giving the AI clear and structured instructions.</p>
      <div class="card-grid">
        <div class="card">
          <h3>Rules</h3>
          <p>Hard constraints the AI must always follow. Non-negotiable instructions that shape every response.</p>
        </div>
        <div class="card">
          <h3>Memories</h3>
          <p>Persistent context about you, your project, or your domain. Facts the AI should always know.</p>
        </div>
        <div class="card">
          <h3>Behaviours</h3>
          <p>How the AI communicates — its tone, style, formatting preferences, and interaction patterns.</p>
        </div>
        <div class="card">
          <h3>Guardrails</h3>
          <p>Boundaries and safety limits. Topics, actions, or outputs the AI should avoid.</p>
        </div>
        <div class="card">
          <h3>Skills</h3>
          <p>Step-by-step workflows and capabilities. Teach the AI specific processes for particular tasks.</p>
        </div>
        <div class="card">
          <h3>Image References</h3>
          <p>Visual context like logos, style guides, and screenshots. Included in the compiled context for vision-capable models.</p>
        </div>
      </div>
    </section>

    <section>
      <h2>Supported LLMs</h2>
      <p>Brainbox integrates with all major AI platforms. Each integration includes a step-by-step guide — most require no coding.</p>
      <div class="llm-grid">
        <div class="llm-card"><strong>Custom GPT</strong><span>OpenAI</span></div>
        <div class="llm-card"><strong>Gemini Gem</strong><span>Google</span></div>
        <div class="llm-card"><strong>Claude Project</strong><span>Anthropic</span></div>
        <div class="llm-card"><strong>Perplexity Space</strong><span>Perplexity</span></div>
        <div class="llm-card"><strong>Copilot Agent</strong><span>Microsoft</span></div>
        <div class="llm-card"><strong>Grok</strong><span>xAI</span></div>
      </div>
    </section>

    <section>
      <h2>Templates</h2>
      <p>Get started quickly with pre-built brain templates designed for common use cases:</p>
      <ul>
        <li><strong>Brand Copywriter</strong> — Maintain your brand voice across blogs, social media, email, and web content.</li>
        <li><strong>Brand Image Generator</strong> — Keep visual identity consistent across AI-generated images.</li>
        <li><strong>Data Analyst</strong> — Standardise analysis methodology, reporting formats, and data handling.</li>
        <li><strong>Project Manager</strong> — Consistent project communication, status updates, and task management.</li>
      </ul>
    </section>

    <section>
      <h2>API Access</h2>
      <p>Brainbox provides a REST API for developers who want to integrate brain context into their own applications. Generate an API key, call the context endpoint, and inject the compiled brain as a system prompt in any LLM API call. The API supports filtering by section type and returns plain text optimised for AI consumption.</p>
    </section>

    <div class="cta">
      <h2>Ready to build your brain?</h2>
      <p>Start free. Deploy everywhere.</p>
      <a href="/login" class="btn">Get started</a>
    </div>
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Brainbox. All rights reserved.
  </div>
</body>
</html>`);
});

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
