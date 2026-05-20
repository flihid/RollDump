import { Link } from 'react-router-dom';

/**
 * RollDump logo — actual rendered film-roll mark (PNG with transparent bg)
 * paired with a handwritten Caveat wordmark.
 */
type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
  linkTo?: string | null;
};

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      alt="RollDump"
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      draggable={false}
    />
  );
}

export default function Logo({
  size = 36,
  showWordmark = true,
  showTagline = false,
  className,
  linkTo = '/',
}: LogoProps) {
  const inner = (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark size={size} className="shrink-0" />
      {showWordmark && (
        <span
          className="text-ink-50 leading-none whitespace-nowrap"
          style={{
            fontFamily: '"Bricolage Grotesque", "DM Sans", system-ui, sans-serif',
            fontWeight: 800,
            fontSize: size * 0.62,
            letterSpacing: '-0.02em',
            fontVariationSettings: '"wdth" 95',
          }}
        >
          Roll<span className="text-primary-400 italic" style={{ fontStyle: 'italic' }}>dump</span>
        </span>
      )}
      {showTagline && (
        <span className="text-[10px] uppercase tracking-[0.22em] text-primary-400 font-bold hidden sm:inline ml-1">
          · 35mm
        </span>
      )}
    </div>
  );

  if (!linkTo) return inner;
  return (
    <Link to={linkTo} className="inline-flex group">
      {inner}
    </Link>
  );
}
