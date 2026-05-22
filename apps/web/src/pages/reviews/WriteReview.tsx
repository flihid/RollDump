import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bold, Italic, Strikethrough, List, Link as LinkIcon, Image as ImageIcon, Quote } from 'lucide-react';
import { api } from '../../lib/api';
import { Loading, FormatBadge } from '../../components/common';

const CONDITIONS = ['daylight', 'overcast', 'indoor', 'low_light', 'night', 'mixed'];
const PUSH_PULL = [-2, -1, 0, 1, 2];

type Dim = { key: string; name: string; ico: string };
const DIMS: Dim[] = [
  { key: 'color', name: 'Color', ico: '🎨' },
  { key: 'grain', name: 'Grain', ico: '⊟' },
  { key: 'sharpness', name: 'Sharpness', ico: '⊞' },
];

export default function WriteReview() {
  const { slug } = useParams();
  const nav = useNavigate();
  const film = useQuery({ queryKey: ['film', slug], queryFn: () => api.get(`/films/${slug}`), enabled: !!slug });

  const [variantId, setVariantId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({ color: 4.5, grain: 4.0, sharpness: 4.2 });
  const [cameraText, setCameraText] = useState('');
  const [lensText, setLensText] = useState('');
  const [pushPull, setPushPull] = useState(0);
  const [conditions, setConditions] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const variants = film.data?.film?.variants;
    if (variants?.length && !variantId) setVariantId(variants[0].id);
  }, [film.data, variantId]);

  // Aggregate score
  const aggregate = (scores.color + scores.grain + scores.sharpness) / 3;

  const m = useMutation({
    mutationFn: () =>
      api.post('/reviews', {
        filmId: film.data!.film.id,
        filmVariantId: variantId,
        ratingOverall: aggregate,
        ratingColor: scores.color,
        ratingGrain: scores.grain,
        ratingSharpness: scores.sharpness,
        title,
        content,
        cameraText,
        lensText,
        pushPullStops: pushPull,
        shootingConditions: conditions || null,
      }),
    onSuccess: () => {
      toast.success('Review published! 🎉');
      nav(`/films/${slug}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (film.isLoading) return <Loading />;
  const f = film.data!.film;
  const valid = title.length >= 5 && content.length >= 20 && variantId;

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <div className="crumbs">Review · {f.brand?.name} · {f.name}</div>
          <h1>Review Studio</h1>
        </div>
        <div className="topbar-right">
          <button onClick={() => nav(-1)} className="btn-ghost">Save Draft</button>
          <button onClick={() => m.mutate()} disabled={!valid || m.isPending} className="btn-primary">
            {m.isPending ? 'Publishing…' : 'Publish Review'}
          </button>
        </div>
      </div>

      <div className="review-grid">
        <div>
          <div className="card p-5 mb-5">
            {/* Film header */}
            <div className="flex gap-4 mb-5 items-center">
              <div
                className="w-16 h-20 rounded-[10px] grid place-items-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #7a4a2a, #3a2a1a)',
                  color: '#e6a519',
                  fontFamily: '"Archivo Black", "Syne", sans-serif',
                  fontSize: 22,
                }}
              >
                {f.iso}
              </div>
              <div>
                <div className="font-mono-tech text-xs uppercase tracking-wider text-ink-500">
                  {f.brand?.name} · {f.colorType?.replace('_', ' ').toUpperCase()}
                </div>
                <div className="font-heading font-bold text-xl text-ink-900">{f.name}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {f.variants?.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      className={variantId === v.id ? 'chip-active' : 'chip'}
                    >
                      <FormatBadge format={v.format} />
                    </button>
                  ))}
                  <span className="badge">ISO {f.iso}</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="field mb-5">
              <label>Review Title</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder={`${f.name}: my take on color, grain, and latitude`}
              />
              <div className="hint">{title.length}/100 · min 5 characters</div>
            </div>

            {/* Markdown editor */}
            <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid #dcd5bf', background: '#fbf8ef' }}>
              <div
                className="flex gap-1 p-2 border-b items-center"
                style={{ background: '#ede5cf', borderColor: '#dcd5bf' }}
              >
                <ToolBtn ico={<Bold className="w-3.5 h-3.5" />} />
                <ToolBtn ico={<Italic className="w-3.5 h-3.5" />} />
                <ToolBtn ico={<Strikethrough className="w-3.5 h-3.5" />} />
                <div className="w-px h-5 mx-1" style={{ background: '#c9c2ae' }} />
                <ToolBtn label="H1" />
                <ToolBtn label="H2" />
                <ToolBtn ico={<Quote className="w-3.5 h-3.5" />} />
                <div className="w-px h-5 mx-1" style={{ background: '#c9c2ae' }} />
                <ToolBtn ico={<List className="w-3.5 h-3.5" />} />
                <ToolBtn ico={<LinkIcon className="w-3.5 h-3.5" />} />
                <ToolBtn ico={<ImageIcon className="w-3.5 h-3.5" />} />
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => setPreviewMode(false)}
                    className={`px-3 py-1 text-xs font-semibold rounded ${!previewMode ? 'bg-ink-900 text-primary-500' : 'text-ink-600'}`}
                  >
                    Write
                  </button>
                  <button
                    onClick={() => setPreviewMode(true)}
                    className={`px-3 py-1 text-xs font-semibold rounded ${previewMode ? 'bg-ink-900 text-primary-500' : 'text-ink-600'}`}
                  >
                    Preview
                  </button>
                </div>
              </div>
              {previewMode ? (
                <div className="p-4 font-mono-tech text-sm text-ink-700 min-h-[280px] whitespace-pre-wrap">
                  {content || <em className="text-ink-500">Nothing to preview yet…</em>}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  placeholder="# My take on this film&#10;&#10;Walk through color rendition, grain texture, latitude, and use cases. Markdown is supported."
                  className="w-full p-4 font-mono-tech text-sm bg-transparent outline-none resize-y min-h-[280px] text-ink-700"
                />
              )}
            </div>
            <div className="font-mono-tech text-[11px] text-ink-500 mt-2">
              {content.length}/10000 · min 20 characters
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="card p-5 mb-5">
            <h4 className="font-heading font-bold text-base mb-1 text-ink-900">Multi-Dimensional Rating</h4>
            <p className="text-xs text-ink-500 mb-5">
              Rate each technical aspect. The aggregate score is calculated automatically.
            </p>

            {DIMS.map((d) => (
              <DimSlider
                key={d.key}
                name={`${d.ico} ${d.name}`}
                value={scores[d.key]}
                onChange={(v) => setScores({ ...scores, [d.key]: v })}
              />
            ))}

            {/* Aggregate */}
            <div
              className="dim-slider"
              style={{ background: '#1a1a1a', color: '#f5f0e1', borderColor: '#1a1a1a' }}
            >
              <div className="top">
                <span className="name" style={{ color: '#f5f0e1' }}>★ Aggregate Score</span>
                <span className="value" style={{ color: '#e6a519' }}>{aggregate.toFixed(1)}</span>
              </div>
              <div className="dim-track" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="dim-fill" style={{ width: `${(aggregate / 5) * 100}%` }} />
                <div className="dim-thumb" style={{ left: `${(aggregate / 5) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h4 className="font-heading font-bold text-sm mb-3 text-ink-900">Equipment Used</h4>
            <div className="field mb-3">
              <label className="text-xs">Camera</label>
              <input className="input" value={cameraText} onChange={(e) => setCameraText(e.target.value)} placeholder="Leica M6" style={{ fontSize: 13 }} />
            </div>
            <div className="field mb-3">
              <label className="text-xs">Lens</label>
              <input className="input" value={lensText} onChange={(e) => setLensText(e.target.value)} placeholder="50mm Summicron f/2" style={{ fontSize: 13 }} />
            </div>
            <div className="field mb-3">
              <label className="text-xs">Push / Pull Stops</label>
              <div className="push-pull">
                {PUSH_PULL.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={pushPull === n ? 'active' : ''}
                    onClick={() => setPushPull(n)}
                  >
                    {n > 0 ? `+${n}` : n}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="text-xs">Conditions</label>
              <div className="flex flex-wrap gap-1.5">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setConditions(c === conditions ? '' : c)}
                    className={c === conditions ? 'chip-active' : 'chip'}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ToolBtn({ ico, label }: { ico?: React.ReactNode; label?: string }) {
  return (
    <button
      type="button"
      className="px-2 py-1 rounded font-mono-tech text-xs text-ink-600 hover:bg-ink-50 hover:text-ink-900"
    >
      {ico ?? label}
    </button>
  );
}

function DimSlider({ name, value, onChange }: { name: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="dim-slider">
      <div className="top">
        <span className="name">{name}</span>
        <span className="value">{value.toFixed(1)} / 5.0</span>
      </div>
      <input
        type="range"
        min="0"
        max="5"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="dim-track w-full"
        style={{ appearance: 'none', cursor: 'pointer' }}
      />
      <div className="dim-marks">
        {[0, 1, 2, 3, 4, 5].map((n) => <span key={n}>{n}</span>)}
      </div>
    </div>
  );
}
