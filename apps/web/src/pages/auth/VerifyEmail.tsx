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
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4">
      <div className="card p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto w-10 h-10 text-primary-600 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold">Memverifikasi…</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto w-12 h-12 text-emerald-500" />
            <h2 className="mt-4 text-xl font-semibold">Akun terverifikasi!</h2>
            <p className="mt-2 text-sm text-ink-600">Mengarahkan ke halaman login…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-xl font-semibold">Tautan tidak valid</h2>
            <p className="mt-2 text-sm text-ink-600">Tautan verifikasi mungkin sudah kedaluwarsa.</p>
            <Link to="/login" className="btn-primary mt-4">Kembali ke login</Link>
          </>
        )}
        {status === 'idle' && (
          <>
            <MailCheck className="mx-auto w-12 h-12 text-primary-600" />
            <h2 className="mt-4 text-xl font-semibold">Cek email Anda</h2>
            <p className="mt-2 text-sm text-ink-600">
              Kami telah mengirim tautan verifikasi. Klik tautan di email tersebut untuk mengaktifkan akun.
            </p>
            <Link to="/login" className="btn-secondary mt-4">Kembali ke login</Link>
          </>
        )}
      </div>
    </div>
  );
}
