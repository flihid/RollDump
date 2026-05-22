import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter as FilterIcon, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Loading, EmptyState } from '../../components/common';
import FilmCard from '../../components/FilmCard';

const FORMATS = ['35mm', '120', 'large_format', 'instant', '110', 'half_frame'];
const COLOR_TYPES = [
  { key: 'color_negative', label: 'Color Negative' },
  { key: 'bw', label: 'B&W' },
  { key: 'slide_e6', label: 'Slide E6' },
];

export default function FilmsList() {
  const [params, setParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);

  const q = params.get('q') || '';
  const sort = params.get('sort') || 'popular';
  const colorType = params.get('color_type') || '';
  const formats = useMemo(() => params.get('formats')?.split(',').filter(Boolean) || [], [params]);
  const isoMin = params.get('iso_min') || '';
  const isoMax = params.get('iso_max') || '';

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

  const reset = () => setParams(new URLSearchParams());

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Film Catalog</h1>
          <p className="text-sm text-ink-600">Browse every emulsion curated by the community.</p>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Search film name…"
            className="input w-44 sm:w-64"
            value={q}
            onChange={(e) => setParam('q', e.target.value || null)}
          />
          <select className="input w-auto" value={sort} onChange={(e) => setParam('sort', e.target.value)}>
            <option value="popular">Most reviewed</option>
            <option value="rating">Highest rated</option>
            <option value="recent">Newest</option>
            <option value="name">A–Z</option>
          </select>
          <button onClick={() => setShowFilter((s) => !s)} className="btn-secondary lg:hidden">
            <FilterIcon className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className={`${showFilter ? '' : 'hidden lg:block'}`}>
          <div className="card p-4 space-y-4 sticky top-20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-ink-900">Filter</h3>
              {Array.from(params.keys()).length > 0 && (
                <button onClick={reset} className="text-xs text-primary-400 hover:underline flex items-center">
                  <X className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-ink-600 mb-2">Format</div>
              <div className="flex flex-wrap gap-1.5">
                {FORMATS.map((f) => (
                  <button key={f} onClick={() => toggleFormat(f)} className={formats.includes(f) ? 'chip-active' : 'chip'}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink-600 mb-2">Type</div>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_TYPES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setParam('color_type', colorType === c.key ? null : c.key)}
                    className={colorType === c.key ? 'chip-active' : 'chip'}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink-600 mb-2">ISO</div>
              <div className="flex gap-2">
                <input
                  placeholder="Min"
                  className="input"
                  type="number"
                  value={isoMin}
                  onChange={(e) => setParam('iso_min', e.target.value || null)}
                />
                <input
                  placeholder="Max"
                  className="input"
                  type="number"
                  value={isoMax}
                  onChange={(e) => setParam('iso_max', e.target.value || null)}
                />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink-600 mb-2">Brand</div>
              <div className="flex flex-wrap gap-1.5">
                {(brands.data?.items || []).slice(0, 10).map((b: any) => (
                  <button
                    key={b.id}
                    onClick={() => setParam('brand', params.get('brand') === b.slug ? null : b.slug)}
                    className={params.get('brand') === b.slug ? 'chip-active' : 'chip'}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div>
          {films.isLoading ? (
            <Loading />
          ) : (films.data?.items || []).length === 0 ? (
            <EmptyState title="Tidak ada film ditemukan" description="Coba longgarkan filter Anda." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
              {films.data!.items.map((f: any, i: number) => (
                <FilmCard key={f.id} film={f} showColorBadge delay={i * 40} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
