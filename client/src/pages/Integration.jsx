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
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold">🧠 Brainbox</Link>
          <Link to="/" className="text-sm text-gray-400 hover:text-white">Dashboard</Link>
          <Link to="/keys" className="text-sm text-gray-400 hover:text-white">API Keys</Link>
          <Link to="/integration" className="text-sm text-white font-medium">Integration</Link>
        </div>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-white">Sign Out</button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Integration Guide</h2>
          <p className="text-gray-400 text-sm">Connect your Brainbox brain to a Custom GPT in 3 steps.</p>
        </div>

        {/* Brain selector */}
        {brains.length > 0 && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Select Brain</label>
            <select value={selectedBrain} onChange={(e) => setSelectedBrain(e.target.value)} className="max-w-xs">
              {brains.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        {/* Step 1 */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold mb-2">Step 1: Your API Endpoint</h3>
          <p className="text-sm text-gray-400 mb-3">This is the URL your Custom GPT will call to fetch context.</p>
          <div className="flex items-center gap-2">
            <code className="bg-black/40 px-3 py-1.5 rounded text-sm text-violet-300 flex-1 font-mono overflow-x-auto">{endpoint}</code>
            <button onClick={() => copy(endpoint, 'endpoint')} className="text-xs text-violet-400 hover:text-violet-300 px-3 py-1.5 border border-violet-500/30 rounded-lg whitespace-nowrap">
              {copied === 'endpoint' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold mb-2">Step 2: Custom GPT Action Schema</h3>
          <p className="text-sm text-gray-400 mb-3">Paste this into your Custom GPT's Actions configuration (Schema tab).</p>
          <div className="relative">
            <pre className="bg-black/40 rounded-lg p-4 text-xs text-gray-300 font-mono overflow-x-auto max-h-80">{actionSchema}</pre>
            <button
              onClick={() => copy(actionSchema, 'schema')}
              className="absolute top-2 right-2 text-xs text-violet-400 hover:text-violet-300 px-3 py-1 border border-violet-500/30 rounded-lg bg-black/60"
            >
              {copied === 'schema' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Set the Authentication to "API Key", header name <code className="text-gray-400">X-API-Key</code>, and paste your API key from the Keys page.</p>
        </div>

        {/* Step 3 */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold mb-2">Step 3: System Prompt Instructions</h3>
          <p className="text-sm text-gray-400 mb-3">Add this to your Custom GPT's system instructions:</p>
          <div className="relative">
            <pre className="bg-black/40 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">{systemPrompt}</pre>
            <button
              onClick={() => copy(systemPrompt, 'prompt')}
              className="absolute top-2 right-2 text-xs text-violet-400 hover:text-violet-300 px-3 py-1 border border-violet-500/30 rounded-lg bg-black/60"
            >
              {copied === 'prompt' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
