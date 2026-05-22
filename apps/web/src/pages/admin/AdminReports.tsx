import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function AdminReports() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-reports'], queryFn: () => api.get('/admin/reports') });
  const action = useMutation({
    mutationFn: ({ id, action }: any) => api.post(`/admin/reports/${id}/action`, { action, notes: 'admin action' }),
    onSuccess: () => {
      toast.success('Action applied');
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });

  if (q.isLoading) return <Loading />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Moderation queue</h1>
      {q.data?.items?.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-600">No pending reports. 🎉</div>
      ) : (
        <div className="card divide-y divide-ink-300">
          {q.data!.items.map((r: any) => (
            <div key={r.id} className="p-4 flex items-center gap-3">
              <div className="badge">{r.reportableType}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-ink-900">{r.reason}</div>
                {r.detail && <div className="text-xs text-ink-500">{r.detail}</div>}
              </div>
              <button onClick={() => action.mutate({ id: r.id, action: 'dismiss' })} className="btn-ghost text-xs">Dismiss</button>
              <button onClick={() => action.mutate({ id: r.id, action: 'remove_content' })} className="btn-danger text-xs">Remove content</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
