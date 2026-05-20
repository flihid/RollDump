import { Loader2, Image as ImageIcon } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`w-4 h-4 animate-spin ${className}`} />;
}

export function Loading({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="py-12 flex items-center justify-center gap-2 text-ink-300 text-sm">
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
      <div className="mx-auto w-14 h-14 rounded-full bg-ink-600 flex items-center justify-center text-ink-300 mb-3">
        <ImageIcon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-ink-50">{title}</h3>
      {description && <p className="text-sm text-ink-200 mt-1 max-w-sm mx-auto">{description}</p>}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

export function StarRating({ value, size = 'md', onChange }: { value: number; size?: 'sm' | 'md' | 'lg'; onChange?: (v: number) => void }) {
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
            aria-label={`${s} bintang`}
          >
            <span className={filled ? 'text-amber-500' : half ? 'text-amber-300' : 'text-ink-300'}>★</span>
          </button>
        );
      })}
    </div>
  );
}

export function FormatBadge({ format }: { format: string }) {
  const labelMap: Record<string, string> = {
    '35mm': '35mm',
    '120': '120',
    large_format: 'Large Format',
    instant: 'Instant',
    '110': '110',
    half_frame: 'Half Frame',
    all: 'Semua',
  };
  return <span className="badge-format">{labelMap[format] || format}</span>;
}

export function ColorTypeBadge({ value }: { value?: string | null }) {
  if (!value) return null;
  const m: Record<string, [string, string]> = {
    color_negative: ['Color Neg', 'bg-primary-500/20 text-primary-300 border border-primary-500/30'],
    color_positive: ['Color Pos', 'bg-primary-500/20 text-primary-300 border border-primary-500/30'],
    bw: ['B&W', 'bg-ink-500/50 text-ink-100 border border-ink-400'],
    slide_e6: ['Slide E6', 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'],
  };
  const [label, cls] = m[value] || [value, 'bg-ink-600 text-ink-100 border border-ink-500'];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}
