import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';

const PLATFORMS = [
  { id: 'custom-gpt', name: 'Custom GPT', label: 'OpenAI', available: true },
  { id: 'claude', name: 'Claude', label: 'Anthropic', available: false },
  { id: 'gemini', name: 'Gemini', label: 'Google', available: false },
];

const PLATFORM_SUBTITLES = {
  'custom-gpt': 'Connect your Brainbox brain to a Custom GPT in 3 steps.',
};

export default function Integration() {
  const [brains, setBrains] = useState([]);
  const [selectedBrain, setSelectedBrain] = useState('');
  const [copied, setCopied] = useState('');
  const [platform, setPlatform] = useState('custom-gpt');
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

  const endpoint = `https://brainboxllm.site/api/context/${selectedBrain || '{brain_id}'}`;

  const actionSchema = JSON.stringify({
    openapi: '3.1.0',
    info: {
      title: 'Brainbox Context API',
      version: '1.0.0',
      description: 'Retrieves compiled brain context for LLM injection',
    },
    servers: [{ url: 'https://brainboxllm.site' }],
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
          responses: {
            '200': {
              description: 'Compiled brain context as plain text',
              content: {
                'text/plain': {
                  schema: { type: 'string' },
                },
              },
            },
          },
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
      schemas: {},
    },
  }, null, 2);

  const systemPrompt = `At the start of every new conversation, call getBrainContext to retrieve your context configuration. Apply everything returned — all rules, memories, behaviours, guardrails, and skills — before responding to any user message. If the context endpoint is unavailable, proceed normally but inform the user their Brainbox context could not be loaded.`;

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-brand-black mb-2">Integration Guide</h2>
          <p className="text-text-muted text-sm">{PLATFORM_SUBTITLES[platform] || 'Choose a platform to get started.'}</p>
        </div>

        {/* Platform selector */}
        <div className="flex gap-3">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => p.available && setPlatform(p.id)}
              disabled={!p.available}
              className={`relative flex-1 border rounded-xl px-4 py-3 text-left transition-colors ${
                p.available && platform === p.id
                  ? 'border-brand-orange bg-brand-orange/5'
                  : p.available
                    ? 'border-border hover:border-brand-orange/40'
                    : 'border-border opacity-50 cursor-not-allowed'
              }`}
            >
              <p className={`text-sm font-medium ${platform === p.id ? 'text-brand-orange' : 'text-brand-black'}`}>{p.name}</p>
              <p className="text-xs text-text-muted">{p.label}</p>
              {!p.available && (
                <span className="absolute top-2 right-2 text-[10px] font-medium text-text-muted bg-bg-panel border border-border rounded px-1.5 py-0.5">
                  Coming Soon
                </span>
              )}
            </button>
          ))}
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

        {platform === 'custom-gpt' && (<>
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
        </>)}
      </div>
    </div>
  );
}
