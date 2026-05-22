import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { setAuth } from '../../store/auth';
import Logo from '../../components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [verifyHint, setVerifyHint] = useState(false);

  const m = useMutation({
    mutationFn: () => api.post('/auth/login', { identifier, password }),
    onSuccess: async (data: any) => {
      setAuth(data.access_token, data.refresh_token, data.user);
      toast.success('Welcome back!');
      // Check whether the user has completed onboarding (any prefs saved).
      // If not, redirect there so first-time logins land on the wizard.
      let next = params.get('next') || '/';
      try {
        const prefs = await api.get('/users/me/preferences');
        const fp = prefs?.preferences?.formatPreferences;
        if (!fp || (Array.isArray(fp) && fp.length === 0)) next = '/onboarding';
      } catch {}
      navigate(next);
    },
    onError: (e: any) => {
      if (e.data?.code === 'VERIFY_REQUIRED') setVerifyHint(true);
      toast.error(e.message || 'Login failed');
    },
  });

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
              The community platform for analog photographers. Review films,
              upload rolls, and discover authentic aesthetics from shooters worldwide.
            </div>
          </div>
          <div className="testimonial">
            <p>
              "Finally a place that truly gets the grain on Portra 400.
              The community is alive, reviews are technical — not just aesthetic."
            </p>
            <div className="who">— Arundaya · 35mm Shooter · Bandung</div>
          </div>
        </div>

        {/* RIGHT — FORM */}
        <div className="auth-right">
          <h2>Welcome back</h2>
          <p className="sub">Sign in to continue your roll journal.</p>

          <div className="auth-tabs">
            <button className="active" type="button">Sign In</button>
            <Link to="/register" className="text-center"><button type="button">Create Account</button></Link>
          </div>

          {verifyHint && (
            <div className="mb-4 p-3 rounded-md text-sm" style={{ background: 'rgba(224,138,26,0.1)', border: '1px solid rgba(224,138,26,0.4)', color: '#9a5e10' }}>
              Your account isn't verified yet. <Link to="/verify" className="font-semibold underline">Verify now</Link>.
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
            className="space-y-4"
          >
            <div className="field">
              <label>Email or Username</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div className="field">
              <div className="flex items-center justify-between">
                <label>Password</label>
                <Link to="/forgot-password" className="text-xs" style={{ color: '#c68a0e' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                type="password"
                className="input"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={m.isPending} className="btn-primary w-full !justify-center">
              {m.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="divider">or</div>
          <button className="btn-ghost w-full !justify-center" type="button">Continue with Google</button>

          <p className="text-sm mt-6 text-center" style={{ color: '#7a7a7a' }}>
            By signing in you agree to our{' '}
            <a href="#" style={{ color: '#c68a0e', textDecoration: 'underline' }}>Terms</a>
            {' '}and{' '}
            <a href="#" style={{ color: '#c68a0e', textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
