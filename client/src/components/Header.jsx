import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/keys', label: 'API Keys' },
  { to: '/integration', label: 'Integration' },
  { to: '/guide', label: 'Guide' },
];

export default function Header({ rightContent, compact }) {
  const { logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav className={`border-b border-border ${compact ? 'px-4 py-2' : 'px-6 py-3'} flex items-center justify-between flex-shrink-0`}>
      <div className={`flex items-center ${compact ? 'gap-4' : 'gap-6'}`}>
        <Link to="/"><img src="/images/brainboxlong.png" alt="Brainbox" className={compact ? 'h-10' : 'h-12'} /></Link>
        {NAV_LINKS.map(({ to, label }) => {
          const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`text-sm ${isActive ? 'text-brand-black font-medium' : 'text-text-muted hover:text-brand-black'}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        {rightContent}
        <button onClick={logout} className="text-sm text-text-muted hover:text-brand-black">Sign Out</button>
      </div>
    </nav>
  );
}
