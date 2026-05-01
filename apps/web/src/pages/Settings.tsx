import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const FORMATS = [
  { id: '35mm', label: '35mm (Standard)' },
  { id: '120', label: '120 (Medium Format)' },
  { id: 'large_format', label: 'Large Format' },
];

const Settings = () => {
  const [preferences, setPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:8788/api/v1/users/${currentUser.username}`);
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setPreferences(data.user.formatPreferences || []);
      } catch (err) {
        toast.error('Gagal memuat preferensi');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser.username) fetchProfile();
  }, [currentUser.username]);

  const handleToggle = (formatId: string) => {
    setPreferences(prev => 
      prev.includes(formatId) 
        ? prev.filter(id => id !== formatId)
        : [...prev, formatId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch('http://localhost:8788/api/v1/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      if (!res.ok) throw new Error('Gagal menyimpan preferensi');
      
      toast.success('Preferensi format disimpan');
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan.')) return;
    
    setDeleting(true);
    const token = localStorage.getItem('access_token');
    
    try {
      const res = await fetch('http://localhost:8788/api/v1/users/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Gagal menghapus akun');
      
      toast.success('Akun berhasil dihapus');
      localStorage.clear();
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-4 pt-12 relative">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-xl">
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 text-sm text-gray-500 hover:text-gray-900 transition flex items-center gap-1"
        >
          &larr; Kembali
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Pengaturan Akun</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Preferensi Format Film</h2>
          <p className="text-gray-500 mb-4 text-sm">Pilih format film yang sering Anda gunakan untuk mendapatkan rekomendasi film yang sesuai.</p>
          
          <div className="space-y-3">
            {FORMATS.map(format => (
              <label key={format.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black accent-black"
                  checked={preferences.includes(format.id)}
                  onChange={() => handleToggle(format.id)}
                />
                <span className="font-medium text-gray-800">{format.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition disabled:opacity-50 mb-8"
        >
          {saving ? 'Menyimpan...' : 'Simpan Preferensi'}
        </button>

        <div className="pt-8 border-t border-red-100">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Zona Berbahaya</h2>
          <p className="text-gray-500 mb-4 text-sm">Menghapus akun akan menghapus seluruh data profil dan preferensi Anda secara permanen. Anda dapat mendaftar kembali menggunakan email yang sama nantinya.</p>
          <button 
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="w-full py-3 bg-red-50 text-red-600 border border-red-200 font-semibold rounded-lg hover:bg-red-100 transition disabled:opacity-50"
          >
            {deleting ? 'Menghapus...' : 'Hapus Akun Saya'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
