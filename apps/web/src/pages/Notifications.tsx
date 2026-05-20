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
          <Bell /> Notifications
        </h1>
        <button onClick={() => markAll.mutate()} className="btn-ghost text-sm">
          <CheckCheck className="w-4 h-4" /> Mark all as read
        </button>
      </div>
      {q.isLoading ? (
        <Loading />
      ) : q.data?.items?.length === 0 ? (
        <EmptyState title="No notifications yet" description="New activity will show up here." />
      ) : (
        <div className="card divide-y divide-ink-600">
          {q.data!.items.map((row: any) => {
            const n = row.n;
            return (
              <Link
                to="/"
                key={n.id}
                className={`p-4 flex gap-3 hover:bg-ink-600/50 ${!n.isRead ? 'bg-primary-500/[0.06]' : ''}`}
              >
                <div className="w-9 h-9 rounded-full bg-primary-500 text-ink-900 flex items-center justify-center font-bold">
                  {row.actor?.username?.[0]?.toUpperCase() || '•'}
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    {row.actor && <span className="font-semibold text-ink-50">@{row.actor.username}</span>}{' '}
                    <span className="text-ink-200">{labelFor(n.type)}</span>
                  </div>
                  <div className="text-xs text-ink-300 mt-0.5">{new Date(n.createdAt).toLocaleString('en-US')}</div>
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
      new_follower: 'started following you',
      new_like: 'liked your content',
      new_comment: 'commented on your content',
      mention: 'mentioned you',
      review_helpful: 'marked your review as helpful',
      tip_voted: 'voted on your tip',
      list_liked: 'liked your list',
      admin_announcement: '— admin announcement',
    } as Record<string, string>
  )[type] || type;
}
