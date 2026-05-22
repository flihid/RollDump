import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [resetLink, setResetLink] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => api.post('/auth/forgot-password', { email }),
    onSuccess: (data: any) => {
      toast.success('Check your email');
      if (data.reset_token) setResetLink(`/reset-password?token=${data.reset_token}`);
    },
  });
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full">
        <Mail className="mx-auto w-10 h-10 text-primary-400" />
        <h2 className="mt-4 text-xl font-semibold text-center text-ink-900">Forgot password</h2>
        <p className="mt-1 text-sm text-ink-600 text-center">
          Enter your email. If it's registered, we'll send you a reset link.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate();
          }}
          className="mt-6 space-y-3"
        >
          <input className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
          <button className="btn-primary w-full" disabled={m.isPending}>
            {m.isPending ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        {resetLink && (
          <div className="mt-4 p-3 rounded-md bg-ink-200 border border-ink-300 text-xs">
            <div className="font-semibold mb-1 text-ink-900">Demo: reset link</div>
            <Link to={resetLink} className="link-amber break-all">
              {resetLink}
            </Link>
          </div>
        )}
        <Link to="/login" className="block text-center text-xs text-ink-500 mt-4 hover:text-primary-400">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
