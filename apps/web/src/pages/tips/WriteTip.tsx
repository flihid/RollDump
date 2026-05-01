import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Loading, FormatBadge } from '../../components/common';

const CATEGORIES = ['exposure', 'development', 'scanning', 'loading', 'push_pull', 'storage', 'general'];
const FORMATS = ['all', '35mm', '120', 'large_format', 'instant'];

export default function WriteTip() {
  const { slug } = useParams();
  const nav = useNavigate();
  const film = useQuery({ queryKey: ['film', slug], queryFn: () => api.get(`/films/${slug}`), enabled: !!slug });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetFormat, setTargetFormat] = useState('all');
  const [category, setCategory] = useState('general');

  const m = useMutation({
    mutationFn: () =>
      api.post('/tips', {
        filmId: film.data!.film.id,
        title,
        content,
        targetFormat,
        category,
      }),
    onSuccess: () => {
      toast.success('Tips dipublikasikan!');
      nav(`/films/${slug}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (film.isLoading) return <Loading />;
  const valid = title.length >= 5 && content.length >= 50;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tulis Tips</h1>
        <p className="text-sm text-ink-600">{film.data?.film.name}</p>
      </div>
      <div className="card p-6 space-y-4">
        <div>
          <label className="label">Judul</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Misal: Best development time for Tri-X 400" />
          <div className="text-xs text-ink-500 mt-0.5">{title.length}/100</div>
        </div>
        <div>
          <label className="label">Format target</label>
          <div className="flex flex-wrap gap-1.5">
            {FORMATS.map((f) => (
              <button key={f} type="button" onClick={() => setTargetFormat(f)} className={targetFormat === f ? 'chip-active' : 'chip'}>
                <FormatBadge format={f} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Kategori</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Konten</label>
          <textarea className="input" rows={10} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Markdown didukung. Tulis langkah-langkah, tips, dan caveat dengan jelas." />
          <div className="text-xs text-ink-500 mt-0.5">{content.length}/10000 (min 50)</div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => nav(-1)} className="btn-ghost">Batal</button>
          <button disabled={!valid || m.isPending} onClick={() => m.mutate()} className="btn-primary">Publikasikan</button>
        </div>
      </div>
    </div>
  );
}
