import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';

export default function Dashboard() {
  const [brains, setBrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const { logout } = useAuth();
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

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const { data } = await axios.post('/api/brains', { name: newName, description: newDesc });
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      navigate(`/brain/${data.id}`);
    } catch (err) {
      console.error('Failed to create brain:', err);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/"><img src="/images/brainboxlong.png" alt="Brainbox" className="h-12" /></Link>
          <Link to="/" className="text-sm text-text-muted hover:text-brand-black">Dashboard</Link>
          <Link to="/keys" className="text-sm text-text-muted hover:text-brand-black">API Keys</Link>
          <Link to="/integration" className="text-sm text-text-muted hover:text-brand-black">Integration</Link>
        </div>
        <button onClick={logout} className="text-sm text-text-muted hover:text-brand-black">Sign Out</button>
      </nav>

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
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreate}
              className="bg-white border border-border rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-semibold text-brand-black">Create New Brain</h3>
              <div>
                <label className="block text-sm text-text-muted mb-1">Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My AI Brain" autoFocus required />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Description (optional)</label>
                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What is this brain for?" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-text-muted hover:text-brand-black px-4 py-2">Cancel</button>
                <button type="submit" className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg">Create</button>
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
