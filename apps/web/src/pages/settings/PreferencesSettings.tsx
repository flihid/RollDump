import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { FormatBadge, Loading } from '../../components/common';

const FORMATS = ['35mm', '120', 'large_format', 'instant', '110', 'half_frame'];
const COLOR = [
  { key: 'color_negative', label: 'Color Negative' },
  { key: 'bw', label: 'B&W' },
  { key: 'slide_e6', label: 'Slide E6' },
];

export default function PreferencesSettings() {
  const q = useQuery({ queryKey: ['prefs'], queryFn: () => api.get('/users/me/preferences') });
  const [formats, setFormats] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [isoMin, setIsoMin] = useState(25);
  const [isoMax, setIsoMax] = useState(3200);

  useEffect(() => {
    const p = q.data?.preferences;
    if (p) {
      setFormats(p.formatPreferences || []);
      setColors(p.colorPreferences || []);
      setIsoMin(p.isoMin || 25);
      setIsoMax(p.isoMax || 3200);
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: () =>
      api.put('/users/me/preferences', {
        formatPreferences: formats,
        colorPreferences: colors,
        isoMin,
        isoMax,
      }),
    onSuccess: () => toast.success('Preferensi tersimpan'),
  });

  const toggle = (arr: string[], setArr: any, k: string) =>
    setArr(arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]);

  if (q.isLoading) return <Loading />;

  return (
    <div className="card p-6 space-y-5">
      <h3 className="font-bold">Preferensi selera</h3>
      <div>
        <div className="label">Format favorit</div>
        <div className="flex flex-wrap gap-1.5">
          {FORMATS.map((f) => (
            <button key={f} onClick={() => toggle(formats, setFormats, f)} className={formats.includes(f) ? 'chip-active' : 'chip'}>
              <FormatBadge format={f} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="label">Tipe emulsi favorit</div>
        <div className="flex flex-wrap gap-1.5">
          {COLOR.map((c) => (
            <button key={c.key} onClick={() => toggle(colors, setColors, c.key)} className={colors.includes(c.key) ? 'chip-active' : 'chip'}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">ISO min</label>
          <input type="number" className="input" value={isoMin} onChange={(e) => setIsoMin(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">ISO max</label>
          <input type="number" className="input" value={isoMax} onChange={(e) => setIsoMax(Number(e.target.value))} />
        </div>
      </div>
      <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">Simpan</button>
    </div>
  );
}
