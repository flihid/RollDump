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
      toast.success('Sesi dicabut');
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
  const all = useMutation({
    mutationFn: () => api.post('/auth/logout-all'),
    onSuccess: () => toast.success('Semua sesi dicabut'),
  });

  if (q.isLoading) return <Loading />;
  return (
    <div className="card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Sesi aktif</h3>
        <button onClick={() => all.mutate()} className="btn-danger">Keluar dari semua perangkat</button>
      </div>
      <div className="divide-y">
        {(q.data?.sessions || []).map((s: any) => {
          const isMobile = (s.userAgent || '').toLowerCase().includes('mobile');
          return (
            <div key={s.id} className="py-3 flex items-center gap-3">
              {isMobile ? <Smartphone className="w-5 h-5 text-ink-500" /> : <Monitor className="w-5 h-5 text-ink-500" />}
              <div className="flex-1 text-sm">
                <div className="font-medium">{s.userAgent || 'Unknown device'}</div>
                <div className="text-xs text-ink-500">{s.ip || '—'} • Sejak {new Date(s.createdAt).toLocaleString('id-ID')}</div>
              </div>
              <button onClick={() => revoke.mutate(s.id)} className="btn-ghost text-red-600 text-xs">Cabut</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
