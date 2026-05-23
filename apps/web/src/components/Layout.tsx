import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
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
  Menu,
  X,
} from 'lucide-react';
import { clearAuth, getUser, isAdmin, isLoggedIn } from '../store/auth';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import Logo from './Logo';

type NavItem = { to: string; icon: any; label: string };
const NAV: { section: string; items: NavItem[] }[] = [
  { section: 'Discover', items: [
    { to: '/', icon: HomeIcon, label: 'Home' },
    { to: '/films', icon: Film, label: 'Catalog' },
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

  // Listen for global "open-global-search" events + ⌘K hotkey.
  // This is the only way to open the palette now — Home's search pill
  // dispatches this event when clicked.
  useEffect(() => {
    const onEvent = () => setSearchOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('open-global-search', onEvent);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('open-global-search', onEvent);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

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
                <span className="flex-1">{it.label}</span>
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
              <Link to="/" className="hover:text-[#c68a0e]">Home</Link>
              <Link to="/films" className="hover:text-[#c68a0e]">Catalog</Link>
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

      {/* Bell + profile avatar — portaled into each page's .topbar-right
          so they sit inline with the page's h1 (no separate sticky bar
          that could cover page action buttons). */}
      <TopbarActionsPortal
        loggedIn={loggedIn}
        user={user}
        isAdmin={!!isAdmin()}
        onLogout={handleLogout}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />
    </div>
  );
}

/**
 * Portals the bell + avatar into the active page's `.topbar-right` element.
 * If the page topbar has no `.topbar-right` div yet, it's created. If the
 * page doesn't use the `.topbar` pattern at all, this gracefully renders nothing.
 *
 * Uses a MutationObserver on <main> so we re-attach on every route change
 * (since each page mounts a fresh DOM subtree).
 */
function TopbarActionsPortal({
  loggedIn,
  user,
  isAdmin,
  onLogout,
  onOpenMobileNav,
}: {
  loggedIn: boolean;
  user: ReturnType<typeof getUser>;
  isAdmin: boolean;
  onLogout: () => void;
  onOpenMobileNav: () => void;
}) {
  const location = useLocation();
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const attach = () => {
      if (cancelled) return false;
      const topbar = document.querySelector('main .topbar') as HTMLElement | null;
      if (!topbar) return false;
      let right = topbar.querySelector(':scope > .topbar-right') as HTMLElement | null;
      if (!right) {
        right = document.createElement('div');
        right.className = 'topbar-right';
        topbar.appendChild(right);
      }
      let s = right.querySelector(':scope > .topbar-user-slot') as HTMLElement | null;
      if (!s) {
        s = document.createElement('div');
        s.className = 'topbar-user-slot';
        // ensure it always renders LAST inside .topbar-right
        right.appendChild(s);
      }
      setSlot(s);
      return true;
    };

    // Try immediately; if the page hasn't rendered its .topbar yet, watch the DOM
    if (!attach()) {
      const main = document.querySelector('main');
      if (!main) return;
      const obs = new MutationObserver(() => {
        if (attach()) obs.disconnect();
      });
      obs.observe(main, { childList: true, subtree: true });
      // Safety: clear the previous slot reference so stale portals don't render
      setSlot(null);
      return () => {
        cancelled = true;
        obs.disconnect();
      };
    }
  }, [location.pathname]);

  if (!slot) return null;
  return createPortal(
    <>
      {loggedIn ? (
        <>
          <NotificationBell />
          {user && <UserMenu user={user} onLogout={onLogout} isAdmin={isAdmin} />}
        </>
      ) : (
        <>
          <Link to="/login" className="btn-ghost !py-2 hidden sm:inline-flex">Sign in</Link>
          <Link to="/register" className="btn-primary !py-2">Join</Link>
        </>
      )}
      <button
        onClick={onOpenMobileNav}
        className="lg:hidden p-2 text-[#2d2d2d]"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>,
    slot
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
