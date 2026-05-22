import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { setAuth } from '../../store/auth';
import Logo from '../../components/Logo';

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
      // If the dev environment auto-verifies (returns access_token directly),
      // log the user in and send them straight to onboarding. Otherwise show
      // the verify-email screen.
      if (data.access_token) {
        setAuth(data.access_token, data.refresh_token, data.user);
        toast.success('Account created! Let\'s set up your taste.');
        navigate('/onboarding');
      } else {
        toast.success('Account created! Check your email to verify.');
        navigate(`/verify?token=${data.verify_token || ''}`);
      }
    },
    onError: (e: any) => toast.error(e.message || 'Registration failed'),
  });

  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][strength] || 'Very weak';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#f5f0e1' }}>
      <div className="auth-wrap w-full max-w-5xl">
        {/* LEFT — INK SLAB */}
        <div className="auth-left">
          <div>
            <Logo size={48} showWordmark={false} />
            <div className="brand-big mt-5">RollDump</div>
            <div className="tagline-big">Every roll tells a story. <br /> Share yours.</div>
            <div className="desc-big">
              Free forever. Track unlimited rolls, write reviews, and follow other shooters.
              Join thousands cataloging their analog journey.
            </div>
          </div>
          <div className="testimonial">
            <p>
              "I came for the catalog, stayed for the community.
              Every roll I shoot now gets logged here first."
            </p>
            <div className="who">— Maya Rinjani · Medium-Format · Jakarta</div>
          </div>
        </div>

        {/* RIGHT — FORM */}
        <div className="auth-right">
          <h2>Start your journey</h2>
          <p className="sub">Sign up free to start logging your rolls.</p>

          <div className="auth-tabs">
            <Link to="/login" className="text-center"><button type="button">Sign In</button></Link>
            <button className="active" type="button">Create Account</button>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); if (valid) m.mutate(); }}
            className="space-y-4"
          >
            <div className="field">
              <label>Username</label>
              <input
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                required
                className="input"
                placeholder="@your_handle"
              />
              <div className="hint">3–20 characters · letters, numbers, underscore</div>
              {form.username && !/^[a-zA-Z0-9_]+$/.test(form.username) && (
                <p className="err">⚠ Only letters, numbers, and underscores</p>
              )}
            </div>
            <div className="field">
              <label>Full Name</label>
              <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className="input" placeholder="Your name" />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={form.email} onChange={(e) => set('email', e.target.value)} type="email" required className="input" placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input value={form.password} onChange={(e) => set('password', e.target.value)} type="password" required className="input" placeholder="Min 8 chars, mix case + numbers" />
              {form.password && (
                <>
                  <div className="password-bar mt-2">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className={s <= strength ? (strength <= 1 ? 'strong-1' : strength === 2 ? 'strong-2' : 'strong-3') : ''}
                      />
                    ))}
                  </div>
                  <div className="hint">{strengthLabel}</div>
                </>
              )}
            </div>
            <div className="field">
              <label>Confirm Password</label>
              <input value={form.confirm} onChange={(e) => set('confirm', e.target.value)} type="password" required className="input" />
              {form.confirm && form.password !== form.confirm && (
                <p className="err">⚠ Passwords don't match</p>
              )}
            </div>
            <button type="submit" disabled={!valid || m.isPending} className="btn-primary w-full !justify-center">
              {m.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account & Start'}
            </button>
          </form>

          <p className="text-sm mt-6 text-center" style={{ color: '#7a7a7a' }}>
            By signing up you agree to our{' '}
            <a href="#" style={{ color: '#c68a0e', textDecoration: 'underline' }}>Terms</a>
            {' '}and{' '}
            <a href="#" style={{ color: '#c68a0e', textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
