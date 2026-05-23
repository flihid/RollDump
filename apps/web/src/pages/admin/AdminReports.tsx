import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, AlertTriangle, Image as ImageIcon, MessageSquare, Star, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

type Report = {
  id: string;
  reason: string;
  detail?: string | null;
  reportableType: string;
  reportableId: string;
  createdAt: string;
  reporterCount?: number;
  reporter?: { username?: string; avatarUrl?: string | null };
  target?: any;
};

// Reason metadata: label + badge color class + severity (drives default action)
const REASONS: Record<string, { label: string; cls: string; severe: boolean }> = {
  spam:           { label: 'SPAM',            cls: 'badge', severe: false },
  harassment:     { label: 'HARASSMENT',      cls: 'badge', severe: true },
  inappropriate:  { label: 'INAPPROPRIATE',   cls: 'badge', severe: true },
  misinformation: { label: 'MISINFORMATION',  cls: 'badge', severe: false },
  copyright:      { label: 'COPYRIGHT',       cls: 'badge', severe: false },
  other:          { label: 'OTHER',           cls: 'badge', severe: false },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  photo:   <ImageIcon className="w-4 h-4" />,
  review:  <Star className="w-4 h-4" />,
  comment: <MessageSquare className="w-4 h-4" />,
  list:    <ListChecks className="w-4 h-4" />,
  tip:     <MessageSquare className="w-4 h-4" />,
  user:    <Shield className="w-4 h-4" />,
};

