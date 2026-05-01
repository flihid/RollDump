import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Compass } from 'lucide-react';
import { api } from '../lib/api';
import { Loading, FormatBadge, StarRating } from '../components/common';

export default function Discover() {
  const trending = useQuery({ queryKey: ['discover-trending'], queryFn: () => api.get('/films/trending') });
  const lists = useQuery({ queryKey: ['discover-lists'], queryFn: () => api.get('/lists?tab=trending') });
  const brands = useQuery({ queryKey: ['discover-brands'], queryFn: () => api.get('/brands') });

  const featured = trending.data?.items?.[0];

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-2">
        <Compass className="text-primary-600" />
        <h1 className="text-2xl font-bold">Discover</h1>
      </div>

      {/* Spotlight */}
      {featured && (
        <Link to={`/films/${featured.slug}`} className="block">
          <div className="rounded-2xl overflow-hidden bg-ink-900 text-white relative">
            <div className="aspect-[16/6] sm:aspect-[16/5] relative">
              {featured.coverUrl && <img src={featured.coverUrl} className="w-full h-full object-cover opacity-60" />}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="text-xs font-semibold text-primary-300 mb-1">RollDump Spotlight</div>
                <h2 className="text-3xl font-bold">{featured.name}</h2>
                <div className="text-sm text-white/70 mt-1">{featured.brand?.name} • ISO {featured.iso}</div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Trending */}
      <section>
        <h2 className="text-xl font-bold mb-3">Trending</h2>
        {trending.isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {(trending.data?.items || []).map((f: any) => (
              <Link key={f.id} to={`/films/${f.slug}`} className="card overflow-hidden group">
                <div className="aspect-[3/4] bg-ink-200">
                  {f.coverUrl && <img src={f.coverUrl} className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm truncate">{f.name}</div>
                  <StarRating value={f.ratingAvg || 0} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Lists */}
      <section>
        <h2 className="text-xl font-bold mb-3">Lists pilihan</h2>
        {lists.isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(lists.data?.items || []).slice(0, 6).map((row: any) => (
              <Link key={row.list.id} to={`/lists/${row.list.id}`} className="card p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold">{row.list.title}</div>
                    <div className="text-xs text-ink-500 mt-0.5">oleh @{row.author?.username}</div>
                  </div>
                  <FormatBadge format={`${row.list.itemCount || 0} item`} />
                </div>
                {row.list.description && <p className="text-sm text-ink-600 mt-2 line-clamp-2">{row.list.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Brands */}
      <section>
        <h2 className="text-xl font-bold mb-3">Pabrikan</h2>
        {brands.isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(brands.data?.items || []).map((b: any) => (
              <Link key={b.id} to={`/brands?slug=${b.slug}`} className="card p-3 text-center hover:shadow-md transition">
                <div className="font-semibold text-sm">{b.name}</div>
                <div className="text-xs text-ink-500">{b.filmCount} film</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
