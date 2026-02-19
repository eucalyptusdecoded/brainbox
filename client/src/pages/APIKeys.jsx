import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';

export default function APIKeys() {
  const [keys, setKeys] = useState([]);
  const [brains, setBrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBrain, setSelectedBrain] = useState('');
  const [label, setLabel] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const { logout } = useAuth();

  async function fetchData() {
    try {
      const [keysRes, brainsRes] = await Promise.all([
        axios.get('/api/keys'),
        axios.get('/api/brains'),
      ]);
      setKeys(keysRes.data);
      setBrains(brainsRes.data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!selectedBrain) return;
    try {
      const { data } = await axios.post('/api/keys', { brain_id: selectedBrain, label });
      setNewKey(data.key);
      setShowCreate(false);
      setLabel('');
      setSelectedBrain('');
      fetchData();
    } catch (err) {
      console.error('Failed to create key:', err);
    }
  }

  async function handleRevoke(id) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/keys/${id}`);
      setKeys(prev => prev.filter(k => k.id !== id));
    } catch (err) {
      console.error('Failed to revoke key:', err);
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold">🧠 Brainbox</Link>
          <Link to="/" className="text-sm text-gray-400 hover:text-white">Dashboard</Link>
          <Link to="/keys" className="text-sm text-white font-medium">API Keys</Link>
          <Link to="/integration" className="text-sm text-gray-400 hover:text-white">Integration</Link>
        </div>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-white">Sign Out</button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">API Keys</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            + Generate Key
          </button>
        </div>

        {/* New key display */}
        {newKey && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-400 font-medium mb-2">Your new API key (shown once only):</p>
            <div className="flex items-center gap-2">
              <code className="bg-black/40 px-3 py-1.5 rounded text-sm text-green-300 flex-1 font-mono">{newKey}</code>
              <button onClick={copyKey} className="text-sm text-green-400 hover:text-green-300 px-3 py-1.5 border border-green-500/30 rounded-lg">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button onClick={() => setNewKey(null)} className="text-xs text-gray-500 mt-2 hover:text-gray-400">Dismiss</button>
          </div>
        )}

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreate}
              className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-semibold">Generate API Key</h3>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Brain</label>
                <select value={selectedBrain} onChange={(e) => setSelectedBrain(e.target.value)} required>
                  <option value="">Select a brain</option>
                  {brains.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Label (optional)</label>
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Custom GPT Production" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Generate</button>
              </div>
            </form>
          </div>
        )}

        {/* Keys table */}
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : keys.length === 0 ? (
          <p className="text-gray-600 text-center py-12">No API keys yet. Generate one to get started.</p>
        ) : (
          <div className="border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-left">
                  <th className="px-4 py-3 font-medium">Label</th>
                  <th className="px-4 py-3 font-medium">Brain</th>
                  <th className="px-4 py-3 font-medium">Key Prefix</th>
                  <th className="px-4 py-3 font-medium">Last Used</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} className="border-b border-gray-800/50 hover:bg-gray-900/30">
                    <td className="px-4 py-3 text-white">{k.label || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{k.brain_name}</td>
                    <td className="px-4 py-3 font-mono text-gray-400">{k.key_prefix}...</td>
                    <td className="px-4 py-3 text-gray-500">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleRevoke(k.id)} className="text-red-400 hover:text-red-300 text-xs">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
