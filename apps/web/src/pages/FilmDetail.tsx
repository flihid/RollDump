import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import toast from 'react-hot-toast';
import ReviewSection from '../components/ReviewSection';
import PhotoGallery from '../components/PhotoGallery';
import TipsSection from '../components/TipsSection';
import AddToListModal from '../components/AddToListModal';
import Header from '../components/Header';

interface Variant {
  id: string;
  filmId: string;
  format: string;
  frameSize: string | null;
  exposures: number | null;
}

interface FilmDetail {
  id: string;
  name: string;
  slug: string;
  brand: string;
  iso: number;
  type: string;
  description: string | null;
  imageUrl: string | null;
  datasheetUrl: string | null;
  variants: Variant[];
}

const formatLabel: Record<string, string> = {
  '35mm': '35mm',
  '120': '120',
  'large_format': 'Large Format',
};

const formatColor: Record<string, string> = {
  '35mm': 'bg-amber-500',
  '120': 'bg-emerald-500',
  'large_format': 'bg-violet-500',
};

const SkeletonDetail = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gray-200 rounded-2xl mb-6" />
    <div className="h-8 w-48 bg-gray-200 rounded mb-3" />
    <div className="h-4 w-32 bg-gray-200 rounded mb-6" />
    <div className="flex gap-3 mb-6">
      <div className="h-10 w-20 bg-gray-200 rounded-lg" />
      <div className="h-10 w-16 bg-gray-200 rounded-lg" />
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  </div>
);

export default function FilmDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [film, setFilm] = useState<FilmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState<string | null>(null);
  const [showListModal, setShowListModal] = useState(false);

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchFilm = async () => {
      try {
        const data = await fetchApi(`/api/v1/films/${slug}`);
        setFilm(data.film);
        // Set first available format as active tab
        if (data.film.variants.length > 0) {
          const formats = [...new Set(data.film.variants.map((v: Variant) => v.format))];
          setActiveTab(formats[0] as string);
        }
      } catch (err) {
        toast.error('Film tidak ditemukan');
      } finally {
        setLoading(false);
      }
    };

    const fetchWishlist = async () => {
      if (!token) return;
      try {
        const data = await fetchApi('/api/v1/wishlists/variant-ids');
        setWishlistIds(data.variantIds);
      } catch (err) {
        // Silently fail
      }
    };

    if (slug) {
      fetchFilm();
      fetchWishlist();
    }
  }, [slug, token]);

  const handleWishlistToggle = async (variantId: string) => {
    if (!token) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    const isInWishlist = wishlistIds.includes(variantId);
    setWishlistLoading(variantId);

    // Optimistic UI
    if (isInWishlist) {
      setWishlistIds(prev => prev.filter(id => id !== variantId));
    } else {
      setWishlistIds(prev => [...prev, variantId]);
    }

    try {
      if (isInWishlist) {
        await fetchApi(`/api/v1/wishlists/${variantId}`, { method: 'DELETE' });
        toast.success('Dihapus dari wishlist');
      } else {
        await fetchApi('/api/v1/wishlists', {
          method: 'POST',
          body: JSON.stringify({ filmVariantId: variantId }),
        });
        toast.success('Ditambahkan ke wishlist ❤️');
      }
    } catch (err: any) {
      // Revert optimistic update
      if (isInWishlist) {
        setWishlistIds(prev => [...prev, variantId]);
      } else {
        setWishlistIds(prev => prev.filter(id => id !== variantId));
      }
      toast.error(err.message || 'Gagal memperbarui wishlist');
    } finally {
      setWishlistLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <SkeletonDetail />
        </div>
      </div>
    );
  }

  if (!film) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Film Tidak Ditemukan</h2>
          <Link to="/films" className="text-primary-600 hover:underline">Kembali ke Katalog</Link>
        </div>
      </div>
    );
  }

  const uniqueFormats = [...new Set(film.variants.map(v => v.format))];
  const activeVariants = film.variants.filter(v => v.format === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition group"
        >
          <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover:shadow-md transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </div>
          Kembali
        </button>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Hero Image */}
          {film.imageUrl && (
            <div className="aspect-[16/9] overflow-hidden bg-gray-100 relative">
              <img
                src={film.imageUrl}
                alt={film.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-6">
                <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${
                  film.type === 'color' ? 'bg-blue-500' : 'bg-gray-700'
                }`}>
                  {film.type === 'color' ? 'Color Negative' : 'Black & White'}
                </span>
              </div>
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* Film info */}
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{film.brand}</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1 mb-1">{film.name}</h1>
            <p className="text-lg text-gray-500 mb-4">ISO {film.iso}</p>

            {film.description && (
              <p className="text-gray-600 leading-relaxed mb-6">{film.description}</p>
            )}

            {/* Datasheet Button */}
            {film.datasheetUrl && (
              <a
                href={film.datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition mb-8 border border-indigo-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Unduh Datasheet Resmi (.PDF)
              </a>
            )}

            {/* Tab Navigation */}
            {uniqueFormats.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Spesifikasi Format</h2>
                <div className="flex gap-2 mb-6">
                  {uniqueFormats.map(format => (
                    <button
                      key={format}
                      onClick={() => setActiveTab(format)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        activeTab === format
                          ? `${formatColor[format] || 'bg-gray-800'} text-white shadow-md`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {formatLabel[format] || format}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-4">
                  {activeVariants.map(variant => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`w-2 h-2 rounded-full ${formatColor[variant.format] || 'bg-gray-400'}`} />
                          <span className="font-semibold text-gray-800">
                            {formatLabel[variant.format]} — {variant.frameSize || 'Standard'}
                          </span>
                        </div>
                        <div className="flex gap-6 text-sm text-gray-500">
                          {variant.frameSize && (
                            <span>📐 Frame: <strong className="text-gray-700">{variant.frameSize}</strong></span>
                          )}
                          {variant.exposures && (
                            <span>🎞️ Exposures: <strong className="text-gray-700">{variant.exposures}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {/* Collection button */}
                        <button
                          onClick={() => setShowListModal(true)}
                          className="p-2.5 bg-gray-100 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all duration-200"
                          title="Simpan ke List"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>

                        {/* Wishlist button */}
                        <button
                          onClick={() => handleWishlistToggle(variant.id)}
                          disabled={wishlistLoading === variant.id}
                          className={`p-2.5 rounded-xl transition-all duration-200 ${
                            wishlistIds.includes(variant.id)
                              ? 'bg-red-50 text-red-500 hover:bg-red-100'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-400'
                          } ${wishlistLoading === variant.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={wishlistIds.includes(variant.id) ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
                        >
                          <svg className="w-5 h-5" fill={wishlistIds.includes(variant.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal */}
        <AddToListModal 
          isOpen={showListModal} 
          onClose={() => setShowListModal(false)} 
          filmName={film.name} 
          variants={film.variants} 
        />

        {/* Review Section */}
        <ReviewSection filmId={film.id} filmSlug={film.slug} variants={film.variants} />

        {/* Photo Gallery Section */}
        <PhotoGallery filmSlug={film.slug} variants={film.variants} />

        {/* Tips & Guides Section */}
        <TipsSection filmId={film.id} filmSlug={film.slug} />
      </div>
    </div>
  );
}
