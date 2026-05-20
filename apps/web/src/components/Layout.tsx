import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  LogOut,
  Settings,
  Shield,
  Plus,
  Menu,
  X,
} from 'lucide-react';
import { clearAuth, getUser, isAdmin, isLoggedIn } from '../store/auth';
import { useState } from 'react';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import Logo from './Logo';

export default function Layout() {
  const navigate = useNavigate();
  const user = getUser();
  const loggedIn = isLoggedIn();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navLinks: { to: string; label: string }[] = [
    { to: '/films', label: 'Films' },
    { to: '/photos', label: 'Gallery' },
    { to: '/lists', label: 'Lists' },
    { to: '/tips', label: 'Tips' },
    { to: '/discover', label: 'Discover' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav — horizontal text links, Letterboxd-style */}
      <header className="sticky top-0 z-30 bg-ink-900/80 backdrop-blur-md border-b border-ink-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">
          <Logo size={52} showTagline className="shrink-0" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'text-primary-400'
                      : 'text-ink-100 hover:text-primary-400'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {loggedIn && (
              <NavLink
                to="/wishlist"
                className={({ isActive }) =>
                  `px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'text-primary-400'
                      : 'text-ink-100 hover:text-primary-400'
                  }`
                }
              >
                Wishlist
              </NavLink>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-ink-100 hover:text-primary-400 transition"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            {loggedIn ? (
              <>
                <NotificationBell />
                <Link to="/upload" className="btn-primary !py-1.5 !px-3 hidden sm:inline-flex">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log</span>
                </Link>
                <UserMenu user={user!} onLogout={handleLogout} isAdmin={!!isAdmin()} />
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost !py-1.5 !px-3 hidden sm:inline-flex">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary !py-1.5 !px-3">
                  Join
                </Link>
              </>
            )}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 text-ink-100"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Subtle filmstrip flourish below header */}
      <div className="filmstrip-divider" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 min-w-0">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-700 bg-ink-900/60 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-ink-200">
          <div className="flex items-center gap-3">
            <Logo size={32} showWordmark linkTo={null} />
            <span className="text-ink-300 italic font-display text-base">— shoot more film.</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 uppercase tracking-wider">
            <Link to="/films" className="hover:text-primary-400">Catalog</Link>
            <Link to="/discover" className="hover:text-primary-400">Discover</Link>
            <Link to="/tips" className="hover:text-primary-400">Tips</Link>
            <Link to="/lists" className="hover:text-primary-400">Lists</Link>
          </div>
        </div>
      </footer>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-72 bg-ink-800 border-l border-ink-700 p-6 flex flex-col gap-1">
            <button
              onClick={() => setMobileNavOpen(false)}
              className="self-end p-2 text-ink-100 mb-2"
            >
              <X className="w-5 h-5" />
            </button>
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-3 text-sm font-bold uppercase tracking-wider border-b border-ink-700 ${
                    isActive ? 'text-primary-400' : 'text-ink-50'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {loggedIn && (
              <>
                <NavLink
                  to="/wishlist"
                  onClick={() => setMobileNavOpen(false)}
                  className="px-3 py-3 text-sm font-bold uppercase tracking-wider border-b border-ink-700 text-ink-50"
                >
                  Wishlist
                </NavLink>
                <NavLink
                  to="/settings"
                  onClick={() => setMobileNavOpen(false)}
                  className="px-3 py-3 text-sm font-bold uppercase tracking-wider border-b border-ink-700 text-ink-50"
                >
                  Settings
                </NavLink>
                {isAdmin() && (
                  <NavLink
                    to="/admin"
                    onClick={() => setMobileNavOpen(false)}
                    className="px-3 py-3 text-sm font-bold uppercase tracking-wider border-b border-ink-700 text-primary-400"
                  >
                    Admin
                  </NavLink>
                )}
              </>
            )}
          </aside>
        </div>
      )}

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function UserMenu({
  user,
  onLogout,
  isAdmin,
}: {
  user: { username: string; avatarUrl?: string | null };
  onLogout: () => void;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-8 h-8 rounded-full bg-primary-500 text-ink-900 text-sm font-bold flex items-center justify-center overflow-hidden ring-1 ring-primary-400/50 hover:ring-primary-400"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
        ) : (
          user.username.charAt(0).toUpperCase()
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-56 bg-ink-700 border border-ink-600 rounded-md shadow-xl shadow-black/50 overflow-hidden z-50">
            <div className="px-3 py-2 border-b border-ink-600 text-sm">
              <div className="font-semibold text-ink-50">@{user.username}</div>
              <div className="text-xs text-ink-200">View profile</div>
            </div>
            <Link
              to={`/u/${user.username}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-ink-50 hover:bg-ink-600"
              onClick={() => setOpen(false)}
            >
              <User className="w-4 h-4" /> Profile
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm text-ink-50 hover:bg-ink-600"
              onClick={() => setOpen(false)}
            >
              <Settings className="w-4 h-4" /> Settings
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-2 text-sm text-primary-400 hover:bg-ink-600"
                onClick={() => setOpen(false)}
              >
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
            <button
              onClick={onLogout}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-ink-600 border-t border-ink-600"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
