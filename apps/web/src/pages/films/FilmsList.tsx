import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '../../lib/api';
import { Loading, EmptyState, FormatBadge } from '../../components/common';
import FilmCard from '../../components/FilmCard';

const FORMATS = [
  { key: '35mm',         label: '35MM' },
  { key: '120',          label: '120' },
  { key: 'large_format', label: 'LARGE' },
  { key: 'instant',      label: 'INSTANT' },
];

export default function FilmsList() {
  const [params, setParams] = useSearchParams();

  const q = params.get('q') || '';
  const sort = params.get('sort') || 'popular';
  const colorType = params.get('color_type') || '';
  const formats = useMemo(() => params.get('formats')?.split(',').filter(Boolean) || [], [params]);
  const brand = params.get('brand') || '';

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (!v) p.delete(k);
    else p.set(k, v);
    setParams(p);
  };

  const toggleFormat = (f: string) => {
    const next = formats.includes(f) ? formats.filter((x) => x !== f) : [...formats, f];
    setParam('formats', next.length ? next.join(',') : null);
  };

  const films = useQuery({
    queryKey: ['films', Object.fromEntries(params.entries())],
    queryFn: () => api.get(`/films?${params.toString()}`),
  });

  const brands = useQuery({ queryKey: ['brands'], queryFn: () => api.get('/brands') });

  const totalCount = films.data?.items?.length ?? 0;

  return (
    <div className="page-enter">
      {/* TOPBAR */}
      <div className="topbar">
        <div>
          <div className="crumbs">Discover · Catalog</div>
          <h1>Film Catalog</h1>
        </div>
        <div className="topbar-right">
          <div className="hidden md:flex items-center gap-2 px-4 py-2.5 text-sm rounded-full"
               style={{ background: '#fbf8ef', border: '1px solid #dcd5bf', color: '#7a7a7a', minWidth: 260 }}>
            <Search className="w-4 h-4" />
            <input
              value={q}
              onChange={(e) => setParam('q', e.target.value || null)}
              placeholder="Search Portra, Velvia, etc…"
              className="bg-transparent outline-none flex-1 text-sm placeholder-ink-500"
            />
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: '#e8e1cb', color: '#2d2d2d', border: '1px solid #dcd5bf' }}>⌘K</span>
          </div>
        </div>
      </div>

      {/* FILTER CHIPS */}
      <div className="filter-row">
        <span className="filter-label">Format</span>
        <button
          onClick={() => setParam('formats', null)}
          className={formats.length === 0 ? 'badge badge-mustard cursor-pointer' : 'badge cursor-pointer hover:bg-ink-200'}
          style={formats.length === 0 ? { background: '#e6a519', color: '#1a1a1a', border: '1px solid #c68a0e' } : undefined}
        >
          ALL · {totalCount}
        </button>
        {FORMATS.map((f) => {
          const active = formats.includes(f.key);
          const badgeClass =
            f.key === '35mm' ? 'badge-35mm' :
            f.key === '120' ? 'badge-120' :
            f.key === 'large_format' ? 'badge-large' :
            'badge-instant';
          return (
            <button
              key={f.key}
              onClick={() => toggleFormat(f.key)}
              className={`${badgeClass} cursor-pointer transition-all`}
              style={active ? { transform: 'scale(1.05)', boxShadow: '0 2px 8px rgba(45,45,45,0.15)' } : undefined}
            >
              {f.label}
            </button>
          );
        })}

        <span className="filter-sep" />

        <span className="filter-label">Sort</span>
        <select
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
          className="badge cursor-pointer outline-none"
          style={{ paddingRight: 24 }}
        >
          <option value="popular">MOST REVIEWED</option>
          <option value="rating">HIGHEST RATED</option>
          <option value="recent">NEWEST</option>
          <option value="name">A–Z</option>
        </select>

        {brands.data?.items?.length > 0 && (
          <>
            <span className="filter-sep" />
            <span className="filter-label">Brand</span>
            {(brands.data.items as any[]).slice(0, 8).map((b: any) => (
              <button
                key={b.id}
                onClick={() => setParam('brand', brand === b.slug ? null : b.slug)}
                className="badge cursor-pointer"
                style={brand === b.slug
                  ? { background: '#1a1a1a', color: '#e6a519', border: '1px solid #1a1a1a' }
                  : undefined}
              >
                {b.name}
              </button>
            ))}
          </>
        )}

        {(formats.length > 0 || colorType || brand || q) && (
          <>
            <span className="filter-sep" />
            <button
              onClick={() => setParams(new URLSearchParams())}
              className="badge cursor-pointer"
              style={{ background: '#c8443a', color: 'white', border: '1px solid #a8362d' }}
            >
              ✕ RESET
            </button>
          </>
        )}
      </div>

      {/* RESULTS */}
      {films.isLoading ? (
        <Loading />
      ) : (films.data?.items || []).length === 0 ? (
        <EmptyState title="No films found" description="Try loosening your filters." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {films.data!.items.map((f: any, i: number) => (
            <FilmCard key={f.id} film={f} delay={i * 40} />
          ))}
        </div>
      )}
    </div>
  );
}

// Silence
void FormatBadge;
