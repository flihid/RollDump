import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../lib/api';
import toast from 'react-hot-toast';

interface Variant {
  id: string;
  format: string;
  frameSize: string | null;
}

interface Photo {
  id: string;
  imageUrl: string;
  format: string;
  frameSize: string | null;
}

interface PhotoDetail extends Photo {
  caption: string | null;
  cameraUsed: string | null;
  lensUsed: string | null;
  createdAt: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  filmName: string;
  filmBrand: string;
}

const formatLabel: Record<string, string> = {
  '35mm': '35mm',
  '120': '120',
  'large_format': 'Large Format',
};

// ── Upload Modal Component ──
const UploadModal = ({ isOpen, onClose, variants, onUploadSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  variants: Variant[];
  onUploadSuccess: () => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [format, setFormat] = useState('');
  const [variantId, setVariantId] = useState('');
  const [caption, setCaption] = useState('');
  const [cameraUsed, setCameraUsed] = useState('');
  const [lensUsed, setLensUsed] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select variant based on format/frameSize logic
  const uniqueFormats = [...new Set(variants.map(v => v.format))];
  const formatVariants = variants.filter(v => v.format === format);

  // FIX: Move useEffect outside JSX to follow Rules of Hooks
  useEffect(() => {
    if (format && format !== '120' && formatVariants.length === 1) {
      setVariantId(formatVariants[0].id);
    }
  }, [format, formatVariants]);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diizinkan');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('Ukuran maksimal file 5MB');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    // FIX: Convert to Base64 so the image is actually saved in the DB
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setProgress(currentProgress);
        if (currentProgress >= 90) clearInterval(interval);
      }, 50);

      reader.onload = () => {
        clearInterval(interval);
        setProgress(100);
        resolve(reader.result as string);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!file || !variantId) {
      toast.error('Pilih foto dan varian film terlebih dahulu');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // 1. Upload to storage
      const imageUrl = await uploadToStorage(file);

      // 2. Save metadata to database
      await fetchApi('/api/v1/photos', {
        method: 'POST',
        body: JSON.stringify({
          filmVariantId: variantId,
          imageUrl,
          caption: caption || undefined,
          cameraUsed: cameraUsed || undefined,
          lensUsed: lensUsed || undefined,
        }),
      });

      toast.success('Foto berhasil diunggah! 📸');
      reset();
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah foto');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setFormat('');
    setVariantId('');
    setCaption('');
    setCameraUsed('');
    setLensUsed('');
    setProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">⬆️ Unggah Karya Analog</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Drag & Drop Area */}
          <div>
            <div
              className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center p-4 transition-colors relative overflow-hidden ${
                isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:bg-gray-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !preview && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              />
              
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70 backdrop-blur-md"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div className="text-center cursor-pointer">
                  <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700">Klik atau seret foto ke sini</p>
                  <p className="text-xs text-gray-400 mt-1">Maks 5MB (JPG, PNG, WebP)</p>
                </div>
              )}
            </div>

            {uploading && (
              <div className="mt-4">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-center text-gray-500 mt-1">Mengunggah... {progress}%</p>
              </div>
            )}
          </div>

          {/* Right: Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format *</label>
              <select
                value={format}
                onChange={(e) => {
                  setFormat(e.target.value);
                  setVariantId(''); // Reset variant when format changes
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Pilih Format</option>
                {uniqueFormats.map(f => (
                  <option key={f} value={f}>{formatLabel[f] || f}</option>
                ))}
              </select>
            </div>

            {format === '120' && formatVariants.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frame Size *</label>
                <select
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Pilih Frame Size</option>
                  {formatVariants.map(v => (
                    <option key={v.id} value={v.id}>{v.frameSize || 'Lainnya'}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kamera</label>
                <input
                  type="text"
                  value={cameraUsed}
                  onChange={e => setCameraUsed(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Opsional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lensa</label>
                <input
                  type="text"
                  value={lensUsed}
                  onChange={e => setLensUsed(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Opsional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Ceritakan tentang foto ini..."
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!file || !variantId || uploading}
              className="w-full py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50 mt-2"
            >
              {uploading ? 'Mengunggah...' : 'Unggah Foto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Lightbox Modal Component ──
import { LikeButton, CommentSection } from './SocialActions';

export const Lightbox = ({ photoId, onClose, onDeleteSuccess }: {
  photoId: string;
  onClose: () => void;
  onDeleteSuccess: () => void;
}) => {
  const [detail, setDetail] = useState<PhotoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef<number>(0);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await fetchApi(`/api/v1/photos/${photoId}`);
        setDetail(data.photo);
      } catch (err) {
        toast.error('Gagal memuat detail foto');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();

    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [photoId, onClose]);

  const handleDoubleTap = async () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
      
      // Trigger like if not already liked? 
      // The toggleLike API handles both.
      try {
        await fetchApi(`/api/v1/photo/${photoId}/like`, { method: 'POST' });
        // We might need to refresh stats or have a local state for stats
      } catch (err) {}
    }
    lastTap.current = now;
  };

  const handleDelete = async () => {
    try {
      await fetchApi(`/api/v1/photos/${photoId}`, { method: 'DELETE' });
      toast.success('Foto berhasil dihapus');
      onDeleteSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus foto');
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!detail) return null;

  const isOwner = currentUser?.id === detail.userId;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col md:flex-row backdrop-blur-md overflow-hidden">
      {/* Close button */}
      <button onClick={onClose} className="absolute top-4 left-4 z-[60] p-2 text-white/70 hover:text-white bg-black/20 rounded-full hover:bg-black/50 transition">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      {/* Main Image Area */}
      <div 
        className="flex-1 flex items-center justify-center p-4 md:p-8 relative h-[50vh] md:h-full cursor-pointer select-none"
        onClick={handleDoubleTap}
      >
        <img
          src={detail.imageUrl}
          alt={detail.caption || 'Film photo'}
          className="max-w-full max-h-full object-contain shadow-2xl"
        />

        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-out-0 duration-1000">
            <svg className="w-32 h-32 text-white fill-current drop-shadow-2xl" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Metadata & Social Sidebar */}
      <div className="w-full md:w-[450px] bg-white md:h-full overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden shrink-0">
               {detail.avatarUrl ? (
                  <img src={detail.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-indigo-600">
                    {detail.username.charAt(0).toUpperCase()}
                  </div>
                )}
            </div>
            <div>
              <p className="font-black text-gray-900 leading-tight">@{detail.username}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(detail.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <LikeButton 
            entityId={photoId} 
            entityType="photo" 
            initialLiked={false} 
            initialCount={0} 
          />
        </div>

        <div className="p-6 space-y-8 flex-1">
          {detail.caption && (
            <p className="text-gray-800 text-sm leading-relaxed italic border-l-4 border-indigo-100 pl-4">"{detail.caption}"</p>
          )}

          <div className="space-y-4 bg-gray-50 p-6 rounded-[32px] border border-gray-100">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Film Stock</p>
              <p className="font-black text-gray-900 text-lg">{detail.filmName}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Format</p>
                <span className="inline-flex px-3 py-1 bg-white border border-gray-100 text-xs font-black rounded-full text-gray-700 shadow-sm">
                  {formatLabel[detail.format] || detail.format} {detail.frameSize && `• ${detail.frameSize}`}
                </span>
              </div>
            </div>

            {(detail.cameraUsed || detail.lensUsed) && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/60">
                {detail.cameraUsed && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kamera</p>
                    <p className="text-xs font-bold text-gray-700 truncate" title={detail.cameraUsed}>📸 {detail.cameraUsed}</p>
                  </div>
                )}
                {detail.lensUsed && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lensa</p>
                    <p className="text-xs font-bold text-gray-700 truncate" title={detail.lensUsed}>👁️ {detail.lensUsed}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="pt-4">
             <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6">Diskusi Komunitas</h4>
             <CommentSection entityId={photoId} entityType="photo" />
          </div>
        </div>

        {/* Delete Action */}
        {(isOwner || isAdmin) && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-xs text-red-600 font-bold text-center mb-2 uppercase tracking-widest">Hapus karya ini secara permanen?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 text-xs font-black text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 shadow-sm">BATAL</button>
                  <button onClick={handleDelete} className="flex-1 py-3 text-xs font-black text-white bg-red-600 rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200">YA, HAPUS</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-black text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition"
              >
                🗑️ HAPUS KARYA INI
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


// ── Main Gallery Component ──
export default function PhotoGallery({ filmSlug, variants }: {
  filmSlug: string;
  variants: Variant[];
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [formatFilter, setFormatFilter] = useState('');
  const [frameFilter, setFrameFilter] = useState('');
  
  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

  const token = localStorage.getItem('access_token');
  const uniqueFormats = [...new Set(variants.map(v => v.format))];
  const uniqueFrames = [...new Set(variants.filter(v => v.format === formatFilter && v.frameSize).map(v => v.frameSize))];

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (formatFilter) params.set('format', formatFilter);
      if (frameFilter) params.set('frameSize', frameFilter);
      
      const data = await fetchApi(`/api/v1/films/${filmSlug}/photos?${params.toString()}`);
      setPhotos(data.photos || []);
    } catch (err) {
      console.error('Error fetching photos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
    // Reset frame filter if format changes
    if (formatFilter === '') setFrameFilter('');
  }, [filmSlug, formatFilter, frameFilter]);

  return (
    <div className="mt-12 mb-16">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🖼️ Galeri Komunitas</h2>
          <p className="text-sm text-gray-500 mt-1">Jelajahi hasil jepretan menggunakan film ini</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={formatFilter}
            onChange={(e) => { setFormatFilter(e.target.value); setFrameFilter(''); }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="">Semua Format</option>
            {uniqueFormats.map(f => (
              <option key={f} value={f}>{formatLabel[f] || f}</option>
            ))}
          </select>

          {formatFilter === '120' && uniqueFrames.length > 0 && (
            <select
              value={frameFilter}
              onChange={(e) => setFrameFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-gray-200"
            >
              <option value="">Semua Frame</option>
              {uniqueFrames.map(fs => (
                <option key={fs} value={fs as string}>{fs}</option>
              ))}
            </select>
          )}

          {token && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition shadow-sm"
            >
              + Unggah
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl" style={{ height: `${Math.random() * 200 + 150}px` }} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 font-medium">Belum ada karya untuk filter ini</p>
          <p className="text-sm text-gray-400 mt-1">Jadilah yang pertama mengunggah hasil jepretan Anda.</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {photos.map(photo => (
            <div 
              key={photo.id} 
              onClick={() => setActivePhotoId(photo.id)}
              className="relative group cursor-zoom-in break-inside-avoid rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-lg transition-all"
            >
              <img
                src={photo.imageUrl}
                alt="Community upload"
                loading="lazy"
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              {/* Hover overlay with minimal metadata */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                <span className="text-xs font-bold text-white bg-black/40 w-max px-2 py-1 rounded backdrop-blur-sm">
                  {formatLabel[photo.format] || photo.format} {photo.frameSize && `• ${photo.frameSize}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        variants={variants}
        onUploadSuccess={fetchPhotos}
      />
      
      {activePhotoId && (
        <Lightbox 
          photoId={activePhotoId} 
          onClose={() => setActivePhotoId(null)}
          onDeleteSuccess={() => {
            setActivePhotoId(null);
            fetchPhotos();
          }}
        />
      )}
    </div>
  );
}
