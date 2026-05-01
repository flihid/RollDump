import { NavLink, Outlet } from 'react-router-dom';
import { User, Lock, Eye, Bell, SlidersHorizontal, Monitor, ShieldOff } from 'lucide-react';

const TABS = [
  { to: '/settings/account', icon: User, label: 'Akun' },
  { to: '/settings/security', icon: Lock, label: 'Keamanan' },
  { to: '/settings/privacy', icon: Eye, label: 'Privasi' },
  { to: '/settings/notifications', icon: Bell, label: 'Notifikasi' },
  { to: '/settings/preferences', icon: SlidersHorizontal, label: 'Preferensi' },
  { to: '/settings/sessions', icon: Monitor, label: 'Sesi aktif' },
  { to: '/settings/blocked', icon: ShieldOff, label: 'Pengguna diblokir' },
];

export default function Settings() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
      <aside>
        <h2 className="text-lg font-bold mb-3">Pengaturan</h2>
        <nav className="space-y-0.5">
          {TABS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-primary-50 text-primary-700' : 'text-ink-700 hover:bg-ink-100'}`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
