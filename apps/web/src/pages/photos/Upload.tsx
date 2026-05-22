import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { FormatBadge } from '../../components/common';

const VISIBILITY = [
  { key: 'public', label: 'Public' },
  { key: 'followers', label: 'Followers' },
  { key: 'private', label: 'Private' },
];

const PUSH_PULL = ['-2', '-1', '0', '+1', '+2'];

export default function Upload() {
  const nav = useNavigate();
  const [filmVariantId, setFilmVariantId] = useState<string>('');
  const [filmFilter, setFilmFilter] = useState('');
  const [cameraText, setCameraText] = useState('');
  const [lensText, setLensText] = useState('');
  const [pushPull, setPushPull] = useState('0');
  const [visibility, setVisibility] = useState('public');
  const [labName, setLabName] = useState('');
  const [shotLocation, setShotLocation] = useState('');
  const [selectedFilm, setSelectedFilm] = useState<any>(null);
  const [items, setItems] = useState<{ imageUrl: string }[]>([{ imageUrl: '' }]);

  const films = useQuery({
    queryKey: ['films-search', filmFilter],
    queryFn: () => api.get(`/films?q=${encodeURIComponent(filmFilter)}&limit=6`),
    enabled: filmFilter.length > 0,
  });

  const upload = useMutation({
    mutationFn: () =>
      api.post('/photos/bulk', {
        items: items.filter((b) => b.imageUrl),
        filmVariantId: filmVariantId || null,
        cameraText: cameraText || null,
        lensText: lensText || null,
        pushPullStops: parseInt(pushPull),
        visibility,
        labName: labName || null,
        shotLocation: shotLocation || null,
      }),
    onSuccess: (data: any) => {
      toast.success(`Roll published! ${items.length} frames added 🎉`);
      nav(`/rolls/${data.roll.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const validItems = items.filter((i) => i.imageUrl).length;
  const totalItems = items.length;
  const progressPct = Math.round((validItems / totalItems) * 100);

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <div className="crumbs">Upload · New Roll</div>
          <h1>Upload Hub</h1>
        </div>
        <div className="topbar-right">
          <button className="btn-ghost">Save as Draft</button>
          <button
            onClick={() => upload.mutate()}
            disabled={validItems === 0 || !filmVariantId || upload.isPending}
            className="btn-primary"
          >
            {upload.isPending ? 'Publishing…' : 'Publish Roll'}
          </button>
        </div>
      </div>

      <div className="upload-layout">
        <div>
          {/* Dropzone */}
          <div className="dropzone is-active">
            <div className="ico">🎞️</div>
            <h3>Drop your full roll (24–36 photos) here</h3>
            <div className="hint">PNG, JPG, or RAW · Max 25MB per file · 36 files per roll</div>
            <button
              type="button"
              onClick={() => setItems([...items, { imageUrl: '' }])}
              className="btn-secondary mt-4"
            >
              <Plus className="w-4 h-4" /> Add Frame
            </button>
          </div>

          {/* Header */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="font-mono-tech text-xs uppercase tracking-wider text-ink-500">
                ROLL · {selectedFilm?.brand?.name || '—'} {selectedFilm?.name || '—'} · {cameraText || '—'}
              </div>
              <div className="font-heading font-bold text-lg text-ink-900 mt-1">
                {validItems} of {totalItems} frames ready
              </div>
            </div>
            <div className="font-mono-tech text-xs">
              <span
                className="badge"
                style={{
                  background: validItems === totalItems ? 'rgba(63,143,63,0.18)' : 'rgba(230,165,25,0.18)',
                  color: validItems === totalItems ? '#3f8f3f' : '#c68a0e',
                }}
              >
                {progressPct}% · {validItems}/{totalItems}
              </span>
            </div>
          </div>

          {/* Upload grid */}
          <div className="upload-grid">
            {items.map((it, i) => (
              <div key={i} className="upload-thumb relative">
                {it.imageUrl ? (
                  <img src={it.imageUrl} className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                {it.imageUrl && (
                  <span className="check">✓</span>
                )}
                <input
                  type="text"
                  placeholder=" "
                  value={it.imageUrl}
                  onChange={(e) =>
                    setItems((arr) => arr.map((x, j) => (j === i ? { ...x, imageUrl: e.target.value } : x)))
                  }
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Paste image URL"
                />
                {!it.imageUrl && (
                  <input
                    type="text"
                    placeholder="URL"
                    value={it.imageUrl}
                    onChange={(e) =>
                      setItems((arr) => arr.map((x, j) => (j === i ? { ...x, imageUrl: e.target.value } : x)))
                    }
                    className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[10px] outline-none"
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#f5f0e1' }}
                  />
                )}
                {items.length > 1 && (
                  <button
                    onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full grid place-items-center"
                    style={{ background: 'rgba(200,68,58,0.85)', color: 'white' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Metadata panel */}
        <aside className="card p-5">
          <h4 className="font-heading font-bold text-base mb-1 text-ink-900">Shared Metadata</h4>
          <p className="text-xs text-ink-500 mb-5">
            Applies to all photos in this roll. Per-photo details can be edited later.
          </p>

          <div className="field mb-4">
            <label>Film Stock</label>
            <input
              className="input"
              placeholder="Search Portra, Velvia, Tri-X…"
              value={filmFilter}
              onChange={(e) => setFilmFilter(e.target.value)}
            />
            {selectedFilm && (
              <div className="mt-2 p-3 rounded-[10px] flex items-center gap-2" style={{ background: '#ede5cf' }}>
                <FormatBadge format={selectedFilm.format || '35mm'} />
                <strong className="text-sm">{selectedFilm.brand?.name} {selectedFilm.name}</strong>
              </div>
            )}
            {films.data?.items?.length > 0 && filmFilter && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {films.data.items.map((f: any) =>
                  (f.availableFormats || ['35mm']).map((fmt: string) => (
                    <button
                      key={`${f.id}-${fmt}`}
                      type="button"
                      onClick={async () => {
                        const det = await api.get(`/films/${f.slug}`);
                        const v = det.film.variants.find((x: any) => x.format === fmt);
                        if (v) {
                          setFilmVariantId(v.id);
                          setSelectedFilm({ ...f, format: fmt });
                          setFilmFilter('');
                        }
                      }}
                      className="w-full text-left p-2 rounded text-xs flex items-center gap-2 hover:bg-ink-200"
                      style={{ background: '#fbf8ef', border: '1px solid #dcd5bf' }}
                    >
                      <FormatBadge format={fmt} />
                      <span className="font-semibold">{f.name}</span>
                      <span className="text-ink-500 ml-auto">{f.brand?.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="field mb-4">
            <label>Camera</label>
            <input className="input" value={cameraText} onChange={(e) => setCameraText(e.target.value)} placeholder="Leica M6 (TTL)" />
            <div className="hint">— Autocomplete from Equipment Registry</div>
          </div>

          <div className="field mb-4">
            <label>Lens</label>
            <input className="input" value={lensText} onChange={(e) => setLensText(e.target.value)} placeholder="50mm f/2 Summicron-M" />
          </div>

          <div className="field mb-4">
            <label>Push / Pull</label>
            <div className="push-pull">
              {PUSH_PULL.map((p) => (
                <button key={p} type="button" className={pushPull === p ? 'active' : ''} onClick={() => setPushPull(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="field mb-4">
            <label>Location & Date</label>
            <input className="input" value={shotLocation} onChange={(e) => setShotLocation(e.target.value)} placeholder="Bromo, East Java · 2026-04-22" />
          </div>

          <div className="field mb-4">
            <label>Development Lab</label>
            <input className="input" value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="e.g. Visiomatik Lab · Jakarta" />
          </div>

          <div className="field">
            <label>Visibility</label>
            <div className="push-pull">
              {VISIBILITY.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className={visibility === v.key ? 'active' : ''}
                  onClick={() => setVisibility(v.key)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
