import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import toast from 'react-hot-toast';

interface Tip {
  id: string;
  title: string;
  content: string;
  targetFormat: string;
  netScore: number;
  createdAt: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
}

const formatLabel: Record<string, string> = {
  'All': 'Semua Format',
  '35mm': '35mm',
  '120': '120',
  'Large_Format': 'Large Format',
};

// ── Tip Card Component ──
const TipCard = ({ tip, onVote, onReport, onDelete }: {
  tip: Tip;
  onVote: (id: string, type: number) => void;
  onReport: (id: string) => void;
  onDelete?: (id: string) => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [voteStatus, setVoteStatus] = useState<number>(0); // 1, -1, or 0
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 hover:shadow-sm transition-shadow">
      {/* Voting column */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => {
            const newVote = voteStatus === 1 ? 0 : 1;
            setVoteStatus(newVote);
            onVote(tip.id, 1);
          }}
          className={`p-1.5 rounded-lg transition-colors ${voteStatus === 1 ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <span className={`text-sm font-bold ${voteStatus === 1 ? 'text-red-600' : voteStatus === -1 ? 'text-indigo-600' : 'text-gray-700'}`}>
          {tip.netScore}
        </span>
        <button
          onClick={() => {
            const newVote = voteStatus === -1 ? 0 : -1;
            setVoteStatus(newVote);
            onVote(tip.id, -1);
          }}
          className={`p-1.5 rounded-lg transition-colors ${voteStatus === -1 ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
             <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">
               {formatLabel[tip.targetFormat]}
             </span>
             <span className="text-xs text-gray-400">• oleh {tip.username}</span>
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1 min-w-[140px]">
                <button
                  onClick={() => { setMenuOpen(false); onReport(tip.id); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  🚩 Laporkan
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { setMenuOpen(false); onDelete?.(tip.id); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                  >
                    🗑️ Hapus (Admin)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{tip.title}</h3>
        <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
          {tip.content}
        </div>
      </div>
    </div>
  );
};

// ── Main Tips Section ──
export default function TipsSection({ filmId, filmSlug }: { filmId: string, filmSlug: string }) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'top' | 'new'>('top');

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showReport, setShowReport] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetFormat, setTargetFormat] = useState('All');
  const [submitting, setSubmitting] = useState(false);

  // Report state
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDesc, setReportDesc] = useState('');

  const token = localStorage.getItem('access_token');

  const fetchTips = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: sortBy });
      if (activeFilter !== 'All') params.set('format', activeFilter);
      const data = await fetchApi(`/api/v1/films/${filmSlug}/tips?${params.toString()}`);
      setTips(data.tips || []);
    } catch (err) {
      console.error('Error fetching tips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, [filmSlug, activeFilter, sortBy]);

  const handleSubmit = async () => {
    if (title.length < 5 || title.length > 100) return toast.error('Judul harus 5-100 karakter');
    if (content.length < 50) return toast.error('Konten minimal 50 karakter');

    setSubmitting(true);
    try {
      await fetchApi(`/api/v1/films/${filmId}/tips`, {
        method: 'POST',
        body: JSON.stringify({ title, content, targetFormat }),
      });
      toast.success('Tips berhasil dipublikasikan! 💡');
      setShowForm(false);
      setTitle('');
      setContent('');
      fetchTips();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim tips');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (id: string, type: number) => {
    if (!token) return toast.error('Silakan login untuk memberikan vote');
    try {
      // Note: Backend handles toggle logic
      await fetchApi(`/api/v1/tips/${id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ voteType: type }),
      });
      // Silent refresh or optimistic UI would be better, but for simplicity:
      fetchTips();
    } catch (err) {
      toast.error('Gagal memproses vote');
    }
  };

  const handleReport = async () => {
    if (!showReport) return;
    try {
      await fetchApi(`/api/v1/tips/${showReport}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason: reportReason, description: reportDesc }),
      });
      toast.success('Terima kasih atas laporan Anda.');
      setShowReport(null);
      setReportReason('Spam');
      setReportDesc('');
    } catch (err) {
      toast.error('Gagal mengirim laporan');
    }
  };

  const handleAdminDelete = async (id: string) => {
    if (!window.confirm('Hapus tips ini sebagai admin?')) return;
    try {
      await fetchApi(`/api/v1/admin/tips/${id}`, { method: 'DELETE' });
      toast.success('Tips dihapus oleh admin');
      fetchTips();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus tips');
    }
  };

  return (
    <div className="mt-12 mb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">💡 Tips & Panduan Teknis</h2>
          <p className="text-sm text-gray-500 mt-1">Saran dari komunitas untuk hasil terbaik</p>
        </div>
        
        {token && (
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-md hover:shadow-lg"
          >
            + Tulis Panduan
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {['All', '35mm', '120', 'Large_Format'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeFilter === f ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600'
              }`}
            >
              {formatLabel[f]}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="top">Terpopuler</option>
          <option value="new">Terbaru</option>
        </select>
      </div>

      {/* Tips List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      ) : tips.length === 0 ? (
        <div className="text-center py-16 bg-indigo-50/30 rounded-3xl border border-dashed border-indigo-100">
          <p className="text-4xl mb-4">📖</p>
          <p className="text-indigo-900 font-semibold text-lg">Belum ada panduan teknis</p>
          <p className="text-indigo-400 text-sm mt-1">Bagikan pengetahuan Anda dengan fotografer lain!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tips.map(tip => (
            <TipCard 
              key={tip.id} 
              tip={tip} 
              onVote={handleVote} 
              onReport={setShowReport} 
              onDelete={handleAdminDelete} 
            />
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">✍️ Buat Panduan Baru</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Target Format</label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(formatLabel).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Judul (Singkat & Jelas)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Tips Push Kodak Gold 200 ke ISO 400"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Isi Panduan (Markdown supported)</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder="Jelaskan langkah-langkah atau tips teknis Anda di sini..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm"
                />
                <div className="flex justify-between mt-2">
                  <span className={`text-xs ${content.length < 50 && content.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {content.length}/50 min
                  </span>
                  <span className="text-xs text-gray-400">Gunakan Markdown untuk formatting</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || content.length < 50 || title.length < 5}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Mengirim...' : 'Publikasikan Tips'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">🚩 Laporkan Tips</h3>
            <p className="text-sm text-gray-500 mb-6">Mengapa Anda melaporkan panduan ini?</p>
            
            <div className="space-y-4">
              {['Spam', 'Misinformation', 'Harmful'].map(r => (
                <label key={r} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reportReason === r}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{r}</span>
                </label>
              ))}
              
              <textarea
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Detail tambahan (opsional)..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
              />

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowReport(null)} className="flex-1 py-2.5 text-gray-500 font-bold text-sm">Batal</button>
                <button onClick={handleReport} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 text-sm">Kirim Laporan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
