import { NavLink, Outlet } from 'react-router-dom';
import { User, Lock, Eye, Bell, SlidersHorizontal, Monitor, ShieldOff } from 'lucide-react';

const TABS = [
  { to: '/settings/account', icon: User, label: 'Account' },
  { to: '/settings/security', icon: Lock, label: 'Security' },
  { to: '/settings/privacy', icon: Eye, label: 'Privacy' },
  { to: '/settings/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings/preferences', icon: SlidersHorizontal, label: 'Preferences' },
  { to: '/settings/sessions', icon: Monitor, label: 'Active sessions' },
  { to: '/settings/blocked', icon: ShieldOff, label: 'Blocked users' },
];

export default function Settings() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
      <aside>
        <h2 className="text-lg font-bold mb-3">Settings</h2>
        <nav className="space-y-0.5">
          {TABS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-primary-500/15 text-primary-300' : 'text-ink-600 hover:bg-ink-200/50'}`
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
