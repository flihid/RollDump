import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter as FilterIcon, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Loading, EmptyState, FormatBadge, ColorTypeBadge, StarRating } from '../../components/common';

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
          <h1 className="text-2xl font-bold">Katalog Film</h1>
          <p className="text-sm text-ink-600">Telusuri semua emulsi yang dikuratori komunitas.</p>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Cari nama film…"
            className="input w-44 sm:w-64"
            value={q}
            onChange={(e) => setParam('q', e.target.value || null)}
          />
          <select className="input w-auto" value={sort} onChange={(e) => setParam('sort', e.target.value)}>
            <option value="popular">Paling direview</option>
            <option value="rating">Rating tertinggi</option>
            <option value="recent">Terbaru</option>
            <option value="name">A-Z</option>
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
              <h3 className="font-semibold text-sm">Filter</h3>
              {Array.from(params.keys()).length > 0 && (
                <button onClick={reset} className="text-xs text-primary-600 hover:underline flex items-center">
                  <X className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-ink-700 mb-2">Format</div>
              <div className="flex flex-wrap gap-1.5">
                {FORMATS.map((f) => (
                  <button key={f} onClick={() => toggleFormat(f)} className={formats.includes(f) ? 'chip-active' : 'chip'}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink-700 mb-2">Tipe</div>
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
              <div className="text-xs font-semibold text-ink-700 mb-2">ISO</div>
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
              <div className="text-xs font-semibold text-ink-700 mb-2">Brand</div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {films.data!.items.map((f: any) => (
                <Link key={f.id} to={`/films/${f.slug}`} className="card overflow-hidden group hover:shadow-md transition">
                  <div className="aspect-[3/4] bg-ink-200 relative overflow-hidden">
                    {f.coverUrl && (
                      <img src={f.coverUrl} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    )}
                    <div className="absolute top-2 left-2">
                      <ColorTypeBadge value={f.colorType} />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-sm leading-tight truncate">{f.name}</div>
                    <div className="text-xs text-ink-500">{f.brand?.name} • ISO {f.iso}</div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <StarRating value={f.ratingAvg || 0} size="sm" />
                      <span className="text-xs text-ink-500">({f.reviewCount || 0})</span>
                    </div>
                    {f.availableFormats?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {f.availableFormats.slice(0, 3).map((x: string) => (
                          <FormatBadge key={x} format={x} />
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
