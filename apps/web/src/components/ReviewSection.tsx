import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import toast from 'react-hot-toast';
import { CommentSection } from './SocialActions';

interface Variant {
  id: string;
  format: string;
  frameSize: string | null;
}

interface Review {
  id: string;
  userId: string;
  rating: number;
  content: string | null;
  cameraUsed: string | null;
  format: string | null;
  username: string;
  avatarUrl: string | null;
  editedAt: string | null;
  createdAt: string;
  upvoteCount: number;
}

const formatLabel: Record<string, string> = {
  '35mm': '35mm',
  '120': '120',
  'large_format': 'Large Format',
};

// ── Star Rating Component ──
const StarRating = ({ rating, onRate, interactive = false, size = 'md' }: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md';
}) => {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => onRate?.(star)}
        >
          <svg className={`${sizeClass} ${
            star <= (hover || rating) ? 'text-amber-400' : 'text-gray-200'
          } transition-colors`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

// ── Review Card Component ──
const ReviewCard = ({ review, currentUserId, upvotedIds, onEdit, onDelete, onUpvote }: {
  review: Review;
  currentUserId: string | null;
  upvotedIds: string[];
  onEdit: (r: Review) => void;
  onDelete: (id: string) => void;
  onUpvote: (id: string) => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwner = currentUserId === review.userId;
  const isAdmin = user.role === 'admin';
  const isUpvoted = upvotedIds.includes(review.id);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}j lalu`;
    const days = Math.floor(hours / 24);
    return `${days}h lalu`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm font-bold text-gray-600 overflow-hidden">
            {review.avatarUrl ? (
              <img src={review.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              review.username.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{review.username}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{timeAgo(review.createdAt)}</span>
              {review.editedAt && (
                <span className="italic text-gray-400">(diedit)</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          {(isOwner || isAdmin) && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-[120px]">
                  {isOwner && (
                    <button
                      onClick={() => { setMenuOpen(false); onEdit(review); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(review.id); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      {(review.cameraUsed || review.format) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {review.cameraUsed && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">📸 {review.cameraUsed}</span>
          )}
          {review.format && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">🎞️ {formatLabel[review.format] || review.format}</span>
          )}
        </div>
      )}

      {/* Content */}
      <p className="text-gray-700 text-sm leading-relaxed mb-4">{review.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onUpvote(review.id)}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
            isUpvoted
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          }`}
        >
          <svg className="w-4 h-4" fill={isUpvoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span>{review.upvoteCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
            showComments ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Komentar</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-6 pt-6 border-t border-gray-50">
           <CommentSection entityId={review.id} entityType="review" />
        </div>
      )}
    </div>
  );
};

