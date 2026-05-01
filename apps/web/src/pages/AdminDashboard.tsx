import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  tipId: string;
  tipTitle: string;
  tipContent: string;
  reporterUsername: string;
}

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'admin') {
      toast.error('Akses ditolak');
      navigate('/');
      return;
    }

    const fetchReports = async () => {
      try {
        const data = await fetchApi('/api/v1/admin/reports');
        setReports(data.reports || []);
      } catch (err) {
        toast.error('Gagal memuat laporan');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleDeleteTip = async (tipId: string) => {
    if (!window.confirm('Hapus tips ini secara permanen?')) return;
    try {
      await fetchApi(`/api/v1/admin/tips/${tipId}`, { method: 'DELETE' });
      toast.success('Tips berhasil dihapus');
      // Refresh reports (they will be gone because of CASCADE or inner join)
      const data = await fetchApi('/api/v1/admin/reports');
      setReports(data.reports || []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus tips');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🛡️ Admin Moderation</h1>
            <p className="text-sm text-gray-500">Pantau laporan komunitas dan jaga kualitas konten</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/admin/films/add')}
              className="px-4 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition shadow-sm"
            >
              + Tambah Film
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-800">Laporan Tips & Panduan ({reports.length})</h2>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400">Memuat laporan...</div>
            ) : reports.length === 0 ? (
              <div className="p-20 text-center">
                <p className="text-4xl mb-4">✅</p>
                <p className="text-gray-500 font-medium">Belum ada laporan baru</p>
                <p className="text-gray-400 text-sm">Komunitas Anda terlihat bersih!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {reports.map(report => (
                  <div key={report.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            report.reason === 'Harmful' ? 'bg-red-100 text-red-600' : 
                            report.reason === 'Misinformation' ? 'bg-orange-100 text-orange-600' : 
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {report.reason}
                          </span>
                          <span className="text-xs text-gray-400">Dilaporkan oleh <b>{report.reporterUsername}</b> • {new Date(report.createdAt).toLocaleString()}</span>
                        </div>
                        
                        {report.description && (
                          <p className="text-sm text-gray-700 bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4">
                            <b>Catatan Pelapor:</b> "{report.description}"
                          </p>
                        )}

                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Konten yang Dilaporkan:</p>
                          <h3 className="font-bold text-gray-900 mb-2">{report.tipTitle}</h3>
                          <p className="text-sm text-gray-600 line-clamp-3">{report.tipContent}</p>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button 
                          onClick={() => handleDeleteTip(report.tipId)}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition shadow-sm"
                        >
                          Hapus Konten
                        </button>
                        {/* Future: Dismiss report button */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
