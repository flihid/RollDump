import { useMemo } from 'react';
import { clsx } from 'clsx';

type FilmCoverFilm = {
  name: string;
  iso?: number | null;
  colorType?: string | null;
  brand?: { name?: string } | null;
  coverUrl?: string | null;
  availableFormats?: string[];
};

type FilmCoverProps = {
  film: FilmCoverFilm;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showIso?: boolean;
};

/**
 * RollDump film cover — a flat 2D "product photo" style image for each film.
 * Renders the film's real coverUrl if available, otherwise generates a
 * branded canister-style image using the film's color type + name + brand.
 *
 * Replaces the old 3D roll in places that need an inline preview.
 */
export default function FilmCover({ film, size = 'md', className, showIso = true }: FilmCoverProps) {
  const dim = SIZE[size];
  const palette = useMemo(() => getPalette(film.colorType), [film.colorType]);

  if (film.coverUrl) {
    return (
      <div
        className={clsx('film-cover-img', className)}
        style={{ width: dim.w, height: dim.h }}
      >
        <img
          src={film.coverUrl}
          alt={film.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // Generated "canister" cover
  const brand = (film.brand?.name || 'FILM').toUpperCase();
  const isoLabel = film.iso ?? '';
  return (
    <div
      className={clsx('film-cover-art', className)}
      style={{
        width: dim.w,
        height: dim.h,
        background: palette.bg,
      }}
    >
      <div className="film-cover-art__band" style={{ background: palette.band }}>
        <span className="film-cover-art__brand" style={{ color: palette.bandText }}>{brand}</span>
      </div>
      <div className="film-cover-art__body" style={{ color: palette.text }}>
        <div className="film-cover-art__name">{film.name}</div>
        {showIso && isoLabel !== '' && (
          <div className="film-cover-art__iso" style={{ color: palette.iso }}>
            ISO {isoLabel}
          </div>
        )}
      </div>
      <div className="film-cover-art__sprockets" style={{ background: palette.sprocket }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>
    </div>
  );
}

const SIZE = {
  sm:   { w: 80,  h: 100 },
  md:   { w: 140, h: 175 },
  lg:   { w: 200, h: 250 },
  hero: { w: 280, h: 350 },
};

type Palette = { bg: string; band: string; bandText: string; text: string; iso: string; sprocket: string };

function getPalette(colorType?: string | null): Palette {
  switch (colorType) {
    case 'bw':
      return {
        bg: 'linear-gradient(160deg, #1a1a1a 0%, #2d2d2d 60%, #0f0f0f 100%)',
        band: '#e6a519',
        bandText: '#1a1a1a',
        text: '#f5f0e1',
        iso: '#e6a519',
        sprocket: 'rgba(245,240,225,0.12)',
      };
    case 'slide_e6':
      return {
        bg: 'linear-gradient(160deg, #4a1560 0%, #7a2898 50%, #2a0d40 100%)',
        band: '#00c9a7',
        bandText: '#1a0a25',
        text: '#f0e8ff',
        iso: '#ffd56b',
        sprocket: 'rgba(255,213,107,0.18)',
      };
    case 'color_positive':
      return {
        bg: 'linear-gradient(160deg, #7a4a10 0%, #b87318 50%, #3a2200 100%)',
        band: '#ff6b35',
        bandText: '#1a0a04',
        text: '#fff8eb',
        iso: '#ffd56b',
        sprocket: 'rgba(255,248,235,0.16)',
      };
    case 'color_negative':
    default:
      return {
        bg: 'linear-gradient(160deg, #8b1a1a 0%, #c42b2b 50%, #4a0d0d 100%)',
        band: '#f5c400',
        bandText: '#1a0a04',
        text: '#fff8eb',
        iso: '#ffd56b',
        sprocket: 'rgba(255,255,255,0.16)',
      };
  }
}
