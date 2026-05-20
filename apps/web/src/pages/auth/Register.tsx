import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
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
      toast.success('Registration successful! Check your email to verify.');
      navigate(`/verify?token=${data.verify_token || ''}`);
    },
    onError: (e: any) => toast.error(e.message || 'Registration failed'),
  });

  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][strength] || 'Very weak';
  const strengthColor =
    strength <= 1 ? 'bg-red-500' : strength === 2 ? 'bg-amber-500' : strength === 3 ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-baseline justify-center gap-2 mb-8">
          <span className="text-3xl font-semibold text-ink-50" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            RollDump
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary-400 font-bold">· 35mm</span>
        </Link>
        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-ink-50">Create your account</h2>
            <p className="mt-1 text-sm text-ink-200">Start logging your rolls.</p>
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
                <p className="text-xs text-red-400 mt-1">Letters, numbers, underscore only</p>
              )}
            </div>
            <div>
              <label className="label">Full name</label>
              <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className="input" placeholder="Your name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input value={form.email} onChange={(e) => set('email', e.target.value)} type="email" required className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input value={form.password} onChange={(e) => set('password', e.target.value)} type="password" required className="input" />
              {form.password && (
                <div className="mt-1.5">
                  <div className="h-1 w-full bg-ink-600 rounded overflow-hidden">
                    <div className={`h-full transition-all ${strengthColor}`} style={{ width: `${(strength / 5) * 100}%` }} />
                  </div>
                  <div className="text-xs text-ink-200 mt-0.5">{strengthLabel}</div>
                </div>
              )}
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input value={form.confirm} onChange={(e) => set('confirm', e.target.value)} type="password" required className="input" />
              {form.confirm && form.password !== form.confirm && (
                <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
              )}
            </div>
            <button type="submit" disabled={!valid || m.isPending} className="btn-primary w-full">
              {m.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-200">
            Already have an account?{' '}
            <Link to="/login" className="link-amber font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
