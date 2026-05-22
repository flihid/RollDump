import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MailCheck, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const token = params.get('token');

  useEffect(() => {
    if (!token) return;
    setStatus('loading');
    api
      .get(`/auth/verify?token=${token}`)
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/login'), 2500);
      })
      .catch(() => setStatus('error'));
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto w-10 h-10 text-primary-400 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-ink-900">Verifying…</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto w-12 h-12 text-emerald-400" />
            <h2 className="mt-4 text-xl font-semibold text-ink-900">Account verified!</h2>
            <p className="mt-2 text-sm text-ink-600">Redirecting to sign in…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-xl font-semibold text-ink-900">Invalid link</h2>
            <p className="mt-2 text-sm text-ink-600">The verification link may have expired.</p>
            <Link to="/login" className="btn-primary mt-4">Back to sign in</Link>
          </>
        )}
        {status === 'idle' && (
          <>
            <MailCheck className="mx-auto w-12 h-12 text-primary-400" />
            <h2 className="mt-4 text-xl font-semibold text-ink-900">Check your email</h2>
            <p className="mt-2 text-sm text-ink-600">
              We've sent you a verification link. Click it to activate your account.
            </p>
            <Link to="/login" className="btn-secondary mt-4">Back to sign in</Link>
          </>
        )}
      </div>
    </div>
  );
}
