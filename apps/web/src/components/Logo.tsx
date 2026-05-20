import { Link } from 'react-router-dom';

/**
 * RollDump logo — curled film strip mark + wordmark in Instrument Serif.
 * Pure SVG (infinitely scalable, crisp at any size).
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
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={`rdm-amber-${size}`} x1="0.2" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#ffd078" />
          <stop offset="35%" stopColor="#f5a623" />
          <stop offset="78%" stopColor="#c66c00" />
          <stop offset="100%" stopColor="#7a3e00" />
        </linearGradient>
        <linearGradient id={`rdm-cream-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbeec7" />
          <stop offset="55%" stopColor="#e6cf94" />
          <stop offset="100%" stopColor="#a48149" />
        </linearGradient>
        <linearGradient id={`rdm-shine-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`rdm-hole-${size}`} cx="0.5" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#000" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id={`rdm-shadow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" in="SourceAlpha" />
          <feOffset dx="0" dy="6" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.55" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#rdm-shadow-${size})`}>
        {/* Cream loop (back) */}
        <g>
          <ellipse cx="128" cy="180" rx="78" ry="34" fill={`url(#rdm-cream-${size})`} />
          <ellipse cx="128" cy="178" rx="52" ry="18" fill="#1a1410" />
          <ellipse cx="128" cy="178" rx="52" ry="18" fill={`url(#rdm-hole-${size})`} />
          {/* Top sprockets */}
          <g fill="#1a1410">
            {[62, 74, 88, 102, 116, 131, 146, 160, 174, 186].map((x, i) => (
              <rect
                key={`t${i}`}
                x={x}
                y={[153, 150, 148, 147, 146.5, 146.5, 147, 148, 150, 153][i]}
                width="5"
                height="3"
                rx="0.6"
              />
            ))}
          </g>
          {/* Bottom sprockets */}
          <g fill="#1a1410">
            {[62, 74, 88, 102, 116, 131, 146, 160, 174, 186].map((x, i) => (
              <rect
                key={`b${i}`}
                x={x}
                y={[205, 208, 210, 211.5, 212, 212, 211.5, 210, 208, 205][i]}
                width="5"
                height="3"
                rx="0.6"
              />
            ))}
          </g>
          <rect x="120" y="177.5" width="16" height="1" fill="#8a6630" opacity="0.65" />
        </g>

        {/* Amber curl (front) */}
        <g>
          <path
            d="M 78,184 C 56,184 50,150 70,110 C 90,68 138,52 172,72 C 200,88 198,118 178,130 C 162,140 138,134 130,118 C 124,104 134,90 152,92 C 168,94 174,108 168,118"
            stroke={`url(#rdm-amber-${size})`}
            strokeWidth="26"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="119" y="74" width="20" height="2.5" rx="0.5" fill="#7a3e00" opacity="0.75" />
          <rect
            x="148"
            y="100"
            width="14"
            height="2"
            rx="0.4"
            fill="#7a3e00"
            opacity="0.55"
            transform="rotate(40 155 101)"
          />
          <path
            d="M 86,118 C 78,90 104,66 138,62 C 162,60 184,72 192,96"
            stroke={`url(#rdm-shine-${size})`}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>
      </g>
    </svg>
  );
}

export default function Logo({
  size = 32,
  showWordmark = true,
  showTagline = false,
  className,
  linkTo = '/',
}: LogoProps) {
  const inner = (
    <div className={`flex items-baseline gap-2.5 ${className ?? ''}`}>
      <LogoMark size={size} className="self-center -mb-1 shrink-0" />
      {showWordmark && (
        <>
          <span className="font-display text-ink-50 font-semibold tracking-tight leading-none" style={{ fontSize: size * 0.78 }}>
            roll<span className="italic text-primary-400">dump</span>
          </span>
          {showTagline && (
            <span className="text-[10px] uppercase tracking-[0.22em] text-primary-400 font-bold hidden sm:inline">
              · 35mm
            </span>
          )}
        </>
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
