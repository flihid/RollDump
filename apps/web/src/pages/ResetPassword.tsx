import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Token tidak valid atau hilang');
      return;
    }
    if (password.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8788/api/v1/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Terjadi kesalahan');
      }

      toast.success('Password berhasil diubah');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Token Tidak Valid</h1>
          <p className="text-gray-600 mb-6">Tautan pemulihan sandi tidak lengkap atau sudah kadaluarsa.</p>
          <Link to="/forgot-password" className="text-primary-600 font-semibold hover:underline">Kembali Minta Tautan Baru</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Buat Sandi Baru</h1>
          <p className="text-gray-500 mt-2">Masukkan kata sandi baru untuk akun Anda.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="Ketik ulang password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
