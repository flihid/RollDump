import { Loader2, Image as ImageIcon } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`w-4 h-4 animate-spin ${className}`} />;
}

export function Loading({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="py-12 flex items-center justify-center gap-2 text-ink-500 text-sm">
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
      <div className="mx-auto w-14 h-14 rounded-full bg-ink-100 flex items-center justify-center text-ink-400 mb-3">
        <ImageIcon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      {description && <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">{description}</p>}
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
    color_negative: ['Color Neg', 'bg-amber-100 text-amber-800'],
    color_positive: ['Color Pos', 'bg-amber-100 text-amber-800'],
    bw: ['B&W', 'bg-ink-200 text-ink-800'],
    slide_e6: ['Slide E6', 'bg-fuchsia-100 text-fuchsia-800'],
  };
  const [label, cls] = m[value] || [value, 'bg-ink-100 text-ink-700'];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}
