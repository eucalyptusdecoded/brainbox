const SECTION_ORDER = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];
const SECTION_LABELS = {
  rule: 'RULES',
  memory: 'MEMORIES',
  behaviour: 'BEHAVIOURS',
  guardrail: 'GUARDRAILS',
  skill: 'SKILLS',
};

function compileContext(sections, filterTypes = null, images = []) {
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

  const parts = Object.entries(grouped)
    .map(([type, items]) => {
      const label = SECTION_LABELS[type];
      const content = items.map(i => i.content).join('\n');
      return `=== ${label} ===\n${content}`;
    });

  if (images.length > 0) {
    const sorted = [...images].sort((a, b) => a.priority - b.priority);
    const imageContent = sorted.map(img => `${img.description}: ${img.url}`).join('\n');
    parts.push(`=== REFERENCE IMAGES ===\n${imageContent}`);
  }

  return parts.join('\n\n');
}

module.exports = { compileContext };
