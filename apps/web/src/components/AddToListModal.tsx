import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import toast from 'react-hot-toast';

interface Variant {
  id: string;
  format: string;
  frameSize: string | null;
}

interface UserList {
  id: string;
  title: string;
  isPublic: number;
}

const formatLabel: Record<string, string> = {
  '35mm': '35mm',
  '120': '120',
  'large_format': 'Large Format',
};

export default function AddToListModal({ isOpen, onClose, filmName, variants }: {
  isOpen: boolean;
  onClose: () => void;
  filmName: string;
  variants: Variant[];
}) {
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  
  // Quick Create List State
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Track which lists already have this variant
  const [existingListIds, setExistingListIds] = useState<string[]>([]);

  const fetchLists = async () => {
    try {
      const data = await fetchApi('/api/v1/my/lists');
      setLists(data.lists || []);
    } catch (err) {}
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [listsData, checkData] = await Promise.all([
          fetchApi('/api/v1/my/lists'),
          selectedVariantId ? fetchApi(`/api/v1/my/variant-lists/${selectedVariantId}`) : Promise.resolve({ listIds: [] })
        ]);
        setLists(listsData.lists || []);
        if (selectedVariantId) setExistingListIds(checkData.listIds || []);
      } catch (err) {
        toast.error('Gagal memuat data list');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, selectedVariantId]);

  // Set default variant if only one
  useEffect(() => {
    if (variants.length === 1 && !selectedVariantId) {
      setSelectedVariantId(variants[0].id);
    }
  }, [variants, selectedVariantId]);

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.length < 3) return toast.error('Judul minimal 3 karakter');
    
    setIsCreatingList(true);
    try {
      const data = await fetchApi('/api/v1/lists', {
        method: 'POST',
        body: JSON.stringify({ title: newListTitle, isPublic: 1 }),
      });
      toast.success('List baru dibuat! 📂');
      setNewListTitle('');
      setShowQuickCreate(false);
      // Refresh lists and select the new one automatically
      await fetchLists();
      // Auto add to this new list? Let's just let the user click it.
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat list');
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleAddToList = async (listId: string) => {
    if (!selectedVariantId) {
      toast.error('Pilih format film terlebih dahulu');
      return;
    }

    setSubmitting(listId);
    try {
      await fetchApi(`/api/v1/lists/${listId}/items`, {
        method: 'POST',
        body: JSON.stringify({
          filmVariantId: selectedVariantId,
          personalNote: personalNote || undefined,
        }),
      });
      toast.success('Berhasil ditambahkan ke koleksi! ✨');
      setExistingListIds(prev => [...prev, listId]);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan ke list');
    } finally {
      setSubmitting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">📂 Simpan ke Koleksi</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Film Info */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Film</p>
            <p className="font-bold text-gray-900">{filmName}</p>
          </div>

          {/* Variant Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pilih Format *</label>
            <div className="grid grid-cols-1 gap-2">
              {variants.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedVariantId === v.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <span className="font-semibold text-sm">{formatLabel[v.format]}</span>
                  <span className="text-xs opacity-60">{v.frameSize}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Note */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Catatan Pribadi (Opsional)</label>
            <textarea
              value={personalNote}
              onChange={e => setPersonalNote(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              placeholder="Kenapa Anda merekomendasikan film ini?"
              rows={2}
            />
          </div>

          {/* List Selection */}
          <div>
            <div className="flex justify-between items-center mb-3">
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Pilih List Anda</label>
               <button 
                onClick={() => setShowQuickCreate(!showQuickCreate)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition"
               >
                 {showQuickCreate ? '✕ Batal' : '+ List Baru'}
               </button>
            </div>

            {showQuickCreate ? (
              <form onSubmit={handleQuickCreate} className="space-y-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Nama List Baru (misal: Sunset Vibes)"
                  value={newListTitle}
                  onChange={e => setNewListTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button 
                  type="submit"
                  disabled={isCreatingList || newListTitle.length < 3}
                  className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {isCreatingList ? 'Membuat...' : 'Buat & Pilih'}
                </button>
              </form>
            ) : loading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Anda belum punya list</p>
                <button 
                  onClick={() => setShowQuickCreate(true)}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Buat List Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {lists.map(list => {
                  const isAlreadyIn = existingListIds.includes(list.id);
                  return (
                    <button
                      key={list.id}
                      disabled={isAlreadyIn || !!submitting}
                      onClick={() => handleAddToList(list.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        isAlreadyIn 
                          ? 'bg-green-50 text-green-700 border border-green-100 cursor-default' 
                          : 'bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{list.title}</span>
                        {list.isPublic === 0 && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Private</span>}
                      </div>
                      {isAlreadyIn ? (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      ) : submitting === list.id ? (
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
