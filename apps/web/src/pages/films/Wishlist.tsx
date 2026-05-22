import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Loading, EmptyState, FormatBadge } from '../../components/common';
import FilmRoll3D from '../../components/FilmRoll3D';

export default function Wishlist() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['wishlist'], queryFn: () => api.get('/films/wishlists/me') });
  const remove = useMutation({
    mutationFn: (variantId: string) => api.delete(`/films/wishlists/${variantId}`),
    onSuccess: () => {
      toast.success('Removed from wishlist');
      qc.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink-900">Wishlist</h1>
      {q.isLoading ? (
        <Loading />
      ) : q.data?.items?.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Save films to revisit them later."
          cta={<Link to="/films" className="btn-primary">Browse catalog</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {q.data!.items.map((row: any) => (
            <div key={row.variant.id} className="card overflow-hidden">
              <Link to={`/films/${row.film.slug}`} className="block film-card__visual relative min-h-[130px]">
                <FilmRoll3D film={row.film} size="sm" interactive />
              </Link>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{row.film.name}</div>
                    <FormatBadge format={row.variant.format} />
                  </div>
                  <button onClick={() => remove.mutate(row.variant.id)} className="text-ink-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
