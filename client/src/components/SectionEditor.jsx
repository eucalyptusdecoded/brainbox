import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

const TYPES = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];

export default function SectionEditor({ section, onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('rule');
  const [priority, setPriority] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (section) {
      setTitle(section.title);
      setContent(section.content);
      setType(section.type);
      setPriority(section.priority || 0);
    }
  }, [section]);

  async function handleSave() {
    setSaving(true);
    await onSave({ ...section, title, content, type, priority });
    setSaving(false);
  }

  if (!section) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        <p>Select a section to edit, or add a new one.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-5 space-y-4">
      {/* Type & Priority row */}
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="text-sm w-36"
          >
            {TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs font-medium text-text-muted">Priority</label>
            <div className="relative group">
              <Info size={12} className="text-text-muted cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-48 bg-brand-black text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10">
                Lower numbers appear first. Use this to control the order nodes are sent to the API.
              </div>
            </div>
          </div>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
            className="w-16 text-sm text-center"
          />
        </div>
      </div>

      {/* Name field */}
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Name</label>
        <input
          className="text-sm font-semibold"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 20))}
          placeholder="e.g. Spelling Rule"
          maxLength={20}
        />
        <p className="text-xs text-text-muted mt-1 text-right">{title.length}/20</p>
      </div>

      {/* Content field */}
      <div className="flex flex-col flex-1">
        <label className="block text-xs font-medium text-text-muted mb-1">Content</label>
        <textarea
          className="flex-1 resize-none text-sm leading-relaxed min-h-[200px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter the full detail for this section..."
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => onDelete(section)}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Delete section
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim() || !content.trim()}
          className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
