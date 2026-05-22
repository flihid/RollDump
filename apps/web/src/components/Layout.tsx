import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Search,
  Compass,
  Film,
  Image as ImageIcon,
  ListChecks,
  BookOpen,
  Home as HomeIcon,
  Heart,
  Bell,
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

const NAV = [
  { section: 'Discover', items: [
    { to: '/', icon: HomeIcon, label: 'Home' },
    { to: '/discover', icon: Compass, label: 'Discover' },
    { to: '/films', icon: Film, label: 'Films' },
  ]},
  { section: 'Community', items: [
    { to: '/photos', icon: ImageIcon, label: 'Gallery' },
    { to: '/lists', icon: ListChecks, label: 'Lists' },
    { to: '/tips', icon: BookOpen, label: 'Tips' },
  ]},
];

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

  return (
    <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
      {/* ============ SIDEBAR (dark ink) ============ */}
      <aside className="hidden lg:flex sticky top-0 h-screen flex-col overflow-y-auto bg-[#1a1a1a] text-[#f5f0e1] px-5 py-6">
        <Logo size={40} showWordmark className="mb-7" />

        {NAV.map((group) => (
          <div key={group.section}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === '/'}
                className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item')}
              >
                <it.icon className="w-[18px] h-[18px] shrink-0" />
                {it.label}
              </NavLink>
            ))}
          </div>
        ))}

        {loggedIn && (
          <div>
            <div className="nav-section-label">Personal</div>
            <NavLink to="/wishlist" className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item')}>
              <Heart className="w-[18px] h-[18px] shrink-0" /> Wishlist
            </NavLink>
            <NavLink to={`/u/${user?.username}`} className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item')}>
              <User className="w-[18px] h-[18px] shrink-0" /> Profile
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item')}>
              <Settings className="w-[18px] h-[18px] shrink-0" /> Settings
            </NavLink>
            {isAdmin() && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item')}>
                <Shield className="w-[18px] h-[18px] shrink-0" /> Admin
              </NavLink>
            )}
          </div>
        )}

        <div className="mt-auto pt-6">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full p-3 rounded-[10px] text-xs text-left text-[#dcd5bf]"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <div className="font-semibold text-[#f5f0e1] mb-1">⚡ Quick search</div>
            <div>
              Press <kbd className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>⌘K</kbd>
              {' '}any time.
            </div>
          </button>
          {loggedIn && (
            <button
              onClick={handleLogout}
              className="mt-3 w-full nav-item text-[#c9c2ae] hover:text-red-300"
            >
              <LogOut className="w-[18px] h-[18px]" /> Sign out
            </button>
          )}
          {!loggedIn && (
            <div className="mt-3 space-y-2">
              <Link to="/register" className="btn-primary w-full">Join</Link>
              <Link to="/login" className="btn-ghost w-full" style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f5f0e1' }}>
                Sign in
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-[#f5f0e1]/85 backdrop-blur border-b border-[#dcd5bf]">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
            {/* Mobile brand */}
            <Link to="/" className="lg:hidden">
              <Logo size={36} showWordmark={false} />
            </Link>

            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 flex-1 max-w-md px-4 py-2.5 text-sm rounded-full transition"
              style={{ background: '#fbf8ef', border: '1px solid #dcd5bf', color: '#7a7a7a' }}
            >
              <Search className="w-4 h-4" />
              <span>Search films, creators, lists…</span>
              <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#e8e1cb', color: '#2d2d2d', border: '1px solid #dcd5bf' }}>
                ⌘K
              </span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              {loggedIn ? (
                <>
                  <NotificationBell />
                  <Link
                    to="/upload"
                    className="btn-primary !py-2 !px-4 hidden sm:inline-flex"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log</span>
                  </Link>
                  <UserMenu user={user!} onLogout={handleLogout} isAdmin={!!isAdmin()} />
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost !py-2 hidden sm:inline-flex">Sign in</Link>
                  <Link to="/register" className="btn-primary !py-2">Join</Link>
                </>
              )}
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-2 text-[#2d2d2d]"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 min-w-0">
          <Outlet />
        </main>

        <footer className="border-t border-[#dcd5bf] mt-12" style={{ background: '#fbf8ef' }}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs" style={{ color: '#4a4a4a' }}>
            <div className="flex items-center gap-3">
              <Logo size={32} showWordmark linkTo={null} />
              <span className="font-display-italic" style={{ color: '#7a7a7a' }}>— shoot more film.</span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono-tech uppercase tracking-wider">
              <Link to="/films" className="hover:text-[#c68a0e]">Catalog</Link>
              <Link to="/discover" className="hover:text-[#c68a0e]">Discover</Link>
              <Link to="/tips" className="hover:text-[#c68a0e]">Tips</Link>
              <Link to="/lists" className="hover:text-[#c68a0e]">Lists</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-72 p-6 flex flex-col gap-1 overflow-y-auto" style={{ background: '#1a1a1a', color: '#f5f0e1' }}>
            <button onClick={() => setMobileNavOpen(false)} className="self-end p-2 mb-2 text-[#f5f0e1]">
              <X className="w-5 h-5" />
            </button>
            {NAV.flatMap((g) => g.items).map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === '/'}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) => (isActive ? 'nav-item-active' : 'nav-item')}
              >
                <it.icon className="w-[18px] h-[18px]" /> {it.label}
              </NavLink>
            ))}
            {loggedIn && (
              <>
                <NavLink to="/wishlist" onClick={() => setMobileNavOpen(false)} className="nav-item">
                  <Heart className="w-[18px] h-[18px]" /> Wishlist
                </NavLink>
                <NavLink to="/settings" onClick={() => setMobileNavOpen(false)} className="nav-item">
                  <Settings className="w-[18px] h-[18px]" /> Settings
                </NavLink>
                {isAdmin() && (
                  <NavLink to="/admin" onClick={() => setMobileNavOpen(false)} className="nav-item">
                    <Shield className="w-[18px] h-[18px]" /> Admin
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
        className="w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #e6a519, #c68a0e)',
          color: '#1a1a1a',
          border: '2px solid #f5f0e1',
          boxShadow: '0 2px 6px rgba(45,45,45,0.08)',
        }}
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
          <div
            className="absolute right-0 top-12 w-56 overflow-hidden z-50 shadow-xl"
            style={{ background: '#fbf8ef', border: '1px solid #dcd5bf', borderRadius: 14 }}
          >
            <div className="px-3 py-3 border-b border-[#dcd5bf]">
              <div className="font-semibold text-[#1a1a1a]">@{user.username}</div>
              <div className="text-xs text-[#7a7a7a]">View profile</div>
            </div>
            <Link to={`/u/${user.username}`} className="flex items-center gap-2 px-3 py-2 text-sm text-[#2d2d2d] hover:bg-[#f5f0e1]" onClick={() => setOpen(false)}>
              <User className="w-4 h-4" /> Profile
            </Link>
            <Link to="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-[#2d2d2d] hover:bg-[#f5f0e1]" onClick={() => setOpen(false)}>
              <Settings className="w-4 h-4" /> Settings
            </Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-2 px-3 py-2 text-sm text-[#c68a0e] hover:bg-[#f5f0e1]" onClick={() => setOpen(false)}>
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
            <button
              onClick={onLogout}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-[#c8443a] hover:bg-[#f5f0e1] border-t border-[#dcd5bf]"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Bell icon imported for future use; silence unused warning
void Bell;
