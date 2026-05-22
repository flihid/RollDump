import { Link } from 'react-router-dom';

/**
 * RollDump logo — rendered film-roll mark (transparent PNG) +
 * Archivo Black wordmark per the "Modern Analog" design system.
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
  size = 40,
  showWordmark = true,
  showTagline = false,
  className,
  linkTo = '/',
}: LogoProps) {
  const inner = (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark size={size} className="shrink-0" />
      {showWordmark && (
        <div className="flex flex-col">
          <span
            className="leading-none whitespace-nowrap"
            style={{
              fontFamily: '"Archivo Black", "Syne", system-ui, sans-serif',
              fontSize: size * 0.45,
              letterSpacing: '-0.02em',
              color: 'inherit',
            }}
          >
            RollDump
          </span>
          {showTagline && (
            <span
              className="mt-1 text-[10px] uppercase tracking-[0.14em] whitespace-nowrap"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: '#ffd56b',
              }}
            >
              Shoot · Share · Discover
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!linkTo) return inner;
  return (
    <Link to={linkTo} className="inline-flex">
      {inner}
    </Link>
  );
}
