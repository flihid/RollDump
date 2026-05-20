import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Bookmark, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { isLoggedIn } from '../../store/auth';
import { Loading, FormatBadge } from '../../components/common';
import FilmRoll3D from '../../components/FilmRoll3D';

export default function ListDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['list', id], queryFn: () => api.get(`/lists/${id}`), enabled: !!id });

  const like = useMutation({
    mutationFn: () => api.post(`/lists/${id}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list', id] }),
  });
  const save = useMutation({
    mutationFn: () => api.post(`/lists/${id}/save`),
    onSuccess: (data: any) => toast.success(data.saved ? 'Saved' : 'Removed from saved'),
  });

  const share = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied');
  };

  if (q.isLoading) return <Loading />;
  if (!q.data) return <div>List not found</div>;
  const list = q.data.list;
  const items = q.data.items || [];

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-3xl font-bold text-ink-50">{list.title}</h1>
        {q.data.author && <div className="text-sm text-ink-300 mt-1">by @{q.data.author.username}</div>}
        {list.description && <p className="text-sm text-ink-100 mt-3 max-w-2xl">{list.description}</p>}
        <div className="flex items-center gap-3 mt-4">
          <span className="badge">{list.itemCount} films</span>
          {isLoggedIn() && (
            <>
              <button onClick={() => like.mutate()} className="btn-secondary">
                <Heart className="w-4 h-4" /> {list.likeCount}
              </button>
              <button onClick={() => save.mutate()} className="btn-secondary">
                <Bookmark className="w-4 h-4" /> Save
              </button>
            </>
          )}
          <button onClick={share} className="btn-ghost">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-200">This list is empty.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((row: any) => (
            <Link key={row.item.id} to={`/films/${row.film.slug}`} className="card card-hover overflow-hidden group">
              <div className="film-card__visual relative spotlight-card">
                <div className="film-card__glow" aria-hidden />
                <FilmRoll3D film={row.film} size="md" hoverSpin />
                <div className="absolute top-2 right-2 z-10">
                  <FormatBadge format={row.variant.format} />
                </div>
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm text-ink-50 truncate group-hover:text-primary-400 transition-colors">
                  {row.film.name}
                </div>
                {row.item.personalNote && (
                  <div className="text-xs italic text-ink-300 mt-1.5 line-clamp-2">"{row.item.personalNote}"</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
