import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ListChecks, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { isLoggedIn } from '../../store/auth';
import { Loading, EmptyState } from '../../components/common';

export default function ListsExplore() {
  const q = useQuery({ queryKey: ['lists'], queryFn: () => api.get('/lists') });
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ListChecks /> Lists</h1>
          <p className="text-sm text-ink-600">Koleksi tematik dari komunitas.</p>
        </div>
        {isLoggedIn() && (
          <Link to="/lists/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Buat list
          </Link>
        )}
      </div>
      {q.isLoading ? (
        <Loading />
      ) : q.data?.items?.length === 0 ? (
        <EmptyState title="Belum ada list publik" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {q.data!.items.map((row: any) => (
            <Link key={row.list.id} to={`/lists/${row.list.id}`} className="card p-4 hover:shadow-md transition">
              <h3 className="font-bold">{row.list.title}</h3>
              <div className="text-xs text-ink-500 mt-0.5">oleh @{row.author.username}</div>
              {row.list.description && <p className="text-sm text-ink-700 mt-2 line-clamp-2">{row.list.description}</p>}
              <div className="text-xs text-ink-500 mt-3">{row.list.itemCount} film • ❤ {row.list.likeCount}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
