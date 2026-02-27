import BrainHealth from './BrainHealth';

const SECTION_ORDER = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];
const SECTION_LABELS = {
  rule: 'Rules',
  memory: 'Memories',
  behaviour: 'Behaviours',
  guardrail: 'Guardrails',
  skill: 'Skills',
};

export default function ContextPreview({ sections, images = [] }) {
  const active = sections.filter(s => s.is_active);

  const grouped = {};
  SECTION_ORDER.forEach(type => {
    grouped[type] = active
      .filter(s => s.type === type)
      .sort((a, b) => a.priority - b.priority);
  });

  const totalSlots = SECTION_ORDER.length * 10;
  const totalUsed = active.length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Brain Preview</h3>
        <p className="text-xs text-text-muted mt-0.5">{totalUsed} active section{totalUsed !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
        <BrainHealth sections={sections} />

        {active.length === 0 ? (
          <p className="text-text-muted text-sm">No active sections</p>
        ) : (
          <div className="space-y-1">
            {SECTION_ORDER.map(type => {
              const items = grouped[type];
              const filled = items.length;
              const barPct = Math.min((filled / 10) * 100, 100);
              return (
                <div key={type} className="bg-white border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-semibold text-brand-orange uppercase tracking-wider">
                      {SECTION_LABELS[type]}
                    </h4>
                    <span className="text-xs text-text-muted">{filled}/10</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-brand-orange rounded-full transition-all duration-500"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-text-muted italic">None yet</p>
                  ) : (
                    <ul className="space-y-1">
                      {items.map(item => (
                        <li key={item.id} className="text-xs text-text-primary truncate leading-relaxed">
                          {item.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            {images.length > 0 && (
              <div className="bg-white border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-semibold text-brand-orange uppercase tracking-wider">
                    Images
                  </h4>
                  <span className="text-xs text-text-muted">{images.length}/10</span>
                </div>
                <ul className="space-y-1">
                  {[...images].sort((a, b) => a.priority - b.priority).map(img => (
                    <li key={img.id} className="text-xs text-text-primary truncate leading-relaxed">
                      {img.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
