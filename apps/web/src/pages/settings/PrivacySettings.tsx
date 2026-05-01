import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function PrivacySettings() {
  const q = useQuery({ queryKey: ['privacy'], queryFn: () => api.get('/users/me/privacy') });
  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (q.data?.privacy) setForm(q.data.privacy);
  }, [q.data]);
  const save = useMutation({
    mutationFn: () => api.put('/users/me/privacy', form),
    onSuccess: () => toast.success('Pengaturan privasi tersimpan'),
  });

  if (q.isLoading) return <Loading />;
  return (
    <div className="card p-6 space-y-4">
      <h3 className="font-bold">Privasi</h3>
      <div>
        <label className="label">Visibilitas profil</label>
        <select className="input" value={form.profileVisibility || 'public'} onChange={(e) => setForm({ ...form, profileVisibility: e.target.value })}>
          <option value="public">Publik</option>
          <option value="followers_only">Hanya followers</option>
          <option value="private">Privat</option>
        </select>
      </div>
      <div>
        <label className="label">Siapa yang boleh menyebut saya?</label>
        <select className="input" value={form.allowMentionsFrom || 'everyone'} onChange={(e) => setForm({ ...form, allowMentionsFrom: e.target.value })}>
          <option value="everyone">Semua orang</option>
          <option value="followers">Followers</option>
          <option value="noone">Tidak ada</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!form.showEmail} onChange={(e) => setForm({ ...form, showEmail: e.target.checked })} />
        Tampilkan email di profil
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!form.showLocation} onChange={(e) => setForm({ ...form, showLocation: e.target.checked })} />
        Tampilkan lokasi di profil
      </label>
      <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">Simpan</button>
    </div>
  );
}
