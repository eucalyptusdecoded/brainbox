const TYPES = [
  { key: 'rule', label: 'Rule', plural: 'Rules' },
  { key: 'memory', label: 'Memory', plural: 'Memories' },
  { key: 'behaviour', label: 'Behaviour', plural: 'Behaviours' },
  { key: 'guardrail', label: 'Guardrail', plural: 'Guardrails' },
  { key: 'skill', label: 'Skill', plural: 'Skills' },
];

const TARGET = 10;
const TOTAL_TARGET = TYPES.length * TARGET;
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
            fontSize="14"
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
            fontSize="13"
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

export default function BrainOverview({ sections, onAdd }) {
  const countByType = {};
  TYPES.forEach(t => {
    countByType[t.key] = sections.filter(s => s.type === t.key).length;
  });

  const totalCount = sections.length;
  const totalPct = Math.min((totalCount / TOTAL_TARGET) * 100, 100);
  const isEmpty = totalCount === 0;

  return (
    <div className="flex flex-col items-center justify-start gap-8 p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-brand-black mb-1">Brain Scan</h2>
        <p className="text-sm text-text-muted">
          {isEmpty
            ? 'Start building your brain by adding neurons below.'
            : `${totalCount} of ${TOTAL_TARGET} neurons — ${Math.round(totalPct)}% brain capacity`}
        </p>
      </div>

      {/* Brain diagram */}
      <BrainDiagram countByType={countByType} />

      {/* Progress bars */}
      <div className="w-full max-w-md">
        {/* Overall */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-text-muted mb-2">
            <span>Brain Capacity</span>
            <span>{totalCount}/{TOTAL_TARGET}</span>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-orange rounded-full transition-all duration-500"
              style={{ width: `${totalPct}%` }}
            />
          </div>
        </div>

        {/* Per type */}
        {TYPES.map(t => {
          const count = countByType[t.key];
          const pct = Math.min((count / TARGET) * 100, 100);
          return (
            <div key={t.key} className="flex items-center gap-3 mb-3">
              <span className="text-sm text-text-muted w-24 flex-shrink-0">{t.plural}</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-orange rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm text-text-muted w-10 text-right flex-shrink-0">{count}/{TARGET}</span>
            </div>
          );
        })}
      </div>

      {/* Empty state CTA */}
      {isEmpty && (
        <div className="border border-dashed border-border rounded-xl p-6 text-center max-w-md w-full">
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
          </div>
        </div>
      )}
    </div>
  );
}
