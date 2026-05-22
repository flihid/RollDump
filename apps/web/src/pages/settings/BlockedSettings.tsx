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
      toast.success('User unblocked');
      qc.invalidateQueries({ queryKey: ['blocked'] });
    },
  });
  if (q.isLoading) return <Loading />;
  return (
    <div className="card p-6 space-y-3">
      <h3 className="font-bold">Blocked users</h3>
      {(q.data?.items || []).length === 0 ? (
        <p className="text-sm text-ink-500">You haven't blocked anyone yet.</p>
      ) : (
        <div className="divide-y divide-ink-300">
          {q.data!.items.map((u: any) => (
            <div key={u.id} className="py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-ink-200 flex items-center justify-center text-xs font-semibold text-ink-900">
                {u.username[0].toUpperCase()}
              </div>
              <div className="flex-1 text-sm text-ink-900">@{u.username}</div>
              <button onClick={() => unblock.mutate(u.username)} className="btn-ghost text-xs">Unblock</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
