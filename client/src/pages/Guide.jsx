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

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">How to Build a Brain</h1>
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

        {/* File uploads */}
        <section id="uploads" className="scroll-mt-20 space-y-4">
          <h2 className="text-lg font-semibold text-brand-black">File Uploads</h2>
          <p className="text-sm text-text-muted">You can upload documents to quickly populate your brain with existing content instead of typing everything manually.</p>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">How It Works</h3>
            <ol className="space-y-1.5 text-sm text-text-primary list-decimal list-inside">
              <li>Click <strong>Upload File</strong> in the sidebar to open the upload form.</li>
              <li>Select a file from your device. Supported formats: <strong>TXT, PDF, DOCX, and CSV</strong>.</li>
              <li>Brainbox extracts the text content from your file on the server. The original file is <strong>not stored</strong> — only the extracted text is kept.</li>
              <li>The extracted text and a name (auto-filled from the filename) appear in the form for you to review.</li>
              <li>Choose a section type (e.g. Memory, Rule) and adjust the priority if needed, then click <strong>Save</strong>.</li>
              <li>The content is saved as a regular brain section. You can edit it afterwards just like any other section.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Tips</h3>
            <ul className="space-y-1.5">
              <li className="text-sm text-text-primary flex gap-2">
                <span className="text-brand-orange flex-shrink-0">&#x2022;</span>
                Maximum extracted text size is 500KB per file. Very large documents will be rejected — consider splitting them into smaller files.
              </li>
              <li className="text-sm text-text-primary flex gap-2">
                <span className="text-brand-orange flex-shrink-0">&#x2022;</span>
                Choose the section type that best fits the content — use Memory for reference documents, Rule for guidelines, Skill for process docs.
              </li>
              <li className="text-sm text-text-primary flex gap-2">
                <span className="text-brand-orange flex-shrink-0">&#x2022;</span>
                After saving, review and trim the extracted content. Removing unnecessary boilerplate or headers keeps your brain clean and focused.
              </li>
              <li className="text-sm text-text-primary flex gap-2">
                <span className="text-brand-orange flex-shrink-0">&#x2022;</span>
                PDF extraction works best with text-based PDFs. Scanned documents or image-heavy PDFs may produce poor results.
              </li>
            </ul>
          </div>
        </section>

        {/* Image references */}
        <section id="images" className="scroll-mt-20 space-y-4">
          <h2 className="text-lg font-semibold text-brand-black">Image References</h2>
          <p className="text-sm text-text-muted">Image references let you attach visual context to your brain — logos, style guides, mood boards, screenshots, and more. They appear in the compiled context as a <strong>REFERENCE IMAGES</strong> section so AI models with vision can see and interpret them.</p>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">How It Works</h3>
            <ol className="space-y-1.5 text-sm text-text-primary list-decimal list-inside">
              <li>Click <strong>+ Add Image</strong> in the sidebar to open the image form.</li>
              <li>Paste a publicly accessible <strong>image URL</strong> (the image is not uploaded — only the link is stored).</li>
              <li>Write a short <strong>description</strong> (up to 200 characters) that tells the AI what the image represents.</li>
              <li>Set a <strong>priority</strong> to control ordering. Lower numbers appear first in the compiled context.</li>
              <li>The image and description are included in the <strong>=== REFERENCE IMAGES ===</strong> block of your compiled brain output.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Tips</h3>
            <ul className="space-y-1.5">
              <li className="text-sm text-text-primary flex gap-2">
                <span className="text-brand-orange flex-shrink-0">&#x2022;</span>
                Write descriptive, specific descriptions — "Primary brand logo, full colour on white background" is better than "Logo".
              </li>
              <li className="text-sm text-text-primary flex gap-2">
                <span className="text-brand-orange flex-shrink-0">&#x2022;</span>
                Use priority to order images by importance. For image-heavy brains (like Brand Image Generator), consider setting priority to 100 so images are emphasised in the context.
              </li>
              <li className="text-sm text-text-primary flex gap-2">
                <span className="text-brand-orange flex-shrink-0">&#x2022;</span>
                Images must be publicly accessible via URL. Private or authenticated links won't work when the AI tries to fetch them.
              </li>
              <li className="text-sm text-text-primary flex gap-2">
                <span className="text-brand-orange flex-shrink-0">&#x2022;</span>
                You can add up to 10 images per brain. Focus on the most important visual references rather than adding everything.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Example Descriptions</h3>
            <div className="space-y-2">
              <div className="bg-bg-panel border border-border rounded-lg px-4 py-3 text-sm text-text-primary">
                Brand logo (primary, full colour on white background)
              </div>
              <div className="bg-bg-panel border border-border rounded-lg px-4 py-3 text-sm text-text-primary">
                Colour palette — hex values: #FF7A00 (orange), #1A1A1A (black), #F5F5F0 (cream)
              </div>
              <div className="bg-bg-panel border border-border rounded-lg px-4 py-3 text-sm text-text-primary">
                Product screenshot showing the dashboard layout and navigation hierarchy
              </div>
            </div>
          </div>
        </section>

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
