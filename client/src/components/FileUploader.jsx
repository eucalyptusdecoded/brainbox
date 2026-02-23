import { useState, useRef } from 'react';
import { Upload, FileText, Lightbulb, ChevronDown, ChevronRight, Info } from 'lucide-react';
import axios from 'axios';

const TYPES = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];

export default function FileUploader({ brainId, onSave, onCancel }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('memory');
  const [priority, setPriority] = useState(50);
  const [error, setError] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(true);
  const fileRef = useRef(null);

  async function handleFileSelect(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    e.target.value = '';

    setFile(selected);
    setError('');
    setContent('');
    setExtracting(true);

    const formData = new FormData();
    formData.append('file', selected);

    try {
      const { data } = await axios.post(`/api/brains/${brainId}/extract`, formData);
      setTitle(data.filename);
      if (data.text.length > 2000) {
        setContent(data.text.slice(0, 2000));
        setError('Extracted text exceeded 2000 characters and was trimmed. Review the content before saving.');
      } else {
        setContent(data.text);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to extract text from file');
      setFile(null);
    } finally {
      setExtracting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    await onSave({
      _draft: true,
      type,
      title,
      content,
      priority,
    });
    setSaving(false);
  }

  return (
    <div className="flex flex-col h-full p-4 md:p-5 space-y-4">
      <h2 className="text-xl font-semibold text-brand-black">Upload File</h2>

      {/* Type & Priority row */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-3">
        <div className="w-full md:w-auto">
          <label className="block text-xs font-medium text-text-muted mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="text-sm w-full md:w-36"
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
              <div className="absolute top-full left-0 mt-1.5 hidden group-hover:block w-64 bg-brand-black text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10">
                Lower numbers appear first in the context sent to the AI — sections read earlier have the strongest influence on output. Default is 50. Use 1–25 for critical, 25–50 for important, 50–75 for standard, 75–100 for supplementary.
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

      {/* Upload tips */}
      <div className="border border-border rounded-lg bg-bg-panel">
        <button
          onClick={() => setTipsOpen(!tipsOpen)}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm"
        >
          <Lightbulb size={14} className="text-brand-orange flex-shrink-0" />
          <span className="font-medium text-text-primary">Uploading Files</span>
          {tipsOpen
            ? <ChevronDown size={14} className="text-text-muted ml-auto" />
            : <ChevronRight size={14} className="text-text-muted ml-auto" />
          }
        </button>
        {tipsOpen && (
          <div className="px-3 pb-3 space-y-1">
            <ul className="space-y-1">
              {[
                'Supported formats: TXT, PDF, DOCX, and CSV.',
                'Text is extracted and saved as a brain section — the original file is not stored.',
                'Maximum 500KB of extracted text per file. Longer documents will be rejected.',
                'Choose the section type that best fits the content — e.g. Memory for reference docs, Rule for guidelines.',
                'You can edit the extracted content after saving, just like any other section.',
              ].map((tip, i) => (
                <li key={i} className="text-xs text-text-muted flex gap-1.5">
                  <span className="text-brand-orange flex-shrink-0">&#x2022;</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Name field */}
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Name</label>
        <input
          className="text-sm font-semibold"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 50))}
          placeholder="Auto-filled from filename"
          maxLength={50}
          disabled={!content}
        />
        <p className="text-xs text-text-muted mt-1 text-right">{title.length}/50</p>
      </div>

      {/* File picker / drop zone */}
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">File</label>
        {!file ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-brand-orange transition-colors"
          >
            <Upload size={24} className="mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-muted">Click to select a file</p>
            <p className="text-xs text-text-muted mt-1">TXT, PDF, DOCX, or CSV</p>
          </button>
        ) : (
          <div className="border border-border rounded-lg p-3 flex items-center gap-3">
            <FileText size={20} className="text-brand-orange flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={() => { setFile(null); setContent(''); setTitle(''); setError(''); }}
              className="text-xs text-brand-orange hover:text-brand-orange-hover"
            >
              Change
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.pdf,.docx,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Extracting state */}
      {extracting && (
        <p className="text-sm text-text-muted">Extracting text...</p>
      )}

      {/* Content preview */}
      {content && (
        <div className="flex flex-col flex-1">
          <label className="block text-xs font-medium text-text-muted mb-1">
            Extracted Content ({(content.length / 1000).toFixed(1)}KB)
          </label>
          <textarea
            className="flex-1 resize-none text-sm leading-relaxed min-h-[200px] bg-bg-panel"
            value={content}
            readOnly
          />
          <p className="text-xs text-text-muted mt-1 text-right">{content.length}/2000</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-sm text-text-muted hover:text-brand-black"
        >
          Cancel
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
