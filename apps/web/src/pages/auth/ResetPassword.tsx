import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const m = useMutation({
    mutationFn: () => api.post('/auth/reset-password', { token, new_password: pw }),
    onSuccess: () => {
      toast.success('Password berhasil diubah');
      navigate('/login');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const valid = pw.length >= 8 && pw === confirm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4">
      <div className="card p-8 max-w-md w-full">
        <KeyRound className="mx-auto w-10 h-10 text-primary-600" />
        <h2 className="mt-4 text-xl font-semibold text-center">Reset password</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) m.mutate();
          }}
          className="mt-6 space-y-3"
        >
          <input type="password" className="input" placeholder="Password baru (min 8 char)" value={pw} onChange={(e) => setPw(e.target.value)} />
          <input type="password" className="input" placeholder="Konfirmasi" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {confirm && pw !== confirm && <p className="text-xs text-red-600">Tidak cocok</p>}
          <button className="btn-primary w-full" disabled={!valid || m.isPending}>
            Simpan
          </button>
        </form>
        <Link to="/login" className="block text-center text-xs text-ink-500 mt-4">
          Kembali ke login
        </Link>
      </div>
    </div>
  );
}
