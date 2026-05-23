import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function AdminAuditLogs() {
  const q = useQuery({ queryKey: ['audit'], queryFn: () => api.get('/admin/audit-logs') });
  if (q.isLoading) return <Loading />;
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
          <h1>Audit Log</h1>
        </div>
      </div>
      <div className="card divide-y divide-ink-300">
        {(q.data?.items || []).map((row: any) => (
          <div key={row.id} className="p-4 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge" style={{ background: '#1a1a1a', color: '#e6a519' }}>{row.action}</span>
              <span className="font-mono-tech text-xs text-ink-500">
                {new Date(row.createdAt).toLocaleString('en-US')}
              </span>
            </div>
            <div className="text-xs text-ink-500 mt-2 font-mono-tech">
              {row.resourceType} · {row.resourceId} · actor {row.actorId}
            </div>
            {row.after && (
              <pre className="mt-2 p-2 rounded text-[11px] font-mono-tech overflow-x-auto" style={{ background: '#ede5cf', color: '#2d2d2d' }}>
                {typeof row.after === 'object' ? JSON.stringify(row.after, null, 2) : String(row.after)}
              </pre>
            )}
          </div>
        ))}
        {q.data?.items?.length === 0 && (
          <div className="p-10 text-center text-sm text-ink-500">No audit logs yet.</div>
        )}
      </div>
    </div>
  );
}
