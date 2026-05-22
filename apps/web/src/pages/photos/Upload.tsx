import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload as UploadIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { FormatBadge } from '../../components/common';

const VISIBILITY = [
  { key: 'public', label: 'Public' },
  { key: 'followers', label: 'Followers' },
  { key: 'private', label: 'Private' },
];
const PUSH_PULL = ['-2', '-1', '0', '+1', '+2'];
const MAX_BYTES = 25 * 1024 * 1024; // 25MB per file

type Frame = { imageUrl: string; name?: string; status: 'pending' | 'uploaded' | 'error' };

export default function Upload() {
  const nav = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Form state
  const [filmVariantId, setFilmVariantId] = useState<string>('');
  const [filmFilter, setFilmFilter] = useState('');
  const [cameraText, setCameraText] = useState('');
  const [lensText, setLensText] = useState('');
  const [pushPull, setPushPull] = useState('0');
  const [visibility, setVisibility] = useState('public');
  const [labName, setLabName] = useState('');
  const [shotLocation, setShotLocation] = useState('');
  const [selectedFilm, setSelectedFilm] = useState<any>(null);
  const [frames, setFrames] = useState<Frame[]>([]);

  const films = useQuery({
    queryKey: ['films-search', filmFilter],
    queryFn: () => api.get(`/films?q=${encodeURIComponent(filmFilter)}&limit=6`),
    enabled: filmFilter.length > 0,
  });

  const handleFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      toast.error('Please drop image files (JPG/PNG/HEIC).');
      return;
    }
    const tooBig = files.filter((f) => f.size > MAX_BYTES);
    if (tooBig.length) {
      toast.error(`${tooBig.length} file(s) exceed 25MB and were skipped.`);
    }
    const good = files.filter((f) => f.size <= MAX_BYTES);
    if (frames.length + good.length > 36) {
      toast.error('Max 36 frames per roll. Extra files were skipped.');
    }
    const room = Math.max(0, 36 - frames.length);
    const toAdd = good.slice(0, room);

    // Read each file → data URL (no real storage backend yet)
    Promise.all(
      toAdd.map(
        (file) =>
          new Promise<Frame>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({ imageUrl: String(reader.result), name: file.name, status: 'uploaded' });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((newFrames) => setFrames((prev) => [...prev, ...newFrames]))
      .catch(() => toast.error('Failed to read some files.'));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const addUrlFrame = () => {
    if (frames.length >= 36) {
      toast.error('Max 36 frames per roll.');
      return;
    }
    setFrames((prev) => [...prev, { imageUrl: '', status: 'pending' }]);
  };

  const removeFrame = (idx: number) =>
    setFrames((prev) => prev.filter((_, i) => i !== idx));

  const updateFrameUrl = (idx: number, url: string) =>
    setFrames((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, imageUrl: url, status: url ? 'uploaded' : 'pending' } : f)),
    );

  const validFrames = frames.filter((f) => f.imageUrl);
  const progressPct = frames.length === 0 ? 0 : Math.round((validFrames.length / frames.length) * 100);

  const upload = useMutation({
    mutationFn: () =>
      api.post('/photos/bulk', {
        items: validFrames.map((f) => ({ imageUrl: f.imageUrl })),
        filmVariantId: filmVariantId || null,
        cameraText: cameraText || null,
        lensText: lensText || null,
        pushPullStops: parseInt(pushPull),
        visibility,
        labName: labName || null,
        shotLocation: shotLocation || null,
      }),
    onSuccess: (data: any) => {
      toast.success(`Roll published! ${validFrames.length} frames added 🎉`);
      nav(`/rolls/${data.roll.id}`);
    },
    onError: (e: any) => toast.error(e.message || 'Failed to publish roll'),
  });

  const canPublish = validFrames.length > 0 && !!filmVariantId && !upload.isPending;

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <div className="crumbs">Upload · New Roll</div>
          <h1>Upload Hub</h1>
        </div>
        <div className="topbar-right">
          <button onClick={() => nav(-1)} className="btn-ghost">Cancel</button>
          <button
            onClick={() => upload.mutate()}
            disabled={!canPublish}
            className="btn-primary"
          >
            {upload.isPending ? 'Publishing…' : 'Publish Roll'}
          </button>
        </div>
      </div>

      <div className="upload-layout">
        <div>
          {/* Hidden file input — clicked by the dropzone */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = ''; // allow re-selecting same file
            }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`dropzone cursor-pointer ${dragOver ? 'is-active' : ''}`}
          >
            <UploadIcon className="w-12 h-12 mx-auto mb-3" style={{ color: '#c68a0e' }} />
            <h3>
              {dragOver ? 'Drop your photos here' : 'Drag & drop, or click to select'}
            </h3>
            <div className="hint">PNG, JPG, HEIC, RAW · Max 25MB · Up to 36 frames</div>
            <div className="mt-4 flex gap-2 justify-center flex-wrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="btn-secondary"
              >
                <Plus className="w-4 h-4" /> Choose Files
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addUrlFrame();
                }}
                className="btn-ghost"
              >
                Paste URL instead
              </button>
            </div>
          </div>

          {/* Roll header */}
          {frames.length > 0 && (
            <div className="flex items-end justify-between mb-3 mt-5">
              <div>
                <div className="font-mono-tech text-xs uppercase tracking-wider text-ink-500">
                  ROLL · {selectedFilm?.brand?.name || '—'} {selectedFilm?.name || '—'} · {cameraText || '—'}
                </div>
                <div className="font-heading font-bold text-lg text-ink-900 mt-1">
                  {validFrames.length} of {frames.length} frames ready
                </div>
              </div>
              <span
                className="badge"
                style={{
                  background: progressPct === 100 ? 'rgba(63,143,63,0.18)' : 'rgba(230,165,25,0.18)',
                  color: progressPct === 100 ? '#3f8f3f' : '#c68a0e',
                }}
              >
                {progressPct}% · {validFrames.length}/{frames.length}
              </span>
            </div>
          )}

          {/* Frames grid */}
          {frames.length > 0 && (
            <div className="upload-grid">
              {frames.map((f, i) => (
                <FrameThumb
                  key={i}
                  index={i}
                  frame={f}
                  onUrlChange={(v) => updateFrameUrl(i, v)}
                  onRemove={() => removeFrame(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Metadata panel */}
        <aside className="card p-5 self-start">
          <h4 className="font-heading font-bold text-base mb-1 text-ink-900">Shared Metadata</h4>
          <p className="text-xs text-ink-500 mb-5">
            Applies to all photos in this roll. Per-photo details can be edited later.
          </p>

          <div className="field mb-4">
            <label>Film Stock *</label>
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
                <button
                  className="ml-auto text-xs text-ink-500 hover:text-red-500"
                  onClick={() => {
                    setSelectedFilm(null);
                    setFilmVariantId('');
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            {films.data?.items?.length > 0 && filmFilter && !selectedFilm && (
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
                      className="w-full text-left p-2 rounded text-xs flex items-center gap-2"
                      style={{ background: '#fbf8ef', border: '1px solid #dcd5bf' }}
                    >
                      <FormatBadge format={fmt} />
                      <span className="font-semibold">{f.name}</span>
                      <span className="text-ink-500 ml-auto">{f.brand?.name}</span>
                    </button>
                  )),
                )}
              </div>
            )}
          </div>

          <div className="field mb-4">
            <label>Camera</label>
            <input className="input" value={cameraText} onChange={(e) => setCameraText(e.target.value)} placeholder="Leica M6 (TTL)" />
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
            <input className="input" value={shotLocation} onChange={(e) => setShotLocation(e.target.value)} placeholder="Bromo, East Java · Apr 22 2026" />
          </div>

          <div className="field mb-4">
            <label>Development Lab</label>
            <input className="input" value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="Visiomatik Lab · Jakarta" />
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

function FrameThumb({
  index,
  frame,
  onUrlChange,
  onRemove,
}: {
  index: number;
  frame: Frame;
  onUrlChange: (v: string) => void;
  onRemove: () => void;
}) {
  const [showUrl, setShowUrl] = useState(!frame.imageUrl);
  return (
    <div className={`upload-thumb relative ${frame.imageUrl ? 'done' : 'uploading'}`}>
      {frame.imageUrl && (
        <img src={frame.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <span className="num">{String(index + 1).padStart(2, '0')}</span>
      {frame.imageUrl && <span className="check">✓</span>}
      {showUrl && !frame.imageUrl && (
        <input
          autoFocus
          type="text"
          placeholder="https://image.url"
          value={frame.imageUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          onBlur={() => frame.imageUrl && setShowUrl(false)}
          className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[10px] outline-none"
          style={{ background: 'rgba(0,0,0,0.7)', color: '#f5f0e1' }}
        />
      )}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-5 h-5 rounded-full grid place-items-center"
        style={{ background: 'rgba(200,68,58,0.92)', color: 'white' }}
        title="Remove frame"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}
