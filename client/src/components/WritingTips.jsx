import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, ChevronDown, ChevronRight } from 'lucide-react';

const TIPS = {
  rule: {
    label: 'Rules',
    description: 'Hard constraints the AI must always follow. Non-negotiable instructions that shape every response.',
    tips: [
      'Be specific and unambiguous — "Always respond in British English" beats "Use proper English".',
      'State rules positively when possible — "Use formal tone" rather than "Don\'t be casual".',
      'Keep each rule focused on a single behaviour so it\'s easy to toggle on or off.',
      'Choose a clear, descriptive name — it appears as a sub-header in the context sent to the AI.',
    ],
    example: 'Always respond in Australian English with Australian spelling conventions.',
  },
  memory: {
    label: 'Memories',
    description: 'Persistent facts the AI should always know — about you, your project, or your domain.',
    tips: [
      'Write memories as factual statements — "The user\'s name is Alex."',
      'Include context that would be tedious to repeat every conversation.',
      'Group related facts into a single memory section for clarity.',
      'Choose a clear, descriptive name — it appears as a sub-header in the context sent to the AI.',
    ],
    example: 'The user is a frontend developer working with React and TypeScript at a fintech startup.',
  },
  behaviour: {
    label: 'Behaviours',
    description: 'How the AI communicates — its tone, style, formatting preferences, and interaction patterns.',
    tips: [
      'Describe the desired tone and style — "Friendly but professional, like a senior colleague."',
      'Include formatting preferences — bullet points, markdown, code blocks, etc.',
      'Specify how to handle uncertainty — ask questions or make assumptions?',
      'Choose a clear, descriptive name — it appears as a sub-header in the context sent to the AI.',
    ],
    example: 'Respond in a warm, encouraging tone. Celebrate small wins and frame mistakes as learning opportunities.',
  },
  guardrail: {
    label: 'Guardrails',
    description: 'Boundaries and safety limits. Topics, actions, or outputs the AI should avoid.',
    tips: [
      'Be explicit about what\'s off-limits — vague guardrails are easy to bypass.',
      'Explain the reason briefly so the AI can apply the spirit in edge cases.',
      'Include a graceful fallback — what should the AI do instead?',
      'Choose a clear, descriptive name — it appears as a sub-header in the context sent to the AI.',
    ],
    example: 'Never provide medical, legal, or financial advice. Redirect the user to consult a qualified professional.',
  },
  skill: {
    label: 'Skills',
    description: 'Step-by-step workflows the AI can follow. Teach it specific processes for particular tasks.',
    tips: [
      'Structure skills as clear step-by-step instructions the AI can follow.',
      'Include input/output expectations — what does the AI receive and produce?',
      'Keep skills modular — one skill per task makes them easier to manage.',
      'Choose a clear, descriptive name — it appears as a sub-header in the context sent to the AI.',
    ],
    example: 'When asked to write a blog post: 1) Ask for the topic and audience. 2) Propose three titles. 3) Write a 500-word draft.',
  },
};

export default function WritingTips({ type, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const data = TIPS[type] || TIPS.rule;

  return (
    <div className="border border-border rounded-lg bg-bg-panel">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm"
      >
        <Lightbulb size={14} className="text-brand-orange flex-shrink-0" />
        <span className="font-medium text-text-primary">Writing {data.label}</span>
        {expanded
          ? <ChevronDown size={14} className="text-text-muted ml-auto" />
          : <ChevronRight size={14} className="text-text-muted ml-auto" />
        }
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-xs text-text-muted">{data.description}</p>
          <ul className="space-y-1">
            {data.tips.map((tip, i) => (
              <li key={i} className="text-xs text-text-muted flex gap-1.5">
                <span className="text-brand-orange flex-shrink-0">&#x2022;</span>
                {tip}
              </li>
            ))}
          </ul>
          <div className="bg-white border border-border rounded px-3 py-2 text-xs text-text-primary">
            <span className="text-text-muted font-medium">Example: </span>{data.example}
          </div>
          <Link to={`/guide#${type}`} className="inline-block text-xs text-brand-orange hover:text-brand-orange-hover">
            View full guide &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
