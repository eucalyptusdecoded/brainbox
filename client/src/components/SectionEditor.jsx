import { useState, useEffect } from 'react';

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
      <div className="flex items-center justify-center h-full text-gray-600">
        <p>Select a section to edit, or add a new one.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="flex items-center gap-3">
        <input
          className="flex-1 text-lg font-semibold"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Section title"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="text-sm w-36"
        >
          {TYPES.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <input
          type="number"
          value={priority}
          onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
          className="w-16 text-sm text-center"
          title="Priority (lower = first)"
        />
      </div>

      <textarea
        className="flex-1 resize-none text-sm leading-relaxed min-h-[200px]"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter the section content..."
      />

      <div className="flex items-center justify-between">
        <button
          onClick={() => onDelete(section)}
          className="text-sm text-red-400 hover:text-red-300"
        >
          Delete section
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim() || !content.trim()}
          className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
