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
    onSuccess: (data: any) => {
      setAuth(data.access_token, data.refresh_token, data.user);
      toast.success('Welcome back!');
      const next = params.get('next') || '/';
      navigate(next);
    },
    onError: (e: any) => {
      if (e.data?.code === 'VERIFY_REQUIRED') {
        setVerifyHint(true);
      }
      toast.error(e.message || 'Sign-in failed');
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size={42} showTagline />
        </div>
        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-ink-50">Sign in</h2>
            <p className="mt-1 text-sm text-ink-200">Continue your darkroom journal.</p>
          </div>

          {verifyHint && (
            <div className="mb-4 p-3 rounded-md bg-primary-500/10 border border-primary-500/30 text-sm text-primary-200">
              Your account isn't verified yet. <Link to="/verify" className="font-medium underline link-amber">Verify now</Link>.
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              m.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">Email or username</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                <Link to="/forgot-password" className="text-xs link-amber">
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
            <button type="submit" disabled={m.isPending} className="btn-primary w-full">
              {m.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-200">
            New here?{' '}
            <Link to="/register" className="link-amber font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
