import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Layers, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { FormatBadge } from '../../components/common';

export default function Upload() {
  const nav = useNavigate();
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [filmVariantId, setFilmVariantId] = useState<string>('');
  const [filmFilter, setFilmFilter] = useState('');
  const [cameraText, setCameraText] = useState('');
  const [conditions, setConditions] = useState('');

  const films = useQuery({
    queryKey: ['films-search', filmFilter],
    queryFn: () => api.get(`/films?q=${encodeURIComponent(filmFilter)}&limit=8`),
  });
  const cameras = useQuery({ queryKey: ['cameras-search', cameraText], queryFn: () => api.get(`/equipment/cameras/search?q=${encodeURIComponent(cameraText)}`) });

  // single
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  // bulk
  const [bulkItems, setBulkItems] = useState<{ imageUrl: string; caption?: string }[]>([{ imageUrl: '' }]);

  const single = useMutation({
    mutationFn: () =>
      api.post('/photos', {
        imageUrl,
        caption,
        filmVariantId: filmVariantId || null,
        cameraText: cameraText || null,
        shootingConditions: conditions || null,
      }),
    onSuccess: (data: any) => {
      toast.success('Foto berhasil diunggah!');
      nav(`/photos/${data.photo.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulk = useMutation({
    mutationFn: () =>
      api.post('/photos/bulk', {
        items: bulkItems.filter((b) => b.imageUrl),
        filmVariantId: filmVariantId || null,
        cameraText: cameraText || null,
        shootingConditions: conditions || null,
      }),
    onSuccess: (data: any) => {
      toast.success('Roll berhasil diunggah!');
      nav(`/rolls/${data.roll.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Unggah foto</h1>
        <div className="flex gap-1 bg-ink-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('single')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${mode === 'single' ? 'bg-white shadow-sm' : ''}`}
          >
            <ImageIcon className="w-3.5 h-3.5 inline mr-1" /> Tunggal
          </button>
          <button
            onClick={() => setMode('bulk')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${mode === 'bulk' ? 'bg-white shadow-sm' : ''}`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" /> Bulk (Roll)
          </button>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <div className="label">Cari & pilih film + format</div>
          <input
            placeholder="Ketik nama film…"
            className="input"
            value={filmFilter}
            onChange={(e) => setFilmFilter(e.target.value)}
          />
          {films.data?.items && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto">
              {films.data.items.map((f: any) =>
                (f.availableFormats || ['35mm']).map((fmt: string) => {
                  const variant = f.variants?.find((v: any) => v.format === fmt);
                  // when listing API didn't return variants, fetch on demand server-side; we infer
                  const id = variant?.id || `${f.id}-${fmt}`;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={async () => {
                        // fetch full film to get variant ids
                        const det = await api.get(`/films/${f.slug}`);
                        const v = det.film.variants.find((x: any) => x.format === fmt);
                        if (v) setFilmVariantId(v.id);
                      }}
                      className={`p-2 text-left border rounded-lg ${
                        filmVariantId === id ? 'border-primary-500 bg-primary-50' : 'border-ink-200 hover:bg-ink-50'
                      }`}
                    >
                      <div className="text-xs font-semibold truncate">{f.name}</div>
                      <FormatBadge format={fmt} />
                    </button>
                  );
                }),
              )}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Kamera</label>
            <input className="input" value={cameraText} onChange={(e) => setCameraText(e.target.value)} placeholder="Misal: Yashica Mat-124G" />
            {cameras.data?.items?.length > 0 && cameraText && (
              <div className="mt-1 text-xs text-ink-500">
                Saran:{' '}
                {cameras.data.items.slice(0, 3).map((c: any) => (
                  <button key={c.id} type="button" onClick={() => setCameraText(`${c.brand} ${c.model}`)} className="underline mr-2">
                    {c.brand} {c.model}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">Kondisi pencahayaan</label>
            <select className="input" value={conditions} onChange={(e) => setConditions(e.target.value)}>
              <option value="">—</option>
              <option value="daylight">Daylight</option>
              <option value="overcast">Overcast</option>
              <option value="indoor">Indoor</option>
              <option value="low_light">Low light</option>
              <option value="night">Night</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>

        {mode === 'single' ? (
          <>
            <div>
              <label className="label">URL gambar *</label>
              <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
              {imageUrl && (
                <div className="mt-2 aspect-[4/3] bg-ink-200 rounded-lg overflow-hidden">
                  <img src={imageUrl} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <label className="label">Caption</label>
              <textarea className="input" rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} />
            </div>
            <div className="flex justify-end">
              <button disabled={!imageUrl || single.isPending} onClick={() => single.mutate()} className="btn-primary">
                Unggah
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="label">Daftar foto roll (URL gambar)</label>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {bulkItems.map((it, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="input"
                      value={it.imageUrl}
                      onChange={(e) =>
                        setBulkItems((arr) => arr.map((x, j) => (j === i ? { ...x, imageUrl: e.target.value } : x)))
                      }
                      placeholder={`Frame ${i + 1} URL`}
                    />
                    <button
                      type="button"
                      onClick={() => setBulkItems((arr) => arr.filter((_, j) => j !== i))}
                      className="btn-ghost p-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setBulkItems((arr) => [...arr, { imageUrl: '' }])}
                className="btn-ghost mt-2"
              >
                <Plus className="w-4 h-4" /> Tambah frame
              </button>
            </div>
            <div className="flex justify-end">
              <button disabled={bulk.isPending || bulkItems.filter((b) => b.imageUrl).length === 0} onClick={() => bulk.mutate()} className="btn-primary">
                Unggah Roll ({bulkItems.filter((b) => b.imageUrl).length})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
