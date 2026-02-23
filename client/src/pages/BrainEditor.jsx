import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, ScanSearch, PanelLeft, Eye, X, BookOpen, Layers, Plug } from 'lucide-react';
import SectionList from '../components/SectionList';
import SectionEditor from '../components/SectionEditor';
import ContextPreview from '../components/ContextPreview';
import BrainOverview from '../components/BrainOverview';
import FileUploader from '../components/FileUploader';
import ImageEditor from '../components/ImageEditor';
import Header from '../components/Header';
import useMediaQuery from '../hooks/useMediaQuery';

export default function BrainEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [brain, setBrain] = useState(null);
  const [sections, setSections] = useState([]);
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showPreview, setShowPreview] = useState(() => !window.matchMedia('(max-width: 1023px)').matches);
  const [editingName, setEditingName] = useState(false);
  const [brainName, setBrainName] = useState('');
  const [brainDesc, setBrainDesc] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(() => {
    try { return localStorage.getItem(`brainbox-getting-started-dismissed-${id}`) === '1'; } catch { return false; }
  });

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
      setImages(data.images || []);
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

  function handleAddImage() {
    const defaultPriority = brain?.template_id === 'brand-image-generator' ? 100 : 0;
    setSelected({ _image: true, _draft: true, url: '', description: '', priority: defaultPriority });
    setSidebarOpen(false);
  }

  async function handleSaveImage(image) {
    try {
      if (image._draft) {
        const { data } = await axios.post(`/api/brains/${id}/images`, {
          url: image.url,
          description: image.description,
          priority: image.priority,
        });
        setImages(prev => [...prev, data]);
        setSelected(null);
      } else {
        const { data } = await axios.put(`/api/brains/${id}/images/${image.id}`, {
          url: image.url,
          description: image.description,
          priority: image.priority,
        });
        setImages(prev => prev.map(i => (i.id === data.id ? data : i)));
        setSelected(null);
      }
    } catch (err) {
      console.error('Failed to save image:', err);
    }
  }

  function handleDeleteImage(image) {
    setDeleteTarget({ ...image, _isImage: true });
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
      if (deleteTarget._isImage) {
        await axios.delete(`/api/brains/${id}/images/${deleteTarget.id}`);
        setImages(prev => prev.filter(i => i.id !== deleteTarget.id));
      } else {
        await axios.delete(`/api/brains/${id}/sections/${deleteTarget.id}`);
        setSections(prev => prev.filter(s => s.id !== deleteTarget.id));
      }
      if (selected?.id === deleteTarget.id) setSelected(null);
    } catch (err) {
      console.error('Failed to delete:', err);
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
            className={`text-xs px-3 py-1 rounded-lg border hidden lg:block ${showPreview ? 'border-brand-orange text-brand-orange' : 'border-border text-text-muted'}`}
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        }
      />

      {/* Mobile toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border lg:hidden flex-shrink-0">
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
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Brain info + Section list */}
        <div className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:w-56 lg:z-auto lg:transition-none
          border-r border-border overflow-y-auto flex-shrink-0 flex flex-col
        `}>
          {/* Mobile close button */}
          <div className="flex items-center justify-between px-3 pt-3 lg:hidden">
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
            <SectionList onAdd={handleAddSection} onUpload={handleUploadStart} onAddImage={handleAddImage} />
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
          ) : selected?._image || selected?._isImage ? (
            <ImageEditor
              image={selected}
              onSave={handleSaveImage}
              onDelete={handleDeleteImage}
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
            <div className="h-full overflow-y-auto">
              {/* Getting started banner — shown when brain has 0 sections */}
              {sections.length === 0 && !guideDismissed && (
                <div className="mx-6 mt-6 bg-bg-panel border border-border rounded-xl p-5 relative">
                  <button
                    onClick={() => { setGuideDismissed(true); try { localStorage.setItem(`brainbox-getting-started-dismissed-${id}`, '1'); } catch {} }}
                    className="absolute top-3 right-3 text-text-muted hover:text-brand-black p-1"
                    aria-label="Dismiss"
                  >
                    <X size={16} />
                  </button>
                  <h3 className="font-semibold text-brand-black mb-3">Getting Started</h3>
                  <div className="space-y-3">
                    {[
                      { icon: BookOpen, step: '1', text: 'Add your first rule or memory' },
                      { icon: Layers, step: '2', text: 'Build out your brain with behaviours and guardrails' },
                      { icon: Plug, step: '3', text: 'Go to Integration to connect to an LLM' },
                    ].map(({ icon: Icon, step, text }) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                          <Icon size={14} className="text-brand-orange" />
                        </div>
                        <div>
                          <span className="text-sm text-text-primary">{text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <BrainOverview
                sections={sections}
                images={images}
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
            </div>
          )}
        </div>

        {/* Right: Context preview — desktop only */}
        {showPreview && !isMobile && (
          <div className="w-80 border-l border-border overflow-y-auto flex-shrink-0 bg-bg-panel">
            <ContextPreview sections={sections} images={images} onDelete={handleDelete} onDeleteImage={handleDeleteImage} onEdit={setSelected} />
          </div>
        )}
      </div>

      {/* Mobile preview overlay */}
      {showPreview && isMobile && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col lg:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <h3 className="text-sm font-semibold text-text-primary">Brain Context</h3>
            <button onClick={() => setShowPreview(false)} className="text-text-muted hover:text-brand-black p-1">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ContextPreview
              sections={sections}
              images={images}
              onDelete={handleDelete}
              onDeleteImage={handleDeleteImage}
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
                <h3 className="text-sm font-semibold text-brand-black">Remove {deleteTarget._isImage ? 'image' : 'section'}</h3>
                <p className="text-xs text-text-muted mt-0.5">This will permanently delete this {deleteTarget._isImage ? 'image' : 'section'} from your brain.</p>
              </div>
            </div>
            <div className="bg-bg-panel rounded-lg px-3 py-2">
              <p className="text-sm font-medium text-text-primary">{deleteTarget.title || deleteTarget.description}</p>
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
