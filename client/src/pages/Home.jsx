import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Navigate } from 'react-router-dom';

export default function Home() {
  const { token } = useAuth();

  if (token) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <img src="/images/brainboxlong.png" alt="Brainbox" className="h-[105px] mx-auto" />

        <h1 className="text-5xl font-bold text-brand-black mt-6">Take your AI brain anywhere</h1>
        <p className="text-sm text-text-muted mt-3">Build your AI brain once and deploy to ChatGPT, Claude, Gemini and more.</p>

        <div className="flex flex-wrap gap-2 justify-center mt-5">
          {['Custom GPT', 'Gemini Gem', 'Claude API', 'More LLMs'].map(label => (
            <span key={label} className="text-xs px-3 py-1.5 rounded-full border border-border text-text-muted bg-bg-panel">
              {label}
            </span>
          ))}
        </div>

        <Link
          to="/login"
          className="inline-block mt-8 bg-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-active text-white font-medium px-8 py-3 rounded-lg transition-colors text-lg"
        >
          Build your brain
        </Link>

        <p className="text-sm text-text-muted mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-orange hover:text-brand-orange-hover">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
