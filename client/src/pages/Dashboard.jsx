import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, LayoutTemplate, Copy, Check } from 'lucide-react';
import Header from '../components/Header';
import brainTemplates from '../data/brainTemplates';

export default function Dashboard() {
  const [brains, setBrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState(null); // null | 'scratch' | 'template'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [newBrainKey, setNewBrainKey] = useState(null); // { brainId, apiKey }
  const [keyCopied, setKeyCopied] = useState(false);
  const navigate = useNavigate();

  async function fetchBrains() {
    try {
      const { data } = await axios.get('/api/brains');
      setBrains(data);
    } catch (err) {
      console.error('Failed to fetch brains:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchBrains(); }, []);

  function resetModal() {
    setShowCreate(false);
    setCreateMode(null);
    setSelectedTemplate(null);
    setNewName('');
    setNewDesc('');
    setCreating(false);
  }

  function goBack() {
    if (selectedTemplate) {
      setSelectedTemplate(null);
      setNewName('');
      setNewDesc('');
    } else {
      setCreateMode(null);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const { data } = await axios.post('/api/brains', { name: newName, description: newDesc });
      resetModal();
      if (data.api_key) {
        setNewBrainKey({ brainId: data.id, apiKey: data.api_key });
      } else {
        navigate(`/brain/${data.id}`);
      }
    } catch (err) {
      console.error('Failed to create brain:', err);
    }
  }

  async function handleCreateFromTemplate(e) {
    e.preventDefault();
    if (!newName.trim() || !selectedTemplate) return;
    setCreating(true);
    try {
      const { data: brain } = await axios.post('/api/brains', { name: newName, description: newDesc });
      for (const section of selectedTemplate.sections) {
        await axios.post(`/api/brains/${brain.id}/sections`, {
          type: section.type,
          title: section.title,
          content: section.content,
          priority: section.priority,
        });
      }
      resetModal();
      if (brain.api_key) {
        setNewBrainKey({ brainId: brain.id, apiKey: brain.api_key });
      } else {
        navigate(`/brain/${brain.id}`);
      }
    } catch (err) {
      console.error('Failed to create brain from template:', err);
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-brand-black">Your Brains</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Brain
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={resetModal}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white border border-border rounded-xl p-6 w-full max-w-lg space-y-4">

              {/* Step 1: Choose method */}
              {!createMode && (
                <>
                  <h3 className="text-lg font-semibold text-brand-black">Create New Brain</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setCreateMode('template')}
                      className="border border-border rounded-xl p-4 text-left hover:border-brand-orange/50 transition-colors group"
                    >
                      <LayoutTemplate size={24} className="text-brand-orange mb-2" />
                      <p className="font-medium text-brand-black text-sm">Start from Template</p>
                      <p className="text-xs text-text-muted mt-1">Choose a pre-built brain and customise it.</p>
                    </button>
                    <button
                      onClick={() => { setCreateMode('scratch'); setNewName(''); setNewDesc(''); }}
                      className="border border-border rounded-xl p-4 text-left hover:border-brand-orange/50 transition-colors group"
                    >
                      <FileText size={24} className="text-brand-orange mb-2" />
                      <p className="font-medium text-brand-black text-sm">Start from Scratch</p>
                      <p className="text-xs text-text-muted mt-1">Build your brain from an empty canvas.</p>
                    </button>
                  </div>
                </>
              )}

              {/* Step 2a: Scratch — name/description form */}
              {createMode === 'scratch' && (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={goBack} className="text-text-muted hover:text-brand-black text-sm">&larr;</button>
                    <h3 className="text-lg font-semibold text-brand-black">Create from Scratch</h3>
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Name</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My AI Brain" autoFocus required />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Description (optional)</label>
                    <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What is this brain for?" />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={resetModal} className="text-sm text-text-muted hover:text-brand-black px-4 py-2">Cancel</button>
                    <button type="submit" className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg">Create</button>
                  </div>
                </form>
              )}

              {/* Step 2b: Template — choose a template */}
              {createMode === 'template' && !selectedTemplate && (
                <>
                  <div className="flex items-center gap-2">
                    <button onClick={goBack} className="text-text-muted hover:text-brand-black text-sm">&larr;</button>
                    <h3 className="text-lg font-semibold text-brand-black">Choose a Template</h3>
                  </div>
                  <div className="space-y-2">
                    {brainTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => {
                          setSelectedTemplate(tpl);
                          setNewName(tpl.name);
                          setNewDesc(tpl.description);
                        }}
                        className="w-full border border-border rounded-xl p-4 text-left hover:border-brand-orange/50 transition-colors flex items-start gap-3"
                      >
                        <span className="text-2xl">{tpl.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-brand-black text-sm">{tpl.name}</p>
                          <p className="text-xs text-text-muted mt-0.5">{tpl.description}</p>
                          <p className="text-xs text-text-muted mt-1">{tpl.sections.length} sections</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 3: Template confirmation — name/description form */}
              {createMode === 'template' && selectedTemplate && (
                <form onSubmit={handleCreateFromTemplate} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={goBack} className="text-text-muted hover:text-brand-black text-sm">&larr;</button>
                    <h3 className="text-lg font-semibold text-brand-black">Customise Template</h3>
                  </div>
                  <div className="bg-bg-panel border border-border rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="text-lg">{selectedTemplate.icon}</span>
                    <span className="text-sm text-text-primary font-medium">{selectedTemplate.name}</span>
                    <span className="text-xs text-text-muted ml-auto">{selectedTemplate.sections.length} sections</span>
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Name</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus required />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Description (optional)</label>
                    <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={resetModal} className="text-sm text-text-muted hover:text-brand-black px-4 py-2">Cancel</button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

        {/* API key modal — shown once after brain creation */}
        {newBrainKey && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white border border-border rounded-xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-brand-black">Your API Key</h3>
              <p className="text-sm text-text-muted">An API key has been generated for this brain. Copy it now — it won't be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="bg-bg-panel border border-border rounded px-3 py-2 text-xs font-mono text-text-primary flex-1 overflow-x-auto">{newBrainKey.apiKey}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newBrainKey.apiKey);
                    setKeyCopied(true);
                    setTimeout(() => setKeyCopied(false), 2000);
                  }}
                  className="text-brand-orange hover:text-brand-orange-hover flex-shrink-0"
                  title="Copy"
                >
                  {keyCopied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const brainId = newBrainKey.brainId;
                    setNewBrainKey(null);
                    setKeyCopied(false);
                    navigate(`/brain/${brainId}`);
                  }}
                  className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                  Continue to Brain
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Brain grid */}
        {loading ? (
          <p className="text-text-muted">Loading...</p>
        ) : brains.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted text-lg">No brains yet</p>
            <p className="text-text-muted text-sm mt-1">Create your first brain to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brains.map((brain) => (
              <Link
                key={brain.id}
                to={`/brain/${brain.id}`}
                className="border border-border rounded-xl overflow-hidden hover:border-brand-orange/50 transition-colors group"
              >
                <div className="bg-bg-panel flex items-center justify-center px-5 py-6">
                  <img src="/images/brainboxlogo.png" alt="" className="h-12 opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="bg-white p-5 border-t border-border">
                  <h3 className="font-semibold text-brand-black group-hover:text-brand-orange transition-colors">{brain.name}</h3>
                  {brain.description && <p className="text-sm text-text-muted mt-1 line-clamp-2">{brain.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                    <span>{brain.section_count || 0} sections</span>
                    <span>Updated {new Date(brain.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
