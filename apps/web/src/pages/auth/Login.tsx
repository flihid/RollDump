import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { LogIn, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { setAuth } from '../../store/auth';

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
      toast.success('Selamat datang kembali!');
      const next = params.get('next') || '/';
      navigate(next);
    },
    onError: (e: any) => {
      if (e.data?.code === 'VERIFY_REQUIRED') {
        setVerifyHint(true);
      }
      toast.error(e.message || 'Login gagal');
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 font-bold text-2xl mb-6">
          <span className="text-primary-600">●</span> RollDump
        </Link>
        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              <LogIn className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">Masuk ke akun Anda</h2>
            <p className="mt-1 text-sm text-ink-600">Lanjutkan eksplorasi film analog Anda.</p>
          </div>

          {verifyHint && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              Akun Anda belum diverifikasi. <Link to="/verify" className="font-medium underline">Verifikasi sekarang</Link>.
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
              <label className="label">Email atau Username</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="input"
                placeholder="ahmad@contoh.com / ahmad"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
                  Lupa password?
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
              {m.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Masuk'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-600">
            Belum punya akun?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
