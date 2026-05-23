import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

const COLOR = ['color_negative', 'bw', 'slide_e6', 'color_positive'];
const STATUSES = ['active', 'discontinued', 'limited', 'rumored'];

export default function AdminFilmEdit() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { slug } = useParams<{ slug: string }>();

  const q = useQuery({
    queryKey: ['admin-film-edit', slug],
    queryFn: () => api.get(`/films/${slug}`),
    enabled: !!slug,
  });
  const film = q.data?.film;

  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (film && !form) {
      setForm({
        name: film.name || '',
        description: film.description || '',
        coverUrl: film.coverUrl || '',
        iso: film.iso ?? 400,
        colorType: film.colorType || 'color_negative',
        countryOfOrigin: film.countryOfOrigin || '',
        yearIntroduced: film.yearIntroduced ?? 2020,
        yearDiscontinued: film.yearDiscontinued ?? '',
        status: film.status || 'active',
      });
    }
  }, [film, form]);

  const save = useMutation({
    mutationFn: () => {
      // Strip empty year so we don't send '' as a number
      const payload: any = { ...form };
      if (payload.yearDiscontinued === '' || payload.yearDiscontinued === null) {
        delete payload.yearDiscontinued;
      } else {
        payload.yearDiscontinued = Number(payload.yearDiscontinued);
      }
      return api.put(`/films/${film.id}`, payload);
    },
    onSuccess: () => {
      toast.success('Film updated');
      qc.invalidateQueries({ queryKey: ['admin-films'] });
      qc.invalidateQueries({ queryKey: ['admin-film-edit'] });
      nav('/admin/films');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save'),
  });

  if (q.isLoading || !form) return <Loading />;
  if (!film) {
    return (
      <div className="page-enter">
        <div className="card p-10 text-center text-sm text-ink-500">
          Film not found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <div className="topbar">
        <div>
          <button
            onClick={() => nav('/admin/films')}
            className="font-mono-tech text-xs uppercase tracking-wider text-ink-500 hover:text-ink-900 inline-flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3 h-3" /> Manage Films
          </button>
          <h1>Edit Film</h1>
          <div className="text-xs text-ink-500 mt-1 font-mono-tech uppercase tracking-wider">
            {film.brand?.name || 'Unknown brand'} · {film.stats?.reviewCount ?? 0} reviews
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field
            label="Film name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />
          <Field
            label="Cover URL"
            value={form.coverUrl}
            onChange={(v) => setForm({ ...form, coverUrl: v })}
          />
          <div>
            <label className="label">ISO</label>
            <input
              type="number"
              className="input"
              value={form.iso}
              onChange={(e) => setForm({ ...form, iso: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={form.colorType}
              onChange={(e) => setForm({ ...form, colorType: e.target.value })}
            >
              {COLOR.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Country of origin"
            value={form.countryOfOrigin}
            onChange={(v) => setForm({ ...form, countryOfOrigin: v })}
          />
          <div>
            <label className="label">Year introduced</label>
            <input
              type="number"
              className="input"
              value={form.yearIntroduced}
              onChange={(e) => setForm({ ...form, yearIntroduced: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Year discontinued (optional)</label>
            <input
              type="number"
              className="input"
              value={form.yearDiscontinued}
              onChange={(e) => setForm({ ...form, yearDiscontinued: e.target.value })}
              placeholder="—"
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="text-xs text-ink-500 font-mono-tech uppercase tracking-wider">
          {film.variants?.length || 0} format variant(s) · edit variants in DB for now
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={() => nav('/admin/films')} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={!form.name || save.isPending}
            className="btn-primary"
          >
            {save.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
