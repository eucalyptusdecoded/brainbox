import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, LayoutTemplate, MoreVertical, Trash2, Copy, Pencil, Download, Upload } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(null); // brain id or null
  const [deleteConfirm, setDeleteConfirm] = useState(null); // brain object or null
  const [deleting, setDeleting] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null); // brain object or null
  const [renameValue, setRenameValue] = useState('');
  const [duplicating, setDuplicating] = useState(null); // brain id or null
  const [importing, setImporting] = useState(false);
  const importRef = useRef(null);
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
      navigate(`/brain/${data.id}`);
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
      navigate(`/brain/${brain.id}`);
    } catch (err) {
      console.error('Failed to create brain from template:', err);
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
    setDuplicating(brain.id);
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

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axios.post('/api/brains/import', formData);
      navigate(`/brain/${data.id}`);
    } catch (err) {
      console.error('Failed to import brain:', err);
      alert(err.response?.data?.error || 'Failed to import brain');
    } finally {
      setImporting(false);
    }
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-brand-black">Your Brains</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => importRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-border text-text-muted hover:border-brand-orange hover:text-brand-orange transition-colors disabled:opacity-50"
            >
              <Upload size={14} />
              {importing ? 'Importing...' : 'Import Brain'}
            </button>
            <input ref={importRef} type="file" accept=".brainbox" onChange={handleImport} className="hidden" />
            <button
              onClick={() => setShowCreate(true)}
              className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
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
              <div key={brain.id} className={`relative border border-border rounded-xl overflow-hidden hover:border-brand-orange/50 transition-colors group ${duplicating === brain.id ? 'opacity-50 pointer-events-none' : ''}`}>
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
          </div>
        )}
      </div>
    </div>
  );
}
