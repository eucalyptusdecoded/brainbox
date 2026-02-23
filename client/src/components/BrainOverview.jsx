import { Upload, ImageOff } from 'lucide-react';

const TYPES = [
  { key: 'rule', label: 'Rule', plural: 'Rules' },
  { key: 'memory', label: 'Memory', plural: 'Memories' },
  { key: 'behaviour', label: 'Behaviour', plural: 'Behaviours' },
  { key: 'guardrail', label: 'Guardrail', plural: 'Guardrails' },
  { key: 'skill', label: 'Skill', plural: 'Skills' },
];

const TARGET = 10;
const TOTAL_TARGET = TYPES.length * TARGET;

const TYPE_DESCS = {
  rule:      'Hard constraints that shape every response',
  memory:    'Persistent facts about you and your domain',
  behaviour: 'Tone, style and interaction patterns',
  guardrail: 'Safety boundaries and topic restrictions',
  skill:     'Step-by-step workflows and processes',
};

const TRAITS = {
  rule:      { label: 'Structured', desc: 'Follows clear constraints and formatting' },
  memory:    { label: 'Informed', desc: 'Grounded in specific knowledge and context' },
  behaviour: { label: 'Expressive', desc: 'Personality-driven tone and style' },
  guardrail: { label: 'Guarded', desc: 'Safety-conscious with clear boundaries' },
  skill:     { label: 'Procedural', desc: 'Workflow and process oriented' },
};

const LEVELS = [
  { min: 0, label: 'Nascent', pos: 0 },
  { min: 11, label: 'Developing', pos: 22 },
  { min: 26, label: 'Sharp', pos: 52 },
  { min: 41, label: 'Brilliant', pos: 82 },
  { min: 50, label: 'Genius', pos: 100 },
];

