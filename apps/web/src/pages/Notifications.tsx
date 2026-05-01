import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Loading, EmptyState } from '../components/common';

export default function Notifications() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notifications'], queryFn: () => api.get('/notifications') });
  const markAll = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell /> Notifikasi
        </h1>
        <button onClick={() => markAll.mutate()} className="btn-ghost text-sm">
          <CheckCheck className="w-4 h-4" /> Tandai semua dibaca
        </button>
      </div>
      {q.isLoading ? (
        <Loading />
      ) : q.data?.items?.length === 0 ? (
        <EmptyState title="Belum ada notifikasi" description="Aktivitas baru akan muncul di sini." />
      ) : (
        <div className="card divide-y">
          {q.data!.items.map((row: any) => {
            const n = row.n;
            return (
              <Link
                to="/"
                key={n.id}
                className={`p-4 flex gap-3 hover:bg-ink-50 ${!n.isRead ? 'bg-primary-50/30' : ''}`}
              >
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-700">
                  {row.actor?.username?.[0]?.toUpperCase() || '•'}
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    {row.actor && <span className="font-semibold">@{row.actor.username}</span>}{' '}
                    <span className="text-ink-600">{labelFor(n.type)}</span>
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">{new Date(n.createdAt).toLocaleString('id-ID')}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function labelFor(type: string) {
  return (
    {
      new_follower: 'mulai mengikuti Anda',
      new_like: 'menyukai konten Anda',
      new_comment: 'mengomentari konten Anda',
      mention: 'menyebut Anda',
      review_helpful: 'menandai review Anda bermanfaat',
      tip_voted: 'memberi vote pada tips Anda',
      list_liked: 'menyukai list Anda',
      admin_announcement: '— pengumuman admin',
    } as Record<string, string>
  )[type] || type;
}
