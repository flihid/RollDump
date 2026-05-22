import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { Heart } from 'lucide-react';
import { api } from '../lib/api';
import { isLoggedIn } from '../store/auth';
import { FormatBadge } from './common';

export type FilmCardData = {
  id?: string;
  slug: string;
  name: string;
  iso?: number | null;
  colorType?: string | null;
  brand?: { name?: string } | null;
  coverUrl?: string | null;
  ratingAvg?: number;
  reviewCount?: number;
  availableFormats?: string[];
  variants?: Array<{ id: string; format: string }>;
};

type FilmCardProps = {
  film: FilmCardData;
  size?: 'sm' | 'md';
  className?: string;
  delay?: number;
};

/**
 * Lightweight global wishlist hook. Fetches the user's wishlisted variant IDs
 * once and lets cards check + toggle them locally + server-side.
 */
function useWishlistIds() {
  return useQuery({
    queryKey: ['wishlist-ids'],
    queryFn: () => api.get('/films/wishlists/ids'),
    enabled: isLoggedIn(),
    staleTime: 30_000,
  });
}

export default function FilmCard({ film, className, delay = 0 }: FilmCardProps) {
  const qc = useQueryClient();
  const wishlist = useWishlistIds();

  // Pick a representative variant — first available, used for wishlist toggle.
  // Falls back to undefined if we don't have any variant info on the card.
  const primaryVariantId =
    film.variants?.[0]?.id ??
    (film as any).primaryVariantId ??
    null;

  const wishlistIds: string[] = wishlist.data?.ids || [];
  const saved = !!primaryVariantId && wishlistIds.includes(primaryVariantId);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  useEffect(() => setOptimistic(null), [saved]);
  const visualSaved = optimistic ?? saved;

  const add = useMutation({
    mutationFn: (variantId: string) =>
      api.post('/films/wishlists', { film_variant_id: variantId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist-ids'] }),
  });
  const remove = useMutation({
    mutationFn: (variantId: string) => api.delete(`/films/wishlists/${variantId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist-ids'] }),
  });

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn() || !primaryVariantId) return;
    const next = !visualSaved;
    setOptimistic(next);
    if (next) add.mutate(primaryVariantId);
    else remove.mutate(primaryVariantId);
  };

  const coverGradient = getCoverGradient(film.colorType, film.iso);

  return (
    <Link
      to={`/films/${film.slug}`}
      className={clsx('film-card group block', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="film-cover">
        {/* Real product photo if we have one; otherwise styled gradient */}
        {film.coverUrl ? (
          <img
            src={film.coverUrl}
            alt={film.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="cover-art" style={{ background: coverGradient }}>
            {/* Branded text overlay so each fallback looks unique */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-3 pb-12">
              <div
                className="font-mono-tech text-[10px] tracking-[0.16em] uppercase mb-2"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                {film.brand?.name || 'FILM'}
              </div>
              <div
                className="font-display leading-none"
                style={{
                  fontSize: 18,
                  color: '#f5f0e1',
                  textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                {film.name}
              </div>
            </div>
          </div>
        )}

        {/* Format badges stacked top-left */}
        <div className="format-badges">
          {(film.availableFormats ?? ['35mm']).slice(0, 3).map((fmt) => (
            <FormatBadge key={fmt} format={fmt} />
          ))}
        </div>

        {/* Save heart top-right — only visible when logged in + variant available */}
        {isLoggedIn() && primaryVariantId && (
          <button
            type="button"
            onClick={toggleWishlist}
            className="save-btn"
            aria-label={visualSaved ? 'Remove from wishlist' : 'Add to wishlist'}
            style={visualSaved ? { background: '#e6a519' } : undefined}
          >
            <Heart
              className="w-4 h-4"
              fill={visualSaved ? '#1a1a1a' : 'none'}
              stroke={visualSaved ? '#1a1a1a' : '#1a1a1a'}
              strokeWidth={2}
            />
          </button>
        )}

        {/* ISO bottom-left */}
        {film.iso != null && <div className="iso">{film.iso}</div>}
      </div>

      <div className="film-meta">
        {film.brand?.name && <div className="film-brand">{film.brand.name}</div>}
        <div className="film-name">{film.name}</div>
        <div className="film-stats">
          <span className="stars">{renderStars(film.ratingAvg ?? 0)}</span>
          <span className="font-mono-tech text-[11px] text-ink-500">
            {(film.ratingAvg ?? 0).toFixed(1)} · {formatCount(film.reviewCount ?? 0)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function renderStars(value: number) {
  return [1, 2, 3, 4, 5].map((s) => (value >= s ? '★' : '☆')).join('');
}

function formatCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

function getCoverGradient(colorType?: string | null, iso?: number | null): string {
  const seed = (iso ?? 100) % 8;
  const map: Record<string, string[]> = {
    color_negative: [
      'linear-gradient(135deg,#8b1a1a 0%,#4a0d0d 60%,#1a0a0a)',
      'linear-gradient(135deg,#9c2424 0%,#5a1010 70%)',
      'linear-gradient(135deg,#a23030 0%,#3a0808 65%)',
      'linear-gradient(135deg,#7a2020 0%,#2a0808 70%)',
      'linear-gradient(135deg,#922222 0%,#421212 60%)',
      'linear-gradient(135deg,#a82828 0%,#481010 70%)',
      'linear-gradient(135deg,#8a1a1a 0%,#3a0a0a 65%)',
      'linear-gradient(135deg,#9a2828 0%,#3a0e0e 65%)',
    ],
    bw: [
      'linear-gradient(135deg,#2a2a2a 0%,#0a0a0a 70%)',
      'linear-gradient(135deg,#3a3a3a 0%,#1a1a1a 70%)',
      'linear-gradient(135deg,#252525 0%,#0a0a0a 65%)',
      'linear-gradient(135deg,#404040 0%,#1a1a1a 65%)',
      'linear-gradient(135deg,#1a1a1a 0%,#3a3a3a 70%)',
      'linear-gradient(135deg,#2d2d2d 0%,#101010 70%)',
      'linear-gradient(135deg,#383838 0%,#0d0d0d 65%)',
      'linear-gradient(135deg,#2a2a2a 0%,#1a1a1a 65%)',
    ],
    slide_e6: [
      'linear-gradient(135deg,#4a1560 0%,#26052e 65%)',
      'linear-gradient(135deg,#3a1450 0%,#1a0428 70%)',
      'linear-gradient(135deg,#5a2070 0%,#2a0838 65%)',
      'linear-gradient(135deg,#491556 0%,#1f0a2a 70%)',
      'linear-gradient(135deg,#5a1a6a 0%,#2a0a35 65%)',
      'linear-gradient(135deg,#421050 0%,#1c0626 70%)',
      'linear-gradient(135deg,#5a2575 0%,#2a0a3a 65%)',
      'linear-gradient(135deg,#502070 0%,#250a30 70%)',
    ],
    color_positive: [
      'linear-gradient(135deg,#7a4a10 0%,#3a2200 65%)',
      'linear-gradient(135deg,#8a5a18 0%,#3a2a08 70%)',
      'linear-gradient(135deg,#7a3a08 0%,#2a1404 65%)',
      'linear-gradient(135deg,#925a0e 0%,#3a2400 70%)',
      'linear-gradient(135deg,#8a4a10 0%,#3a1c00 65%)',
      'linear-gradient(135deg,#7a3a0a 0%,#3a1800 70%)',
      'linear-gradient(135deg,#9a5a14 0%,#42240a 65%)',
      'linear-gradient(135deg,#7c4214 0%,#341800 70%)',
    ],
  };
  const key = colorType && map[colorType] ? colorType : 'color_negative';
  return map[key][seed];
}
