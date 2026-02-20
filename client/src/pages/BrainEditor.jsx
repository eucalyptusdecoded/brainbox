import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, ScanSearch, PanelLeft, Eye, X } from 'lucide-react';
import SectionList from '../components/SectionList';
import SectionEditor from '../components/SectionEditor';
import ContextPreview from '../components/ContextPreview';
import BrainOverview from '../components/BrainOverview';
import FileUploader from '../components/FileUploader';
import Header from '../components/Header';
import useMediaQuery from '../hooks/useMediaQuery';

export default function BrainEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [brain, setBrain] = useState(null);
  const [sections, setSections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showPreview, setShowPreview] = useState(() => !window.matchMedia('(max-width: 767px)').matches);
  const [editingName, setEditingName] = useState(false);
  const [brainName, setBrainName] = useState('');
  const [brainDesc, setBrainDesc] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lock body scroll when mobile overlays are open
  useEffect(() => {
    if (isMobile && (sidebarOpen || showPreview)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarOpen, showPreview]);

  async function fetchBrain() {
    try {
      const { data } = await axios.get(`/api/brains/${id}`);
      setBrain(data);
      setSections(data.sections || []);
      setBrainName(data.name);
      setBrainDesc(data.description || '');
    } catch (err) {
      console.error('Failed to fetch brain:', err);
      navigate('/');
    }
  }

  useEffect(() => { fetchBrain(); }, [id]);

  async function saveBrainMeta() {
    try {
      await axios.put(`/api/brains/${id}`, { name: brainName, description: brainDesc });
      setEditingName(false);
    } catch (err) {
      console.error('Failed to save brain:', err);
    }
  }

  function handleAddSection(type) {
    setSelected({
      _draft: true,
      type,
      title: '',
      content: '',
      priority: 50,
    });
    setSidebarOpen(false);
  }

  function handleUploadStart() {
    setSelected({ _upload: true });
    setSidebarOpen(false);
  }

  async function handleSaveSection(section) {
    try {
      if (section._draft) {
        const { data } = await axios.post(`/api/brains/${id}/sections`, {
          type: section.type,
          title: section.title,
          content: section.content,
          priority: section.priority,
        });
        setSections(prev => [...prev, data]);
        setSelected(data);
      } else {
        const { data } = await axios.put(`/api/brains/${id}/sections/${section.id}`, {
          type: section.type,
          title: section.title,
          content: section.content,
          is_active: section.is_active,
          priority: section.priority,
        });
        setSections(prev => prev.map(s => (s.id === data.id ? data : s)));
        setSelected(data);
      }
    } catch (err) {
      console.error('Failed to save section:', err);
    }
  }

  function handleCancelDraft() {
    setSelected(null);
  }

  async function handleToggle(section) {
    try {
      const { data } = await axios.patch(`/api/brains/${id}/sections/${section.id}/toggle`);
      setSections(prev => prev.map(s => (s.id === data.id ? data : s)));
      if (selected?.id === data.id) setSelected(data);
    } catch (err) {
      console.error('Failed to toggle section:', err);
    }
  }

  function handleDelete(section) {
    setDeleteTarget(section);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/brains/${id}/sections/${deleteTarget.id}`);
      setSections(prev => prev.filter(s => s.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
    } catch (err) {
      console.error('Failed to delete section:', err);
    } finally {
      setDeleteTarget(null);
    }
  }

  if (!brain) return <div className="flex items-center justify-center min-h-screen text-text-muted">Loading...</div>;

  return (
    <div className="h-screen flex flex-col">
      <Header
        compact
        rightContent={
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`text-xs px-3 py-1 rounded-lg border hidden md:block ${showPreview ? 'border-brand-orange text-brand-orange' : 'border-border text-text-muted'}`}
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        }
      />

      {/* Mobile toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border md:hidden flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-black"
        >
          <PanelLeft size={16} />
          Sections
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-black ml-auto"
        >
          <Eye size={16} />
          Preview
        </button>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Brain info + Section list */}
        <div className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:w-56 md:z-auto md:transition-none
          border-r border-border overflow-y-auto flex-shrink-0 flex flex-col
        `}>
          {/* Mobile close button */}
          <div className="flex items-center justify-between px-3 pt-3 md:hidden">
            <span className="text-sm font-medium text-text-muted">Sections</span>
            <button onClick={() => setSidebarOpen(false)} className="text-text-muted hover:text-brand-black p-1">
              <X size={18} />
            </button>
          </div>

          {/* Overview link */}
          <div className="px-3 pt-3">
            <button
              onClick={() => { setSelected(null); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-brand-orange hover:bg-bg-panel transition-colors font-medium"
            >
              <ScanSearch size={14} />
              Brain Scan
            </button>
          </div>

          {/* Add section actions */}
          <div className="flex-1 overflow-y-auto p-3">
            <SectionList onAdd={handleAddSection} onUpload={handleUploadStart} />
          </div>
        </div>

        {/* Centre: Section editor or Overview */}
        <div className="flex-1 overflow-y-auto">
          {selected?._upload ? (
            <FileUploader
              brainId={id}
              onSave={handleSaveSection}
              onCancel={() => setSelected(null)}
            />
          ) : selected ? (
            <SectionEditor
              section={selected}
              onSave={handleSaveSection}
              onDelete={handleDelete}
              onCancel={handleCancelDraft}
            />
          ) : (
            <BrainOverview
              sections={sections}
              onAdd={handleAddSection}
              onUpload={handleUploadStart}
              brain={brain}
              editingName={editingName}
              setEditingName={setEditingName}
              brainName={brainName}
              setBrainName={setBrainName}
              brainDesc={brainDesc}
              setBrainDesc={setBrainDesc}
              saveBrainMeta={saveBrainMeta}
            />
          )}
        </div>

        {/* Right: Context preview — desktop only */}
        {showPreview && !isMobile && (
          <div className="w-80 border-l border-border overflow-y-auto flex-shrink-0 bg-bg-panel">
            <ContextPreview sections={sections} onDelete={handleDelete} onEdit={setSelected} />
          </div>
        )}
      </div>

      {/* Mobile preview overlay */}
      {showPreview && isMobile && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col md:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <h3 className="text-sm font-semibold text-text-primary">Brain Context</h3>
            <button onClick={() => setShowPreview(false)} className="text-text-muted hover:text-brand-black p-1">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ContextPreview
              sections={sections}
              onDelete={handleDelete}
              onEdit={(item) => { setSelected(item); setShowPreview(false); }}
            />
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white border border-border rounded-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-brand-orange" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-brand-black">Remove section</h3>
                <p className="text-xs text-text-muted mt-0.5">This will permanently delete this section from your brain.</p>
              </div>
            </div>
            <div className="bg-bg-panel rounded-lg px-3 py-2">
              <p className="text-sm font-medium text-text-primary">{deleteTarget.title}</p>
              {deleteTarget.content && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{deleteTarget.content}</p>}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="text-sm text-text-muted hover:text-brand-black px-4 py-2">Cancel</button>
              <button onClick={confirmDelete} className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
