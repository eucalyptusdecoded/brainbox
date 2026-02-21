import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const SECTIONS = [
  {
    image: '/images/brainboxhomepage2.jpg',
    imageAlt: 'AI resets illustration',
    heading: 'AI resets. You don\u2019t.',
    body: (
      <>
        <p>Every new chat starts from zero.</p>
        <p className="mt-4">
          You re-explain your tone.<br />
          Your standards.<br />
          Your constraints.<br />
          Your strategy.
        </p>
        <p className="mt-4">Across every model.</p>
        <p className="mt-4 font-medium text-brand-black">That's friction.</p>
      </>
    ),
    imageLeft: true,
    bgPanel: false,
  },
  {
    image: '/images/brainboxhomepage3.jpg',
    imageAlt: 'Structured AI brain',
    heading: 'Your AI brain, structured.',
    body: (
      <>
        <p>BrainBox lets you define:</p>
        <ul className="mt-4 space-y-2">
          <li><strong className="text-brand-black">Skills</strong> — what you're capable of</li>
          <li><strong className="text-brand-black">Rules</strong> — your non-negotiables</li>
          <li><strong className="text-brand-black">Memories</strong> — persistent knowledge</li>
          <li><strong className="text-brand-black">Behaviours</strong> — how you operate</li>
          <li><strong className="text-brand-black">Guardrails</strong> — what must never happen</li>
        </ul>
        <p className="mt-4 font-medium text-brand-black">This isn't a prompt. It's a configured brain.</p>
      </>
    ),
    imageLeft: false,
    bgPanel: true,
  },
  {
    image: '/images/brainboxhomepage4.jpg',
    imageAlt: 'How BrainBox works',
    heading: 'How it works',
    body: (
      <>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-brand-orange text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <span>Build your brain inside BrainBox</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-brand-orange text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <span>Generate your configuration</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-brand-orange text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <span>Deploy it into any LLM</span>
          </div>
        </div>
        <p className="mt-6">
          No retraining.<br />
          No model lock-in.<br />
          No repeating yourself.
        </p>
      </>
    ),
    imageLeft: true,
    bgPanel: false,
  },
  {
    image: '/images/brainboxhomepage5.jpg',
    imageAlt: 'Who BrainBox is for',
    heading: 'Built for people who think for a living.',
    body: (
      <>
        <p>
          Founders.<br />
          Operators.<br />
          Writers.<br />
          Developers.<br />
          Teams.
        </p>
        <p className="mt-4 font-medium text-brand-black">If your output matters, your brain should be portable.</p>
      </>
    ),
    imageLeft: false,
    bgPanel: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
        <div className="w-full max-w-lg text-center">
          <img src="/images/brainboxlong.png" alt="Brainbox" className="h-[105px] mx-auto" />

          <h1 className="text-5xl font-bold text-brand-black mt-6">Take your AI brain anywhere</h1>
          <p className="text-base font-semibold text-brand-orange mt-4">
            Build your AI brain and deploy it across ChatGPT, Claude, Gemini for consistent output everywhere.
          </p>

          <div className="flex flex-wrap gap-2 justify-center mt-5">
            {['Custom GPT', 'Gemini Gem', 'Claude API', 'More LLMs'].map(label => (
              <span key={label} className="text-xs px-3 py-1.5 rounded-full border border-border text-text-muted bg-bg-panel">
                {label}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
            <Link
              to="/login"
              state={{ register: true }}
              className="bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white font-medium px-8 py-3 rounded-lg transition-colors text-lg"
            >
              Build your brain
            </Link>
            <a
              href="/documentation"
              className="border border-border text-text-muted hover:border-brand-orange hover:text-brand-orange font-medium px-8 py-3 rounded-lg transition-colors text-lg"
            >
              Read Documentation
            </a>
          </div>

          <p className="text-sm text-text-muted mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-orange hover:text-brand-orange-hover">Sign in</Link>
          </p>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-text-muted">
          <ChevronDown size={24} />
        </div>
      </div>

      {/* Below the fold */}
      {SECTIONS.map((section, i) => (
        <div key={i} className={section.bgPanel ? 'bg-bg-panel' : ''}>
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <div
              className={`flex flex-col ${section.imageLeft ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-12 py-16 md:py-24`}
            >
              <div className="w-full md:w-1/2">
                <img
                  src={section.image}
                  alt={section.imageAlt}
                  className="w-full rounded-xl object-cover"
                />
              </div>
              <div className="w-full md:w-1/2 text-text-primary">
                <div className="w-10 h-1 bg-brand-orange rounded-full mb-4" />
                <h2 className="text-3xl font-bold text-brand-black mb-4">{section.heading}</h2>
                <div className="text-base leading-relaxed text-text-muted">
                  {section.body}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Bottom CTA */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="bg-bg-panel rounded-xl text-center px-6 py-12 md:py-16">
          <h2 className="text-3xl font-bold text-brand-black">Ready to build your brain?</h2>
          <p className="text-base text-text-muted mt-3">Start free. Deploy everywhere.</p>
          <Link
            to="/login"
            state={{ register: true }}
            className="inline-block mt-6 bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white font-medium px-8 py-3 rounded-lg transition-colors text-lg"
          >
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
}
