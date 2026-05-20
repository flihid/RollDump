import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Heart, MessageSquare, UserPlus, Star, BookOpen, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';

const TYPE_ICON: Record<string, React.ReactNode> = {
  like: <Heart className="w-4 h-4 text-rose-400" />,
  comment: <MessageSquare className="w-4 h-4 text-sky-400" />,
  follow: <UserPlus className="w-4 h-4 text-primary-400" />,
  review: <Star className="w-4 h-4 text-amber-400" />,
  tip: <BookOpen className="w-4 h-4 text-emerald-400" />,
  photo: <ImageIcon className="w-4 h-4 text-fuchsia-400" />,
};

function relativeTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
    refetchInterval: open ? 0 : 60_000,
  });

  // close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items: any[] = data?.items || [];
  const unread = items.filter((n) => !n.readAt).length;

  const markRead = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((s) => !s);
          if (!open) refetch();
        }}
        className="relative p-2 text-ink-100 hover:text-primary-400 transition"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary-500 text-ink-900 text-[10px] font-bold flex items-center justify-center ring-2 ring-ink-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-[360px] max-w-[calc(100vw-2rem)] bg-ink-700 border border-ink-600 rounded-md shadow-2xl shadow-black/60 overflow-hidden z-50 animate-in">
          <div className="px-4 py-3 border-b border-ink-600 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-ink-50">Notifications</div>
              <div className="text-[11px] text-ink-300">
                {unread > 0 ? `${unread} unread` : 'All caught up'}
              </div>
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-[11px] uppercase tracking-wider font-bold link-amber"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-ink-300">Loading…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-ink-400 mx-auto mb-2" />
                <div className="text-sm text-ink-100 font-semibold">No notifications yet</div>
                <div className="text-xs text-ink-300 mt-0.5">
                  Likes, comments, and follows will show up here.
                </div>
              </div>
            ) : (
              items.slice(0, 15).map((n) => (
                <NotifRow
                  key={n.id}
                  notif={n}
                  onMarkRead={() => !n.readAt && markRead.mutate(n.id)}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-ink-600 px-4 py-2 text-center">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="text-[11px] uppercase tracking-wider font-bold link-amber"
              >
                View all →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotifRow({
  notif,
  onMarkRead,
  onClose,
}: {
  notif: any;
  onMarkRead: () => void;
  onClose: () => void;
}) {
  const unread = !notif.readAt;
  const icon = TYPE_ICON[notif.type] ?? <Bell className="w-4 h-4 text-ink-200" />;
  const message = notif.message || notif.title || 'New activity';
  const href = notif.actionUrl || '#';

  const inner = (
    <div
      className={`flex gap-3 px-4 py-3 border-b border-ink-600/60 transition-colors ${
        unread ? 'bg-primary-500/[0.06]' : 'hover:bg-ink-600/50'
      }`}
    >
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm leading-snug ${unread ? 'text-ink-50' : 'text-ink-100'}`}>
          {message}
        </div>
        <div className="text-[11px] text-ink-300 mt-0.5 flex items-center gap-2">
          <span>{relativeTime(notif.createdAt)}</span>
          {unread && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-400" />}
        </div>
      </div>
      {unread && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead();
          }}
          className="shrink-0 self-start p-1 text-ink-300 hover:text-primary-400"
          aria-label="Mark read"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  if (href !== '#' && href.startsWith('/')) {
    return (
      <Link to={href} onClick={() => { onMarkRead(); onClose(); }}>
        {inner}
      </Link>
    );
  }
  return <div onClick={onMarkRead}>{inner}</div>;
}
