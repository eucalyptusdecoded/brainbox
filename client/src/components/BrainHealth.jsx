import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TYPES = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];

export function calculateHealth(sections) {
  const active = sections.filter(s => s.is_active !== 0);
  if (active.length === 0) return { score: 0, tips: ['Add your first neuron to get started.'], criteria: [] };

  const tips = [];
  const criteria = [];

  // 1. Coverage — uses at least 3 of 5 types (max 2 points)
  const typesUsed = new Set(active.map(s => s.type)).size;
  let coverageScore;
  if (typesUsed >= 4) coverageScore = 2;
  else if (typesUsed >= 3) coverageScore = 1.5;
  else if (typesUsed >= 2) coverageScore = 1;
  else coverageScore = 0.5;
  if (typesUsed < 3) tips.push(`Use more neuron types — you're only using ${typesUsed} of 5. A well-rounded brain has rules, memories, and at least one other type.`);
  criteria.push({ label: 'Coverage', score: coverageScore, max: 2 });

  // 2. Section balance — no single type dominates >60% (max 2 points)
  const counts = {};
  TYPES.forEach(t => { counts[t] = active.filter(s => s.type === t).length; });
  const maxTypeCount = Math.max(...Object.values(counts));
  const dominance = maxTypeCount / active.length;
  let balanceScore;
  if (dominance <= 0.4) balanceScore = 2;
  else if (dominance <= 0.6) balanceScore = 1.5;
  else balanceScore = 0.5;
  if (dominance > 0.6) {
    const dominant = TYPES.find(t => counts[t] === maxTypeCount);
    tips.push(`Your brain is ${Math.round(dominance * 100)}% ${dominant}s. Try adding other neuron types for better balance.`);
  }
  criteria.push({ label: 'Balance', score: balanceScore, max: 2 });

  // 3. Content density — sections between 100-1500 chars are ideal (max 2 points)
  const wellSized = active.filter(s => s.content.length >= 100 && s.content.length <= 1500).length;
  const densityRatio = wellSized / active.length;
  let densityScore;
  if (densityRatio >= 0.8) densityScore = 2;
  else if (densityRatio >= 0.5) densityScore = 1;
  else densityScore = 0.5;
  const tooLong = active.filter(s => s.content.length > 1500).length;
  const tooShort = active.filter(s => s.content.length < 100).length;
  if (tooLong > 0) tips.push(`${tooLong} neuron${tooLong > 1 ? 's are' : ' is'} over 1,500 characters. Consider splitting for better LLM comprehension.`);
  if (tooShort > 0) tips.push(`${tooShort} neuron${tooShort > 1 ? 's are' : ' is'} under 100 characters. Consider adding more detail.`);
  criteria.push({ label: 'Density', score: densityScore, max: 2 });

  // 4. Priority spread — not everything at default 50 (max 2 points)
  const priorities = active.map(s => s.priority ?? 50);
  const allDefault = priorities.every(p => p === 50);
  const uniquePriorities = new Set(priorities).size;
  let priorityScore;
  if (uniquePriorities >= 3) priorityScore = 2;
  else if (!allDefault) priorityScore = 1;
  else priorityScore = 0.5;
  if (allDefault && active.length > 3) tips.push('All neurons have the same priority. Set lower numbers (1-25) for critical rules so they appear first in the context.');
  criteria.push({ label: 'Priority', score: priorityScore, max: 2 });

  // 5. Token efficiency — total estimated tokens (max 2 points)
  const totalChars = active.reduce((sum, s) => sum + s.title.length + s.content.length + 10, 0) + 140;
  const tokens = Math.ceil(totalChars / 4);
  let tokenScore;
  if (tokens < 5000) tokenScore = 2;
  else if (tokens < 15000) tokenScore = 1.5;
  else tokenScore = 0.5;
  if (tokens > 15000) tips.push(`Your brain compiles to ~${tokens.toLocaleString()} tokens. LLMs may ignore middle content — try trimming less critical neurons.`);
  criteria.push({ label: 'Tokens', score: tokenScore, max: 2 });

  // 6. Volume/Completeness — how full is the brain? (max 2 points)
  const totalCount = active.length;
  let volumeScore;
  if (totalCount >= 30) volumeScore = 2;
  else if (totalCount >= 20) volumeScore = 1.5;
  else if (totalCount >= 10) volumeScore = 1;
  else volumeScore = 0.5;
  if (totalCount < 20) tips.push(`Your brain has ${totalCount}/50 neurons. Adding more neurons improves coverage and depth.`);
  criteria.push({ label: 'Volume', score: volumeScore, max: 2 });

  // Normalise from 12-point scale to 10
  const rawScore = criteria.reduce((sum, c) => sum + c.score, 0);
  const score = Math.round((rawScore / 12) * 10);

  if (tips.length === 0) tips.push('Your brain is well-structured. Keep it up!');

  return { score, tips, tokens, criteria };
}

function SegmentedBar({ criteria, compact = false }) {
  return (
    <div className={compact ? '' : ''}>
      <div className="flex gap-0.5">
        {criteria.map((c) => {
          const fillPct = (c.score / c.max) * 100;
          return (
            <div key={c.label} className="flex-1">
              <div className={`${compact ? 'h-1.5' : 'h-2'} bg-gray-100 rounded-full overflow-hidden`}>
                <div
                  className="h-full bg-brand-orange rounded-full transition-all duration-500"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="flex gap-0.5 mt-1.5">
          {criteria.map((c) => (
            <div key={c.label} className="flex-1 text-center">
              <span className="text-[11px] text-text-muted">{c.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrainHealth({ sections }) {
  const [showTips, setShowTips] = useState(false);
  const { score, tips, tokens, criteria } = calculateHealth(sections);

  if (sections.length === 0) return null;

  const scoreColor = score >= 8 ? 'text-green-600' : score >= 5 ? 'text-brand-orange' : 'text-red-600';

  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <button
        onClick={() => setShowTips(!showTips)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-bold ${scoreColor}`}>{score}<span className="text-sm font-normal text-text-muted">/10</span></div>
          <div className="text-left">
            <p className="text-sm font-semibold text-brand-black">Brain Health</p>
            <div className="relative group inline-flex">
              <p className="text-xs text-text-muted cursor-help flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tokens < 5000 ? 'bg-green-500' : tokens < 15000 ? 'bg-amber-500' : 'bg-red-500'}`} />
                ~{(tokens || 0).toLocaleString()} tokens
              </p>
              <div className="absolute top-full left-0 mt-1.5 hidden group-hover:block w-64 bg-brand-black text-white text-xs rounded-xl px-4 py-3 shadow-lg z-10 space-y-2">
                <p className="font-semibold text-sm">What are tokens?</p>
                <p className="text-white/70 leading-relaxed">Tokens measure how much of the AI's context window your brain uses. Fewer tokens = stronger influence.</p>
                <div className="border-t border-white/10 pt-2 space-y-1">
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></span><span className="text-white/80">&lt;5,000 — Optimal</span></div>
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span><span className="text-white/80">5–15k — Good</span></div>
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span><span className="text-white/80">&gt;15,000 — Trim</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showTips ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>
      {criteria.length > 0 && (
        <div className="mt-3">
          <SegmentedBar criteria={criteria} compact />
        </div>
      )}
      {showTips && (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {tips.map((tip, i) => (
            <li key={i} className="text-xs text-text-primary flex gap-2 leading-relaxed">
              <span className="text-brand-orange flex-shrink-0">&bull;</span>
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
