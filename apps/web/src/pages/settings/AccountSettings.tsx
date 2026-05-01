import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';
import { clearAuth } from '../../store/auth';

export default function AccountSettings() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api.get('/users/me') });
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (me.data?.user) {
      const u = me.data.user;
      setForm({
        fullName: u.fullName || '',
        bio: u.bio || '',
        location: u.location || '',
        websiteUrl: u.websiteUrl || '',
        instagramHandle: u.instagramHandle || '',
        avatarUrl: u.avatarUrl || '',
        bannerUrl: u.bannerUrl || '',
      });
    }
  }, [me.data]);

  const save = useMutation({
    mutationFn: () => api.put('/users/me/profile', form),
    onSuccess: () => {
      toast.success('Profil tersimpan');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const [pw, setPw] = useState({ current: '', next: '' });
  const changePw = useMutation({
    mutationFn: () => api.put('/users/me/password', { current_password: pw.current, new_password: pw.next }),
    onSuccess: () => {
      toast.success('Password diubah');
      setPw({ current: '', next: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => api.delete('/users/me'),
    onSuccess: () => {
      toast.success('Akun dihapus');
      clearAuth();
      window.location.href = '/';
    },
  });

  if (me.isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h3 className="font-bold mb-4">Profil publik</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nama lengkap" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
          <Field label="Lokasi" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Field label="URL avatar" value={form.avatarUrl} onChange={(v) => setForm({ ...form, avatarUrl: v })} />
          <Field label="URL banner" value={form.bannerUrl} onChange={(v) => setForm({ ...form, bannerUrl: v })} />
          <Field label="Website" value={form.websiteUrl} onChange={(v) => setForm({ ...form, websiteUrl: v })} />
          <Field label="Instagram" value={form.instagramHandle} onChange={(v) => setForm({ ...form, instagramHandle: v })} />
        </div>
        <div className="mt-4">
          <label className="label">Bio</label>
          <textarea className="input" rows={3} maxLength={280} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <div className="text-xs text-ink-500 mt-0.5">{(form.bio || '').length}/280</div>
        </div>
        <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary mt-4">Simpan profil</button>
      </section>

      <section className="card p-6">
        <h3 className="font-bold mb-4">Ubah password</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Password saat ini" type="password" value={pw.current} onChange={(v) => setPw((s) => ({ ...s, current: v }))} />
          <Field label="Password baru" type="password" value={pw.next} onChange={(v) => setPw((s) => ({ ...s, next: v }))} />
        </div>
        <button onClick={() => changePw.mutate()} disabled={!pw.current || pw.next.length < 8 || changePw.isPending} className="btn-primary mt-4">
          Ubah password
        </button>
      </section>

      <section className="card p-6 border-red-200 bg-red-50">
        <h3 className="font-bold text-red-700 mb-2">Zona Bahaya</h3>
        <p className="text-sm text-red-700">Hapus akun akan menghilangkan akses Anda. Data akan diarsipkan 30 hari.</p>
        <button
          onClick={() => {
            if (confirm('Yakin ingin menghapus akun? Tindakan ini tidak bisa dibatalkan.')) remove.mutate();
          }}
          className="btn-danger mt-3"
        >
          Hapus akun saya
        </button>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
