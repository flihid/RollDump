import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Search,
  Home,
  Film,
  Image,
  BookOpen,
  Compass,
  ListChecks,
  Bell,
  User,
  LogIn,
  LogOut,
  Settings,
  Shield,
  Plus,
} from 'lucide-react';
import { clearAuth, getUser, isAdmin, isLoggedIn } from '../store/auth';
import { useState } from 'react';
import GlobalSearch from './GlobalSearch';

export default function Layout() {
  const navigate = useNavigate();
  const user = getUser();
  const loggedIn = isLoggedIn();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItem = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
          isActive ? 'bg-primary-50 text-primary-700' : 'text-ink-700 hover:bg-ink-100'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-ink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-primary-600">●</span>
            <span>RollDump</span>
          </Link>
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-auto px-3 py-1.5 rounded-lg border border-ink-200 text-ink-500 text-sm hover:border-primary-500 transition"
          >
            <Search className="w-4 h-4" />
            <span>Cari film, kreator, list…</span>
            <span className="ml-auto text-xs bg-ink-100 rounded px-1.5 py-0.5">⌘K</span>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 hover:bg-ink-100 rounded-lg"
              aria-label="Cari"
            >
              <Search className="w-5 h-5" />
            </button>
            {loggedIn ? (
              <>
                <Link to="/notifications" className="p-2 hover:bg-ink-100 rounded-lg" aria-label="Notifikasi">
                  <Bell className="w-5 h-5" />
                </Link>
                <Link to="/upload" className="btn-primary !py-1.5 !px-3 hidden sm:inline-flex">
                  <Plus className="w-4 h-4" />
                  <span>Unggah</span>
                </Link>
                <UserMenu user={user!} onLogout={handleLogout} />
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  <LogIn className="w-4 h-4" />
                  Masuk
                </Link>
                <Link to="/register" className="btn-primary">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 py-6">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-20 space-y-1">
            {navItem('/', <Home className="w-4 h-4" />, 'Beranda')}
            {navItem('/films', <Film className="w-4 h-4" />, 'Katalog Film')}
            {navItem('/photos', <Image className="w-4 h-4" />, 'Galeri')}
            {navItem('/tips', <BookOpen className="w-4 h-4" />, 'Tips & Guide')}
            {navItem('/lists', <ListChecks className="w-4 h-4" />, 'Lists')}
            {navItem('/discover', <Compass className="w-4 h-4" />, 'Discover')}
            {loggedIn && navItem('/wishlist', <ListChecks className="w-4 h-4" />, 'Wishlist')}
            {loggedIn && navItem('/settings', <Settings className="w-4 h-4" />, 'Pengaturan')}
            {isAdmin() && navItem('/admin', <Shield className="w-4 h-4" />, 'Admin')}
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden sticky bottom-0 bg-white border-t border-ink-200 grid grid-cols-5 z-30">
        <NavLink to="/" className={({ isActive }) => `py-2 flex flex-col items-center text-xs ${isActive ? 'text-primary-600' : 'text-ink-600'}`}>
          <Home className="w-5 h-5" />
          <span>Beranda</span>
        </NavLink>
        <NavLink to="/films" className={({ isActive }) => `py-2 flex flex-col items-center text-xs ${isActive ? 'text-primary-600' : 'text-ink-600'}`}>
          <Film className="w-5 h-5" />
          <span>Film</span>
        </NavLink>
        <NavLink to="/upload" className={({ isActive }) => `py-2 flex flex-col items-center text-xs ${isActive ? 'text-primary-600' : 'text-ink-600'}`}>
          <Plus className="w-5 h-5" />
          <span>Unggah</span>
        </NavLink>
        <NavLink to="/discover" className={({ isActive }) => `py-2 flex flex-col items-center text-xs ${isActive ? 'text-primary-600' : 'text-ink-600'}`}>
          <Compass className="w-5 h-5" />
          <span>Cari</span>
        </NavLink>
        <NavLink to={user ? `/u/${user.username}` : '/login'} className={({ isActive }) => `py-2 flex flex-col items-center text-xs ${isActive ? 'text-primary-600' : 'text-ink-600'}`}>
          <User className="w-5 h-5" />
          <span>Profil</span>
        </NavLink>
      </nav>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function UserMenu({ user, onLogout }: { user: { username: string; avatarUrl?: string | null }; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-9 h-9 rounded-full bg-primary-600 text-white font-medium flex items-center justify-center overflow-hidden"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
        ) : (
          user.username.charAt(0).toUpperCase()
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-56 bg-white border border-ink-200 rounded-xl shadow-lg overflow-hidden z-50">
            <div className="px-3 py-2 border-b border-ink-100 text-sm">
              <div className="font-medium">@{user.username}</div>
            </div>
            <Link to={`/u/${user.username}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-ink-50" onClick={() => setOpen(false)}>
              <User className="w-4 h-4" /> Profil saya
            </Link>
            <Link to="/settings" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-ink-50" onClick={() => setOpen(false)}>
              <Settings className="w-4 h-4" /> Pengaturan
            </Link>
            <button onClick={onLogout} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
