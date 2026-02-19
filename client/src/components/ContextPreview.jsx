const SECTION_ORDER = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];
const SECTION_LABELS = {
  rule: 'RULES',
  memory: 'MEMORIES',
  behaviour: 'BEHAVIOURS',
  guardrail: 'GUARDRAILS',
  skill: 'SKILLS',
};

export default function ContextPreview({ sections }) {
  const active = sections.filter(s => s.is_active);

  const grouped = {};
  SECTION_ORDER.forEach(type => {
    const items = active
      .filter(s => s.type === type)
      .sort((a, b) => a.priority - b.priority);
    if (items.length > 0) grouped[type] = items;
  });

  const output = Object.entries(grouped)
    .map(([type, items]) => {
      const label = SECTION_LABELS[type];
      const content = items.map(i => i.content).join('\n');
      return `=== ${label} ===\n${content}`;
    })
    .join('\n\n');

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-400">Context Preview</h3>
        <p className="text-xs text-gray-600">This is what the API will return</p>
      </div>
      <pre className="flex-1 overflow-auto p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
        {output || 'No active sections'}
      </pre>
    </div>
  );
}
