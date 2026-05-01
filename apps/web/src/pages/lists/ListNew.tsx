import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function ListNew() {
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const m = useMutation({
    mutationFn: () => api.post('/lists', { title, description, isPublic }),
    onSuccess: (data: any) => {
      toast.success('List dibuat!');
      nav(`/lists/${data.list.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Buat List baru</h1>
      <div className="card p-6 space-y-4">
        <div>
          <label className="label">Judul</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Misal: Rekomendasi roll buat senja sore" />
        </div>
        <div>
          <label className="label">Deskripsi</label>
          <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Publik (orang lain bisa lihat)
        </label>
        <button onClick={() => m.mutate()} disabled={!title || m.isPending} className="btn-primary w-full">
          Buat List
        </button>
      </div>
    </div>
  );
}
