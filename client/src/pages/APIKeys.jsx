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
      <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/"><img src="/images/brainboxlong.png" alt="Brainbox" className="h-12" /></Link>
          <Link to="/" className="text-sm text-text-muted hover:text-brand-black">Dashboard</Link>
          <Link to="/keys" className="text-sm text-brand-black font-medium">API Keys</Link>
          <Link to="/integration" className="text-sm text-text-muted hover:text-brand-black">Integration</Link>
        </div>
        <button onClick={logout} className="text-sm text-text-muted hover:text-brand-black">Sign Out</button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-brand-black">API Keys</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            + Generate Key
          </button>
        </div>

        {/* New key display */}
        {newKey && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-600 font-medium mb-2">Your new API key (shown once only):</p>
            <div className="flex items-center gap-2">
              <code className="bg-bg-panel px-3 py-1.5 rounded text-sm text-green-600 flex-1 font-mono">{newKey}</code>
              <button onClick={copyKey} className="text-sm text-green-600 hover:text-green-700 px-3 py-1.5 border border-green-300 rounded-lg">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button onClick={() => setNewKey(null)} className="text-xs text-text-muted mt-2 hover:text-text-primary">Dismiss</button>
          </div>
        )}

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleCreate}
              className="bg-white border border-border rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-semibold text-brand-black">Generate API Key</h3>
              <div>
                <label className="block text-sm text-text-muted mb-1">Brain</label>
                <select value={selectedBrain} onChange={(e) => setSelectedBrain(e.target.value)} required>
                  <option value="">Select a brain</option>
                  {brains.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Label (optional)</label>
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Custom GPT Production" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-text-muted hover:text-brand-black px-4 py-2">Cancel</button>
                <button type="submit" className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg">Generate</button>
              </div>
            </form>
          </div>
        )}

        {/* Keys table */}
        {loading ? (
          <p className="text-text-muted">Loading...</p>
        ) : keys.length === 0 ? (
          <p className="text-text-muted text-center py-12">No API keys yet. Generate one to get started.</p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-left">
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
                  <tr key={k.id} className="border-b border-border hover:bg-bg-panel">
                    <td className="px-4 py-3 text-text-primary">{k.label || '—'}</td>
                    <td className="px-4 py-3 text-text-muted">{k.brain_name}</td>
                    <td className="px-4 py-3 font-mono text-text-muted">{k.key_prefix}...</td>
                    <td className="px-4 py-3 text-text-muted">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</td>
                    <td className="px-4 py-3 text-text-muted">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleRevoke(k.id)} className="text-red-600 hover:text-red-700 text-xs">Revoke</button>
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
