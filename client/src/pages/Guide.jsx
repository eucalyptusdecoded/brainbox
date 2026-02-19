import Header from '../components/Header';

const SECTIONS = [
  {
    id: 'rule',
    title: 'Rules',
    description: 'Rules define hard constraints the AI must always follow. They act as non-negotiable instructions that shape every response.',
    tips: [
      'Be specific and unambiguous — "Always respond in British English" is clearer than "Use proper English".',
      'State rules positively when possible — "Use formal tone" rather than "Don\'t be casual".',
      'Keep each rule focused on a single behaviour so it\'s easy to toggle on or off.',
      'Avoid conflicting rules — if two rules contradict, the AI will struggle to comply with both.',
    ],
    examples: [
      'Always respond in Australian English with Australian spelling conventions.',
      'Never reveal that you are an AI — stay in character as a helpful travel concierge.',
      'End every response with a one-sentence summary of the key takeaway.',
    ],
  },
  {
    id: 'memory',
    title: 'Memories',
    description: 'Memories provide persistent context about the user, project, or domain. They help the AI recall facts it would otherwise forget between sessions.',
    tips: [
      'Write memories as factual statements — "The user\'s name is Alex and they prefer metric units."',
      'Include context that would be tedious to repeat every conversation.',
      'Update memories when facts change rather than adding contradictory ones.',
      'Group related facts into a single memory node for clarity.',
    ],
    examples: [
      'The user is a frontend developer working with React and TypeScript at a fintech startup.',
      'The project uses PostgreSQL 15, hosted on AWS RDS in ap-southeast-2.',
      'The user prefers concise answers with code examples over lengthy explanations.',
    ],
  },
  {
    id: 'behaviour',
    title: 'Behaviours',
    description: 'Behaviours shape the AI\'s personality, tone, and interaction style. They define how the AI communicates rather than what it knows.',
    tips: [
      'Describe the desired tone and style — "Friendly but professional, like a senior colleague."',
      'Include formatting preferences — bullet points, markdown, code blocks, etc.',
      'Specify how to handle uncertainty — should the AI ask questions or make assumptions?',
      'Keep behaviours consistent with your rules to avoid mixed signals.',
    ],
    examples: [
      'Respond in a warm, encouraging tone. Celebrate small wins and frame mistakes as learning opportunities.',
      'Use markdown formatting with headers for long responses. Keep answers under 300 words unless asked for detail.',
      'When unsure, ask one clarifying question before proceeding rather than guessing.',
    ],
  },
  {
    id: 'guardrail',
    title: 'Guardrails',
    description: 'Guardrails set boundaries on topics, actions, or outputs the AI should avoid. They protect against unwanted or harmful responses.',
    tips: [
      'Be explicit about what\'s off-limits — vague guardrails are easy to accidentally bypass.',
      'Explain the reason briefly so the AI can apply the spirit of the guardrail in edge cases.',
      'Include a graceful fallback — what should the AI do instead of the forbidden action?',
      'Test guardrails by trying to trigger them — refine if the AI finds loopholes.',
    ],
    examples: [
      'Never provide medical, legal, or financial advice. Redirect the user to consult a qualified professional.',
      'Do not generate code that accesses the filesystem or network unless the user explicitly requests it.',
      'Avoid discussing competitor products. If asked, say "I\'m best suited to help with our own platform."',
    ],
  },
  {
    id: 'skill',
    title: 'Skills',
    description: 'Skills teach the AI specific capabilities or workflows. They define step-by-step processes the AI should follow for particular tasks.',
    tips: [
      'Structure skills as clear step-by-step instructions the AI can follow.',
      'Include input/output expectations — what does the AI receive and what should it produce?',
      'Provide an example interaction so the AI understands the expected format.',
      'Keep skills modular — one skill per task makes them easier to manage and reuse.',
    ],
    examples: [
      'When asked to write a blog post: 1) Ask for the topic and target audience. 2) Propose three title options. 3) Write a 500-word draft with introduction, 3 sections, and conclusion.',
      'For code review requests: Analyse the code for bugs, performance issues, and readability. Format feedback as a numbered list with severity (critical/warning/suggestion).',
      'When translating content: Preserve the original tone and intent. Flag any idioms or cultural references that don\'t translate directly.',
    ],
  },
];

export default function Guide() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">Writing Guide</h1>
          <p className="text-text-muted mt-2">Learn how to write effective nodes for each section type in your brain.</p>
        </div>

        {/* General best practices */}
        <div className="bg-bg-panel border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-lg font-semibold text-brand-black">General Best Practices</h2>
          <ul className="space-y-2 text-sm text-text-primary">
            <li className="flex gap-2"><span className="text-brand-orange font-bold">1.</span>Write for an AI audience — be literal and precise. Avoid sarcasm or implied meaning.</li>
            <li className="flex gap-2"><span className="text-brand-orange font-bold">2.</span>Keep nodes focused — each node should address one concept. Split complex instructions into multiple nodes.</li>
            <li className="flex gap-2"><span className="text-brand-orange font-bold">3.</span>Use priority to control order — lower numbers appear first in the compiled context sent to the API.</li>
            <li className="flex gap-2"><span className="text-brand-orange font-bold">4.</span>Test and iterate — after adding nodes, use the Preview panel to see the compiled output and refine.</li>
          </ul>
        </div>

        {/* Per-type sections */}
        {SECTIONS.map(({ id, title, description, tips, examples }) => (
          <section key={id} id={id} className="scroll-mt-20 space-y-4">
            <h2 className="text-lg font-semibold text-brand-black">{title}</h2>
            <p className="text-sm text-text-muted">{description}</p>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Tips</h3>
              <ul className="space-y-1.5">
                {tips.map((tip, i) => (
                  <li key={i} className="text-sm text-text-primary flex gap-2">
                    <span className="text-brand-orange flex-shrink-0">&#x2022;</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Examples</h3>
              <div className="space-y-2">
                {examples.map((ex, i) => (
                  <div key={i} className="bg-bg-panel border border-border rounded-lg px-4 py-3 text-sm text-text-primary">
                    {ex}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
