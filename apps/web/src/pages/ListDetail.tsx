import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import toast from 'react-hot-toast';

interface ListItem {
  id: string;
  personalNote: string | null;
  variantId: string;
  format: string;
  frameSize: string | null;
  filmName: string;
  filmBrand: string;
  filmSlug: string;
  imageUrl: string | null;
}

interface ListDetail {
  id: string;
  title: string;
  description: string | null;
  isPublic: number;
  createdAt: string;
  username: string;
  avatarUrl: string | null;
  items: ListItem[];
}

const ShareDrawer = ({ isOpen, onClose, listTitle, listSlug, username }: { 
  isOpen: boolean; 
  onClose: () => void; 
  listTitle: string; 
  listSlug: string;
  username: string;
}) => {
  const shareUrl = `${window.location.origin}/profile/${username}/list/${listSlug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Tautan disalin ke papan klip! 📋');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Bagikan Koleksi</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          {/* Social Card Preview */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
             <div className="aspect-[1.91/1] bg-indigo-600 rounded-xl mb-3 flex items-center justify-center text-white text-center p-6">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Rolldump Collection</p>
                   <h4 className="text-xl font-bold leading-tight">{listTitle}</h4>
                   <p className="text-xs mt-2 opacity-80">by @{username}</p>
                </div>
             </div>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Preview Social Card</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-3 w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition font-bold text-gray-700"
            >
              <span className="text-xl">🔗</span> Salin Tautan
            </button>
            <a 
              href={`https://twitter.com/intent/tweet?text=Cek koleksi film analog saya: ${listTitle}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 w-full p-4 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 rounded-2xl transition font-bold text-[#1DA1F2]"
            >
              <span className="text-xl">𝕏</span> Bagikan ke X
            </a>
            <a 
              href={`https://wa.me/?text=${encodeURIComponent(`Cek koleksi film analog saya "${listTitle}": ${shareUrl}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 w-full p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 rounded-2xl transition font-bold text-[#25D366]"
            >
              <span className="text-xl">📱</span> Bagikan ke WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ListDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchListDetail = async () => {
      setLoading(true);
      try {
        const data = await fetchApi(`/api/v1/lists/${slug}`);
        setList(data.list);
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat detail list');
        if (err.message === 'List not found') navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchListDetail();
  }, [slug, navigate]);

  const handleDeleteItem = async (itemId: string) => {
    if (!list || !window.confirm('Hapus film ini dari list?')) return;
    try {
      await fetchApi(`/api/v1/lists/${list.id}/items/${itemId}`, { method: 'DELETE' });
      toast.success('Berhasil dihapus');
      setList({
        ...list,
        items: list.items.filter(item => item.id !== itemId)
      });
    } catch (err) {
      toast.error('Gagal menghapus item');
    }
  };

  const handleTogglePrivacy = async () => {
    if (!list) return;
    setIsTogglingPrivacy(true);
    try {
      const newStatus = list.isPublic === 1 ? 0 : 1;
      await fetchApi(`/api/v1/lists/${list.id}/privacy`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic: newStatus }),
      });
      setList({ ...list, isPublic: newStatus });
      toast.success(`List sekarang ${newStatus === 1 ? 'Publik' : 'Privat'}`);
    } catch (err) {
      toast.error('Gagal mengubah privasi');
    } finally {
      setIsTogglingPrivacy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!list) return null;

  const isOwner = currentUser.username === list.username;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <button 
            onClick={() => navigate(-1)}
            className="mb-8 text-sm text-gray-500 hover:text-gray-900 transition flex items-center gap-1"
          >
            &larr; Kembali
          </button>

          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">{list.title}</h1>
            {list.description && <p className="text-gray-500 text-lg mb-6 leading-relaxed">{list.description}</p>}
            
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
               <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                  <Link to={`/profile/${list.username}`} className="flex items-center gap-2 group">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                      {list.avatarUrl ? (
                        <img src={list.avatarUrl} alt={list.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                          {list.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition">@{list.username}</span>
                  </Link>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{list.items.length} Item</span>
               </div>

               <button 
                onClick={() => setShowShare(true)}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 transition shadow-md"
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                 Bagikan
               </button>

               {isOwner && (
                 <button
                   onClick={handleTogglePrivacy}
                   disabled={isTogglingPrivacy}
                   className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition shadow-md ${
                     list.isPublic === 1 
                       ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                       : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                   }`}
                 >
                   {isTogglingPrivacy ? '...' : (list.isPublic === 1 ? '🔒 Set Privat' : '🌍 Set Publik')}
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-6xl mx-auto px-4 mt-12">
        {list.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-4xl mb-4">Empty 📭</p>
            <p className="text-gray-500 font-medium">List ini masih kosong.</p>
            {isOwner && (
              <Link to="/films" className="mt-4 inline-block text-indigo-600 font-bold hover:underline">
                Mulai tambahkan film favorit Anda &rarr;
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {list.items.map(item => (
              <div key={item.id} className="group relative">
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
                  {/* Poster */}
                  <Link to={`/films/${item.filmSlug}`} className="block relative aspect-[3/4] bg-gray-100 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.filmName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🎞️</div>
                    )}
                    
                    {/* Format Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md shadow-sm rounded-full text-[10px] font-black uppercase tracking-tighter text-gray-900 border border-white/20">
                        {item.format}
                      </span>
                    </div>

                    {/* Delete Overlay for Owner */}
                    {isOwner && (
                      <button
                        onClick={(e) => { e.preventDefault(); handleDeleteItem(item.id); }}
                        className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </Link>

                  <div className="p-5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.filmBrand}</p>
                    <h3 className="font-bold text-gray-900 truncate leading-tight mb-3 group-hover:text-indigo-600 transition">{item.filmName}</h3>
                    
                    {item.personalNote && (
                      <div className="relative pt-4 border-t border-gray-50 italic text-gray-600 text-xs leading-relaxed">
                        <span className="absolute -top-2 left-2 text-2xl text-indigo-200 font-serif leading-none">“</span>
                        {item.personalNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ShareDrawer 
        isOpen={showShare} 
        onClose={() => setShowShare(false)} 
        listTitle={list.title} 
        listSlug={slug!} 
        username={list.username} 
      />
    </div>
  );
}
