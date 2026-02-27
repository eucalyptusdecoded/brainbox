import { useState } from 'react';
import { Upload, ImageOff, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { calculateHealth } from './BrainHealth';

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
      <polygon
        points={polygonPoints}
        fill="rgba(255,122,0,0.03)"
        stroke="#FF7A00"
        strokeWidth="0.5"
        opacity="0.25"
      />
      {nodes.map(n => {
        const armLen = R;
        const dashFill = armLen * n.pct;
        const dashGap = armLen - dashFill;
        return (
          <g key={n.key}>
            <line
              x1={CX} y1={CY} x2={n.x} y2={n.y}
              stroke="#E6E6E6"
              strokeWidth="6"
              strokeLinecap="round"
            />
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
      {nodes.map(n => (
        <g key={`node-${n.key}`}>
          <circle
            cx={n.x} cy={n.y} r={NODE_R}
            fill="#FFFFFF"
            stroke={n.count > 0 ? '#FF7A00' : '#E6E6E6'}
            strokeWidth={n.count > 0 ? 2.5 : 1.5}
            style={{ transition: 'stroke 0.3s ease' }}
          />
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
  const isEmpty = totalCount === 0;
  const { score, tips, tokens, criteria } = calculateHealth(sections);
  const [showTips, setShowTips] = useState(false);
  const scoreColor = score >= 8 ? 'text-green-600' : score >= 5 ? 'text-brand-orange' : 'text-red-600';

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header — brain name + description (click to edit) */}
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

      {/* Brain Health card */}
      {totalCount > 0 && (
        <div className="bg-white border border-border rounded-xl p-5">
          {/* Top row: score + title + metric badges */}
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold ${scoreColor}`}>{score}<span className="text-base font-normal text-text-muted">/10</span></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-black">Brain Health</p>
              <div className="flex items-center gap-2 mt-1">
                {/* Neurons badge with tooltip */}
                <div className="relative group inline-flex">
                  <span className="text-xs font-medium text-text-muted bg-gray-100 rounded px-2 py-0.5 cursor-help">
                    {totalCount}/{TOTAL_TARGET} neurons
                  </span>
                  <div className="absolute top-full left-0 mt-1.5 hidden group-hover:block w-72 bg-brand-black text-white text-xs rounded-xl px-4 py-3 shadow-lg z-10 space-y-3">
                    <div>
                      <p className="font-semibold text-sm mb-1">What are neurons?</p>
                      <p className="text-white/70 leading-relaxed">Each neuron is a single piece of context in your brain. You can have up to {TOTAL_TARGET} neurons — {TARGET} per type (Rules, Memories, Behaviours, Guardrails, Skills).</p>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/90 font-medium">Capacity</span>
                        <span className="text-white/60">{totalCount}/{TOTAL_TARGET}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-orange rounded-full" style={{ width: `${Math.min((totalCount / TOTAL_TARGET) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Tokens badge with tooltip */}
                {(() => {
                  const tokenColor = tokens < 5000 ? 'text-green-600 bg-green-50'
                    : tokens < 15000 ? 'text-amber-600 bg-amber-50'
                    : 'text-red-600 bg-red-50';
                  return (
                    <div className="relative group inline-flex">
                      <span className={`text-xs font-medium rounded px-2 py-0.5 cursor-help ${tokenColor}`}>
                        ~{(tokens || 0).toLocaleString()} tokens
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
                })()}
              </div>
            </div>
          </div>

          {/* Segmented health bar */}
          {criteria.length > 0 && (
            <div className="mt-4">
              <div className="flex gap-0.5">
                {criteria.map((c) => {
                  const fillPct = (c.score / c.max) * 100;
                  return (
                    <div key={c.label} className="flex-1">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-orange rounded-full transition-all duration-500"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-0.5 mt-1.5">
                {criteria.map((c) => (
                  <div key={c.label} className="flex-1 text-center">
                    <span className="text-[11px] text-text-muted">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expandable tips */}
          <button
            onClick={() => setShowTips(!showTips)}
            className="mt-4 w-full flex items-center justify-between border-t border-border pt-3"
          >
            <span className="text-xs font-medium text-text-muted">{tips.length} tip{tips.length !== 1 ? 's' : ''}</span>
            {showTips ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
          </button>
          {showTips && (
            <ul className="mt-2 space-y-1.5">
              {tips.map((tip, i) => (
                <li key={i} className="text-xs text-text-primary flex gap-2 leading-relaxed">
                  <span className="text-brand-orange flex-shrink-0">&bull;</span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 2-column grid: Brain Capacity + Brain Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Brain Capacity */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-brand-black mb-4">Brain Capacity</h3>
          <div className="space-y-3">
            {TYPES.map(t => {
              const count = countByType[t.key];
              const pct = Math.min((count / TARGET) * 100, 100);
              return (
                <div key={t.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-primary font-medium">{t.plural}</span>
                    <span className="text-xs text-text-muted">{count}/{TARGET}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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

        {/* Brain Profile */}
        <div className="bg-white border border-border rounded-xl p-5">
          {totalCount === 0 ? (
            <>
              <h3 className="text-sm font-semibold text-brand-black mb-3">Brain Profile</h3>
              <p className="text-sm text-text-muted">Add neurons to reveal your brain's profile.</p>
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
                  <h3 className="text-sm font-semibold text-brand-black">Brain Profile</h3>
                  <span className="text-xs font-medium text-brand-orange bg-brand-orange/10 rounded px-2 py-0.5">{summary}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {traitData.map(t => (
                    <div key={t.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text-primary font-medium">{t.label}</span>
                        <span className="text-xs text-text-muted">{t.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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

      {/* Mind Map — full width */}
      <div className="bg-white border border-border rounded-xl p-5 flex flex-col items-center">
        <h3 className="text-sm font-semibold text-brand-black mb-3 self-start">Mind Map</h3>
        <BrainDiagram countByType={countByType} />
      </div>

      {/* Imaging card */}
      <div className="bg-white border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-brand-black mb-3">
          Imaging <span className="text-xs font-normal text-text-muted">({images.length}/10)</span>
        </h3>
        {(() => {
          const sortedImages = [...images].sort((a, b) => a.priority - b.priority);
          return (
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, idx) => {
                const img = sortedImages[idx];
                return img ? (
                  <div key={img.id}>
                    <div className="aspect-square rounded-lg border border-border overflow-hidden bg-bg-panel">
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

      {/* Empty state CTA */}
      {isEmpty && (
        <div className="border border-dashed border-border rounded-xl p-6 text-center">
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
