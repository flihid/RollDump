import { Loader2, Image as ImageIcon } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`w-4 h-4 animate-spin ${className}`} />;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="py-12 flex items-center justify-center gap-2 text-sm" style={{ color: '#7a7a7a' }}>
      <Spinner /> {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  cta,
}: {
  title: string;
  description?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: '#e8e1cb', color: '#7a7a7a' }}>
        <ImageIcon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold" style={{ color: '#1a1a1a' }}>{title}</h3>
      {description && <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: '#4a4a4a' }}>{description}</p>}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

export function StarRating({
  value,
  size = 'md',
  onChange,
}: {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (v: number) => void;
}) {
  const sz = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`inline-flex gap-0.5 ${sz}`}>
      {stars.map((s) => {
        const filled = value >= s;
        const half = !filled && value >= s - 0.5;
        return (
          <button
            key={s}
            type="button"
            disabled={!onChange}
            onClick={() => onChange?.(s)}
            className={`leading-none ${onChange ? 'hover:scale-110' : ''} transition`}
            aria-label={`${s} stars`}
          >
            <span style={{ color: filled ? '#e6a519' : half ? '#ffd56b' : '#c9c2ae' }}>★</span>
          </button>
        );
      })}
    </div>
  );
}

export function FormatBadge({ format }: { format: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    '35mm':         { label: '35mm',         cls: 'badge-35mm' },
    '120':          { label: '120',          cls: 'badge-120' },
    large_format:   { label: 'Large Format', cls: 'badge-large' },
    instant:        { label: 'Instant',      cls: 'badge-instant' },
    '110':          { label: '110',          cls: 'badge' },
    half_frame:     { label: 'Half Frame',   cls: 'badge' },
    all:            { label: 'All',          cls: 'badge' },
  };
  const { label, cls } = map[format] ?? { label: format, cls: 'badge' };
  return <span className={cls}>{label}</span>;
}

export function ColorTypeBadge({ value }: { value?: string | null }) {
  if (!value) return null;
  const m: Record<string, [string, string]> = {
    color_negative: ['Color Neg',  'badge-35mm'],
    color_positive: ['Color Pos',  'badge-35mm'],
    bw:             ['B&W',        'badge'],
    slide_e6:       ['Slide E6',   'badge-instant'],
  };
  const [label, cls] = m[value] || [value, 'badge'];
  return <span className={cls}>{label}</span>;
}
