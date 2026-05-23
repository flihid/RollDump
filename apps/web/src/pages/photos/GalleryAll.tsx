import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Loading, EmptyState, FormatBadge } from '../../components/common';
import PhotoLightbox from '../../components/PhotoLightbox';

const FORMATS = ['35mm', '120', 'large_format', 'instant'];

export default function GalleryAll() {
  const [params, setParams] = useSearchParams();
  const format = params.get('format');
  const [lightboxId, setLightboxId] = useState<string | null>(null);
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
    <div className="page-enter">
      <div className="topbar">
        <div>
          <div className="crumbs">Community · Gallery</div>
          <h1>Community Gallery</h1>
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">Format</span>
        <button onClick={() => set('format', null)} className={!format ? 'chip-active' : 'chip'}>
          All
        </button>
        {FORMATS.map((f) => (
          <button
            key={f}
            onClick={() => set('format', format === f ? null : f)}
            className={format === f ? 'chip-active' : 'chip'}
          >
            <FormatBadge format={f} />
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <Loading />
      ) : q.data?.items?.length === 0 ? (
        <EmptyState title="Gallery is empty" description="No photos for this filter yet." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {q.data!.items.map((row: any) => (
            <button
              key={row.photo.id}
              onClick={() => setLightboxId(row.photo.id)}
              className="aspect-square rounded-lg overflow-hidden group relative cursor-pointer"
              style={{ background: '#1a1a1a' }}
            >
              <img
                src={row.photo.thumbUrl || row.photo.imageUrl}
                className="w-full h-full object-cover group-hover:scale-105 transition"
                alt=""
              />
              {row.viewerHasLiked && (
                <span
                  className="absolute top-2 right-2 text-lg"
                  style={{ color: '#e6a519', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}
                >
                  ♥
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {lightboxId && <PhotoLightbox photoId={lightboxId} onClose={() => setLightboxId(null)} />}
    </div>
  );
}