export default function AdminReports() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-reports'], queryFn: () => api.get('/admin/reports') });
  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats') });

  const action = useMutation({
    mutationFn: ({ id, kind, notes }: any) =>
      api.post(`/admin/reports/${id}/action`, { action: kind, notes: notes || `Moderator: ${kind}` }),
    onSuccess: (_d, vars: any) => {
      const msg =
        vars.kind === 'remove_content'
          ? 'Content removed'
          : vars.kind === 'warn_user'
          ? 'User warned'
          : vars.kind === 'suspend_user'
          ? 'User suspended'
          : vars.kind === 'dismiss'
          ? 'Report dismissed'
          : 'Action applied';
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to apply action'),
  });

  if (q.isLoading) return <Loading />;
  const items: Report[] = q.data?.items || [];
  const s = stats.data || {};

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <Link
            to="/admin"
            className="font-mono-tech text-xs uppercase tracking-wider text-ink-500 hover:text-ink-900 inline-flex items-center gap-1 mb-1"
          >
            ← Admin Dashboard
          </Link>
          <h1>Moderation Queue</h1>
        </div>
        <div className="topbar-right">
          <Link to="/admin/audit-logs" className="btn-ghost">Audit Log</Link>
          <Link to="/admin/users" className="btn-primary">User Management</Link>
        </div>
      </div>

      {/* === STAT GRID === */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="lbl">Pending Reports</div>
          <div className="val">{items.length}</div>
          <div className="delta" style={{ color: items.length > 0 ? '#c8443a' : '#3f8f3f' }}>
            {items.length > 0 ? `Needs review` : 'All clear'}
          </div>
        </div>
        <div className="stat-card">
          <div className="lbl">Avg Response</div>
          <div className="val">{s.avgResponseHours ? `${s.avgResponseHours.toFixed(1)}h` : '—'}</div>
          <div className="delta">target &lt; 4h</div>
        </div>
        <div className="stat-card">
          <div className="lbl">Resolved Today</div>
          <div className="val">{s.resolvedToday ?? 0}</div>
          <div className="delta">{s.resolveRate ? `${s.resolveRate}% rate` : 'keep it up'}</div>
        </div>
        <div className="stat-card is-accent">
          <div className="lbl">Active Mods</div>
          <div className="val">{s.activeMods ?? 1}</div>
          <div className="delta" style={{ color: '#ffd56b' }}>Online</div>
        </div>
      </div>

      {/* === MODERATION LIST === */}
      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: '#3f8f3f' }} />
          <h3 className="font-heading text-lg text-ink-900 mb-1">All caught up 🎉</h3>
          <p className="text-sm text-ink-600 max-w-md mx-auto">
            No pending reports right now. Community is behaving — go shoot a roll.
          </p>
        </div>
      ) : (
        <div className="mod-list">
          {items.map((r) => (
            <ModRow
              key={r.id}
              report={r}
              onAction={(kind, notes) => action.mutate({ id: r.id, kind, notes })}
              pending={action.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModRow({
  report,
  onAction,
  pending,
}: {
  report: Report;
  onAction: (kind: string, notes?: string) => void;
  pending: boolean;
}) {
  const meta = REASONS[report.reason] || REASONS.other;
  const icon = TYPE_ICON[report.reportableType] || <Shield className="w-4 h-4" />;
  const targetUser = report.target?.author?.username || report.target?.user?.username;
  const ageHours = Math.max(
    1,
    Math.floor((Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60)),
  );
  const ageLabel = ageHours < 24 ? `${ageHours}h ago` : `${Math.floor(ageHours / 24)}d ago`;

  return (
    <div className="mod-row">
      {/* Thumb */}
      <div
        className="mod-thumb"
        style={{
          backgroundImage: report.target?.imageUrl ? `url(${report.target.imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!report.target?.imageUrl && (
          <div className="w-full h-full grid place-items-center" style={{ color: '#e6a519' }}>
            {icon}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0">
        <div className="flex gap-2 mb-3 flex-wrap items-center">
          <span
            className="reason-tag"
            style={{
              background: meta.severe ? 'rgba(200,68,58,0.15)' : 'rgba(224,138,26,0.15)',
              color: meta.severe ? '#c8443a' : '#c68a0e',
              border: `1px solid ${meta.severe ? 'rgba(200,68,58,0.4)' : 'rgba(224,138,26,0.4)'}`,
            }}
          >
            {meta.label}
          </span>
          <span className="reason-tag badge">
            {report.reportableType.toUpperCase()} · {report.reporterCount ?? 1} REPORT
            {(report.reporterCount ?? 1) > 1 ? 'S' : ''}
          </span>
        </div>

        <h5 className="font-heading font-bold text-base text-ink-900">
          {report.target?.title ||
            report.target?.caption?.slice(0, 80) ||
            `${capitalize(report.reportableType)}${targetUser ? ` by @${targetUser}` : ''}`}
        </h5>

        {report.detail && (
          <p className="text-sm text-ink-700 mt-2">
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-ink-500 mr-2">
              Reporter note:
            </span>
            {report.detail}
          </p>
        )}

        <div className="meta-info">
          {ageLabel}
          {targetUser && (
            <>
              {' · '}
              <Link to={`/u/${targetUser}`} className="link-amber">
                @{targetUser}
              </Link>
            </>
          )}
          {report.reporter?.username && (
            <>
              {' · '}reported by @{report.reporter.username}
            </>
          )}
          {report.reportableId && (
            <>
              {' · '}
              <Link to={getViewUrl(report.reportableType, report.reportableId)} className="link-amber">
                View →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {meta.severe ? (
          <>
            <button
              onClick={() => {
                if (confirm('Remove this content AND suspend the user? This is reversible from User Management.')) {
                  onAction('suspend_user');
                }
              }}
              disabled={pending}
              className="btn-danger btn-sm"
            >
              Remove + Suspend
            </button>
            <button
              onClick={() => onAction('remove_content')}
              disabled={pending}
              className="btn-ghost btn-sm"
            >
              Remove Content
            </button>
            <button
              onClick={() => onAction('warn_user')}
              disabled={pending}
              className="btn-ghost btn-sm"
            >
              Warn User
            </button>
            <button
              onClick={() => onAction('dismiss')}
              disabled={pending}
              className="btn-ghost btn-sm"
              style={{ color: '#7a7a7a' }}
            >
              Dismiss
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onAction('remove_content')}
              disabled={pending}
              className="btn-danger btn-sm"
            >
              Remove Content
            </button>
            <button
              onClick={() => onAction('warn_user')}
              disabled={pending}
              className="btn-ghost btn-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Warn User
            </button>
            <button
              onClick={() => onAction('dismiss')}
              disabled={pending}
              className="btn-ghost btn-sm"
              style={{ color: '#7a7a7a' }}
            >
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function getViewUrl(type: string, id: string): string {
  return (
    {
      photo:  `/photos/${id}`,
      review: `/reviews/${id}`,
      list:   `/lists/${id}`,
      tip:    `/tips/${id}`,
      user:   `/u/${id}`,
    } as Record<string, string>
  )[type] || '#';
}