function getBrainLevel(count) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (count >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
const CX = 200;
const CY = 200;
const R = 140;
const NODE_R = 28;

function getNodes(countByType) {
  return TYPES.map((t, i) => {
    const angleDeg = -90 + i * 72;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = CX + R * Math.cos(angleRad);
    const y = CY + R * Math.sin(angleRad);
    const count = countByType[t.key] || 0;
    const pct = Math.min(count / TARGET, 1);
    return { ...t, x, y, count, pct, angleDeg };
  });
}

function BrainDiagram({ countByType }) {
  const nodes = getNodes(countByType);
  const polygonPoints = nodes.map(n => `${n.x},${n.y}`).join(' ');

  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-[420px]" aria-hidden="true">
      {/* Faint pentagon outline */}
      <polygon
        points={polygonPoints}
        fill="rgba(255,122,0,0.03)"
        stroke="#FF7A00"
        strokeWidth="0.5"
        opacity="0.25"
      />

      {/* Arms: background tracks + filled portions */}
      {nodes.map(n => {
        const armLen = R;
        const dashFill = armLen * n.pct;
        const dashGap = armLen - dashFill;
        return (
          <g key={n.key}>
            {/* Track */}
            <line
              x1={CX} y1={CY} x2={n.x} y2={n.y}
              stroke="#E6E6E6"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Fill */}
            <line
              x1={CX} y1={CY} x2={n.x} y2={n.y}
              stroke="#FF7A00"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${dashFill} ${dashGap}`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </g>
        );
      })}

      {/* Node circles */}
      {nodes.map(n => (
        <g key={`node-${n.key}`}>
          <circle
            cx={n.x} cy={n.y} r={NODE_R}
            fill="#FFFFFF"
            stroke={n.count > 0 ? '#FF7A00' : '#E6E6E6'}
            strokeWidth={n.count > 0 ? 2.5 : 1.5}
            style={{ transition: 'stroke 0.3s ease' }}
          />
          {/* Count inside node */}
          <text
            x={n.x} y={n.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={n.count > 0 ? '#FF7A00' : '#6B6B6B'}
            fontSize="16"
            fontWeight="600"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {n.count}/{TARGET}
          </text>
          {/* Label below/above node */}
          <text
            x={n.x}
            y={n.y < CY - 20 ? n.y - NODE_R - 10 : n.y + NODE_R + 18}
            textAnchor="middle"
            fill="#6B6B6B"
            fontSize="16"
            fontWeight="500"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {n.plural}
          </text>
        </g>
      ))}

      {/* Central brain circle */}
      <circle
        cx={CX} cy={CY} r={36}
        fill="#FFFFFF"
        stroke="#FF7A00"
        strokeWidth="1.5"
      />
      <image
        href="/images/brainboxlogo.png"
        x={CX - 26} y={CY - 26}
        width="52" height="52"
      />
    </svg>
  );
}

export default function BrainOverview({ sections, images = [], onAdd, onUpload, brain, editingName, setEditingName, brainName, setBrainName, brainDesc, setBrainDesc, saveBrainMeta }) {
  const countByType = {};
  TYPES.forEach(t => {
    countByType[t.key] = sections.filter(s => s.type === t.key).length;
  });

  const totalCount = sections.length;
  const totalPct = Math.min((totalCount / TOTAL_TARGET) * 100, 100);
  const currentLevel = getBrainLevel(totalCount);
  const isEmpty = totalCount === 0;

  return (
    <div className="p-6">
      {/* Page title — click to edit */}
      {editingName ? (
        <div className="flex items-start gap-4">
          <img src="/images/brainboxlogo.png" alt="" className="w-12 h-12 rounded-full object-cover bg-bg-panel flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <input
              className="text-xl font-semibold text-brand-black w-full bg-transparent border-b border-brand-orange outline-none"
              value={brainName}
              onChange={(e) => setBrainName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveBrainMeta()}
            />
            <input
              className="text-sm text-text-muted w-full bg-transparent border-b border-border outline-none"
              value={brainDesc}
              onChange={(e) => setBrainDesc(e.target.value)}
              placeholder="Description"
              onKeyDown={(e) => e.key === 'Enter' && saveBrainMeta()}
            />
            <div className="flex gap-3">
              <button onClick={saveBrainMeta} className="text-sm text-brand-orange hover:text-brand-orange-hover">Save</button>
              <button onClick={() => setEditingName(false)} className="text-sm text-text-muted hover:text-text-primary">Cancel</button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditingName(true)} className="text-left group flex items-center gap-4">
          <img src="/images/brainboxlogo.png" alt="" className="w-12 h-12 rounded-full object-cover bg-bg-panel flex-shrink-0" />
          <div>
            <h2 className="text-xl font-semibold text-brand-black group-hover:text-brand-orange transition-colors">{brain?.name || 'Brain Scan'}</h2>
            {brain?.description && (
              <p className="text-sm text-text-muted mt-1">{brain.description}</p>
            )}
          </div>
        </button>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 items-stretch">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Brain Capacity card (merged with per-type bars) */}
          <div className="bg-bg-panel border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-brand-black">Brain Capacity</h3>
              <span className="text-sm font-medium text-brand-orange">{currentLevel.label}</span>
            </div>
            <p className="text-xs text-text-muted mb-3">{totalCount}/{TOTAL_TARGET} neurons</p>
            <div className="relative">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-orange rounded-full transition-all duration-500"
                  style={{ width: `${totalPct}%` }}
                />
              </div>
              {/* Level tick marks — hidden on mobile */}
              <div className="relative mt-1.5 h-6 hidden md:block">
                {LEVELS.map((level) => {
                  const isActive = totalCount >= level.min;
                  return (
                    <div
                      key={level.label}
                      className="absolute flex flex-col items-center"
                      style={{ left: `${level.pos}%`, transform: level.pos === 100 ? 'translateX(-100%)' : level.pos === 0 ? 'none' : 'translateX(-50%)' }}
                    >
                      <div className={`w-px h-2 ${isActive ? 'bg-brand-orange' : 'bg-gray-300'}`} />
                      <span className={`text-[10px] mt-0.5 whitespace-nowrap ${isActive ? 'text-brand-orange font-medium' : 'text-text-muted'}`}>
                        {level.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Per-type progress bars */}
            <div className="mt-4">
              {TYPES.map(t => {
                const count = countByType[t.key];
                const pct = Math.min((count / TARGET) * 100, 100);
                return (
                  <div key={t.key} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-muted">{t.plural}</span>
                      <span className="text-sm text-text-muted">{count}/{TARGET}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-orange rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{TYPE_DESCS[t.key]}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Brain Profile card */}
          <div className="bg-bg-panel border border-border rounded-xl p-5">
            {totalCount === 0 ? (
              <>
                <h3 className="font-semibold text-brand-black mb-3">Brain Profile</h3>
                <p className="text-sm text-text-muted">Add sections to reveal your brain's profile.</p>
              </>
            ) : (() => {
              const traitData = TYPES
                .map(t => ({
                  key: t.key,
                  count: countByType[t.key] || 0,
                  pct: Math.round(((countByType[t.key] || 0) / totalCount) * 100),
                  ...TRAITS[t.key],
                }))
                .filter(t => t.count > 0)
                .sort((a, b) => b.pct - a.pct);

              const summary = traitData.length >= 2
                ? `${traitData[0].label} & ${traitData[1].label}`
                : traitData[0]?.label || '';

              return (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-brand-black">Brain Profile</h3>
                    <span className="text-sm font-medium text-brand-orange">{summary}</span>
                  </div>
                  <p className="text-xs text-text-muted mb-3">Auto-derived from section distribution</p>
                  <div>
                    {traitData.map(t => (
                      <div key={t.key} className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text-muted">{t.label}</span>
                          <span className="text-sm text-text-muted">{t.pct}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-orange rounded-full transition-all duration-500"
                            style={{ width: `${t.pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{t.desc}</p>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Right column — Mind Map + Imaging */}
        <div className="flex flex-col gap-6">
          <div className="bg-bg-panel border border-border rounded-xl p-5 flex flex-col items-center">
            <h3 className="font-semibold text-brand-black mb-3 self-start">Mind Map</h3>
            <BrainDiagram countByType={countByType} />
          </div>

          {/* Imaging card */}
          <div className="bg-bg-panel border border-border rounded-xl p-5 flex-1">
            <h3 className="font-semibold text-brand-black mb-3">
              Imaging <span className="text-sm font-normal text-text-muted">({images.length}/10)</span>
            </h3>
            {(() => {
              const sortedImages = [...images].sort((a, b) => a.priority - b.priority);
              return (
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const img = sortedImages[idx];
                    return img ? (
                      <div key={img.id}>
                        <div className="aspect-square rounded-lg border border-border overflow-hidden bg-white">
                          <img
                            src={img.url}
                            alt={img.description}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden items-center justify-center w-full h-full text-text-muted">
                            <ImageOff size={28} />
                          </div>
                        </div>
                        <p className="text-xs text-text-muted mt-1 line-clamp-1">{img.description}</p>
                      </div>
                    ) : (
                      <div key={`empty-${idx}`}>
                        <div className="aspect-square rounded-lg border-2 border-dashed border-border" />
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Empty state CTA */}
      {isEmpty && (
        <div className="border border-dashed border-border rounded-xl p-6 text-center mt-6">
          <p className="text-text-muted text-sm mb-1">Your brain is empty.</p>
          <p className="text-text-muted text-sm mb-4">Add your first neuron to get started.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => onAdd(t.key)}
                className="text-sm px-3 py-1.5 rounded-lg border border-border text-text-muted hover:border-brand-orange hover:text-brand-orange transition-colors"
              >
                + {t.label}
              </button>
            ))}
            {onUpload && (
              <button
                onClick={onUpload}
                className="text-sm px-3 py-1.5 rounded-lg border border-border text-text-muted hover:border-brand-orange hover:text-brand-orange transition-colors flex items-center gap-1"
              >
                <Upload size={14} />
                Upload File
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
