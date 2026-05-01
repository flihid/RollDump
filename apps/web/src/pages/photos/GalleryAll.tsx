import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Loading, EmptyState, FormatBadge } from '../../components/common';

const FORMATS = ['35mm', '120', 'large_format', 'instant'];

export default function GalleryAll() {
  const [params, setParams] = useSearchParams();
  const format = params.get('format');
  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (!v) p.delete(k);
    else p.set(k, v);
    setParams(p);
  };
  const q = useQuery({
    queryKey: ['gallery', Object.fromEntries(params.entries())],
    queryFn: () => api.get(`/photos?${params.toString()}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Galeri Komunitas</h1>
        <div className="flex gap-1.5 flex-wrap">
          {FORMATS.map((f) => (
            <button key={f} onClick={() => set('format', format === f ? null : f)} className={format === f ? 'chip-active' : 'chip'}>
              <FormatBadge format={f} />
            </button>
          ))}
        </div>
      </div>
      {q.isLoading ? (
        <Loading />
      ) : q.data?.items?.length === 0 ? (
        <EmptyState title="Galeri masih kosong" description="Belum ada foto untuk filter ini." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {q.data!.items.map((row: any) => (
            <Link key={row.photo.id} to={`/photos/${row.photo.id}`} className="aspect-square bg-ink-200 rounded-lg overflow-hidden group">
              <img src={row.photo.thumbUrl || row.photo.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
