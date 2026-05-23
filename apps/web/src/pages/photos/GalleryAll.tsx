import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Loading, EmptyState } from '../../components/common';
import PhotoLightbox from '../../components/PhotoLightbox';

const FORMAT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  all:           { bg: '#1a1a1a',                 border: '#1a1a1a',                  text: '#e6a519' },
  '35mm':        { bg: 'rgba(230,165,25,0.18)',    border: 'rgba(230,165,25,0.4)',     text: '#c68a0e' },
  '120':         { bg: 'rgba(184,92,56,0.15)',     border: 'rgba(184,92,56,0.4)',      text: '#b85c38' },
  large_format:  { bg: 'rgba(74,93,58,0.15)',      border: 'rgba(74,93,58,0.4)',       text: '#4a5d3a' },
  instant:       { bg: 'rgba(201,94,138,0.15)',    border: 'rgba(201,94,138,0.4)',     text: '#c95e8a' },
};
function formatChipStyle(key: string, active: boolean): React.CSSProperties {
  const c = FORMAT_COLORS[key] || FORMAT_COLORS['35mm'];
  if (active) {
    const filled = {
      all: { bg: '#e6a519', text: '#1a1a1a' },
      '35mm': { bg: '#e6a519', text: '#1a1a1a' },
      '120': { bg: '#b85c38', text: '#fff8eb' },
      large_format: { bg: '#4a5d3a', text: '#fff8eb' },
      instant: { bg: '#c95e8a', text: '#fff8eb' },
    } as Record<string, { bg: string; text: string }>;
    const f = filled[key] || filled['35mm'];
    return { background: f.bg, color: f.text, border: `1px solid ${f.bg}`, boxShadow: `0 4px 12px ${c.border}`, transform: 'translateY(-1px)' };
  }
  return { background: c.bg, color: c.text, border: `1px solid ${c.border}` };
}

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
        <button
          onClick={() => set('format', null)}
          className="format-chip"
          style={formatChipStyle('all', !format)}
        >
          ALL
        </button>
        {FORMATS.map((f) => (
          <button
            key={f}
            onClick={() => set('format', format === f ? null : f)}
            className="format-chip"
            style={formatChipStyle(f, format === f)}
          >
            {f === '35mm' ? '35MM' : f === '120' ? '120' : f === 'large_format' ? 'LARGE' : 'INSTANT'}
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
