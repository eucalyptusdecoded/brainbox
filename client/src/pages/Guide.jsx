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

function Bullet({ children }) {
  return (
    <li className="text-sm text-text-primary flex gap-2">
      <span className="text-brand-orange flex-shrink-0">&bull;</span>
      <span>{children}</span>
    </li>
  );
}

export default function Guide() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">Brainbox Guide</h1>
          <p className="text-text-muted mt-2">Everything you need to know to build, manage, and deploy your AI brains.</p>
        </div>

        {/* 1. What is Brainbox? */}
        <div className="bg-bg-panel border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-lg font-semibold text-brand-black">What is Brainbox?</h2>
          <p className="text-sm text-text-primary">Brainbox lets you build portable AI context — called <strong>brains</strong> — that work across LLM platforms. A brain is a collection of instructions, knowledge, personality traits, and guardrails that shape how an AI responds to you.</p>
          <p className="text-sm text-text-primary">Build a brain once, then deploy it to ChatGPT, Gemini, Claude, Perplexity, Copilot, Grok, or any platform that accepts custom instructions. When you update your brain, your AI updates too.</p>
        </div>

        {/* 2. Getting Started */}
        <section id="getting-started" className="scroll-mt-20 space-y-4">
          <h2 className="text-lg font-semibold text-brand-black">Getting Started</h2>
          <p className="text-sm text-text-muted">Here's how to create your first brain and start building.</p>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">The Dashboard</h3>
            <p className="text-sm text-text-primary">The Dashboard is your home screen. It shows all your brains (up to 15) and lets you create, rename, duplicate, delete, import, and export them.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Creating a Brain</h3>
            <ol className="space-y-1.5 text-sm text-text-primary list-decimal list-inside">
              <li>Click + New Brain on the dashboard.</li>
              <li>Choose Start from Template to begin with a pre-built brain, or Start from Scratch for a blank canvas.</li>
              <li>Give your brain a name and optional description, then click Create.</li>
              <li>You'll be taken to the brain editor where you can start adding sections.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Templates</h3>
            <p className="text-sm text-text-primary">Templates are pre-built brains that show you how a well-structured brain looks. They come with example rules, memories, behaviours, guardrails, and skills that you can customise. They're the fastest way to get started.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Import &amp; Export</h3>
            <ol className="space-y-1.5 text-sm text-text-primary list-decimal list-inside">
              <li>To export, open the dashboard menu (&hellip;) on any brain and click Export. This saves a .brainbox file containing all sections, images, and settings.</li>
              <li>To import, click Import Brain on the dashboard and upload a .brainbox file. This creates a new brain with all the original content.</li>
              <li>Use import and export to share brains with colleagues, back up your work, or move brains between accounts.</li>
            </ol>
          </div>
        </section>

        {/* 3. Understanding Section Types */}
        <div className="bg-bg-panel border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-lg font-semibold text-brand-black">Understanding Section Types</h2>
          <p className="text-sm text-text-muted">A brain is made up of 5 types of sections. Each type serves a different purpose. You can have up to 10 sections of each type.</p>
          <div className="space-y-2 mt-2">
            <div className="flex gap-3 text-sm">
              <span className="text-brand-orange font-semibold w-24 flex-shrink-0">Rules</span>
              <span className="text-text-primary">Hard constraints the AI must always follow — e.g. "Always use British English"</span>
            </div>
            <div className="flex gap-3 text-sm">
              <span className="text-brand-orange font-semibold w-24 flex-shrink-0">Memories</span>
              <span className="text-text-primary">Persistent facts about you, your project, or your domain — e.g. "The user works in fintech"</span>
            </div>
            <div className="flex gap-3 text-sm">
              <span className="text-brand-orange font-semibold w-24 flex-shrink-0">Behaviours</span>
              <span className="text-text-primary">Tone, style, and interaction patterns — e.g. "Be warm and concise"</span>
            </div>
            <div className="flex gap-3 text-sm">
              <span className="text-brand-orange font-semibold w-24 flex-shrink-0">Guardrails</span>
              <span className="text-text-primary">Boundaries and restrictions — e.g. "Never give financial advice"</span>
            </div>
            <div className="flex gap-3 text-sm">
              <span className="text-brand-orange font-semibold w-24 flex-shrink-0">Skills</span>
              <span className="text-text-primary">Step-by-step workflows — e.g. "When writing a blog post, follow these steps..."</span>
            </div>
          </div>
          <p className="text-sm text-text-muted mt-2">Each type is explained in detail below with tips and examples.</p>
        </div>

        {/* 4–8. Per-type sections */}
        {SECTIONS.map(({ id, title, description, tips, examples }) => (
          <section key={id} id={id} className="scroll-mt-20 space-y-4">
            <h2 className="text-lg font-semibold text-brand-black">{title}</h2>
            <p className="text-sm text-text-muted">{description}</p>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-primary">Tips</h3>
              <ul className="space-y-1.5">
                {tips.map((tip, i) => (
                  <Bullet key={i}>{tip}</Bullet>
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

        {/* 9. Writing Best Practices */}
        <div className="bg-bg-panel border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-lg font-semibold text-brand-black">Writing Best Practices</h2>
          <p className="text-sm text-text-muted">General tips that apply to all section types.</p>
          <ul className="space-y-2 text-sm text-text-primary">
            <li className="flex gap-2"><span className="text-brand-orange font-bold">1.</span><span>Write for an AI audience — be literal and precise. Avoid sarcasm or implied meaning.</span></li>
            <li className="flex gap-2"><span className="text-brand-orange font-bold">2.</span><span>Keep nodes focused — each node should address one concept. Split complex instructions into multiple nodes.</span></li>
            <li className="flex gap-2"><span className="text-brand-orange font-bold">3.</span><span>Use priority to control order — lower numbers appear first in the compiled context sent to the AI.</span></li>
            <li className="flex gap-2"><span className="text-brand-orange font-bold">4.</span><span>Test and iterate — after adding nodes, use the Brain Context panel to see the compiled output and refine.</span></li>
          </ul>
        </div>

        {/* 10. File Uploads */}
        <section id="uploads" className="scroll-mt-20 space-y-4">
          <h2 className="text-lg font-semibold text-brand-black">File Uploads</h2>
          <p className="text-sm text-text-muted">You can upload documents to quickly populate your brain with existing content instead of typing everything manually.</p>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">How It Works</h3>
            <ol className="space-y-1.5 text-sm text-text-primary list-decimal list-inside">
              <li>Click Upload File in the sidebar to open the upload form.</li>
              <li>Select a file from your device. Supported formats: TXT, PDF, DOCX, and CSV.</li>
              <li>Brainbox extracts the text content from your file on the server. The original file is not stored — only the extracted text is kept.</li>
              <li>The extracted text and a name (auto-filled from the filename) appear in the form for you to review.</li>
              <li>Choose a section type (e.g. Memory, Rule) and adjust the priority if needed, then click Save.</li>
              <li>The content is saved as a regular brain section. You can edit it afterwards just like any other section.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Tips</h3>
            <ul className="space-y-1.5">
              <Bullet>Maximum extracted text size is 500KB per file. Very large documents will be rejected — consider splitting them into smaller files.</Bullet>
              <Bullet>Choose the section type that best fits the content — use Memory for reference documents, Rule for guidelines, Skill for process docs.</Bullet>
              <Bullet>After saving, review and trim the extracted content. Removing unnecessary boilerplate or headers keeps your brain clean and focused.</Bullet>
              <Bullet>PDF extraction works best with text-based PDFs. Scanned documents or image-heavy PDFs may produce poor results.</Bullet>
            </ul>
          </div>
        </section>

        {/* 11. Image References */}
        <section id="images" className="scroll-mt-20 space-y-4">
          <h2 className="text-lg font-semibold text-brand-black">Image References</h2>
          <p className="text-sm text-text-muted">Image references let you attach visual context to your brain — logos, style guides, mood boards, screenshots, and more. They appear in the compiled context so AI models with vision can see and interpret them.</p>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">How It Works</h3>
            <ol className="space-y-1.5 text-sm text-text-primary list-decimal list-inside">
              <li>Click + Add Image in the sidebar to open the image form.</li>
              <li>Paste a publicly accessible image URL (the image is not uploaded — only the link is stored).</li>
              <li>Write a short description (up to 200 characters) that tells the AI what the image represents.</li>
              <li>Set a priority to control ordering. Lower numbers appear first in the compiled context.</li>
              <li>The image and description are included in the Reference Images block of your compiled brain output.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Tips</h3>
            <ul className="space-y-1.5">
              <Bullet>Write descriptive, specific descriptions — "Primary brand logo, full colour on white background" is better than "Logo".</Bullet>
              <Bullet>Use priority to order images by importance. For image-heavy brains, consider setting priority to 100 so images are emphasised in the context.</Bullet>
              <Bullet>Images must be publicly accessible via URL. Private or authenticated links won't work when the AI tries to fetch them.</Bullet>
              <Bullet>You can add up to 10 images per brain. Focus on the most important visual references rather than adding everything.</Bullet>
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

        {/* 12. Priority & Ordering */}
        <section id="priority" className="scroll-mt-20 space-y-4">
          <h2 className="text-lg font-semibold text-brand-black">Priority &amp; Ordering</h2>
          <p className="text-sm text-text-muted">Priority controls the order sections appear in the compiled context that gets sent to the AI. This matters because LLMs process context from top to bottom — instructions that appear earlier have the strongest influence on output, especially in longer contexts.</p>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">How It Works</h3>
            <ul className="space-y-1.5">
              <Bullet>Each section has a priority number from 1–100. Lower numbers appear first within each type.</Bullet>
              <Bullet>Sections are grouped by type in the compiled output: Rules first, then Memories, Behaviours, Guardrails, and Skills.</Bullet>
              <Bullet>Within each type, sections are sorted by priority number. This means a Rule at priority 10 appears before a Rule at priority 50, but all Rules appear before all Memories regardless of priority.</Bullet>
              <Bullet>The default priority is 50 — the midpoint of the scale. This gives you room to place sections before (1–49) or after (51–100) the default.</Bullet>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Priority Scale</h3>
            <div className="bg-bg-panel border border-border rounded-lg overflow-hidden text-sm">
              <div className="grid grid-cols-[80px_1fr] border-b border-border">
                <div className="px-3 py-2 font-medium text-brand-orange bg-white">1–25</div>
                <div className="px-3 py-2 text-text-muted">Critical — core instructions that must shape every response. Example: a spelling rule that affects every word.</div>
              </div>
              <div className="grid grid-cols-[80px_1fr] border-b border-border">
                <div className="px-3 py-2 font-medium text-brand-orange bg-white">25–50</div>
                <div className="px-3 py-2 text-text-muted">Important — key context and frequently-used rules. Example: your brand voice description.</div>
              </div>
              <div className="grid grid-cols-[80px_1fr] border-b border-border">
                <div className="px-3 py-2 font-medium text-brand-orange bg-white">50</div>
                <div className="px-3 py-2 text-text-muted">Default — standard sections. Most sections can stay here unless ordering matters.</div>
              </div>
              <div className="grid grid-cols-[80px_1fr] border-b border-border">
                <div className="px-3 py-2 font-medium text-brand-orange bg-white">50–75</div>
                <div className="px-3 py-2 text-text-muted">Supporting — supplementary detail and less frequently-used workflows. Example: a skill for quarterly comparisons.</div>
              </div>
              <div className="grid grid-cols-[80px_1fr]">
                <div className="px-3 py-2 font-medium text-brand-orange bg-white">75–100</div>
                <div className="px-3 py-2 text-text-muted">Reference — background information the AI can draw on when needed. Example: a company history memory.</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Tips</h3>
            <ul className="space-y-1.5">
              <Bullet>You don't need to set priority for every section. The default of 50 works well for most cases — only adjust when you notice the AI isn't following certain instructions consistently.</Bullet>
              <Bullet>If the AI keeps ignoring a rule, try lowering its priority number so it appears earlier in the context.</Bullet>
              <Bullet>You can deactivate a section without deleting it. Inactive sections are excluded from the compiled output but remain saved in your brain. This is useful for testing how the AI responds with different combinations.</Bullet>
            </ul>
          </div>
        </section>

        {/* 13. Brain Context Preview */}
        <section id="preview" className="scroll-mt-20 space-y-4">
          <h2 className="text-lg font-semibold text-brand-black">Brain Context Preview</h2>
          <p className="text-sm text-text-muted">The Brain Context panel shows you exactly what gets sent to the AI — the compiled output of all your active sections, formatted and ordered by type and priority.</p>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">How It Works</h3>
            <ol className="space-y-1.5 text-sm text-text-primary list-decimal list-inside">
              <li>Open any brain from the dashboard.</li>
              <li>The Brain Context panel appears on the right side of the editor.</li>
              <li>It updates in real time as you add, edit, or toggle sections.</li>
              <li>Click the expand icon to see the full preview with complete content and priority badges.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Tips</h3>
            <ul className="space-y-1.5">
              <Bullet>Always check the preview before connecting your brain to an LLM. It shows the exact text the AI will receive.</Bullet>
              <Bullet>The preview only includes active sections. Deactivated sections won't appear.</Bullet>
              <Bullet>Section titles appear as sub-headers in the compiled output, so choose clear, descriptive names.</Bullet>
            </ul>
          </div>
        </section>

        {/* 14. Connecting Your Brain */}
        <section id="integration" className="scroll-mt-20 space-y-4">
          <h2 className="text-lg font-semibold text-brand-black">Connecting Your Brain</h2>
          <p className="text-sm text-text-muted">Once you've built your brain, the next step is connecting it to an LLM platform so the AI actually uses your context. Brainbox supports Custom GPT, Gemini Gem, Claude Project, Perplexity Space, Copilot Agent, and Grok.</p>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">How It Works</h3>
            <ol className="space-y-1.5 text-sm text-text-primary list-decimal list-inside">
              <li>Build your brain by adding rules, memories, behaviours, guardrails, and skills.</li>
              <li>Go to the Integration page and select the brain you want to connect.</li>
              <li>Choose your platform — each one has step-by-step setup instructions.</li>
              <li>Follow the instructions to paste your compiled context or connect via API key.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Two Ways to Connect</h3>
            <div className="space-y-3">
              <div className="bg-bg-panel border border-border rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-text-primary">Copy &amp; Paste</p>
                <p className="text-sm text-text-muted mt-1">Download your compiled brain as a .txt file from the Integration page and paste it into your LLM's system prompt or custom instructions. Simple and immediate, but you'll need to re-paste after making changes.</p>
              </div>
              <div className="bg-bg-panel border border-border rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-text-primary">API Key (Live Sync)</p>
                <p className="text-sm text-text-muted mt-1">Generate an API key on the Integration page. Some platforms support fetching your brain context via URL, so changes sync automatically without re-pasting.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Tips</h3>
            <ul className="space-y-1.5">
              <Bullet>Each platform has different instructions — the Integration page shows step-by-step setup for whichever platform you select.</Bullet>
              <Bullet>Your compiled context includes only active sections, ordered by priority within each type.</Bullet>
              <Bullet>You can preview exactly what gets sent to the AI using the Brain Context panel inside any brain.</Bullet>
            </ul>
          </div>
        </section>

        {/* 15. API Keys */}
        <section id="api-keys" className="scroll-mt-20 space-y-4">
          <h2 className="text-lg font-semibold text-brand-black">API Keys</h2>
          <p className="text-sm text-text-muted">API keys let LLM platforms fetch your brain context automatically via a URL, so you don't need to manually re-paste after every change.</p>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">How It Works</h3>
            <ol className="space-y-1.5 text-sm text-text-primary list-decimal list-inside">
              <li>Go to the API Keys page or generate a key from the Integration page.</li>
              <li>Select the brain you want to connect and add an optional label (e.g. "Custom GPT Production").</li>
              <li>Your key is shown once — copy it immediately. It cannot be retrieved later.</li>
              <li>Use the key in your LLM platform's configuration as instructed on the Integration page.</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">Tips</h3>
            <ul className="space-y-1.5">
              <Bullet>Each API key is scoped to a single brain. Generate a separate key for each brain you want to connect.</Bullet>
              <Bullet>Deleting an API key immediately stops any integration using it. To reconnect, generate a new key and update your platform settings.</Bullet>
              <Bullet>The Last Used column on the API Keys page shows when a key was last accessed, helping you identify unused keys.</Bullet>
              <Bullet>Treat API keys like passwords — don't share them publicly or commit them to source control.</Bullet>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
