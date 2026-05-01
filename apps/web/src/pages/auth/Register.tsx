import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', fullName: '', password: '', confirm: '' });
  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const strength = useMemo(() => {
    const p = form.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }, [form.password]);

  const valid =
    form.username.length >= 3 &&
    /^[a-zA-Z0-9_]+$/.test(form.username) &&
    form.email.includes('@') &&
    strength >= 3 &&
    form.password === form.confirm;

  const m = useMutation({
    mutationFn: () =>
      api.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        fullName: form.fullName || form.username,
      }),
    onSuccess: (data: any) => {
      toast.success('Registrasi berhasil! Cek email Anda untuk verifikasi.');
      navigate(`/verify?token=${data.verify_token || ''}`);
    },
    onError: (e: any) => toast.error(e.message || 'Registrasi gagal'),
  });

  const strengthLabel = ['Sangat lemah', 'Lemah', 'Sedang', 'Baik', 'Kuat', 'Sangat kuat'][strength] || 'Sangat lemah';
  const strengthColor =
    strength <= 1 ? 'bg-red-500' : strength === 2 ? 'bg-amber-500' : strength === 3 ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 font-bold text-2xl mb-6">
          <span className="text-primary-600">●</span> RollDump
        </Link>
        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">Buat akun</h2>
            <p className="mt-1 text-sm text-ink-600">Mulai dokumentasi roll film Anda.</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) m.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">Username</label>
              <input value={form.username} onChange={(e) => set('username', e.target.value)} required className="input" placeholder="ahmadphoto" />
              {form.username && !/^[a-zA-Z0-9_]+$/.test(form.username) && (
                <p className="text-xs text-red-600 mt-1">Hanya huruf, angka, underscore</p>
              )}
            </div>
            <div>
              <label className="label">Nama lengkap</label>
              <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className="input" placeholder="Ahmad Subagja" />
            </div>
            <div>
              <label className="label">Email</label>
              <input value={form.email} onChange={(e) => set('email', e.target.value)} type="email" required className="input" placeholder="ahmad@contoh.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input value={form.password} onChange={(e) => set('password', e.target.value)} type="password" required className="input" />
              {form.password && (
                <div className="mt-1.5">
                  <div className="h-1 w-full bg-ink-200 rounded overflow-hidden">
                    <div className={`h-full transition-all ${strengthColor}`} style={{ width: `${(strength / 5) * 100}%` }} />
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">{strengthLabel}</div>
                </div>
              )}
            </div>
            <div>
              <label className="label">Konfirmasi password</label>
              <input value={form.confirm} onChange={(e) => set('confirm', e.target.value)} type="password" required className="input" />
              {form.confirm && form.password !== form.confirm && (
                <p className="text-xs text-red-600 mt-1">Password tidak cocok</p>
              )}
            </div>
            <button type="submit" disabled={!valid || m.isPending} className="btn-primary w-full">
              {m.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Daftar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-600">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
