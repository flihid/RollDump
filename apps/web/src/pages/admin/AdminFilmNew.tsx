import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';

const FORMATS = ['35mm', '120', 'large_format', 'instant', '110', 'half_frame'];
const COLOR = ['color_negative', 'bw', 'slide_e6', 'color_positive'];

export default function AdminFilmNew() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: '',
    brandName: '',
    description: '',
    coverUrl: '',
    iso: 400,
    colorType: 'color_negative',
    countryOfOrigin: '',
    yearIntroduced: 2020,
  });
  const [variants, setVariants] = useState<any[]>([{ format: '35mm', exposures: 36, frameSize: '24x36' }]);

  const m = useMutation({
    mutationFn: () => api.post('/films', { ...form, variants }),
    onSuccess: () => {
      toast.success('Film added');
      nav('/admin/films');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Add a new film</h1>
      <div className="card p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Film name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Brand" value={form.brandName} onChange={(v) => setForm({ ...form, brandName: v })} />
          <Field label="Cover URL" value={form.coverUrl} onChange={(v) => setForm({ ...form, coverUrl: v })} />
          <div>
            <label className="label">ISO</label>
            <input type="number" className="input" value={form.iso} onChange={(e) => setForm({ ...form, iso: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.colorType} onChange={(e) => setForm({ ...form, colorType: e.target.value })}>
              {COLOR.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Field label="Country of origin" value={form.countryOfOrigin} onChange={(v) => setForm({ ...form, countryOfOrigin: v })} />
          <div>
            <label className="label">Year introduced</label>
            <input type="number" className="input" value={form.yearIntroduced} onChange={(e) => setForm({ ...form, yearIntroduced: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="label !mb-0">Format variants</div>
            <button onClick={() => setVariants([...variants, { format: '35mm', exposures: 36 }])} className="btn-ghost text-xs"><Plus className="w-3 h-3" />Add</button>
          </div>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <select className="input" value={v.format} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, format: e.target.value } : x))}>
                    {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <input className="input col-span-2" placeholder="Exp" type="number" value={v.exposures} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, exposures: Number(e.target.value) } : x))} />
                <input className="input col-span-2" placeholder="Frame" value={v.frameSize || ''} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, frameSize: e.target.value } : x))} />
                <input className="input col-span-2" placeholder="Push range" value={v.pushPullRange || ''} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, pushPullRange: e.target.value } : x))} />
                <input className="input col-span-2" placeholder="MSRP USD" type="number" value={v.msrpUsd || ''} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, msrpUsd: Number(e.target.value) } : x))} />
                <button onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="btn-ghost text-red-600 col-span-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={() => nav(-1)} className="btn-ghost">Cancel</button>
          <button onClick={() => m.mutate()} disabled={!form.name || m.isPending} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
