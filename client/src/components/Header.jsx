import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, CircleUser } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  return (
    <nav className={`border-b border-border ${compact ? 'px-4 py-2' : 'px-6 py-3'} flex items-center justify-between flex-shrink-0 relative`} onClick={() => setAvatarOpen(false)}>
      <Link to="/"><img src="/images/brainboxlong.png" alt="Brainbox" className={compact ? 'h-10' : 'h-12'} /></Link>
      <div className="flex items-center gap-3">
        <div className={`hidden md:flex items-center ${compact ? 'gap-4' : 'gap-6'}`}>
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
        {rightContent}
        <div className="relative hidden md:block">
          <button
            onClick={(e) => { e.stopPropagation(); setAvatarOpen(!avatarOpen); }}
            className="text-text-muted hover:text-brand-black p-1 rounded-full transition-colors"
          >
            <CircleUser size={24} />
          </button>
          {avatarOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg py-1 z-50 w-36" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => { setAvatarOpen(false); logout(); }}
                className="w-full text-left px-3 py-2 text-sm text-text-muted hover:text-brand-black hover:bg-bg-panel transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-text-muted hover:text-brand-black p-1">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-border z-40 px-6 py-3 space-y-1">
          {NAV_LINKS.map(({ to, label }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`block text-sm py-2 ${isActive ? 'text-brand-black font-medium' : 'text-text-muted hover:text-brand-black'}`}
              >
                {label}
              </Link>
            );
          })}
          <button
            onClick={() => { setMenuOpen(false); logout(); }}
            className="block text-sm text-text-muted hover:text-brand-black py-2 w-full text-left"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}
