import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Copy, Check, Key } from 'lucide-react';
import Header from '../components/Header';

const PLATFORMS = [
  { id: 'custom-gpt', name: 'Custom GPT', label: 'OpenAI', available: true },
  { id: 'claude', name: 'Claude', label: 'Anthropic', available: false },
  { id: 'gemini', name: 'Gemini', label: 'Google', available: false },
];

const PLATFORM_SUBTITLES = {
  'custom-gpt': 'Connect your Brainbox brain to a Custom GPT in 4 steps.',
};

export default function Integration() {
  const [brains, setBrains] = useState([]);
  const [selectedBrain, setSelectedBrain] = useState('');
  const [copied, setCopied] = useState('');
  const [platform, setPlatform] = useState('custom-gpt');

  // API key state
  const [keys, setKeys] = useState([]);
  const [generatedKey, setGeneratedKey] = useState(null); // full key shown once
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    axios.get('/api/brains').then(({ data }) => {
      setBrains(data);
      if (data.length > 0) setSelectedBrain(data[0].id);
    });
  }, []);

  // Fetch keys when brain changes
  useEffect(() => {
    if (!selectedBrain) return;
    setGeneratedKey(null);
    axios.get('/api/keys').then(({ data }) => {
      setKeys(data.filter(k => k.brain_id === selectedBrain));
    });
  }, [selectedBrain]);

  function copy(text, label) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  async function handleGenerateKey() {
    if (!selectedBrain) return;
    setGenerating(true);
    try {
      const { data } = await axios.post('/api/keys', { brain_id: selectedBrain, label: 'Integration' });
      setGeneratedKey(data.key);
      // Refresh keys list
      const keysRes = await axios.get('/api/keys');
      setKeys(keysRes.data.filter(k => k.brain_id === selectedBrain));
    } catch (err) {
      console.error('Failed to generate key:', err);
    } finally {
      setGenerating(false);
    }
  }

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

  const brainHasKey = keys.length > 0;

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

        {/* Step 1: API Key */}
        <div className="bg-bg-panel border border-border rounded-xl p-5">
          <h3 className="font-semibold text-brand-black mb-2">Step 1: Your API Key</h3>
          <p className="text-sm text-text-muted mb-3">Generate an API key for this brain. You'll need it to authenticate your Custom GPT.</p>

          {generatedKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="bg-white px-3 py-2 rounded text-xs text-text-primary flex-1 font-mono overflow-x-auto border border-border">{generatedKey}</code>
                <button
                  onClick={() => copy(generatedKey, 'apikey')}
                  className="text-brand-orange hover:text-brand-orange-hover flex-shrink-0 p-1"
                  title="Copy"
                >
                  {copied === 'apikey' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-xs text-amber-600 font-medium">Copy this key now — it won't be shown again.</p>
            </div>
          ) : brainHasKey ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Key size={14} className="text-text-muted" />
                <code className="text-sm text-text-muted font-mono">{keys[0].key_prefix}...</code>
                <span className="text-xs text-text-muted">— API key exists for this brain</span>
              </div>
              <p className="text-xs text-text-muted">
                Need a new key? <Link to="/keys" className="text-brand-orange hover:text-brand-orange-hover">Manage keys</Link> or generate another below.
              </p>
              <button
                onClick={handleGenerateKey}
                disabled={generating}
                className="text-xs text-brand-orange hover:text-brand-orange-hover border border-brand-orange/30 rounded-lg px-3 py-1.5 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate New Key'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateKey}
              disabled={generating || !selectedBrain}
              className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate API Key'}
            </button>
          )}
        </div>

        {/* Step 2: Action Schema */}
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
        </div>

        {/* Step 3: Authentication Setup */}
        <div className="bg-bg-panel border border-border rounded-xl p-5">
          <h3 className="font-semibold text-brand-black mb-2">Step 3: Authentication Setup</h3>
          <p className="text-sm text-text-muted mb-3">Configure the API key authentication in your Custom GPT.</p>
          <ol className="text-sm text-text-primary space-y-2 list-decimal list-inside">
            <li>In your Custom GPT's Actions, click the <strong>Authentication gear icon</strong></li>
            <li>Set Authentication Type to <strong>API Key</strong></li>
            <li>Set Auth Type to <strong>Custom</strong></li>
            <li>Set Custom Header Name to <code className="bg-white px-1.5 py-0.5 rounded border border-border text-xs font-mono">X-API-Key</code></li>
            <li>Paste your API key from Step 1 into the API Key field</li>
            <li>Click <strong>Save</strong></li>
          </ol>
        </div>

        {/* Step 4: System Prompt */}
        <div className="bg-bg-panel border border-border rounded-xl p-5">
          <h3 className="font-semibold text-brand-black mb-2">Step 4: System Prompt Instructions</h3>
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
