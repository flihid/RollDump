import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Film, Star, Image as ImageIcon, Flag, ScrollText, BarChart3, MessageSquare, ListChecks, Activity, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function AdminDashboard() {
  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats') });

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <div className="crumbs">Admin · Dashboard</div>
          <h1>Admin Dashboard</h1>
        </div>
        <div className="topbar-right">
          <Link to="/admin/reports" className="btn-primary">
            <Flag className="w-4 h-4" /> Moderation Queue
          </Link>
        </div>
      </div>

      {stats.isLoading ? (
        <Loading />
      ) : (
        <>
          {/* === PRIMARY METRICS ROW === */}
          <div className="stat-grid">
            <StatCard
              label="Total Users"
              value={stats.data?.users}
              delta={stats.data?.activeMods ? `${stats.data.activeMods} active mods` : 'Community'}
            />
            <StatCard
              label="Films in Catalog"
              value={stats.data?.films}
              delta={`${stats.data?.reviews || 0} reviews logged`}
            />
            <StatCard
              label="Total Photos"
              value={stats.data?.photos}
              delta="Uploaded by users"
            />
            <StatCard
              label="Pending Reports"
              value={stats.data?.pendingReports}
              delta={stats.data?.pendingReports > 0 ? 'Needs review' : 'All clear ✓'}
              accent={stats.data?.pendingReports > 0 ? 'urgent' : 'ok'}
            />
          </div>

          {/* === MODERATION ROW === */}
          <div className="section-title-underlined mt-2">Moderation Health</div>
          <div className="stat-grid mb-6">
            <StatCard
              label="Avg Response"
              value={stats.data?.avgResponseHours ? `${stats.data.avgResponseHours.toFixed(1)}h` : '—'}
              delta="Target < 4h"
            />
            <StatCard
              label="Resolved Today"
              value={stats.data?.resolvedToday ?? 0}
              delta={stats.data?.resolveRate ? `${stats.data.resolveRate}% resolve rate` : '—'}
            />
            <StatCard
              label="Active Mods"
              value={stats.data?.activeMods ?? 1}
              delta="Online"
            />
            <StatCard
              label="Total Resolved"
              value={(stats.data?.resolveRate ?? 0) + '%'}
              delta="all-time resolution rate"
              accent="ink"
            />
          </div>

          {/* === MANAGEMENT GRID === */}
          <div className="section-title-underlined mt-2">Management</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <ManageCard
              to="/admin/reports"
              icon={<Flag />}
              title="Moderation Queue"
              subtitle={`${stats.data?.pendingReports ?? 0} reports pending review`}
              urgent={(stats.data?.pendingReports ?? 0) > 0}
            />
            <ManageCard
              to="/admin/users"
              icon={<Users />}
              title="User Management"
              subtitle="Suspend, ban, change roles & permissions"
            />
            <ManageCard
              to="/admin/films"
              icon={<Film />}
              title="Film Catalog"
              subtitle="Add, edit, retire film stocks"
            />
            <ManageCard
              to="/admin/films/new"
              icon={<ImageIcon />}
              title="Add a Film"
              subtitle="Register a new stock with variants & specs"
            />
            <ManageCard
              to="/admin/audit-logs"
              icon={<ScrollText />}
              title="Audit Log"
              subtitle="Trail of every admin/moderator action"
            />
            <ManageCard
              to="/admin/reports"
              icon={<BarChart3 />}
              title="Analytics"
              subtitle="Coming soon — engagement metrics"
              disabled
            />
          </div>

          {/* === CONTENT VOLUME ROW === */}
          <div className="section-title-underlined mt-2">Content Volume</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat icon={<Star className="w-4 h-4" />} label="Reviews" value={stats.data?.reviews ?? 0} />
            <MiniStat icon={<ImageIcon className="w-4 h-4" />} label="Photos" value={stats.data?.photos ?? 0} />
            <MiniStat icon={<MessageSquare className="w-4 h-4" />} label="Active Lists" value={stats.data?.lists ?? '—'} />
            <MiniStat icon={<ListChecks className="w-4 h-4" />} label="Tips" value={stats.data?.tips ?? '—'} />
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  accent,
}: {
  label: string;
  value: any;
  delta?: string;
  accent?: 'urgent' | 'ok' | 'ink';
}) {
  if (accent === 'ink') {
    return (
      <div className="stat-card is-accent">
        <div className="lbl">{label}</div>
        <div className="val">{typeof value === 'number' ? value.toLocaleString() : value ?? 0}</div>
        {delta && <div className="delta" style={{ color: '#ffd56b' }}>{delta}</div>}
      </div>
    );
  }
  return (
    <div className="stat-card">
      <div className="lbl">{label}</div>
      <div className="val">{typeof value === 'number' ? value.toLocaleString() : value ?? 0}</div>
      {delta && (
        <div className="delta" style={{ color: accent === 'urgent' ? '#c8443a' : '#3f8f3f' }}>
          {delta}
        </div>
      )}
    </div>
  );
}

function ManageCard({
  to,
  icon,
  title,
  subtitle,
  urgent,
  disabled,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  urgent?: boolean;
  disabled?: boolean;
}) {
  const inner = (
    <div
      className={`card card-hover p-5 flex gap-4 items-start relative ${disabled ? 'opacity-50' : ''}`}
      style={urgent ? { borderColor: '#c8443a', boxShadow: '0 0 0 1px rgba(200,68,58,0.2)' } : undefined}
    >
      <div
        className="w-11 h-11 rounded-lg grid place-items-center shrink-0"
        style={{ background: urgent ? 'rgba(200,68,58,0.15)' : 'rgba(230,165,25,0.18)', color: urgent ? '#c8443a' : '#c68a0e' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-heading font-bold text-base text-ink-900">{title}</div>
          {urgent && (
            <span
              className="font-mono-tech text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: '#c8443a', color: 'white' }}
            >
              ACTION
            </span>
          )}
        </div>
        <div className="text-sm text-ink-600 mt-1">{subtitle}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-ink-500 shrink-0 mt-1" />
    </div>
  );
  if (disabled) return <div title="Coming soon">{inner}</div>;
  return <Link to={to}>{inner}</Link>;
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full grid place-items-center" style={{ background: '#ede5cf', color: '#c68a0e' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono-tech text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
        <div className="font-display text-xl text-ink-900 leading-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>
    </div>
  );
}

// Silence
void Activity;