// ── Main Review Section Component ──
export default function ReviewSection({ filmId, filmSlug, variants }: {
  filmId: string;
  filmSlug: string;
  variants: Variant[];
}) {
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [upvotedIds, setUpvotedIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formContent, setFormContent] = useState('');
  const [formCamera, setFormCamera] = useState('');
  const [formVariantId, setFormVariantId] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const token = localStorage.getItem('access_token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchReviews = async (format?: string) => {
    try {
      const params = format && format !== 'all' ? `?format=${format}` : '';
      const data = await fetchApi(`/api/v1/films/${filmSlug}/reviews${params}`);
      setReviewList(data.reviews || []);

      // Fetch user's upvotes
      if (token && data.reviews.length > 0) {
        try {
          const upvoteData = await fetchApi('/api/v1/reviews/upvoted', {
            method: 'POST',
            body: JSON.stringify({ reviewIds: data.reviews.map((r: Review) => r.id) }),
          });
          setUpvotedIds(upvoteData.upvotedIds || []);
        } catch { /* silent */ }
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(activeFilter);
  }, [filmSlug, activeFilter]);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setLoading(true);
  };

  // Create or Edit review
  const handleSubmitReview = async () => {
    if (formRating === 0) { toast.error('Pilih rating terlebih dahulu'); return; }
    if (formContent.length < 20) { toast.error('Ulasan minimal 20 karakter'); return; }
    if (!formVariantId && !editingReview) { toast.error('Pilih varian format'); return; }

    setFormSubmitting(true);
    try {
      if (editingReview) {
        await fetchApi(`/api/v1/reviews/${editingReview.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            rating: formRating,
            content: formContent,
            cameraUsed: formCamera || undefined,
          }),
        });
        toast.success('Ulasan berhasil diperbarui ✅');
      } else {
        await fetchApi('/api/v1/reviews', {
          method: 'POST',
          body: JSON.stringify({
            filmId,
            filmVariantId: formVariantId,
            rating: formRating,
            content: formContent,
            cameraUsed: formCamera || undefined,
          }),
        });
        toast.success('Ulasan berhasil dibuat! 🎉');
      }
      resetForm();
      fetchReviews(activeFilter);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan ulasan');
    } finally {
      setFormSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingReview(null);
    setFormRating(0);
    setFormContent('');
    setFormCamera('');
    setFormVariantId('');
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setFormRating(review.rating);
    setFormContent(review.content || '');
    setFormCamera(review.cameraUsed || '');
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchApi(`/api/v1/reviews/${deleteTarget}`, { method: 'DELETE' });
      toast.success('Ulasan berhasil dihapus');
      setDeleteTarget(null);
      fetchReviews(activeFilter);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus ulasan');
    }
  };

  const handleUpvote = async (reviewId: string) => {
    if (!token) { toast.error('Silakan login terlebih dahulu'); return; }

    // Optimistic UI
    const wasUpvoted = upvotedIds.includes(reviewId);
    setUpvotedIds(prev => wasUpvoted ? prev.filter(id => id !== reviewId) : [...prev, reviewId]);
    setReviewList(prev => prev.map(r =>
      r.id === reviewId ? { ...r, upvoteCount: r.upvoteCount + (wasUpvoted ? -1 : 1) } : r
    ));

    try {
      await fetchApi(`/api/v1/reviews/${reviewId}/upvote`, { method: 'POST' });
    } catch {
      // Revert
      setUpvotedIds(prev => wasUpvoted ? [...prev, reviewId] : prev.filter(id => id !== reviewId));
      setReviewList(prev => prev.map(r =>
        r.id === reviewId ? { ...r, upvoteCount: r.upvoteCount + (wasUpvoted ? 1 : -1) } : r
      ));
      toast.error('Gagal memperbarui upvote');
    }
  };

  // Get unique formats from variants
  const uniqueFormats = [...new Set(variants.map(v => v.format))];

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">💬 Ulasan Komunitas</h2>
        {token && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="text-sm font-semibold text-white bg-black px-4 py-2 rounded-xl hover:bg-gray-800 transition"
          >
            + Tulis Ulasan
          </button>
        )}
      </div>

      {/* Chip Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleFilterChange('all')}
          className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
            activeFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Semua
        </button>
        {uniqueFormats.map(f => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
              activeFilter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {formatLabel[f] || f}
          </button>
        ))}
      </div>

      {/* Review Form / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingReview ? '✏️ Edit Ulasan' : '✍️ Tulis Ulasan Baru'}
            </h3>

            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
              <StarRating rating={formRating} onRate={setFormRating} interactive />
            </div>

            {/* Variant Selector (only for new reviews) */}
            {!editingReview && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Varian Format *</label>
                <select
                  value={formVariantId}
                  onChange={e => setFormVariantId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-800 bg-white text-sm"
                >
                  <option value="">Pilih format yang Anda gunakan</option>
                  {variants.map(v => (
                    <option key={v.id} value={v.id}>
                      {formatLabel[v.format] || v.format} {v.frameSize ? `(${v.frameSize})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Camera Used */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kamera yang Digunakan</label>
              <input
                type="text"
                value={formCamera}
                onChange={e => setFormCamera(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-800 text-sm"
                placeholder="Canon AE-1, Yashica Mat-124G, dll"
              />
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ulasan *</label>
              <textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-800 text-sm resize-none"
                placeholder="Ceritakan pengalaman Anda menggunakan film ini..."
              />
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${formContent.length < 20 && formContent.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {formContent.length < 20 && formContent.length > 0 ? 'Ulasan minimal 20 karakter' : ''}
                </span>
                <span className="text-xs text-gray-400">{formContent.length}/20 min</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={formSubmitting || formRating === 0 || formContent.length < 20}
                className="flex-1 py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {formSubmitting ? 'Menyimpan...' : editingReview ? 'Simpan Perubahan' : 'Kirim Ulasan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Ulasan?</h3>
            <p className="text-gray-500 mb-6">Apakah Anda yakin ingin menghapus ulasan ini? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-2 w-16 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : reviewList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-gray-500 font-medium">Belum ada ulasan untuk film ini</p>
          <p className="text-gray-400 text-sm mt-1">Jadilah yang pertama menulis ulasan!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewList.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUser?.id || null}
              upvotedIds={upvotedIds}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteTarget(id)}
              onUpvote={handleUpvote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
