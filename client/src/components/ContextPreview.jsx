import { useState } from 'react';
import { Pencil, Trash2, Maximize2, X, ImageIcon } from 'lucide-react';

const SECTION_ORDER = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];
const SECTION_LABELS = {
  rule: 'Rules',
  memory: 'Memories',
  behaviour: 'Behaviours',
  guardrail: 'Guardrails',
  skill: 'Skills',
};

export default function ContextPreview({ sections, images = [], onDelete, onDeleteImage, onEdit }) {
  const [expanded, setExpanded] = useState(false);

  const active = sections.filter(s => s.is_active);

  const grouped = {};
  SECTION_ORDER.forEach(type => {
    const items = active
      .filter(s => s.type === type)
      .sort((a, b) => a.priority - b.priority);
    grouped[type] = items;
  });

  const totalActive = active.length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Brain Context</h3>
          <p className="text-xs text-text-muted">Your brain's active knowledge and instructions</p>
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="text-text-muted hover:text-text-primary transition-colors"
          title="Expand full preview"
        >
          <Maximize2 size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 text-sm text-text-primary leading-relaxed">
        {totalActive === 0 ? (
          <p className="text-text-muted">No active sections</p>
        ) : (
          <div className="space-y-5">
            {SECTION_ORDER.map(type => {
              const items = grouped[type];
              if (items.length === 0) return null;
              return (
                <div key={type}>
                  <h4 className="text-xs font-semibold text-brand-orange uppercase tracking-wider mb-2">
                    {SECTION_LABELS[type]} ({items.length}/10)
                  </h4>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={item.id} className="flex items-start gap-2 group">
                        <span className="text-xs text-text-muted mt-0.5 w-4 flex-shrink-0 text-right">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                          <p className="text-xs text-text-muted truncate">{item.content.length > 35 ? item.content.slice(0, 35) + '...' : item.content}</p>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1.5 text-brand-orange hover:text-brand-orange-hover"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              className="p-1.5 text-brand-orange hover:text-brand-orange-hover"
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {images.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-brand-orange uppercase tracking-wider mb-2">
                  REFERENCE IMAGES ({images.length}/10)
                </h4>
                <div className="space-y-2">
                  {images.sort((a, b) => a.priority - b.priority).map((img, idx) => (
                    <div key={img.id} className="flex items-start gap-2 group">
                      <span className="text-xs text-text-muted mt-0.5 w-4 flex-shrink-0 text-right">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{img.description}</p>
                        <p className="text-xs text-text-muted truncate">{img.url}</p>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                        {onEdit && (
                          <button
                            onClick={() => onEdit({ ...img, _image: true })}
                            className="p-1.5 text-brand-orange hover:text-brand-orange-hover"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {onDeleteImage && (
                          <button
                            onClick={() => onDeleteImage(img)}
                            className="p-1.5 text-brand-orange hover:text-brand-orange-hover"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center" onClick={() => setExpanded(false)}>
          <div
            className="bg-white max-w-3xl w-full mx-auto my-0 lg:my-8 rounded-none lg:rounded-xl shadow-xl h-full lg:h-auto lg:max-h-[calc(100vh-4rem)] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-semibold text-text-primary">Brain Context</h2>
              <button
                onClick={() => setExpanded(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 lg:p-6 text-sm text-text-primary leading-relaxed">
              {totalActive === 0 ? (
                <p className="text-text-muted">No active sections</p>
              ) : (
                <div className="space-y-6">
                  {SECTION_ORDER.map(type => {
                    const items = grouped[type];
                    if (items.length === 0) return null;
                    return (
                      <div key={type}>
                        <h4 className="text-xs font-semibold text-brand-orange uppercase tracking-wider mb-3">
                          {SECTION_LABELS[type]} ({items.length}/10)
                        </h4>
                        <div className="space-y-3">
                          {items.map((item, idx) => (
                            <div key={item.id} className="flex items-start gap-2 group">
                              <span className="text-xs text-text-muted mt-0.5 w-4 flex-shrink-0 text-right">{idx + 1}.</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                                  <span className="text-[10px] text-text-muted bg-bg-panel border border-border rounded px-1.5 py-0.5 flex-shrink-0">P:{item.priority}</span>
                                </div>
                                <p className="text-xs text-text-muted whitespace-pre-wrap mt-1">{item.content}</p>
                              </div>
                              <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                                {onEdit && (
                                  <button
                                    onClick={() => onEdit(item)}
                                    className="p-1.5 text-brand-orange hover:text-brand-orange-hover"
                                    title="Edit"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={() => onDelete(item)}
                                    className="p-1.5 text-brand-orange hover:text-brand-orange-hover"
                                    title="Remove"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {images.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-brand-orange uppercase tracking-wider mb-3">
                        REFERENCE IMAGES ({images.length}/10)
                      </h4>
                      <div className="space-y-3">
                        {images.sort((a, b) => a.priority - b.priority).map((img, idx) => (
                          <div key={img.id} className="flex items-start gap-2 group">
                            <span className="text-xs text-text-muted mt-0.5 w-4 flex-shrink-0 text-right">{idx + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary">{img.description}</p>
                              <p className="text-xs text-text-muted mt-1 break-all">{img.url}</p>
                              <img src={img.url} alt={img.description} className="mt-2 max-h-24 rounded border border-border object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                            </div>
                            <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                              {onEdit && (
                                <button
                                  onClick={() => onEdit({ ...img, _image: true })}
                                  className="p-1.5 text-brand-orange hover:text-brand-orange-hover"
                                  title="Edit"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {onDeleteImage && (
                                <button
                                  onClick={() => onDeleteImage(img)}
                                  className="p-1.5 text-brand-orange hover:text-brand-orange-hover"
                                  title="Remove"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
