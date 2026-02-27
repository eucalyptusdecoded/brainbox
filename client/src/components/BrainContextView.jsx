import { Pencil, Trash2, ImageIcon, Info } from 'lucide-react';

const SECTION_ORDER = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];
const SECTION_LABELS = {
  rule: 'Rules',
  memory: 'Memories',
  behaviour: 'Behaviours',
  guardrail: 'Guardrails',
  skill: 'Skills',
};

function estimateTokens(sections, images) {
  const active = sections.filter(s => s.is_active);
  let chars = 80;
  active.forEach(s => { chars += s.title.length + s.content.length + 10; });
  images.forEach(img => { chars += (img.description?.length || 0) + (img.url?.length || 0) + 5; });
  chars += 60;
  return Math.ceil(chars / 4);
}

function TokenBadge({ tokens }) {
  const color = tokens < 5000 ? 'text-green-600 bg-green-50 border-green-200'
    : tokens < 15000 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200';
  return (
    <div className="relative group inline-flex">
      <span className={`text-sm font-medium px-2 py-0.5 rounded border cursor-help ${color}`}>
        ~{tokens.toLocaleString()} tokens
      </span>
      <div className="absolute top-full left-0 mt-1.5 hidden group-hover:block w-72 bg-brand-black text-white text-xs rounded-xl px-4 py-3 shadow-lg z-10 space-y-3">
        <div>
          <p className="font-semibold text-sm mb-1">What are tokens?</p>
          <p className="text-white/70 leading-relaxed">Tokens measure how much of the AI's context window your brain uses. Fewer tokens = stronger influence on output.</p>
        </div>
        <div className="border-t border-white/10 pt-3 space-y-1.5">
          <p className="font-medium text-white/90">Thresholds</p>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></span><span className="text-white/80">Under 5,000 — Optimal</span></div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></span><span className="text-white/80">5,000–15,000 — Good</span></div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"></span><span className="text-white/80">Over 15,000 — Consider trimming</span></div>
        </div>
        <div className="border-t border-white/10 pt-3">
          <p className="text-white/60 leading-relaxed">To reduce tokens, shorten or deactivate neurons with lower priority.</p>
        </div>
      </div>
    </div>
  );
}

export default function BrainContextView({ sections, images = [], onEdit, onDelete, onDeleteImage }) {
  const active = sections.filter(s => s.is_active);
  const tokenEstimate = estimateTokens(sections, images);

  const grouped = {};
  SECTION_ORDER.forEach(type => {
    grouped[type] = active
      .filter(s => s.type === type)
      .sort((a, b) => a.priority - b.priority);
  });

  const flatOrdered = SECTION_ORDER.flatMap(type =>
    active.filter(s => s.type === type).sort((a, b) => a.priority - b.priority)
  );
  const positionMap = {};
  flatOrdered.forEach((s, i) => {
    const third = flatOrdered.length / 3;
    positionMap[s.id] = i < third ? 'Top' : i >= flatOrdered.length - third ? 'Bottom' : 'Middle';
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-semibold text-brand-black">Brain Context</h2>
          {active.length > 0 && <TokenBadge tokens={tokenEstimate} />}
          {active.length > 0 && (
            <div className="relative group inline-flex">
              <Info size={16} className="text-text-muted cursor-help" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 hidden group-hover:block w-80 bg-brand-black text-white text-xs rounded-xl px-4 py-3 shadow-lg z-10 space-y-3">
                <div>
                  <p className="font-semibold text-sm mb-1">Position Tags</p>
                  <p className="text-white/70 leading-relaxed">Shows where each neuron sits in the compiled context sent to the AI.</p>
                </div>

                <div className="border-t border-white/10 pt-3 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-medium bg-green-500/20 text-green-400 rounded px-1.5 py-0.5 flex-shrink-0 mt-px">Top</span>
                    <p className="text-white/80 leading-relaxed">Read first by the AI. Strongest influence on output.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-medium bg-amber-500/20 text-amber-400 rounded px-1.5 py-0.5 flex-shrink-0 mt-px">Middle</span>
                    <p className="text-white/80 leading-relaxed">May be deprioritised. LLMs often skip middle content.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-medium bg-orange-500/20 text-orange-400 rounded px-1.5 py-0.5 flex-shrink-0 mt-px">Bottom</span>
                    <p className="text-white/80 leading-relaxed">Read last. Strong influence due to recency bias.</p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <p className="font-medium text-white/90 mb-1">How is position determined?</p>
                  <p className="text-white/60 leading-relaxed">Neuron type order (Rules first, Skills last) then priority within each type. Lower priority numbers = closer to the top.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {active.length === 0 ? (
          <p className="text-text-muted text-sm">No active neurons. Add neurons to see your brain's context.</p>
        ) : (
          <div className="space-y-8">
            {SECTION_ORDER.map(type => {
              const items = grouped[type];
              if (items.length === 0) return null;
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-sm font-semibold text-brand-orange uppercase tracking-wider">
                      {SECTION_LABELS[type]}
                    </h4>
                    <span className="text-xs text-text-muted">{items.length}/10</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, idx) => {
                      const pos = positionMap[item.id];
                      const posColor = pos === 'Top' ? 'bg-green-100 text-green-700'
                        : pos === 'Bottom' ? 'bg-orange-100 text-orange-700'
                        : 'bg-amber-100 text-amber-700';
                      return (
                        <div key={item.id} className="bg-white border border-border rounded-xl p-4 group hover:border-brand-orange/30 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-text-muted">{idx + 1}.</span>
                                <p className="text-sm font-semibold text-brand-black">{item.title}</p>
                                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${posColor}`}>P:{item.priority}</span>
                                {pos && <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${posColor}`}>{pos}</span>}
                              </div>
                              <p className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed">{item.content}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
                              {onEdit && (
                                <button
                                  onClick={() => onEdit(item)}
                                  className="p-1.5 text-brand-orange hover:text-brand-orange-hover rounded-lg hover:bg-brand-orange/5"
                                  title="Edit"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => onDelete(item)}
                                  className="p-1.5 text-brand-orange hover:text-brand-orange-hover rounded-lg hover:bg-brand-orange/5"
                                  title="Remove"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {images.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-sm font-semibold text-brand-orange uppercase tracking-wider">
                    Reference Images
                  </h4>
                  <span className="text-xs text-text-muted">{images.length}/10</span>
                </div>
                <div className="space-y-3">
                  {[...images].sort((a, b) => a.priority - b.priority).map((img, idx) => (
                    <div key={img.id} className="bg-white border border-border rounded-xl p-4 group hover:border-brand-orange/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-text-muted">{idx + 1}.</span>
                            <p className="text-sm font-semibold text-brand-black">{img.description}</p>
                          </div>
                          <p className="text-xs text-text-muted break-all">{img.url}</p>
                          <img src={img.url} alt={img.description} className="mt-3 max-h-28 rounded-lg border border-border object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {onEdit && (
                            <button
                              onClick={() => onEdit({ ...img, _image: true })}
                              className="p-1.5 text-brand-orange hover:text-brand-orange-hover rounded-lg hover:bg-brand-orange/5"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {onDeleteImage && (
                            <button
                              onClick={() => onDeleteImage(img)}
                              className="p-1.5 text-brand-orange hover:text-brand-orange-hover rounded-lg hover:bg-brand-orange/5"
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
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
  );
}
