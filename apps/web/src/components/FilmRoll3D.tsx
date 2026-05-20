import { useRef, useCallback, useState, type CSSProperties } from 'react';
import { clsx } from 'clsx';

export type FilmRollFilm = {
  name: string;
  iso?: number | null;
  colorType?: string | null;
  brand?: { name?: string } | null;
};

type RollPalette = {
  body: string;
  bodyMid: string;
  bodyDark: string;
  cap: string;
  stripe: string;
  label: string;
  labelText: string;
  glow: string;
};

const PALETTES: Record<string, RollPalette> = {
  color_negative: {
    body: '#8b1a1a',
    bodyMid: '#c42b2b',
    bodyDark: '#4a0d0d',
    cap: '#0f0f0f',
    stripe: '#f5c400',
    label: '#f8f4e8',
    labelText: '#1a1208',
    glow: 'rgba(240, 138, 0, 0.45)',
  },
  bw: {
    body: '#3d3d42',
    bodyMid: '#6b6b72',
    bodyDark: '#1a1a1c',
    cap: '#0a0a0a',
    stripe: '#c8c8c8',
    label: '#e8e8e8',
    labelText: '#111',
    glow: 'rgba(200, 200, 210, 0.35)',
  },
  slide_e6: {
    body: '#4a1560',
    bodyMid: '#7a2898',
    bodyDark: '#260830',
    cap: '#0f0816',
    stripe: '#00c9a7',
    label: '#f0e8ff',
    labelText: '#2a1040',
    glow: 'rgba(160, 80, 220, 0.45)',
  },
  color_positive: {
    body: '#7a4a10',
    bodyMid: '#b87318',
    bodyDark: '#3a2200',
    cap: '#0f0a04',
    stripe: '#ff6b35',
    label: '#fff8eb',
    labelText: '#3a2200',
    glow: 'rgba(255, 160, 40, 0.4)',
  },
};

const DEFAULT_PALETTE = PALETTES.color_negative;

function getPalette(colorType?: string | null): RollPalette {
  if (colorType && PALETTES[colorType]) return PALETTES[colorType];
  return DEFAULT_PALETTE;
}

function shortName(name: string, max = 14) {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

type FilmRoll3DProps = {
  film: FilmRollFilm;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  /** Tilt the roll based on cursor position (default: true) */
  interactive?: boolean;
  /** Idle gentle wobble when not interacted (default: false) */
  autoSpin?: boolean;
  /** Spin continuously around Y-axis when hovered (default: true) */
  hoverSpin?: boolean;
  className?: string;
};

const SIZE_MAP = {
  sm: { w: 80, h: 110 },
  md: { w: 130, h: 175 },
  lg: { w: 180, h: 240 },
  hero: { w: 260, h: 340 },
};

export default function FilmRoll3D({
  film,
  size = 'md',
  interactive = true,
  autoSpin = false,
  hoverSpin = true,
  className,
}: FilmRoll3DProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const palette = getPalette(film.colorType);
  const dims = SIZE_MAP[size];
  const brandShort = film.brand?.name?.split(' ')[0] ?? 'FILM';
  const nameMax = size === 'sm' ? 10 : size === 'hero' ? 20 : 16;

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // when hoverSpin active, animation owns the transform
      if (hoverSpin && isHovered) return;
      if (!interactive || !sceneRef.current || !rollRef.current) return;
      const rect = sceneRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      rollRef.current.style.transform = `rotateY(${x * 42}deg) rotateX(${-y * 28}deg)`;
    },
    [interactive, hoverSpin, isHovered],
  );

  const handleEnter = useCallback(() => setIsHovered(true), []);
  const handleLeave = useCallback(() => {
    setIsHovered(false);
    if (!rollRef.current) return;
    rollRef.current.style.transform = autoSpin ? '' : 'rotateY(-12deg) rotateX(6deg)';
  }, [autoSpin]);

  const cssVars = {
    '--roll-body': palette.body,
    '--roll-body-mid': palette.bodyMid,
    '--roll-body-dark': palette.bodyDark,
    '--roll-cap': palette.cap,
    '--roll-stripe': palette.stripe,
    '--roll-label': palette.label,
    '--roll-label-text': palette.labelText,
    '--roll-glow': palette.glow,
    '--roll-w': `${dims.w}px`,
    '--roll-h': `${dims.h}px`,
  } as CSSProperties;

  const SPROCKETS = size === 'hero' ? 9 : size === 'lg' ? 7 : size === 'md' ? 6 : 5;

  return (
    <div
      ref={sceneRef}
      className={clsx(
        'film-roll-scene',
        autoSpin && 'film-roll-scene--spin',
        hoverSpin && 'film-roll-scene--hover-spin',
        className,
      )}
      style={{ width: dims.w, height: dims.h, ...cssVars }}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchMove={handleMove}
      onTouchEnd={handleLeave}
    >
      <div
        ref={rollRef}
        className="film-roll"
        style={{ transform: 'rotateY(-12deg) rotateX(6deg)' }}
        aria-hidden
      >
        {/* Back panel — visible only when rotated */}
        <div className="film-roll__back" />
        {/* Front face */}
        <div className="film-roll__body">
          <div className="film-roll__stripe" />
          <div className="film-roll__label">
            <span className="film-roll__brand">{brandShort.toUpperCase()}</span>
            <span className="film-roll__name">{shortName(film.name, nameMax)}</span>
            {film.iso != null && <span className="film-roll__iso">ISO {film.iso}</span>}
          </div>
        </div>
        {/* Side strips with sprocket dots */}
        <div className="film-roll__edge film-roll__edge--left">
          {Array.from({ length: SPROCKETS }).map((_, i) => (
            <span key={i} className="film-roll__sprocket" />
          ))}
        </div>
        <div className="film-roll__edge film-roll__edge--right">
          {Array.from({ length: SPROCKETS }).map((_, i) => (
            <span key={i} className="film-roll__sprocket" />
          ))}
        </div>
        <div className="film-roll__cap film-roll__cap--top" />
        <div className="film-roll__cap film-roll__cap--bottom" />
        <div className="film-roll__spool" />
        <div className="film-roll__leader" />
        {/* Glossy reflection sweep */}
        <div className="film-roll__shine" />
      </div>
      {/* Floor shadow */}
      <div className="film-roll__floor" aria-hidden />
    </div>
  );
}
