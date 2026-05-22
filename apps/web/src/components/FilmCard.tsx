import { Link } from 'react-router-dom';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Heart } from 'lucide-react';
import type { FilmRollFilm } from './FilmRoll3D';
import { FormatBadge } from './common';

export type FilmCardData = FilmRollFilm & {
  id?: string;
  slug: string;
  ratingAvg?: number;
  reviewCount?: number;
  availableFormats?: string[];
  coverUrl?: string | null;
};

type FilmCardProps = {
  film: FilmCardData;
  size?: 'sm' | 'md';
  className?: string;
  delay?: number;
  onSaveToggle?: (filmId: string) => void;
};

/**
 * RollDump film card — exact match to design-system spec.
 *   .film-cover (dark gradient)
 *     ├ format-badges (top-left, multiple)
 *     ├ save-btn (top-right, mustard hover)
 *     └ .iso (bottom-left, Archivo Black 28px mustard)
 *   .film-meta
 *     ├ .film-brand (mono caps)
 *     ├ .film-name (Syne 16 ink)
 *     └ .film-stats (stars + mono rating · review count)
 */
export default function FilmCard({ film, className, delay = 0, onSaveToggle }: FilmCardProps) {
  const [saved, setSaved] = useState(false);

  // Build a cover-art gradient based on color type for variation
  const coverGradient = getCoverGradient(film.colorType, film.iso);

  return (
    <Link
      to={`/films/${film.slug}`}
      className={clsx('film-card group block', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="film-cover">
        {/* Cover art layer */}
        <div className="cover-art" style={{ background: coverGradient }}>
          {film.coverUrl && (
            <img
              src={film.coverUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          )}
        </div>

        {/* Format badges stacked top-left */}
        <div className="format-badges">
          {(film.availableFormats ?? ['35mm']).slice(0, 3).map((fmt) => (
            <FormatBadge key={fmt} format={fmt} />
          ))}
        </div>

        {/* Save heart top-right */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setSaved((s) => !s);
            if (film.id) onSaveToggle?.(film.id);
          }}
          className="save-btn"
          aria-label={saved ? 'Saved' : 'Save'}
        >
          <Heart
            className="w-4 h-4"
            fill={saved ? '#e6a519' : 'none'}
            stroke={saved ? '#e6a519' : '#1a1a1a'}
            strokeWidth={2}
          />
        </button>

        {/* ISO bottom-left, big Archivo Black mustard */}
        {film.iso != null && (
          <div className="iso">{film.iso}</div>
        )}
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
  return [1, 2, 3, 4, 5].map((s) => (value >= s ? '★' : value >= s - 0.5 ? '★' : '☆')).join('');
}

function formatCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

function getCoverGradient(colorType?: string | null, iso?: number | null): string {
  // Hash iso/colorType into one of several themed gradients for variety
  const seed = (iso ?? 100) % 8;
  const gradients: Record<string, string[]> = {
    color_negative: [
      'linear-gradient(135deg,#7a4a2a 0%,#3a2a1a 60%,#1a1a1a)',
      'linear-gradient(135deg,#8a5a3a,#3a2a1a 70%)',
      'linear-gradient(135deg,#5a4a2a,#2a2010 65%)',
      'linear-gradient(135deg,#7a3a2a,#2a1a0a 70%)',
      'linear-gradient(135deg,#5a5a8a 0%,#1a1a3a 60%)',
      'linear-gradient(135deg,#9a6a4a,#3a2a1a 70%)',
      'linear-gradient(135deg,#6a4a3a,#2a1a0a)',
      'linear-gradient(135deg,#8a6a3a,#3a2a1a)',
    ],
    bw: [
      'linear-gradient(135deg,#1a1a1a 0%,#3a3a3a 70%)',
      'linear-gradient(135deg,#2a2a2a,#5a5a5a 70%)',
      'linear-gradient(135deg,#3a3a3a 0%,#1a1a1a 70%)',
      'linear-gradient(135deg,#4a4a4a,#1a1a1a 65%)',
      'linear-gradient(135deg,#2a2a2a,#0a0a0a)',
      'linear-gradient(135deg,#3a3a3a,#1a1a1a)',
      'linear-gradient(135deg,#5a5a5a,#2a2a2a 70%)',
      'linear-gradient(135deg,#1a1a1a,#3a3a3a)',
    ],
    slide_e6: [
      'linear-gradient(135deg,#2a5a4a 0%,#1a2a1a 70%)',
      'linear-gradient(135deg,#5a2a6a,#1a0a2a 65%)',
      'linear-gradient(135deg,#3a4a6a,#1a1a2a)',
      'linear-gradient(135deg,#4a5a3a,#1a2a0a 70%)',
      'linear-gradient(135deg,#2a5a8a,#0a1a3a)',
      'linear-gradient(135deg,#5a3a7a,#1a0a2a)',
      'linear-gradient(135deg,#3a6a5a,#1a2a1a)',
      'linear-gradient(135deg,#4a3a6a,#1a1a2a)',
    ],
    color_positive: [
      'linear-gradient(135deg,#7a4a2a 0%,#3a2a1a)',
      'linear-gradient(135deg,#8a5a2a 0%,#3a2a0a)',
      'linear-gradient(135deg,#7a2a4a 0%,#3a1a2a 70%)',
      'linear-gradient(135deg,#6a3a4a,#2a1a2a)',
      'linear-gradient(135deg,#9a5a4a,#3a2a1a)',
      'linear-gradient(135deg,#7a3a2a,#3a1a0a)',
      'linear-gradient(135deg,#8a4a3a,#3a2a1a)',
      'linear-gradient(135deg,#7a5a3a,#3a2a1a)',
    ],
  };
  const key = (colorType && gradients[colorType]) ? colorType : 'color_negative';
  return gradients[key][seed];
}
