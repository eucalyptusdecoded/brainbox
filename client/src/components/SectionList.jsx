import { Plus } from 'lucide-react';

const TYPE_LABELS = {
  rule: 'Rule',
  memory: 'Memory',
  behaviour: 'Behaviour',
  guardrail: 'Guardrail',
  skill: 'Skill',
};

const TYPE_ORDER = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];

export default function SectionList({ onAdd }) {
  return (
    <div className="space-y-1">
      {TYPE_ORDER.map(type => (
        <button
          key={type}
          onClick={() => onAdd(type)}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-text-muted hover:bg-bg-panel hover:text-brand-orange transition-colors"
        >
          <Plus size={14} className="text-brand-orange flex-shrink-0" />
          <span>Add {TYPE_LABELS[type]}</span>
        </button>
      ))}
    </div>
  );
}
