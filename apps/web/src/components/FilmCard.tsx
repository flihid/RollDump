import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { clsx } from 'clsx';
import FilmRoll3D, { type FilmRollFilm } from './FilmRoll3D';
import { FormatBadge, StarRating, ColorTypeBadge } from './common';

export type FilmCardData = FilmRollFilm & {
  id?: string;
  slug: string;
  ratingAvg?: number;
  reviewCount?: number;
  availableFormats?: string[];
};

type FilmCardProps = {
  film: FilmCardData;
  size?: 'sm' | 'md';
  showColorBadge?: boolean;
  className?: string;
  delay?: number;
};

export default function FilmCard({
  film,
  size = 'md',
  showColorBadge = false,
  className,
  delay = 0,
}: FilmCardProps) {
  const rollSize = size === 'sm' ? 'sm' : 'md';
  const cardRef = useRef<HTMLAnchorElement>(null);

  return (
    <Link
      ref={cardRef}
      to={`/films/${film.slug}`}
      className={clsx('film-card group block', className)}
      style={{ animationDelay: `${delay}ms` }}
      onMouseMove={(e) => {
        const el = cardRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
    >
      <div className="film-card__visual relative spotlight-card">
        <div className="film-card__glow" aria-hidden />
        <FilmRoll3D film={film} size={rollSize} hoverSpin />
        {showColorBadge && film.colorType && (
          <div className="absolute top-1 left-1 z-10 scale-90 origin-top-left">
            <ColorTypeBadge value={film.colorType} />
          </div>
        )}
        {film.availableFormats?.[0] && (
          <div className="absolute top-1 right-1 z-10">
            <FormatBadge format={film.availableFormats[0]} />
          </div>
        )}
      </div>
      <div className="film-card__meta">
        {film.brand?.name && (
          <div className="text-[10px] uppercase tracking-[0.15em] text-primary-400/80 font-bold mb-0.5">
            {film.brand.name}
          </div>
        )}
        <div className="font-semibold text-sm text-ink-900 leading-tight line-clamp-2 group-hover:text-primary-400 transition-colors">
          {film.name}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 rating-shimmer">
          <StarRating value={film.ratingAvg || 0} size="sm" />
          <span className="text-[11px] text-ink-500 counter-num">({film.reviewCount || 0})</span>
        </div>
      </div>
    </Link>
  );
}
