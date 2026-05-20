import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Compass } from 'lucide-react';
import { api } from '../lib/api';
import { Loading } from '../components/common';
import FilmCard from '../components/FilmCard';
import FilmRoll3D from '../components/FilmRoll3D';
import RevealSection from '../components/RevealSection';

export default function Discover() {
  const trending = useQuery({ queryKey: ['discover-trending'], queryFn: () => api.get('/films/trending') });
  const lists = useQuery({ queryKey: ['discover-lists'], queryFn: () => api.get('/lists?tab=trending') });
  const brands = useQuery({ queryKey: ['discover-brands'], queryFn: () => api.get('/brands') });

  const featured = trending.data?.items?.[0];

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-2">
        <Compass className="text-primary-400" />
        <h1 className="text-2xl font-bold text-ink-50">Discover</h1>
      </div>

      {featured && (
        <Link to={`/films/${featured.slug}`} className="block group">
          <div className="hero-split overflow-hidden">
            <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-6 items-center px-6 sm:px-10 py-8">
              <div>
                <div className="text-xs font-semibold text-primary-400 mb-2 uppercase tracking-[0.2em]">
                  RollDump Spotlight
                </div>
                <h2 className="text-3xl font-bold text-ink-50 group-hover:text-primary-400 transition-colors">
                  {featured.name}
                </h2>
                <p className="text-sm text-ink-200 mt-1">
                  {featured.brand?.name} • ISO {featured.iso}
                </p>
              </div>
              <FilmRoll3D film={featured} size="lg" autoSpin interactive />
            </div>
          </div>
        </Link>
      )}

      <RevealSection>
        <h2 className="section-title">
          <span>Trending</span>
        </h2>
        {trending.isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
            {(trending.data?.items || []).map((f: any, i: number) => (
              <FilmCard key={f.id} film={f} delay={i * 50} />
            ))}
          </div>
        )}
      </RevealSection>

      <RevealSection>
        <h2 className="section-title">
          <span>Featured lists</span>
        </h2>
        {lists.isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(lists.data?.items || []).slice(0, 6).map((row: any) => (
              <Link
                key={row.list.id}
                to={`/lists/${row.list.id}`}
                className="card p-4 hover:border-primary-500/50 hover:scale-[1.01] transition-all duration-200"
              >
                <div className="font-bold text-ink-50">{row.list.title}</div>
                <div className="text-xs text-ink-300 mt-0.5">by @{row.author?.username}</div>
                {row.list.description && (
                  <p className="text-sm text-ink-200 mt-2 line-clamp-2">{row.list.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </RevealSection>

      <RevealSection>
        <h2 className="section-title">
          <span>Brands</span>
        </h2>
        {brands.isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(brands.data?.items || []).map((b: any) => (
              <Link
                key={b.id}
                to={`/brands?slug=${b.slug}`}
                className="card p-4 text-center hover:border-primary-500/50 hover:bg-ink-600/50 transition-all"
              >
                <div className="font-semibold text-sm text-ink-50">{b.name}</div>
                <div className="text-xs text-ink-300">{b.filmCount} films</div>
              </Link>
            ))}
          </div>
        )}
      </RevealSection>
    </div>
  );
}
