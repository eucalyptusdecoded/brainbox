const SECTION_ORDER = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];
const SECTION_LABELS = {
  rule: 'RULES',
  memory: 'MEMORIES',
  behaviour: 'BEHAVIOURS',
  guardrail: 'GUARDRAILS',
  skill: 'SKILLS',
};

function compileContext(sections, filterTypes = null) {
  const active = sections.filter(s => s.is_active);
  const filtered = filterTypes
    ? active.filter(s => filterTypes.includes(s.type))
    : active;

  const grouped = {};
  SECTION_ORDER.forEach(type => {
    const items = filtered
      .filter(s => s.type === type)
      .sort((a, b) => a.priority - b.priority);
    if (items.length > 0) grouped[type] = items;
  });

  return Object.entries(grouped)
    .map(([type, items]) => {
      const label = SECTION_LABELS[type];
      const content = items.map(i => i.content).join('\n');
      return `=== ${label} ===\n${content}`;
    })
    .join('\n\n');
}

module.exports = { compileContext };
