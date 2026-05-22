import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Loading, EmptyState, FormatBadge } from '../../components/common';
import FilmCover from '../../components/FilmCover';

export default function Wishlist() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['wishlist'], queryFn: () => api.get('/films/wishlists/me') });
  const remove = useMutation({
    mutationFn: (variantId: string) => api.delete(`/films/wishlists/${variantId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      qc.invalidateQueries({ queryKey: ['wishlist-ids'] });
    },
  });

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <div className="crumbs">Personal · Wishlist</div>
          <h1>Wishlist</h1>
        </div>
      </div>

      {q.isLoading ? (
        <Loading />
      ) : q.data?.items?.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Save films from the catalog to revisit them later."
          cta={<Link to="/films" className="btn-primary">Browse catalog</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {q.data!.items.map((row: any) => (
            <div key={row.variant.id} className="card overflow-hidden">
              <Link
                to={`/films/${row.film.slug}`}
                className="block relative"
                style={{ aspectRatio: '4 / 5', background: '#1a1a1a' }}
              >
                {row.film.coverUrl ? (
                  <img
                    src={row.film.coverUrl}
                    alt={row.film.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FilmCover film={row.film} size="md" />
                  </div>
                )}
                <div className="absolute top-2 left-2 z-10">
                  <FormatBadge format={row.variant.format} />
                </div>
              </Link>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono-tech text-[10px] uppercase tracking-wider text-ink-500">
                      {row.film.brand?.name || 'FILM'}
                    </div>
                    <div className="font-heading font-bold text-sm text-ink-900 truncate">
                      {row.film.name}
                    </div>
                  </div>
                  <button
                    onClick={() => remove.mutate(row.variant.id)}
                    className="text-ink-500 hover:text-red-500 p-1"
                    title="Remove from wishlist"
                  >
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
