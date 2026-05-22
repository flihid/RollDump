import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function AdminAuditLogs() {
  const q = useQuery({ queryKey: ['audit'], queryFn: () => api.get('/admin/audit-logs') });
  if (q.isLoading) return <Loading />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <div className="card divide-y">
        {(q.data?.items || []).map((row: any) => (
          <div key={row.id} className="p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="badge">{row.action}</span>
              <span className="text-ink-500 text-xs">{new Date(row.createdAt).toLocaleString('en-US')}</span>
            </div>
            <div className="text-xs text-ink-500 mt-1">
              {row.resourceType} {row.resourceId} · actor {row.actorId}
            </div>
          </div>
        ))}
        {q.data?.items?.length === 0 && <div className="p-6 text-center text-sm text-ink-500">No logs yet.</div>}
      </div>
    </div>
  );
}
