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

  const parts = [];

  // Preamble — positions critical framing at the start where LLMs pay most attention
  parts.push('You are an AI assistant. Follow the instructions, rules, and context below exactly.');

  Object.entries(grouped).forEach(([type, items]) => {
    const label = SECTION_LABELS[type];
    const content = items
      .map(i => `[${i.title}]\n${i.content}`)
      .join('\n\n');
    parts.push(`## ${label}\n\n${content}`);
  });

  if (images.length > 0) {
    const sorted = [...images].sort((a, b) => a.priority - b.priority);
    const imageContent = sorted.map(img => `${img.description}: ${img.url}`).join('\n');
    parts.push(`## REFERENCE IMAGES\n\n${imageContent}`);
  }

  // Closing reinforcement — exploits recency bias so LLMs don't drift
  const hasRules = !!grouped.rule;
  const hasGuardrails = !!grouped.guardrail;
  if (hasRules || hasGuardrails) {
    const reminders = [];
    if (hasRules) reminders.push('RULES');
    if (hasGuardrails) reminders.push('GUARDRAILS');
    parts.push(`---\nRemember: Follow all ${reminders.join(' and ')} above without exception.`);
  }

  return parts.join('\n\n');
}

module.exports = { compileContext };
