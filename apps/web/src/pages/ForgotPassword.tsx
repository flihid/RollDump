import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8788/api/v1/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Terjadi kesalahan');
      }

      toast.success('Tautan telah dikirim');
      setEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim tautan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Lupa Password?</h1>
          <p className="text-gray-500 mt-2">Masukkan email Anda untuk menerima tautan pemulihan sandi.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="nama@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : 'Kirim Tautan'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600 text-sm">
          Kembali ke <Link to="/login" className="text-primary-600 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
