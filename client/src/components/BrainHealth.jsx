import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TYPES = ['rule', 'memory', 'behaviour', 'guardrail', 'skill'];

export function calculateHealth(sections) {
  const active = sections.filter(s => s.is_active !== 0);
  if (active.length === 0) return { score: 0, tips: ['Add your first section to get started.'] };

  let score = 0;
  const tips = [];

  // 1. Coverage — uses at least 3 of 5 types (max 2 points)
  const typesUsed = new Set(active.map(s => s.type)).size;
  if (typesUsed >= 4) score += 2;
  else if (typesUsed >= 3) score += 1.5;
  else if (typesUsed >= 2) score += 1;
  else score += 0.5;
  if (typesUsed < 3) tips.push(`Use more section types — you're only using ${typesUsed} of 5. A well-rounded brain has rules, memories, and at least one other type.`);

  // 2. Section balance — no single type dominates >60% (max 2 points)
  const counts = {};
  TYPES.forEach(t => { counts[t] = active.filter(s => s.type === t).length; });
  const maxTypeCount = Math.max(...Object.values(counts));
  const dominance = maxTypeCount / active.length;
  if (dominance <= 0.4) score += 2;
  else if (dominance <= 0.6) score += 1.5;
  else score += 0.5;
  if (dominance > 0.6) {
    const dominant = TYPES.find(t => counts[t] === maxTypeCount);
    tips.push(`Your brain is ${Math.round(dominance * 100)}% ${dominant}s. Try adding other section types for better balance.`);
  }

  // 3. Content density — sections between 100-1500 chars are ideal (max 2 points)
  const wellSized = active.filter(s => s.content.length >= 100 && s.content.length <= 1500).length;
  const densityRatio = wellSized / active.length;
  if (densityRatio >= 0.8) score += 2;
  else if (densityRatio >= 0.5) score += 1;
  else score += 0.5;
  const tooLong = active.filter(s => s.content.length > 1500).length;
  const tooShort = active.filter(s => s.content.length < 100).length;
  if (tooLong > 0) tips.push(`${tooLong} section${tooLong > 1 ? 's are' : ' is'} over 1,500 characters. Consider splitting for better LLM comprehension.`);
  if (tooShort > 0) tips.push(`${tooShort} section${tooShort > 1 ? 's are' : ' is'} under 100 characters. Consider adding more detail.`);

  // 4. Priority spread — not everything at default 50 (max 2 points)
  const priorities = active.map(s => s.priority ?? 50);
  const allDefault = priorities.every(p => p === 50);
  const uniquePriorities = new Set(priorities).size;
  if (uniquePriorities >= 3) score += 2;
  else if (!allDefault) score += 1;
  else score += 0.5;
  if (allDefault && active.length > 3) tips.push('All sections have the same priority. Set lower numbers (1-25) for critical rules so they appear first in the context.');

  // 5. Token efficiency — total estimated tokens (max 2 points)
  const totalChars = active.reduce((sum, s) => sum + s.title.length + s.content.length + 10, 0) + 140;
  const tokens = Math.ceil(totalChars / 4);
  if (tokens < 5000) score += 2;
  else if (tokens < 15000) score += 1.5;
  else score += 0.5;
  if (tokens > 15000) tips.push(`Your brain compiles to ~${tokens.toLocaleString()} tokens. LLMs may ignore middle content — try trimming less critical sections.`);

  if (tips.length === 0) tips.push('Your brain is well-structured. Keep it up!');

  return { score: Math.round(score), tips, tokens };
}

export default function BrainHealth({ sections }) {
  const [showTips, setShowTips] = useState(false);
  const { score, tips, tokens } = calculateHealth(sections);

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
            <p className="text-xs text-text-muted">~{(tokens || 0).toLocaleString()} tokens</p>
          </div>
        </div>
        {showTips ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>
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
