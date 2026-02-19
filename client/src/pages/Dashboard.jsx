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
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold">🧠 Brainbox</h1>
          <Link to="/" className="text-sm text-gray-400 hover:text-white">Dashboard</Link>
          <Link to="/keys" className="text-sm text-gray-400 hover:text-white">API Keys</Link>
          <Link to="/integration" className="text-sm text-gray-400 hover:text-white">Integration</Link>
        </div>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-white">Sign Out</button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Brains</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Brain
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreate}
              className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-semibold">Create New Brain</h3>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My AI Brain" autoFocus required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What is this brain for?" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Create</button>
              </div>
            </form>
          </div>
        )}

        {/* Brain grid */}
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : brains.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No brains yet</p>
            <p className="text-gray-600 text-sm mt-1">Create your first brain to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brains.map((brain) => (
              <Link
                key={brain.id}
                to={`/brain/${brain.id}`}
                className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-violet-500/50 transition-colors group"
              >
                <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">{brain.name}</h3>
                {brain.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{brain.description}</p>}
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
                  <span>{brain.section_count || 0} sections</span>
                  <span>Updated {new Date(brain.updated_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
