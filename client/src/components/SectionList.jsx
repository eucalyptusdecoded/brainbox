const TYPE_LABELS = {
  rule: 'Rules',
  memory: 'Memories',
  behaviour: 'Behaviours',
  guardrail: 'Guardrails',
  skill: 'Skills',
};

const TYPE_ORDER = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];

export default function SectionList({ sections, selectedId, onSelect, onToggle, onAdd }) {
  const grouped = {};
  TYPE_ORDER.forEach(type => { grouped[type] = []; });
  sections.forEach(s => {
    if (grouped[s.type]) grouped[s.type].push(s);
  });

  return (
    <div className="space-y-4">
      {TYPE_ORDER.map(type => (
        <div key={type}>
          <div className="flex items-center justify-between px-2 mb-1">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{TYPE_LABELS[type]}</h4>
            <button
              onClick={() => onAdd(type)}
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              + Add
            </button>
          </div>
          {grouped[type].length === 0 ? (
            <p className="text-xs text-gray-700 px-2">No {TYPE_LABELS[type].toLowerCase()} yet</p>
          ) : (
            <div className="space-y-0.5">
              {grouped[type]
                .sort((a, b) => a.priority - b.priority)
                .map(section => (
                  <div
                    key={section.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm ${
                      selectedId === section.id
                        ? 'bg-violet-600/20 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                    onClick={() => onSelect(section)}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggle(section); }}
                      className={`w-3 h-3 rounded-full border flex-shrink-0 ${
                        section.is_active
                          ? 'bg-green-500 border-green-500'
                          : 'bg-transparent border-gray-600'
                      }`}
                      title={section.is_active ? 'Active' : 'Inactive'}
                    />
                    <span className="truncate flex-1">{section.title}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
