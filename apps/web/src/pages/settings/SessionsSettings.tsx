import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Monitor, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function SessionsSettings() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['sessions'], queryFn: () => api.get('/auth/sessions') });
  const revoke = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/sessions/${id}`),
    onSuccess: () => {
      toast.success('Session revoked');
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
  const all = useMutation({
    mutationFn: () => api.post('/auth/logout-all'),
    onSuccess: () => toast.success('All sessions revoked'),
  });

  if (q.isLoading) return <Loading />;
  return (
    <div className="card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Active sessions</h3>
        <button onClick={() => all.mutate()} className="btn-danger">Sign out everywhere</button>
      </div>
      <div className="divide-y divide-ink-600">
        {(q.data?.sessions || []).map((s: any) => {
          const isMobile = (s.userAgent || '').toLowerCase().includes('mobile');
          return (
            <div key={s.id} className="py-3 flex items-center gap-3">
              {isMobile ? <Smartphone className="w-5 h-5 text-ink-300" /> : <Monitor className="w-5 h-5 text-ink-300" />}
              <div className="flex-1 text-sm">
                <div className="font-medium text-ink-50">{s.userAgent || 'Unknown device'}</div>
                <div className="text-xs text-ink-300">{s.ip || '—'} · Since {new Date(s.createdAt).toLocaleString('en-US')}</div>
              </div>
              <button onClick={() => revoke.mutate(s.id)} className="btn-ghost text-red-400 text-xs">Revoke</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
