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
      toast.success('Profile saved');
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const [pw, setPw] = useState({ current: '', next: '' });
  const changePw = useMutation({
    mutationFn: () => api.put('/users/me/password', { current_password: pw.current, new_password: pw.next }),
    onSuccess: () => {
      toast.success('Password updated');
      setPw({ current: '', next: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => api.delete('/users/me'),
    onSuccess: () => {
      toast.success('Account deleted');
      clearAuth();
      window.location.href = '/';
    },
  });

  if (me.isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h3 className="font-bold mb-4">Public profile</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
          <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Field label="Avatar URL" value={form.avatarUrl} onChange={(v) => setForm({ ...form, avatarUrl: v })} />
          <Field label="Banner URL" value={form.bannerUrl} onChange={(v) => setForm({ ...form, bannerUrl: v })} />
          <Field label="Website" value={form.websiteUrl} onChange={(v) => setForm({ ...form, websiteUrl: v })} />
          <Field label="Instagram" value={form.instagramHandle} onChange={(v) => setForm({ ...form, instagramHandle: v })} />
        </div>
        <div className="mt-4">
          <label className="label">Bio</label>
          <textarea className="input" rows={3} maxLength={280} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <div className="text-xs text-ink-500 mt-0.5">{(form.bio || '').length}/280</div>
        </div>
        <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary mt-4">Save profile</button>
      </section>

      <section className="card p-6">
        <h3 className="font-bold mb-4">Change password</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Current password" type="password" value={pw.current} onChange={(v) => setPw((s) => ({ ...s, current: v }))} />
          <Field label="New password" type="password" value={pw.next} onChange={(v) => setPw((s) => ({ ...s, next: v }))} />
        </div>
        <button onClick={() => changePw.mutate()} disabled={!pw.current || pw.next.length < 8 || changePw.isPending} className="btn-primary mt-4">
          Update password
        </button>
      </section>

      <section className="card p-6 border-red-500/30 bg-red-500/10">
        <h3 className="font-bold text-red-300 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-200">Deleting your account will remove your access. Data is archived for 30 days.</p>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete your account? This cannot be undone.')) remove.mutate();
          }}
          className="btn-danger mt-3"
        >
          Delete my account
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
