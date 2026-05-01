import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function BlockedSettings() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['blocked'], queryFn: () => api.get('/users/me/blocked') });
  const unblock = useMutation({
    mutationFn: (username: string) => api.post(`/users/by-username/${username}/block`),
    onSuccess: () => {
      toast.success('Diblokir dilepas');
      qc.invalidateQueries({ queryKey: ['blocked'] });
    },
  });
  if (q.isLoading) return <Loading />;
  return (
    <div className="card p-6 space-y-3">
      <h3 className="font-bold">Pengguna diblokir</h3>
      {(q.data?.items || []).length === 0 ? (
        <p className="text-sm text-ink-500">Belum ada pengguna yang Anda blokir.</p>
      ) : (
        <div className="divide-y">
          {q.data!.items.map((u: any) => (
            <div key={u.id} className="py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center text-xs font-semibold">
                {u.username[0].toUpperCase()}
              </div>
              <div className="flex-1 text-sm">@{u.username}</div>
              <button onClick={() => unblock.mutate(u.username)} className="btn-ghost text-xs">Lepas blokir</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
