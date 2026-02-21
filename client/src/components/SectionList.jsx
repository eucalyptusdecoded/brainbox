import { Plus, Upload, ImagePlus } from 'lucide-react';

const TYPE_LABELS = {
  rule: 'Rule',
  memory: 'Memory',
  behaviour: 'Behaviour',
  guardrail: 'Guardrail',
  skill: 'Skill',
};

const TYPE_ORDER = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];

export default function SectionList({ onAdd, onUpload, onAddImage }) {
  return (
    <div className="space-y-1">
      {TYPE_ORDER.map(type => (
        <button
          key={type}
          onClick={() => onAdd(type)}
          className="w-full flex items-center gap-2 px-2 py-3 rounded-lg text-sm text-text-muted hover:bg-bg-panel hover:text-brand-orange transition-colors"
        >
          <Plus size={16} className="text-brand-orange flex-shrink-0" />
          <span>Add {TYPE_LABELS[type]}</span>
        </button>
      ))}

      {(onUpload || onAddImage) && (
        <>
          <div className="border-t border-border my-2" />
          {onUpload && (
            <button
              onClick={onUpload}
              className="w-full flex items-center gap-2 px-2 py-3 rounded-lg text-sm text-text-muted hover:bg-bg-panel hover:text-brand-orange transition-colors"
            >
              <Upload size={16} className="text-brand-orange flex-shrink-0" />
              <span>Upload File</span>
            </button>
          )}
          {onAddImage && (
            <button
              onClick={onAddImage}
              className="w-full flex items-center gap-2 px-2 py-3 rounded-lg text-sm text-text-muted hover:bg-bg-panel hover:text-brand-orange transition-colors"
            >
              <ImagePlus size={16} className="text-brand-orange flex-shrink-0" />
              <span>Add Image</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
