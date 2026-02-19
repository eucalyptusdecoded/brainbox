import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SectionList from '../components/SectionList';
import SectionEditor from '../components/SectionEditor';
import ContextPreview from '../components/ContextPreview';
import { useAuth } from '../App';

export default function BrainEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [brain, setBrain] = useState(null);
  const [sections, setSections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [brainName, setBrainName] = useState('');
  const [brainDesc, setBrainDesc] = useState('');

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

  async function handleAddSection(type) {
    try {
      const { data } = await axios.post(`/api/brains/${id}/sections`, {
        type,
        title: `New ${type}`,
        content: '',
        priority: 0,
      });
      setSections(prev => [...prev, data]);
      setSelected(data);
    } catch (err) {
      console.error('Failed to add section:', err);
    }
  }

  async function handleSaveSection(section) {
    try {
      const { data } = await axios.put(`/api/brains/${id}/sections/${section.id}`, {
        type: section.type,
        title: section.title,
        content: section.content,
        is_active: section.is_active,
        priority: section.priority,
      });
      setSections(prev => prev.map(s => (s.id === data.id ? data : s)));
      setSelected(data);
    } catch (err) {
      console.error('Failed to save section:', err);
    }
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

  async function handleDelete(section) {
    if (!confirm('Delete this section?')) return;
    try {
      await axios.delete(`/api/brains/${id}/sections/${section.id}`);
      setSections(prev => prev.filter(s => s.id !== section.id));
      if (selected?.id === section.id) setSelected(null);
    } catch (err) {
      console.error('Failed to delete section:', err);
    }
  }

  if (!brain) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>;

  return (
    <div className="h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-lg font-bold">🧠</Link>
          <Link to="/" className="text-sm text-gray-400 hover:text-white">Dashboard</Link>
          <Link to="/keys" className="text-sm text-gray-400 hover:text-white">API Keys</Link>
          <Link to="/integration" className="text-sm text-gray-400 hover:text-white">Integration</Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`text-xs px-3 py-1 rounded-lg border ${showPreview ? 'border-violet-500 text-violet-400' : 'border-gray-700 text-gray-500'}`}
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-white">Sign Out</button>
        </div>
      </nav>

      {/* Brain name bar */}
      <div className="border-b border-gray-800 px-4 py-2 flex items-center gap-3 flex-shrink-0">
        {editingName ? (
          <>
            <input
              className="text-sm font-semibold flex-1"
              value={brainName}
              onChange={(e) => setBrainName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveBrainMeta()}
            />
            <input
              className="text-sm flex-1"
              value={brainDesc}
              onChange={(e) => setBrainDesc(e.target.value)}
              placeholder="Description"
              onKeyDown={(e) => e.key === 'Enter' && saveBrainMeta()}
            />
            <button onClick={saveBrainMeta} className="text-xs text-violet-400 hover:text-violet-300">Save</button>
            <button onClick={() => setEditingName(false)} className="text-xs text-gray-500 hover:text-gray-400">Cancel</button>
          </>
        ) : (
          <button onClick={() => setEditingName(true)} className="text-sm font-semibold text-white hover:text-violet-400 transition-colors">
            {brain.name} {brain.description && <span className="font-normal text-gray-500">— {brain.description}</span>}
          </button>
        )}
      </div>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Section list */}
        <div className="w-56 border-r border-gray-800 overflow-y-auto p-3 flex-shrink-0">
          <SectionList
            sections={sections}
            selectedId={selected?.id}
            onSelect={setSelected}
            onToggle={handleToggle}
            onAdd={handleAddSection}
          />
        </div>

        {/* Centre: Section editor */}
        <div className="flex-1 overflow-y-auto">
          <SectionEditor
            section={selected}
            onSave={handleSaveSection}
            onDelete={handleDelete}
          />
        </div>

        {/* Right: Context preview */}
        {showPreview && (
          <div className="w-80 border-l border-gray-800 overflow-y-auto flex-shrink-0 bg-[#0d0d0d]">
            <ContextPreview sections={sections} />
          </div>
        )}
      </div>
    </div>
  );
}
