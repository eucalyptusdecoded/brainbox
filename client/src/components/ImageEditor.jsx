import { useState } from 'react';
import { Info, ImageOff } from 'lucide-react';

export default function ImageEditor({ image, onSave, onDelete, onCancel }) {
  const [url, setUrl] = useState(image?.url || '');
  const [description, setDescription] = useState(image?.description || '');
  const [priority, setPriority] = useState(image?.priority ?? 0);
  const [imgError, setImgError] = useState(false);

  function handleSave() {
    if (!url.trim() || !description.trim()) return;
    onSave({
      ...image,
      url: url.trim(),
      description: description.trim(),
      priority,
    });
  }

  return (
    <div className="flex flex-col h-full p-4 md:p-5 space-y-4">
      <h2 className="text-xl font-semibold text-brand-black">
        {image?._draft ? 'Add Image Reference' : 'Edit Image Reference'}
      </h2>

      {/* Type & Priority row */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-3">
        <div className="w-full md:w-auto">
          <label className="block text-xs font-medium text-text-muted mb-1">Type</label>
          <select disabled className="text-sm w-full md:w-36 opacity-70 cursor-not-allowed">
            <option>Reference</option>
          </select>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-xs font-medium text-text-muted">Priority</label>
            <div className="relative group">
              <Info size={12} className="text-text-muted cursor-help" />
              <div className="absolute top-full left-0 mt-1.5 hidden group-hover:block w-56 bg-brand-black text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10">
                Controls the order images appear in the compiled context. Lower numbers appear first. Default is 0.
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

      {/* URL */}
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Image URL</label>
        <input
          className="text-sm"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setImgError(false); }}
          placeholder="https://example.com/image.png"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Description</label>
        <input
          className="text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 200))}
          placeholder="e.g. Brand logo (primary, full colour)"
          maxLength={200}
        />
        <p className="text-xs text-text-muted mt-1 text-right">{description.length}/200</p>
      </div>

      {/* Image preview */}
      {url.trim() && (
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Preview</label>
          <div className="border border-border rounded-lg p-3 bg-bg-panel">
            {imgError ? (
              <div className="flex flex-col items-center justify-center py-6 text-text-muted">
                <ImageOff size={32} className="mb-2" />
                <p className="text-xs">Could not load image from this URL</p>
              </div>
            ) : (
              <img
                src={url}
                alt={description || 'Preview'}
                className="max-h-48 max-w-full rounded object-contain mx-auto"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {image?._draft ? (
          <button onClick={onCancel} className="text-sm text-text-muted hover:text-brand-black">
            Cancel
          </button>
        ) : (
          <button onClick={() => onDelete(image)} className="text-sm text-red-600 hover:text-red-700">
            Delete image
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!url.trim() || !description.trim()}
          className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {image?._draft ? 'Add Image' : 'Save'}
        </button>
      </div>
    </div>
  );
}
