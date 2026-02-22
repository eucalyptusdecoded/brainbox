import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';

export default function APIKeys() {
  const [keys, setKeys] = useState([]);
  const [brains, setBrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBrain, setSelectedBrain] = useState('');
  const [label, setLabel] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
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

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await axios.delete(`/api/keys/${deleteConfirm.id}`);
      setKeys(prev => prev.filter(k => k.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete key:', err);
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h2 className="text-xl font-semibold text-brand-black">API Keys</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium whitespace-nowrap w-fit px-4 py-2 rounded-lg"
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
              className="bg-white border border-border rounded-xl p-6 w-full max-w-md mx-4 space-y-4"
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
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
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
                {keys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted">No API keys yet. Click Generate Key to create one.</td>
                  </tr>
                ) : keys.map(k => (
                  <tr key={k.id} className="border-b border-border hover:bg-bg-panel">
                    <td className="px-4 py-3 text-text-primary">{k.label || '—'}</td>
                    <td className="px-4 py-3 text-text-muted">{k.brain_name}</td>
                    <td className="px-4 py-3 font-mono text-text-muted">{k.key_prefix}...</td>
                    <td className="px-4 py-3 text-text-muted">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</td>
                    <td className="px-4 py-3 text-text-muted">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDeleteConfirm(k)} className="text-red-600 hover:text-red-700 text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
        {/* Delete confirmation modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
            <div onClick={e => e.stopPropagation()} className="bg-white border border-border rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
              <h3 className="text-lg font-semibold text-brand-black">Delete API Key</h3>
              <p className="text-sm text-text-muted">
                Deleting this key will immediately stop any integration using it. To reconnect, generate a new API key and update your integration settings.
              </p>
              <div className="bg-bg-panel border border-border rounded-lg px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-muted">Label</span>
                  <span className="text-text-primary">{deleteConfirm.label || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Key</span>
                  <span className="font-mono text-text-primary">{deleteConfirm.key_prefix}...</span>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="text-sm text-text-muted hover:text-brand-black px-4 py-2">Cancel</button>
                <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Delete Key</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
