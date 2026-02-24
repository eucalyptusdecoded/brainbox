import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, LayoutTemplate, MoreVertical, Trash2, Copy, Pencil, Download, Upload, Plus, Brain, Sparkles, X } from 'lucide-react';
import Header from '../components/Header';
import brainTemplates from '../data/brainTemplates';

export default function Dashboard() {
  const [brains, setBrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState(null); // null | 'scratch' | 'template' | 'ai'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null); // brain id or null
  const [deleteConfirm, setDeleteConfirm] = useState(null); // brain object or null
  const [deleting, setDeleting] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null); // brain object or null
  const [renameValue, setRenameValue] = useState('');
  const [duplicating, setDuplicating] = useState(null); // brain object or null
  const [createError, setCreateError] = useState('');
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importError, setImportError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [aiFile, setAiFile] = useState(null);
  const [aiDescription, setAiDescription] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDragOver, setAiDragOver] = useState(false);
  const importRef = useRef(null);
  const aiFileRef = useRef(null);
  const matrixCanvasRef = useRef(null);
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

  // Matrix rain animation for AI generating state
  useEffect(() => {
    if (!aiGenerating) return;
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789{}[]<>/=+-*&@#$%!?';
    const fontSize = 13;

    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();

    const cols = Math.floor(canvas.offsetWidth / fontSize);
    const drops = Array(cols).fill(0).map(() => Math.random() * -20);

    let animId;
    function draw() {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < cols; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const alpha = 0.15 + Math.random() * 0.5;
        ctx.fillStyle = `rgba(255, 122, 0, ${alpha})`;
        ctx.fillText(char, x, y);
        if (y > canvas.offsetHeight && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5 + Math.random() * 0.5;
      }
      animId = requestAnimationFrame(draw);
    }

    // Fill initial background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    draw();

    return () => cancelAnimationFrame(animId);
  }, [aiGenerating]);

  function resetModal() {
    setShowCreate(false);
    setCreateMode(null);
    setSelectedTemplate(null);
    setNewName('');
    setNewDesc('');
    setCreating(false);
    setCreateError('');
    setAiFile(null);
    setAiDescription('');
    setAiGenerating(false);
    setAiDragOver(false);
    setAiError('');
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

  const [aiError, setAiError] = useState('');

  async function handleAiGenerate() {
    if (!aiFile && !aiDescription.trim()) return;
    setAiGenerating(true);
    setAiError('');
    try {
      let data;
      const ext = aiFile ? aiFile.name.split('.').pop().toLowerCase() : null;
      if (aiFile && (ext === 'pdf' || ext === 'docx')) {
        const formData = new FormData();
        formData.append('file', aiFile);
        if (aiDescription.trim()) formData.append('description', aiDescription.trim());
        ({ data } = await axios.post('/api/brains/generate-with-file', formData));
      } else {
        let fileContent = null;
        if (aiFile) {
          fileContent = await aiFile.text();
        }
        ({ data } = await axios.post('/api/brains/generate', {
          description: aiDescription.trim() || null,
          fileContent,
        }));
      }
      resetModal();
      fetchBrains();
      navigate(`/brain/${data.id}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to generate brain. Please try again.';
      setAiError(msg);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreateError('');
    setCreating(true);
    try {
      const { data } = await axios.post('/api/brains', { name: newName, description: newDesc });
      resetModal();
      navigate(`/brain/${data.id}`);
    } catch (err) {
      console.error('Failed to create brain:', err);
      setCreateError(err.response?.data?.error || 'Failed to create brain. Please try again.');
      setCreating(false);
    }
  }

  async function handleCreateFromTemplate(e) {
    e.preventDefault();
    if (!newName.trim() || !selectedTemplate) return;
    setCreateError('');
    setCreating(true);
    try {
      const { data: brain } = await axios.post('/api/brains', { name: newName, description: newDesc, template_id: selectedTemplate.id });
      for (const section of selectedTemplate.sections) {
        await axios.post(`/api/brains/${brain.id}/sections`, {
          type: section.type,
          title: section.title,
          content: section.content,
          priority: section.priority,
        });
      }
      resetModal();
      navigate(`/brain/${brain.id}`);
    } catch (err) {
      console.error('Failed to create brain from template:', err);
      setCreateError(err.response?.data?.error || 'Failed to create brain. Please try again.');
      setCreating(false);
    }
  }

  async function handleRename(e) {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await axios.put(`/api/brains/${renameTarget.id}`, { name: renameValue });
      setRenameTarget(null);
      fetchBrains();
    } catch (err) {
      console.error('Failed to rename brain:', err);
    }
  }

  async function handleDuplicate(brain) {
    setDuplicating(brain);
    try {
      const { data: source } = await axios.get(`/api/brains/${brain.id}`);
      const { data: newBrain } = await axios.post('/api/brains', {
        name: `Copy of ${brain.name}`,
        description: brain.description,
      });
      for (const section of source.sections || []) {
        await axios.post(`/api/brains/${newBrain.id}/sections`, {
          type: section.type,
          title: section.title,
          content: section.content,
          priority: section.priority,
        });
      }
      fetchBrains();
    } catch (err) {
      console.error('Failed to duplicate brain:', err);
    } finally {
      setDuplicating(null);
    }
  }

  async function handleExport(brain) {
    try {
      const response = await axios.get(`/api/brains/${brain.id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brain.name.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-')}.brainbox`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export brain:', err);
    }
  }

  async function handleImportFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.brainbox')) {
      setImportError('Only .brainbox files are accepted. Export a brain from the dashboard to get a .brainbox file.');
      return;
    }
    setImportError('');
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axios.post('/api/brains/import', formData);
      setShowImport(false);
      navigate(`/brain/${data.id}`);
    } catch (err) {
      console.error('Failed to import brain:', err);
      setImportError(err.response?.data?.error || 'Failed to import brain');
    } finally {
      setImporting(false);
    }
  }

  function handleImportInput(e) {
    handleImportFile(e.target.files?.[0]);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleImportFile(e.dataTransfer.files?.[0]);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/brains/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      setDeleting(false);
      fetchBrains();
    } catch (err) {
      console.error('Failed to delete brain:', err);
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen" onClick={() => setMenuOpen(null)}>
      <Header />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h2 className="text-xl font-semibold text-brand-black">Your Brains <span className="text-sm font-normal text-text-muted">({brains.length}/15)</span></h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowImport(true); setImportError(''); }}
              className="flex items-center gap-1.5 text-sm whitespace-nowrap px-3 py-2 rounded-lg border border-border text-text-muted hover:border-brand-orange hover:text-brand-orange transition-colors"
            >
              <Upload size={14} />
              Import Brain
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium whitespace-nowrap px-4 py-2 rounded-lg transition-colors"
            >
              + New Brain
            </button>
          </div>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={resetModal}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white border border-border rounded-xl p-6 w-full max-w-lg mx-4 space-y-4">

              {/* Step 1: Choose method */}
              {!createMode && (
                <>
                  <h3 className="text-lg font-semibold text-brand-black">Create New Brain</h3>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setCreateMode('ai')}
                      className="border border-border rounded-xl p-4 text-left hover:border-brand-orange/50 transition-colors group flex items-start gap-3"
                    >
                      <Sparkles size={24} className="text-brand-orange flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-brand-black text-sm">Generate with AI <span className="text-xs font-normal text-brand-orange">(Fastest)</span></p>
                        <p className="text-xs text-text-muted mt-1">Upload a context file or describe your brain and AI will build it for you.</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setCreateMode('template')}
                      className="border border-border rounded-xl p-4 text-left hover:border-brand-orange/50 transition-colors group flex items-start gap-3"
                    >
                      <LayoutTemplate size={24} className="text-brand-orange flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-brand-black text-sm">Use a Template</p>
                        <p className="text-xs text-text-muted mt-1">Choose a pre-built brain and customise it.</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { setCreateMode('scratch'); setNewName(''); setNewDesc(''); }}
                      className="border border-border rounded-xl p-4 text-left hover:border-brand-orange/50 transition-colors group flex items-start gap-3"
                    >
                      <FileText size={24} className="text-brand-orange flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-brand-black text-sm">Start from Scratch</p>
                        <p className="text-xs text-text-muted mt-1">Build your brain from an empty canvas.</p>
                      </div>
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: AI Generate */}
              {createMode === 'ai' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={goBack} className="text-text-muted hover:text-brand-black text-sm">&larr;</button>
                    <h3 className="text-lg font-semibold text-brand-black">Generate with AI</h3>
                  </div>

                  {aiGenerating ? (
                    <div className="space-y-4">
                      <div className="relative h-40 rounded-lg overflow-hidden border border-border bg-white">
                        <canvas
                          ref={matrixCanvasRef}
                          className="w-full h-full"
                          style={{ display: 'block' }}
                        />
                        {aiError && (
                          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-center px-4">
                            <button
                              onClick={() => { setAiGenerating(false); setAiError(''); }}
                              className="absolute top-2 right-2 text-text-muted hover:text-brand-black p-1"
                              aria-label="Close"
                            >
                              <X size={18} />
                            </button>
                            <p className="text-sm font-semibold text-brand-black">AI is unavailable right now</p>
                            <p className="text-xs text-text-muted mt-1">Please try again later.</p>
                          </div>
                        )}
                      </div>
                      {!aiError && (
                        <div className="text-center space-y-1">
                          <p className="text-sm font-semibold text-brand-black">Building your brain...</p>
                          <p className="text-xs text-text-muted">This usually takes 15–30 seconds</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Upload file */}
                      <div>
                        <label className="block text-sm text-text-muted mb-1">Upload a context file</label>
                        <div
                          onClick={() => aiFileRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setAiDragOver(true); }}
                          onDragLeave={() => setAiDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setAiDragOver(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file && /\.(txt|md|json|pdf|docx|csv)$/i.test(file.name)) setAiFile(file);
                          }}
                          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${aiDragOver ? 'border-brand-orange bg-brand-orange/5' : 'border-border hover:border-brand-orange/50'}`}
                        >
                          {aiFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <FileText size={16} className="text-brand-orange" />
                              <span className="text-sm text-text-primary font-medium">{aiFile.name}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); setAiFile(null); }}
                                className="text-text-muted hover:text-red-500 text-xs ml-1"
                              >
                                &times;
                              </button>
                            </div>
                          ) : (
                            <>
                              <Upload size={20} className={`mx-auto mb-2 ${aiDragOver ? 'text-brand-orange' : 'text-text-muted'}`} />
                              <p className="text-sm text-text-primary font-medium">Drag and drop or click to upload</p>
                              <p className="text-xs text-text-muted mt-1">.txt, .md, .json, .pdf, .docx, or .csv files accepted</p>
                            </>
                          )}
                          <input
                            ref={aiFileRef}
                            type="file"
                            accept=".txt,.md,.json,.pdf,.docx,.csv"
                            onChange={(e) => { setAiFile(e.target.files?.[0] || null); e.target.value = ''; }}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 border-t border-border" />
                        <span className="text-xs text-text-muted">or</span>
                        <div className="flex-1 border-t border-border" />
                      </div>

                      {/* Describe */}
                      <div>
                        <label className="block text-sm text-text-muted mb-1">Describe your brain</label>
                        <textarea
                          value={aiDescription}
                          onChange={(e) => setAiDescription(e.target.value)}
                          placeholder="e.g. A customer support agent that knows our refund policy and shipping FAQ..."
                          rows={3}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand-orange"
                        />
                      </div>

                      {aiError && (
                        <p className="text-xs text-red-600 font-medium">{aiError}</p>
                      )}

                      <div className="flex gap-3 justify-end">
                        <button onClick={resetModal} className="text-sm text-text-muted hover:text-brand-black px-4 py-2">Cancel</button>
                        <button
                          onClick={handleAiGenerate}
                          disabled={!aiFile && !aiDescription.trim()}
                          className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Sparkles size={14} />
                          Generate
                        </button>
                      </div>
                    </>
                  )}
                </div>
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
                  {createError && (
                    <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-2">{createError}</div>
                  )}
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={resetModal} className="text-sm text-text-muted hover:text-brand-black px-4 py-2">Cancel</button>
                    <button type="submit" disabled={creating} className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">{creating ? 'Creating...' : 'Create'}</button>
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
                  {createError && (
                    <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-2">{createError}</div>
                  )}
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

        {/* Import modal */}
        {showImport && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowImport(false)}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white border border-border rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
              <h3 className="text-lg font-semibold text-brand-black">Import Brain</h3>

              <div
                onClick={() => importRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-brand-orange bg-brand-orange/5' : 'border-border hover:border-brand-orange/50'}`}
              >
                <Upload size={32} className={`mx-auto mb-3 ${dragOver ? 'text-brand-orange' : 'text-text-muted'}`} />
                {importing ? (
                  <p className="text-sm text-brand-orange font-medium">Importing...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-text-primary">Drag and drop your .brainbox file here</p>
                    <p className="text-xs text-text-muted mt-1">or click to browse</p>
                  </>
                )}
                <p className="text-xs text-text-muted mt-3">Only .brainbox files accepted</p>
                <input ref={importRef} type="file" accept=".brainbox" onChange={handleImportInput} className="hidden" />
              </div>

              {importError && (
                <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-2">
                  {importError}
                </div>
              )}

              <details className="border border-border rounded-lg bg-bg-panel">
                <summary className="px-3 py-2 text-sm font-medium text-text-primary cursor-pointer">
                  Where do I get a .brainbox file?
                </summary>
                <div className="px-3 pb-3">
                  <ul className="space-y-1.5 text-xs text-text-muted">
                    <li className="flex gap-1.5"><span className="text-brand-orange flex-shrink-0">&bull;</span>Export from any brain using the <strong className="text-text-primary">&hellip;</strong> menu on the dashboard.</li>
                    <li className="flex gap-1.5"><span className="text-brand-orange flex-shrink-0">&bull;</span>.brainbox files contain all sections, images and settings.</li>
                    <li className="flex gap-1.5"><span className="text-brand-orange flex-shrink-0">&bull;</span>.txt context files are for pasting into LLMs — they cannot be imported into Brainbox.</li>
                  </ul>
                </div>
              </details>

              <div className="flex justify-end">
                <button onClick={() => setShowImport(false)} className="text-sm text-text-muted hover:text-brand-black px-4 py-2">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-white border border-border rounded-xl p-6 w-full max-w-sm mx-4 space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-brand-black">Delete Brain</h3>
              <p className="text-sm text-text-muted">
                Are you sure you want to delete <strong className="text-text-primary">{deleteConfirm.name}</strong>? This will permanently remove all sections and API keys associated with this brain.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="text-sm text-text-muted hover:text-brand-black px-4 py-2">Cancel</button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rename modal */}
        {renameTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setRenameTarget(null)}>
            <form onSubmit={handleRename} onClick={e => e.stopPropagation()} className="bg-white border border-border rounded-xl p-6 w-full max-w-sm mx-4 space-y-4">
              <h3 className="text-lg font-semibold text-brand-black">Rename Brain</h3>
              <div>
                <label className="block text-sm text-text-muted mb-1">Name</label>
                <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus required />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setRenameTarget(null)} className="text-sm text-text-muted hover:text-brand-black px-4 py-2">Cancel</button>
                <button type="submit" className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg">Save</button>
              </div>
            </form>
          </div>
        )}

        {/* Duplicating modal */}
        {duplicating && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white border border-border rounded-xl p-6 w-full max-w-sm mx-4 text-center space-y-3">
              <img src="/images/brainboxlogo.png" alt="" className="h-12 mx-auto animate-pulse" />
              <h3 className="text-lg font-semibold text-brand-black">Duplicating {duplicating.name}...</h3>
              <p className="text-sm text-text-muted">Copying all sections and settings</p>
            </div>
          </div>
        )}

        {/* Brain grid */}
        {loading ? (
          <p className="text-text-muted">Loading...</p>
        ) : brains.length === 0 ? (
          /* Empty state — welcome + template previews */
          <div className="flex flex-col items-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-5">
              <img src="/images/brainboxlogo.png" alt="" className="h-10" />
            </div>
            <h3 className="text-2xl font-semibold text-brand-black mb-2">Build your first brain</h3>
            <p className="text-text-muted max-w-md mb-6">
              Create an AI brain with rules, memories, and behaviours and deploy it to any LLM.
            </p>
            <div className="w-full max-w-md flex flex-col gap-3 mb-10">
              <button
                onClick={() => { setShowCreate(true); setCreateMode('ai'); }}
                className="border border-border rounded-xl p-4 text-left hover:border-brand-orange/50 transition-colors flex items-start gap-3"
              >
                <Sparkles size={22} className="text-brand-orange flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-brand-black text-sm">Generate with AI <span className="text-xs font-normal text-brand-orange">(Fastest)</span></p>
                  <p className="text-xs text-text-muted mt-1">Upload a context file or describe your brain and AI will build it for you.</p>
                </div>
              </button>
              <button
                onClick={() => { setShowCreate(true); setCreateMode('template'); }}
                className="border border-border rounded-xl p-4 text-left hover:border-brand-orange/50 transition-colors flex items-start gap-3"
              >
                <LayoutTemplate size={22} className="text-brand-orange flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-brand-black text-sm">Use a Template</p>
                  <p className="text-xs text-text-muted mt-1">Choose a pre-built brain and customise it.</p>
                </div>
              </button>
              <button
                onClick={() => { setShowCreate(true); setCreateMode('scratch'); }}
                className="border border-border rounded-xl p-4 text-left hover:border-brand-orange/50 transition-colors flex items-start gap-3"
              >
                <FileText size={22} className="text-brand-orange flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-brand-black text-sm">Start from Scratch</p>
                  <p className="text-xs text-text-muted mt-1">Build your brain from an empty canvas.</p>
                </div>
              </button>
            </div>

            {/* Template previews */}
            <div className="w-full max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-brand-orange" />
                <span className="text-sm font-medium text-text-muted">Popular templates</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {brainTemplates.slice(0, 3).map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      setShowCreate(true);
                      setCreateMode('template');
                      setSelectedTemplate(tpl);
                      setNewName(tpl.name);
                      setNewDesc(tpl.description);
                    }}
                    className="border border-border rounded-xl p-4 text-left hover:border-brand-orange/50 transition-colors group"
                  >
                    <span className="text-2xl">{tpl.icon}</span>
                    <p className="font-medium text-brand-black text-sm mt-2 group-hover:text-brand-orange transition-colors">{tpl.name}</p>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">{tpl.description}</p>
                    <p className="text-xs text-text-muted mt-2">{tpl.sections.length} sections</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brains.map((brain) => (
              <div key={brain.id} className={`relative border border-border rounded-xl overflow-hidden hover:border-brand-orange/50 transition-colors group ${duplicating?.id === brain.id ? 'opacity-50 pointer-events-none' : ''}`}>
                <Link to={`/brain/${brain.id}`}>
                  <div className="bg-bg-panel flex items-center justify-center px-5 py-6">
                    <img src="/images/brainboxlogo.png" alt="" className="h-12 opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="bg-white p-5 border-t border-border">
                    <h3 className="font-semibold text-brand-black group-hover:text-brand-orange transition-colors">{brain.name}</h3>
                    {brain.description && <p className="text-sm text-text-muted mt-1 line-clamp-2">{brain.description}</p>}
                    <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                      <span>{brain.section_count || 0}/50 nodes</span>
                      <span>Updated {new Date(brain.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
                <div className="absolute top-2 right-2">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(menuOpen === brain.id ? null : brain.id); }}
                    className="p-1 rounded-lg text-text-muted hover:text-brand-black hover:bg-white/80 transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen === brain.id && (
                    <div className="absolute right-0 top-8 bg-white border border-border rounded-lg shadow-lg py-1 z-10 w-40" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => { setMenuOpen(null); setRenameTarget(brain); setRenameValue(brain.name); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-panel transition-colors"
                      >
                        <Pencil size={14} />
                        Rename
                      </button>
                      <button
                        onClick={() => { setMenuOpen(null); handleDuplicate(brain); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-panel transition-colors"
                      >
                        <Copy size={14} />
                        Duplicate
                      </button>
                      <button
                        onClick={() => { setMenuOpen(null); handleExport(brain); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-panel transition-colors"
                      >
                        <Download size={14} />
                        Export
                      </button>
                      <button
                        onClick={() => { setMenuOpen(null); setDeleteConfirm(brain); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {Array.from({ length: Math.min(3, 15 - brains.length) }).map((_, idx) => (
              <button
                key={`empty-${idx}`}
                onClick={() => setShowCreate(true)}
                className="border-2 border-dashed border-border rounded-xl flex items-center justify-center min-h-[200px] hover:border-brand-orange/50 transition-colors group"
              >
                <div className="text-center text-text-muted group-hover:text-brand-orange transition-colors">
                  <Plus size={24} className="mx-auto mb-1" />
                  <span className="text-sm">New Brain</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
