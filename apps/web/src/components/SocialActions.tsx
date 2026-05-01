import React, { useState } from 'react';
import { fetchApi } from '../lib/api';
import toast from 'react-hot-toast';

interface LikeButtonProps {
  entityId: string;
  entityType: 'photo' | 'review' | 'list';
  initialLiked: boolean;
  initialCount: number;
  size?: 'sm' | 'md';
}

export const LikeButton: React.FC<LikeButtonProps> = ({ 
  entityId, 
  entityType, 
  initialLiked, 
  initialCount,
  size = 'md'
}) => {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic
    const prevLiked = liked;
    setLiked(!liked);
    setCount(prev => prevLiked ? prev - 1 : prev + 1);

    try {
      await fetchApi(`/api/v1/${entityType}/${entityId}/like`, { method: 'POST' });
    } catch (err) {
      setLiked(prevLiked);
      setCount(initialCount);
      toast.error('Gagal memberikan like');
    }
  };

  return (
    <button 
      onClick={toggleLike}
      className={`flex items-center gap-1.5 transition-all active:scale-90 ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
    >
      <svg 
        className={`${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'} ${liked ? 'fill-current' : 'fill-none'}`} 
        stroke="currentColor" 
        strokeWidth={2} 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span className="text-xs font-black">{count}</span>
    </button>
  );
};

interface CommentSectionProps {
  entityId: string;
  entityType: 'photo' | 'review';
}

export const CommentSection: React.FC<CommentSectionProps> = ({ entityId, entityType }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  React.useEffect(() => {
    fetchComments();
  }, [entityId]);

  const fetchComments = async () => {
    setFetching(true);
    try {
      const data = await fetchApi(`/api/v1/${entityType}/${entityId}/comments`);
      setComments(data.comments || []);
    } catch (err) {}
    setFetching(false);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const data = await fetchApi(`/api/v1/${entityType}/${entityId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment })
      });
      setComments(prev => [data.comment, ...prev]);
      setNewComment('');
      toast.success('Komentar terkirim! 💬');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim komentar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submitComment} className="relative">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Tulis pendapat Anda..."
          className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none min-h-[100px]"
          maxLength={500}
        />
        <button 
          type="submit"
          disabled={loading || !newComment.trim()}
          className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:shadow-none hover:bg-indigo-700 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>

      <div className="space-y-4">
        {fetching ? (
          <div className="flex justify-center p-4">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4">Belum ada komentar. Jadilah yang pertama!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                {c.user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-gray-50 p-3 rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-gray-900">@{c.user.username}</span>
                  <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
