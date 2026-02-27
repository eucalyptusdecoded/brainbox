import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Copy, Check, Key, Download, ImageIcon } from 'lucide-react';
import Header from '../components/Header';

const PLATFORMS = [
  { id: 'custom-gpt', name: 'Custom GPT', label: 'OpenAI', available: true },
  { id: 'gemini', name: 'Gemini Gem', label: 'Google', available: true },
  { id: 'claude', name: 'Claude', label: 'Anthropic', available: true },
  { id: 'perplexity', name: 'Perplexity Space', label: 'Perplexity', available: true },
  { id: 'copilot', name: 'Copilot Agent', label: 'Microsoft', available: true },
  { id: 'grok', name: 'Grok', label: 'xAI', available: true },
];

export default function Integration() {
  const [brains, setBrains] = useState([]);
  const [selectedBrain, setSelectedBrain] = useState('');
  const [copied, setCopied] = useState('');
  const [platform, setPlatform] = useState('custom-gpt');

  // API key state
  const [keys, setKeys] = useState([]);
  const [generatedKey, setGeneratedKey] = useState(null); // full key shown once
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [brainImages, setBrainImages] = useState([]);

  useEffect(() => {
    axios.get('/api/brains').then(({ data }) => {
      setBrains(data);
      if (data.length > 0) setSelectedBrain(data[0].id);
    });
  }, []);

  // Fetch keys and images when brain changes
  useEffect(() => {
    if (!selectedBrain) return;
    setGeneratedKey(null);
    axios.get('/api/keys').then(({ data }) => {
      setKeys(data.filter(k => k.brain_id === selectedBrain));
    });
    axios.get(`/api/brains/${selectedBrain}`).then(({ data }) => {
      setBrainImages(data.images || []);
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

  async function handleDownloadContext() {
    if (!selectedBrain) return;
    setDownloading(true);
    try {
      const { data } = await axios.get(`/api/brains/${selectedBrain}/context`, { responseType: 'blob' });
      const brain = brains.find(b => b.id === selectedBrain);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brainbox-${brain?.name || 'context'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download context:', err);
    } finally {
      setDownloading(false);
    }
  }


  const selectedBrainObj = brains.find(b => b.id === selectedBrain);

  const gptSystemPrompt = `You have been provided a Brainbox context file in your knowledge. Apply everything in it — all rules, memories, behaviours, guardrails, and skills — before responding to any user message. Follow the context file as your primary instructions.`;

  const geminiSystemPrompt = `You have been provided a Brainbox context file. Apply everything in it — all rules, memories, behaviours, guardrails, and skills — before responding to any user message. Follow the context file as your primary instructions.`;

  const claudeSystemPrompt = `You have been provided a Brainbox context file in your project knowledge. Apply everything in it — all rules, memories, behaviours, guardrails, and skills — before responding to any user message. Follow the context file as your primary instructions.`;

  const perplexitySystemPrompt = `You have been provided a Brainbox context file. Apply everything in it — all rules, memories, behaviours, guardrails, and skills — before responding to any user message. Follow the context file as your primary instructions.`;

  const copilotSystemPrompt = `You have been provided a Brainbox context file in your knowledge. Apply everything in it — all rules, memories, behaviours, guardrails, and skills — before responding to any user message. Follow the context file as your primary instructions.`;

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

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-brand-black mb-2">Integration Guide</h2>
          <p className="text-text-muted text-sm">Connect your brain to any of the following models.</p>
        </div>

        {/* Platform selector */}
        <div>
          <label className="block text-sm text-text-muted mb-1">Select LLM</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

        {/* Custom GPT Setup (No Code) */}
        <details open className="bg-bg-panel border border-border rounded-xl">
          <summary className="font-semibold text-brand-black p-5 cursor-pointer select-none">
            Custom GPT Setup
          </summary>
          <div className="px-5 pb-5 space-y-5">
            {/* Step 1: Download Context */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 1: Download Brain Context</h3>
              <p className="text-sm text-text-muted">Download your brain's context as a text file to upload to your Custom GPT.</p>
              <button
                onClick={handleDownloadContext}
                disabled={downloading || !selectedBrain}
                className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <Download size={16} />
                {downloading ? 'Downloading...' : 'Download Context File'}
              </button>
              <p className="text-xs text-amber-600 font-medium">Re-download this file after making changes to your brain.</p>

              {brainImages.length > 0 && (
                <div className="mt-2 border-t border-border pt-3">
                  <div className="flex items-start gap-2 mb-3">
                    <ImageIcon size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-text-muted">
                      Context files are text-only and don't include images directly. To use your reference images, download them below and upload them to your Custom GPT's <strong>Knowledge</strong> section.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {brainImages.map((img, i) => (
                      <a key={img.id || i} href={img.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-orange hover:text-brand-orange-hover">
                        <Download size={14} />
                        {img.description || `Image ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Create Custom GPT */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 2: Create Your Custom GPT</h3>
              <p className="text-sm text-text-muted">Create a new Custom GPT in ChatGPT and upload your brain context.</p>
              <ol className="text-sm text-text-primary space-y-2 list-decimal list-inside">
                <li>Open <strong>chatgpt.com</strong>, click your profile icon and select <strong>My GPTs</strong></li>
                <li>Click <strong>Create a GPT</strong>, then go to the <strong>Configure</strong> tab</li>
                <li>Copy the <strong>Name</strong>, <strong>Description</strong>, and <strong>Instructions</strong> from Step 3 below into the corresponding fields</li>
                <li>In the <strong>Knowledge</strong> section, click <strong>Upload files</strong> and select the <code className="bg-white px-1.5 py-0.5 rounded border border-border text-xs font-mono">.txt</code> file from Step 1</li>
                <li>Click <strong>Save</strong>, choose your visibility, and click <strong>Confirm</strong></li>
              </ol>
            </div>

            {/* Step 3: GPT Configuration */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Step 3: Configure Your GPT</h3>
              <p className="text-sm text-text-muted">Copy and paste each of these into your Custom GPT's fields:</p>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Name</label>
                <div className="relative">
                  <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary border border-border">{selectedBrainObj?.name || ''}</pre>
                  <button
                    onClick={() => copy(selectedBrainObj?.name || '', 'gpt-name')}
                    className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                  >
                    {copied === 'gpt-name' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Description</label>
                <div className="relative">
                  <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap border border-border">{selectedBrainObj?.description || '—'}</pre>
                  <button
                    onClick={() => copy(selectedBrainObj?.description || '', 'gpt-desc')}
                    className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                  >
                    {copied === 'gpt-desc' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Instructions</label>
                <div className="relative">
                  <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap border border-border">{gptSystemPrompt}</pre>
                  <button
                    onClick={() => copy(gptSystemPrompt, 'gpt-prompt')}
                    className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                  >
                    {copied === 'gpt-prompt' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* Custom GPT with Actions (Auto-Sync) */}
        <details className="bg-bg-panel border border-border rounded-xl">
          <summary className="font-semibold text-brand-black p-5 cursor-pointer select-none">
            Custom GPT with Actions (Auto-Sync)
          </summary>
          <div className="px-5 pb-5 space-y-5">
            <p className="text-sm text-text-muted">Use Actions to have your Custom GPT automatically fetch the latest brain context via API — no need to re-download and re-upload the context file after every change.</p>

            {/* Step 1: API Key */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 1: Generate an API Key</h3>
              <p className="text-sm text-text-muted">Generate an API key for this brain. You'll need it to authenticate your Custom GPT.</p>

              {generatedKey ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-3 py-2 rounded text-xs text-text-primary flex-1 font-mono overflow-x-auto border border-border">{generatedKey}</code>
                    <button onClick={() => copy(generatedKey, 'apikey')} className="text-brand-orange hover:text-brand-orange-hover flex-shrink-0 p-1" title="Copy">
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
                  <button onClick={handleGenerateKey} disabled={generating} className="text-xs text-brand-orange hover:text-brand-orange-hover border border-brand-orange/30 rounded-lg px-3 py-1.5 disabled:opacity-50">
                    {generating ? 'Generating...' : 'Generate New Key'}
                  </button>
                </div>
              ) : (
                <button onClick={handleGenerateKey} disabled={generating || !selectedBrain} className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">
                  {generating ? 'Generating...' : 'Generate API Key'}
                </button>
              )}
            </div>

            {/* Step 2: Create GPT with Actions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 2: Create Your Custom GPT</h3>
              <p className="text-sm text-text-muted">Create a Custom GPT and configure it with an Action to fetch your brain context.</p>
              <ol className="text-sm text-text-primary space-y-2 list-decimal list-inside">
                <li>Open <strong>chatgpt.com</strong>, click your profile icon and select <strong>My GPTs</strong></li>
                <li>Click <strong>Create a GPT</strong>, then go to the <strong>Configure</strong> tab</li>
                <li>Paste the <strong>Instructions</strong> from Step 4 below into the Instructions field</li>
                <li>Scroll down to <strong>Actions</strong> and click <strong>Create new action</strong></li>
                <li>Paste the <strong>Action Schema</strong> from Step 3 into the Schema field</li>
                <li>Click the <strong>Authentication gear icon</strong> and set:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Authentication Type: <strong>API Key</strong></li>
                    <li>Auth Type: <strong>Custom</strong></li>
                    <li>Custom Header Name: <code className="bg-white px-1.5 py-0.5 rounded border border-border text-xs font-mono">X-API-Key</code></li>
                    <li>Paste your API key from Step 1 and click <strong>Save</strong></li>
                  </ul>
                </li>
                <li>Click <strong>Save</strong>, choose your visibility, and click <strong>Confirm</strong></li>
              </ol>
            </div>

            {/* Step 3: Action Schema */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 3: Action Schema</h3>
              <p className="text-sm text-text-muted">Paste this into your Custom GPT's Action Schema field:</p>
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

            {/* Step 4: System Prompt */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 4: Instructions</h3>
              <p className="text-sm text-text-muted">Paste this into your Custom GPT's Instructions field:</p>
              <div className="relative">
                <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap border border-border">{systemPrompt}</pre>
                <button
                  onClick={() => copy(systemPrompt, 'prompt')}
                  className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                >
                  {copied === 'prompt' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </details>

        </>)}

        {platform === 'gemini' && (<>

        {/* Step 1: Download Context */}
        <div className="bg-bg-panel border border-border rounded-xl p-5">
          <h3 className="font-semibold text-brand-black mb-2">Step 1: Download Brain Context</h3>
          <p className="text-sm text-text-muted mb-3">Download your brain's context as a text file to upload to your Gem.</p>
          <button
            onClick={handleDownloadContext}
            disabled={downloading || !selectedBrain}
            className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <Download size={16} />
            {downloading ? 'Downloading...' : 'Download Context File'}
          </button>
          <p className="text-xs text-amber-600 font-medium mt-3">Re-download this file after making changes to your brain.</p>

          {brainImages.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-start gap-2 mb-3">
                <ImageIcon size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
                <p className="text-sm text-text-muted">
                  Context files are text-only and don't include images directly. To use your reference images, download them below and upload them alongside your context file in your Gem's <strong>Knowledge</strong> section.
                </p>
              </div>
              <div className="space-y-2">
                {brainImages.map((img, i) => (
                  <a
                    key={img.id || i}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-brand-orange hover:text-brand-orange-hover"
                  >
                    <Download size={14} />
                    {img.description || `Image ${i + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Create Gem */}
        <div className="bg-bg-panel border border-border rounded-xl p-5">
          <h3 className="font-semibold text-brand-black mb-2">Step 2: Create Your Gem</h3>
          <p className="text-sm text-text-muted mb-3">Create a new Gem in Google Gemini and configure it using the values from Step 3.</p>
          <ol className="text-sm text-text-primary space-y-2 list-decimal list-inside">
            <li>Open <strong>gemini.google.com</strong> and click <strong>Gem manager</strong> in the left sidebar</li>
            <li>Click <strong>New Gem</strong></li>
            <li>Copy the <strong>Name</strong>, <strong>Description</strong> and <strong>Instructions</strong> from Step 3 below into the corresponding fields</li>
            <li>In the <strong>Knowledge</strong> section, click <strong>Upload</strong> and select the <code className="bg-white px-1.5 py-0.5 rounded border border-border text-xs font-mono">.txt</code> file downloaded in Step 1</li>
            <li>Click <strong>Save</strong></li>
          </ol>
        </div>

        {/* Step 3: Gem Configuration */}
        <div className="bg-bg-panel border border-border rounded-xl p-5">
          <h3 className="font-semibold text-brand-black mb-2">Step 3: Configure Your Gem</h3>
          <p className="text-sm text-text-muted mb-4">Copy and paste each of these into your Gem's fields:</p>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Name</label>
              <div className="relative">
                <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary border border-border">{selectedBrainObj?.name || ''}</pre>
                <button
                  onClick={() => copy(selectedBrainObj?.name || '', 'gemini-name')}
                  className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                >
                  {copied === 'gemini-name' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Description</label>
              <div className="relative">
                <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap border border-border">{selectedBrainObj?.description || '—'}</pre>
                <button
                  onClick={() => copy(selectedBrainObj?.description || '', 'gemini-desc')}
                  className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                >
                  {copied === 'gemini-desc' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Instructions</label>
              <div className="relative">
                <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap border border-border">{geminiSystemPrompt}</pre>
                <button
                  onClick={() => copy(geminiSystemPrompt, 'gemini-prompt')}
                  className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                >
                  {copied === 'gemini-prompt' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        </>)}

        {platform === 'claude' && (<>

        {/* Claude Project (No Code) */}
        <details open className="bg-bg-panel border border-border rounded-xl">
          <summary className="font-semibold text-brand-black p-5 cursor-pointer select-none">
            Claude Project Setup (No Code)
          </summary>
          <div className="px-5 pb-5 space-y-5">
            {/* Step 1: Download Context */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 1: Download Brain Context</h3>
              <p className="text-sm text-text-muted">Download your brain's context as a text file to upload to your Claude Project.</p>
              <button
                onClick={handleDownloadContext}
                disabled={downloading || !selectedBrain}
                className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <Download size={16} />
                {downloading ? 'Downloading...' : 'Download Context File'}
              </button>
              <p className="text-xs text-amber-600 font-medium">Re-download this file after making changes to your brain.</p>

              {brainImages.length > 0 && (
                <div className="mt-2 border-t border-border pt-3">
                  <div className="flex items-start gap-2 mb-3">
                    <ImageIcon size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-text-muted">
                      Context files are text-only and don't include images directly. To use your reference images, download them below and upload them to your Project's <strong>Project knowledge</strong> section.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {brainImages.map((img, i) => (
                      <a key={img.id || i} href={img.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-orange hover:text-brand-orange-hover">
                        <Download size={14} />
                        {img.description || `Image ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Create Project */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 2: Create Your Project</h3>
              <p className="text-sm text-text-muted">Create a new Project in Claude and upload your brain context.</p>
              <ol className="text-sm text-text-primary space-y-2 list-decimal list-inside">
                <li>Open <strong>claude.ai</strong> and click <strong>Projects</strong> in the left sidebar</li>
                <li>Click <strong>Create a project</strong></li>
                <li>Copy the <strong>Name</strong>, <strong>Description</strong> and <strong>Instructions</strong> from Step 3 below into the corresponding fields</li>
                <li>In the <strong>Project knowledge</strong> section, click <strong>Add content</strong> and upload the <code className="bg-white px-1.5 py-0.5 rounded border border-border text-xs font-mono">.txt</code> file downloaded in Step 1</li>
                <li>Start a new chat inside the project — Claude will use your brain context automatically</li>
              </ol>
            </div>

            {/* Step 3: Project Configuration */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Step 3: Configure Your Project</h3>
              <p className="text-sm text-text-muted">Copy and paste each of these into your Project's fields:</p>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Name</label>
                <div className="relative">
                  <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary border border-border">{selectedBrainObj?.name || ''}</pre>
                  <button
                    onClick={() => copy(selectedBrainObj?.name || '', 'claude-name')}
                    className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                  >
                    {copied === 'claude-name' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Description</label>
                <div className="relative">
                  <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap border border-border">{selectedBrainObj?.description || '—'}</pre>
                  <button
                    onClick={() => copy(selectedBrainObj?.description || '', 'claude-desc')}
                    className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                  >
                    {copied === 'claude-desc' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Project Instructions</label>
                <div className="relative">
                  <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap border border-border">{claudeSystemPrompt}</pre>
                  <button
                    onClick={() => copy(claudeSystemPrompt, 'claude-prompt')}
                    className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                  >
                    {copied === 'claude-prompt' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* For Developers */}
        <details className="bg-bg-panel border border-border rounded-xl">
          <summary className="font-semibold text-brand-black p-5 cursor-pointer select-none">
            For Developers: Claude API Integration
          </summary>
          <div className="px-5 pb-5 space-y-5">
            <p className="text-sm text-text-muted">This section is for developers building their own apps with the Claude API. If you just want to use your brain in Claude, follow Steps 1–3 above instead — no code needed.</p>

            {/* Step 1: Install */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">Step 1: Install the required packages</p>
              <p className="text-sm text-text-muted">Open a terminal on your computer and run this command to install the Anthropic Python SDK and requests library:</p>
              <div className="relative">
                <pre className="bg-white rounded-lg px-4 py-3 text-xs text-text-primary font-mono border border-border">pip install anthropic requests</pre>
                <button
                  onClick={() => copy('pip install anthropic requests', 'claude-pip')}
                  className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                >
                  {copied === 'claude-pip' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Step 2: API Keys */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-text-primary">Step 2: Get your API keys</p>
              <p className="text-sm text-text-muted">You need two API keys — one from Brainbox and one from Anthropic.</p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Brainbox API Key</p>
                {generatedKey ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-3 py-2 rounded text-xs text-text-primary flex-1 font-mono overflow-x-auto border border-border">{generatedKey}</code>
                      <button onClick={() => copy(generatedKey, 'claude-apikey')} className="text-brand-orange hover:text-brand-orange-hover flex-shrink-0 p-1" title="Copy">
                        {copied === 'claude-apikey' ? <Check size={16} /> : <Copy size={16} />}
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
                    <button onClick={handleGenerateKey} disabled={generating} className="text-xs text-brand-orange hover:text-brand-orange-hover border border-brand-orange/30 rounded-lg px-3 py-1.5 disabled:opacity-50">
                      {generating ? 'Generating...' : 'Generate New Key'}
                    </button>
                  </div>
                ) : (
                  <button onClick={handleGenerateKey} disabled={generating || !selectedBrain} className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">
                    {generating ? 'Generating...' : 'Generate API Key'}
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Claude API Key</p>
                <p className="text-sm text-text-muted">Get your Claude API key from <strong>console.anthropic.com</strong> &rarr; <strong>API Keys</strong>. You'll need an Anthropic account.</p>
              </div>
            </div>

            {/* Step 3: Python file */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">Step 3: Create a Python file</p>
              <p className="text-sm text-text-muted">Create a new file called <code className="bg-white px-1.5 py-0.5 rounded border border-border text-xs font-mono">brainbox_claude.py</code> and paste the following code. Replace the two placeholder API keys with your real keys from Step 2.</p>
              <div className="relative">
                <pre className="bg-white rounded-lg p-4 text-xs text-text-primary font-mono overflow-x-auto border border-border whitespace-pre">{`import requests
import anthropic

# Replace these with your real API keys from Step 2
BRAINBOX_API_KEY = "your_brainbox_api_key_here"
CLAUDE_API_KEY = "your_claude_api_key_here"

# 1. Fetch your brain context from Brainbox
response = requests.get(
    "https://brainboxllm.site/api/context/${selectedBrain || '{brain_id}'}",
    headers={"X-API-Key": BRAINBOX_API_KEY}
)
brain_context = response.text

# 2. Send a message to Claude with your brain as the system prompt
client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
message = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    system=brain_context,
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(message.content[0].text)`}</pre>
                <button
                  onClick={() => copy(`import requests\nimport anthropic\n\n# Replace these with your real API keys from Step 2\nBRAINBOX_API_KEY = "your_brainbox_api_key_here"\nCLAUDE_API_KEY = "your_claude_api_key_here"\n\n# 1. Fetch your brain context from Brainbox\nresponse = requests.get(\n    "https://brainboxllm.site/api/context/${selectedBrain || '{brain_id}'}",\n    headers={"X-API-Key": BRAINBOX_API_KEY}\n)\nbrain_context = response.text\n\n# 2. Send a message to Claude with your brain as the system prompt\nclient = anthropic.Anthropic(api_key=CLAUDE_API_KEY)\nmessage = client.messages.create(\n    model="claude-sonnet-4-5-20250929",\n    max_tokens=1024,\n    system=brain_context,\n    messages=[\n        {"role": "user", "content": "Hello!"}\n    ]\n)\n\nprint(message.content[0].text)`, 'claude-python')}
                  className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                >
                  {copied === 'claude-python' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Step 4: Run */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">Step 4: Run it</p>
              <p className="text-sm text-text-muted">Open a terminal, navigate to the folder where you saved the file, and run:</p>
              <div className="relative">
                <pre className="bg-white rounded-lg px-4 py-3 text-xs text-text-primary font-mono border border-border">python brainbox_claude.py</pre>
                <button
                  onClick={() => copy('python brainbox_claude.py', 'claude-run')}
                  className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                >
                  {copied === 'claude-run' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-text-muted">Claude will respond using your brain context as its instructions. You can change the <code className="bg-white px-1.5 py-0.5 rounded border border-border text-xs font-mono">"Hello!"</code> message in the code to anything you like.</p>
            </div>
          </div>
        </details>

        {/* Claude with MCP (Auto-Sync) */}
        <details className="bg-bg-panel border border-border rounded-xl">
          <summary className="font-semibold text-brand-black p-5 cursor-pointer select-none">
            Claude with MCP (Auto-Sync)
          </summary>
          <div className="px-5 pb-5 space-y-5">
            <p className="text-sm text-text-muted">MCP (Model Context Protocol) lets Claude Desktop and Claude Code pull your brain context automatically — no copy-pasting or re-downloading needed. When you update your brain in Brainbox, Claude gets the latest version.</p>

            {/* Step 1: Generate API Key */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Step 1: Generate an API Key</h3>
              <p className="text-sm text-text-muted">You need a Brainbox API key so the MCP server can fetch your brain context.</p>
              {generatedKey ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-3 py-2 rounded text-xs text-text-primary flex-1 font-mono overflow-x-auto border border-border">{generatedKey}</code>
                    <button onClick={() => copy(generatedKey, 'mcp-apikey')} className="text-brand-orange hover:text-brand-orange-hover flex-shrink-0 p-1" title="Copy">
                      {copied === 'mcp-apikey' ? <Check size={16} /> : <Copy size={16} />}
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
                  <button onClick={handleGenerateKey} disabled={generating} className="text-xs text-brand-orange hover:text-brand-orange-hover border border-brand-orange/30 rounded-lg px-3 py-1.5 disabled:opacity-50">
                    {generating ? 'Generating...' : 'Generate New Key'}
                  </button>
                </div>
              ) : (
                <button onClick={handleGenerateKey} disabled={generating || !selectedBrain} className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">
                  {generating ? 'Generating...' : 'Generate API Key'}
                </button>
              )}
            </div>

            {/* Step 2: Install */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 2: Install Node.js</h3>
              <p className="text-sm text-text-muted">The MCP server requires Node.js 18 or later. If you don't have it, download it from <strong>nodejs.org</strong>.</p>
            </div>

            {/* Step 3: Configure Claude */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Step 3: Configure Claude Desktop</h3>
              <p className="text-sm text-text-muted">Open your Claude Desktop config file and add the Brainbox MCP server:</p>

              <div className="space-y-1">
                <p className="text-xs text-text-muted">Config file location:</p>
                <ul className="text-xs text-text-muted space-y-0.5">
                  <li><strong>macOS:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-border font-mono">~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
                  <li><strong>Windows:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-border font-mono">%APPDATA%\Claude\claude_desktop_config.json</code></li>
                </ul>
              </div>

              <div className="relative">
                <pre className="bg-white rounded-lg p-4 text-xs text-text-primary font-mono overflow-x-auto border border-border whitespace-pre">{JSON.stringify({
  mcpServers: {
    brainbox: {
      command: "npx",
      args: ["-y", "brainbox-mcp"],
      env: {
        BRAINBOX_API_KEY: generatedKey || "your_api_key_here",
        BRAINBOX_BRAIN_ID: selectedBrain || "your_brain_id_here"
      }
    }
  }
}, null, 2)}</pre>
                <button
                  onClick={() => copy(JSON.stringify({
                    mcpServers: {
                      brainbox: {
                        command: "npx",
                        args: ["-y", "brainbox-mcp"],
                        env: {
                          BRAINBOX_API_KEY: generatedKey || "your_api_key_here",
                          BRAINBOX_BRAIN_ID: selectedBrain || "your_brain_id_here"
                        }
                      }
                    }
                  }, null, 2), 'mcp-config')}
                  className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                >
                  {copied === 'mcp-config' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <p className="text-xs text-text-muted">If you already have other MCP servers configured, add the <code className="bg-white px-1 py-0.5 rounded border border-border font-mono">brainbox</code> entry inside your existing <code className="bg-white px-1 py-0.5 rounded border border-border font-mono">mcpServers</code> object.</p>
            </div>

            {/* Step 4: Restart */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 4: Restart Claude</h3>
              <p className="text-sm text-text-muted">Quit Claude Desktop completely (<strong>Cmd+Q</strong> on macOS, <strong>Alt+F4</strong> on Windows) and reopen it. You should see an MCP icon in the chat input — click it to verify the Brainbox resource is available.</p>
              <p className="text-sm text-text-muted">Claude will now have access to your brain context in every conversation. When you update your brain in Brainbox, Claude automatically gets the latest version next time it reads the resource.</p>
            </div>
          </div>
        </details>

        </>)}

        {platform === 'perplexity' && (<>

        {/* Perplexity Space Setup */}
        <details open className="bg-bg-panel border border-border rounded-xl">
          <summary className="font-semibold text-brand-black p-5 cursor-pointer select-none">
            Perplexity Space Setup
          </summary>
          <div className="px-5 pb-5 space-y-5">
            {/* Step 1: Download Context */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 1: Download Brain Context</h3>
              <p className="text-sm text-text-muted">Download your brain's context as a text file to upload to your Space.</p>
              <button
                onClick={handleDownloadContext}
                disabled={downloading || !selectedBrain}
                className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <Download size={16} />
                {downloading ? 'Downloading...' : 'Download Context File'}
              </button>
              <p className="text-xs text-amber-600 font-medium">Re-download this file after making changes to your brain.</p>

              {brainImages.length > 0 && (
                <div className="mt-2 border-t border-border pt-3">
                  <div className="flex items-start gap-2 mb-3">
                    <ImageIcon size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-text-muted">
                      Context files are text-only and don't include images directly. To use your reference images, download them below and upload them as files in your Space's <strong>Sources</strong> section.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {brainImages.map((img, i) => (
                      <a key={img.id || i} href={img.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-orange hover:text-brand-orange-hover">
                        <Download size={14} />
                        {img.description || `Image ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Create Space */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 2: Create Your Space</h3>
              <p className="text-sm text-text-muted">Create a new Space in Perplexity and upload your brain context.</p>
              <ol className="text-sm text-text-primary space-y-2 list-decimal list-inside">
                <li>Open <strong>perplexity.ai</strong> and hover over <strong>Spaces</strong> in the left sidebar</li>
                <li>Click <strong>Create a Space</strong></li>
                <li>Enter the <strong>Name</strong> and <strong>Description</strong> from Step 3 below</li>
                <li>Paste the <strong>Instructions</strong> from Step 3 into the custom instructions field</li>
                <li>Click <strong>Continue</strong></li>
                <li>In the <strong>Sources</strong> panel on the right, click the <strong>file icon</strong> and upload the <code className="bg-white px-1.5 py-0.5 rounded border border-border text-xs font-mono">.txt</code> file from Step 1</li>
              </ol>
            </div>

            {/* Step 3: Configuration */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Step 3: Configure Your Space</h3>
              <p className="text-sm text-text-muted">Copy and paste each of these into your Space's fields:</p>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Name</label>
                <div className="relative">
                  <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary border border-border">{selectedBrainObj?.name || ''}</pre>
                  <button onClick={() => copy(selectedBrainObj?.name || '', 'pplx-name')} className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white">
                    {copied === 'pplx-name' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Description</label>
                <div className="relative">
                  <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap border border-border">{selectedBrainObj?.description || '—'}</pre>
                  <button onClick={() => copy(selectedBrainObj?.description || '', 'pplx-desc')} className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white">
                    {copied === 'pplx-desc' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Custom Instructions</label>
                <div className="relative">
                  <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap border border-border">{perplexitySystemPrompt}</pre>
                  <button onClick={() => copy(perplexitySystemPrompt, 'pplx-prompt')} className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white">
                    {copied === 'pplx-prompt' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </details>

        </>)}

        {platform === 'copilot' && (<>

        {/* Copilot Agent Setup */}
        <details open className="bg-bg-panel border border-border rounded-xl">
          <summary className="font-semibold text-brand-black p-5 cursor-pointer select-none">
            Copilot Agent Setup
          </summary>
          <div className="px-5 pb-5 space-y-5">
            {/* Step 1: Download Context */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 1: Download Brain Context</h3>
              <p className="text-sm text-text-muted">Download your brain's context as a text file to upload to your Copilot Agent.</p>
              <button
                onClick={handleDownloadContext}
                disabled={downloading || !selectedBrain}
                className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <Download size={16} />
                {downloading ? 'Downloading...' : 'Download Context File'}
              </button>
              <p className="text-xs text-amber-600 font-medium">Re-download this file after making changes to your brain.</p>

              {brainImages.length > 0 && (
                <div className="mt-2 border-t border-border pt-3">
                  <div className="flex items-start gap-2 mb-3">
                    <ImageIcon size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-text-muted">
                      Context files are text-only and don't include images directly. To use your reference images, download them below and upload them to your Agent's <strong>Knowledge</strong> section.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {brainImages.map((img, i) => (
                      <a key={img.id || i} href={img.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-orange hover:text-brand-orange-hover">
                        <Download size={14} />
                        {img.description || `Image ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Create Agent */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 2: Create Your Agent</h3>
              <p className="text-sm text-text-muted">Create a new Agent in Microsoft 365 Copilot and upload your brain context.</p>
              <ol className="text-sm text-text-primary space-y-2 list-decimal list-inside">
                <li>Open <strong>Microsoft 365 Copilot</strong> at <strong>copilot.microsoft.com</strong></li>
                <li>Click <strong>Create agent</strong> in the left pane</li>
                <li>Go to the <strong>Configure</strong> tab</li>
                <li>Enter the <strong>Name</strong>, <strong>Description</strong>, and <strong>Instructions</strong> from Step 3 below</li>
                <li>In the <strong>Knowledge</strong> section, click the search bar and upload the <code className="bg-white px-1.5 py-0.5 rounded border border-border text-xs font-mono">.txt</code> file from Step 1</li>
                <li>Test your agent in the preview pane, then click <strong>Create</strong></li>
              </ol>
            </div>

            {/* Step 3: Configuration */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Step 3: Configure Your Agent</h3>
              <p className="text-sm text-text-muted">Copy and paste each of these into your Agent's fields:</p>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Name</label>
                <div className="relative">
                  <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary border border-border">{selectedBrainObj?.name || ''}</pre>
                  <button onClick={() => copy(selectedBrainObj?.name || '', 'copilot-name')} className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white">
                    {copied === 'copilot-name' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Description</label>
                <div className="relative">
                  <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap border border-border">{selectedBrainObj?.description || '—'}</pre>
                  <button onClick={() => copy(selectedBrainObj?.description || '', 'copilot-desc')} className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white">
                    {copied === 'copilot-desc' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Instructions</label>
                <div className="relative">
                  <pre className="bg-white rounded-lg px-4 py-3 text-sm text-text-primary whitespace-pre-wrap border border-border">{copilotSystemPrompt}</pre>
                  <button onClick={() => copy(copilotSystemPrompt, 'copilot-prompt')} className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white">
                    {copied === 'copilot-prompt' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </details>

        </>)}

        {platform === 'grok' && (<>

        {/* Grok Setup */}
        <details open className="bg-bg-panel border border-border rounded-xl">
          <summary className="font-semibold text-brand-black p-5 cursor-pointer select-none">
            Grok Custom Instructions Setup
          </summary>
          <div className="px-5 pb-5 space-y-5">
            {/* Step 1: Download Context */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 1: Download Brain Context</h3>
              <p className="text-sm text-text-muted">Download your brain's context as a text file. You'll paste its contents into Grok's custom instructions.</p>
              <button
                onClick={handleDownloadContext}
                disabled={downloading || !selectedBrain}
                className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <Download size={16} />
                {downloading ? 'Downloading...' : 'Download Context File'}
              </button>
              <p className="text-xs text-amber-600 font-medium">Re-download this file after making changes to your brain.</p>

              {brainImages.length > 0 && (
                <div className="mt-2 border-t border-border pt-3">
                  <div className="flex items-start gap-2 mb-3">
                    <ImageIcon size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-text-muted">
                      Context files are text-only and don't include images directly. To use your reference images, download them below and attach them to your Grok conversation.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {brainImages.map((img, i) => (
                      <a key={img.id || i} href={img.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-orange hover:text-brand-orange-hover">
                        <Download size={14} />
                        {img.description || `Image ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Set Custom Instructions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Step 2: Set Custom Instructions</h3>
              <p className="text-sm text-text-muted">Paste your brain context into Grok's custom instructions.</p>
              <ol className="text-sm text-text-primary space-y-2 list-decimal list-inside">
                <li>Open <strong>grok.com</strong> and go to <strong>Settings</strong></li>
                <li>Find the <strong>Custom Instructions</strong> section</li>
                <li>Open the <code className="bg-white px-1.5 py-0.5 rounded border border-border text-xs font-mono">.txt</code> file from Step 1 in a text editor, select all the text, and copy it</li>
                <li>Paste the contents into the custom instructions field</li>
                <li>Click <strong>Save</strong></li>
              </ol>
              <p className="text-xs text-text-muted mt-2">Note: Grok has a character limit on custom instructions. If your brain is too large, consider disabling less important sections or using the API approach below.</p>
            </div>
          </div>
        </details>

        {/* For Developers: Grok API */}
        <details className="bg-bg-panel border border-border rounded-xl">
          <summary className="font-semibold text-brand-black p-5 cursor-pointer select-none">
            For Developers: Grok API Integration
          </summary>
          <div className="px-5 pb-5 space-y-5">
            <p className="text-sm text-text-muted">This section is for developers building their own apps with the xAI API. If you just want to use your brain in Grok, follow the steps above instead — no code needed.</p>

            {/* Step 1: Install */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">Step 1: Install the required packages</p>
              <p className="text-sm text-text-muted">Open a terminal on your computer and run this command:</p>
              <div className="relative">
                <pre className="bg-white rounded-lg px-4 py-3 text-xs text-text-primary font-mono border border-border">pip install openai requests</pre>
                <button onClick={() => copy('pip install openai requests', 'grok-pip')} className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white">
                  {copied === 'grok-pip' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Step 2: API Keys */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-text-primary">Step 2: Get your API keys</p>
              <p className="text-sm text-text-muted">You need two API keys — one from Brainbox and one from xAI.</p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Brainbox API Key</p>
                {generatedKey ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-3 py-2 rounded text-xs text-text-primary flex-1 font-mono overflow-x-auto border border-border">{generatedKey}</code>
                      <button onClick={() => copy(generatedKey, 'grok-apikey')} className="text-brand-orange hover:text-brand-orange-hover flex-shrink-0 p-1" title="Copy">
                        {copied === 'grok-apikey' ? <Check size={16} /> : <Copy size={16} />}
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
                    <button onClick={handleGenerateKey} disabled={generating} className="text-xs text-brand-orange hover:text-brand-orange-hover border border-brand-orange/30 rounded-lg px-3 py-1.5 disabled:opacity-50">
                      {generating ? 'Generating...' : 'Generate New Key'}
                    </button>
                  </div>
                ) : (
                  <button onClick={handleGenerateKey} disabled={generating || !selectedBrain} className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">
                    {generating ? 'Generating...' : 'Generate API Key'}
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide">xAI API Key</p>
                <p className="text-sm text-text-muted">Get your xAI API key from <strong>console.x.ai</strong> &rarr; <strong>API Keys</strong>. You'll need an xAI account.</p>
              </div>
            </div>

            {/* Step 3: Python file */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">Step 3: Create a Python file</p>
              <p className="text-sm text-text-muted">Create a new file called <code className="bg-white px-1.5 py-0.5 rounded border border-border text-xs font-mono">brainbox_grok.py</code> and paste the following code. Replace the two placeholder API keys with your real keys from Step 2.</p>
              <div className="relative">
                <pre className="bg-white rounded-lg p-4 text-xs text-text-primary font-mono overflow-x-auto border border-border whitespace-pre">{`import requests
from openai import OpenAI

# Replace these with your real API keys from Step 2
BRAINBOX_API_KEY = "your_brainbox_api_key_here"
XAI_API_KEY = "your_xai_api_key_here"

# 1. Fetch your brain context from Brainbox
response = requests.get(
    "https://brainboxllm.site/api/context/${selectedBrain || '{brain_id}'}",
    headers={"X-API-Key": BRAINBOX_API_KEY}
)
brain_context = response.text

# 2. Send a message to Grok with your brain as the system prompt
client = OpenAI(api_key=XAI_API_KEY, base_url="https://api.x.ai/v1")
message = client.chat.completions.create(
    model="grok-3-latest",
    messages=[
        {"role": "system", "content": brain_context},
        {"role": "user", "content": "Hello!"}
    ]
)

print(message.choices[0].message.content)`}</pre>
                <button
                  onClick={() => copy(`import requests\nfrom openai import OpenAI\n\n# Replace these with your real API keys from Step 2\nBRAINBOX_API_KEY = "your_brainbox_api_key_here"\nXAI_API_KEY = "your_xai_api_key_here"\n\n# 1. Fetch your brain context from Brainbox\nresponse = requests.get(\n    "https://brainboxllm.site/api/context/${selectedBrain || '{brain_id}'}",\n    headers={"X-API-Key": BRAINBOX_API_KEY}\n)\nbrain_context = response.text\n\n# 2. Send a message to Grok with your brain as the system prompt\nclient = OpenAI(api_key=XAI_API_KEY, base_url="https://api.x.ai/v1")\nmessage = client.chat.completions.create(\n    model="grok-3-latest",\n    messages=[\n        {"role": "system", "content": brain_context},\n        {"role": "user", "content": "Hello!"}\n    ]\n)\n\nprint(message.choices[0].message.content)`, 'grok-python')}
                  className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white"
                >
                  {copied === 'grok-python' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Step 4: Run */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">Step 4: Run it</p>
              <p className="text-sm text-text-muted">Open a terminal, navigate to the folder where you saved the file, and run:</p>
              <div className="relative">
                <pre className="bg-white rounded-lg px-4 py-3 text-xs text-text-primary font-mono border border-border">python brainbox_grok.py</pre>
                <button onClick={() => copy('python brainbox_grok.py', 'grok-run')} className="absolute top-2 right-2 text-xs text-brand-orange hover:text-brand-orange-hover px-3 py-1 border border-brand-orange/30 rounded-lg bg-white">
                  {copied === 'grok-run' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-text-muted">Grok will respond using your brain context as its instructions. You can change the <code className="bg-white px-1.5 py-0.5 rounded border border-border text-xs font-mono">"Hello!"</code> message in the code to anything you like.</p>
            </div>
          </div>
        </details>

        </>)}
      </div>
    </div>
  );
}
