import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';

export default function Integration() {
  const [brains, setBrains] = useState([]);
  const [selectedBrain, setSelectedBrain] = useState('');
  const [copied, setCopied] = useState('');
  const { logout } = useAuth();

  useEffect(() => {
    axios.get('/api/brains').then(({ data }) => {
      setBrains(data);
      if (data.length > 0) setSelectedBrain(data[0].id);
    });
  }, []);

  function copy(text, label) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  const endpoint = `https://api.brainbox.ai/api/context/${selectedBrain || '{brain_id}'}`;

  const actionSchema = JSON.stringify({
    openapi: '3.0.0',
    info: {
      title: 'Brainbox Context API',
      version: '1.0.0',
      description: 'Retrieves compiled brain context for LLM injection',
    },
    servers: [{ url: 'https://api.brainbox.ai' }],
    paths: {
      [`/api/context/${selectedBrain || '{brain_id}'}`]: {
        get: {
          operationId: 'getBrainContext',
          summary: 'Get compiled brain context',
          description: 'Returns structured plain text context including rules, memories, behaviours, guardrails and skills',
          parameters: [
            {
              name: 'types',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Comma separated list of section types to return. Options: rule, memory, behaviour, guardrail, skill',
            },
          ],
          security: [{ ApiKeyAuth: [] }],
        },
      },
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
  }, null, 2);

  const systemPrompt = `At the start of every new conversation, call getBrainContext to retrieve your context configuration. Apply everything returned — all rules, memories, behaviours, guardrails, and skills — before responding to any user message. If the context endpoint is unavailable, proceed normally but inform the user their Brainbox context could not be loaded.`;

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/"><img src="/images/brainboxlong.png" alt="Brainbox" className="h-12" /></Link>
          <Link to="/" className="text-sm text-text-muted hover:text-brand-black">Dashboard</Link>
          <Link to="/keys" className="text-sm text-text-muted hover:text-brand-black">API Keys</Link>
          <Link to="/integration" className="text-sm text-brand-black font-medium">Integration</Link>
        </div>
        <button onClick={logout} className="text-sm text-text-muted hover:text-brand-black">Sign Out</button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-brand-black mb-2">Integration Guide</h2>
          <p className="text-text-muted text-sm">Connect your Brainbox brain to a Custom GPT in 3 steps.</p>
        </div>

        {/* Brain selector */}
        {brains.length > 0 && (
          <div>
            <label className="block text-sm text-text-muted mb-1">Select Brain</label>
            <select value={selectedBrain} onChange={(e) => setSelectedBrain(e.target.value)} className="max-w-xs">
              {brains.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        {/* Step 1 */}
        <div className="bg-bg-panel border border-border rounded-xl p-5">
          <h3 className="font-semibold text-brand-black mb-2">Step 1: Your API Endpoint</h3>
          <p className="text-sm text-text-muted mb-3">This is the URL your Custom GPT will call to fetch context.</p>
          <div className="flex items-center gap-2">
            <code className="bg-white px-3 py-1.5 rounded text-sm text-brand-orange flex-1 font-mono overflow-x-auto border border-border">{endpoint}</code>
            <button onClick={() => copy(endpoint, 'endpoint')} className="text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1.5 border border-brand-orange/30 rounded-lg whitespace-nowrap">
              {copied === 'endpoint' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-bg-panel border border-border rounded-xl p-5">
          <h3 className="font-semibold text-brand-black mb-2">Step 2: Custom GPT Action Schema</h3>
          <p className="text-sm text-text-muted mb-3">Paste this into your Custom GPT's Actions configuration (Schema tab).</p>
          <div className="relative">
            <pre className="bg-white rounded-lg p-4 text-xs text-text-primary font-mono overflow-x-auto max-h-80 border border-border">{actionSchema}</pre>
            <button
              onClick={() => copy(actionSchema, 'schema')}
              className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
            >
              {copied === 'schema' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-2">Set the Authentication to "API Key", header name <code className="text-text-primary">X-API-Key</code>, and paste your API key from the Keys page.</p>
        </div>

        {/* Step 3 */}
        <div className="bg-bg-panel border border-border rounded-xl p-5">
          <h3 className="font-semibold text-brand-black mb-2">Step 3: System Prompt Instructions</h3>
          <p className="text-sm text-text-muted mb-3">Add this to your Custom GPT's system instructions:</p>
          <div className="relative">
            <pre className="bg-white rounded-lg p-4 text-sm text-text-primary whitespace-pre-wrap border border-border">{systemPrompt}</pre>
            <button
              onClick={() => copy(systemPrompt, 'prompt')}
              className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
            >
              {copied === 'prompt' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
