import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Camera as CamIcon, ArrowLeft, Trash2, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Loading, FormatBadge } from '../../components/common';
import { getUser, isLoggedIn } from '../../store/auth';

export default function PhotoDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const me = getUser();
  const photo = useQuery({ queryKey: ['photo', id], queryFn: () => api.get(`/photos/${id}`), enabled: !!id });
  const likeCount = useQuery({
    queryKey: ['photo-likes', id],
    queryFn: () => api.get(`/likes/photo/${id}/count`),
    enabled: !!id,
  });
  const comments = useQuery({
    queryKey: ['photo-comments', id],
    queryFn: () => api.get(`/comments/photo/${id}`),
    enabled: !!id,
  });
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(false);
  }, [id]);

  const like = useMutation({
    mutationFn: () => api.post(`/likes/photo/${id}`),
    onSuccess: (data: any) => {
      setLiked(!!data.liked);
      qc.invalidateQueries({ queryKey: ['photo-likes', id] });
    },
  });
  const send = useMutation({
    mutationFn: () => api.post(`/comments/photo/${id}`, { content: comment }),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['photo-comments', id] });
    },
  });
  const del = useMutation({
    mutationFn: () => api.delete(`/photos/${id}`),
    onSuccess: () => {
      toast.success('Photo deleted');
      nav(-1);
    },
  });
  const report = useMutation({
    mutationFn: () => api.post(`/reports/photo/${id}`, { reason: 'offensive' }),
    onSuccess: () => toast.success('Report submitted'),
  });

  if (photo.isLoading) return <Loading />;
  if (!photo.data) return <div>Photo not found</div>;
  const p = photo.data.photo;
  const author = photo.data.author;
  const film = photo.data.film;
  const variant = photo.data.variant;
  const isOwner = me?.id === p.userId;

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => nav(-1)} className="btn-ghost mb-3">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div className="bg-ink-900 rounded-2xl overflow-hidden flex items-center justify-center">
          <img src={p.imageUrl} alt={p.caption || 'Foto'} className="max-h-[80vh] object-contain" />
        </div>
        <div className="card p-4 space-y-4 self-start">
          <div className="flex items-center gap-3">
            <Link to={`/u/${author?.username}`} className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-700 overflow-hidden">
              {author?.avatarUrl ? <img src={author.avatarUrl} className="w-full h-full object-cover" /> : author?.username[0].toUpperCase()}
            </Link>
            <div className="flex-1">
              <Link to={`/u/${author?.username}`} className="font-semibold text-sm hover:underline">@{author?.username}</Link>
              <div className="text-xs text-ink-500">{new Date(p.createdAt).toLocaleString('en-US')}</div>
            </div>
          </div>
          {p.caption && <p className="text-sm">{p.caption}</p>}

          {(film || variant) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {film && (
                <div className="card p-2">
                  <div className="text-ink-500">Film</div>
                  <Link to={`/films/${film.slug}`} className="font-medium hover:underline">{film.name}</Link>
                </div>
              )}
              {variant && (
                <div className="card p-2">
                  <div className="text-ink-500">Format</div>
                  <FormatBadge format={variant.format} />
                </div>
              )}
              {p.frameSize && (
                <div className="card p-2">
                  <div className="text-ink-500">Frame size</div>
                  <div className="font-medium">{p.frameSize}</div>
                </div>
              )}
              {p.shootingConditions && (
                <div className="card p-2">
                  <div className="text-ink-500">Conditions</div>
                  <div className="font-medium">{p.shootingConditions}</div>
                </div>
              )}
            </div>
          )}

          {(photo.data.camera || photo.data.lens) && (
            <div className="text-xs text-ink-600 flex items-center gap-1">
              <CamIcon className="w-3.5 h-3.5" />
              {photo.data.camera && `${photo.data.camera.brand} ${photo.data.camera.model}`}
              {photo.data.lens && ` • ${photo.data.lens.brand} ${photo.data.lens.model}`}
            </div>
          )}

          <div className="flex items-center gap-3 border-t pt-3">
            {isLoggedIn() && (
              <button onClick={() => like.mutate()} className={`flex items-center gap-1.5 text-sm ${liked ? 'text-red-600' : 'text-ink-700'}`}>
                <Heart className={`w-5 h-5 ${liked ? 'fill-red-600' : ''}`} /> {likeCount.data?.count || 0}
              </button>
            )}
            <span className="flex items-center gap-1.5 text-sm text-ink-700">
              <MessageCircle className="w-5 h-5" /> {comments.data?.items?.length || 0}
            </span>
            <span className="ml-auto flex gap-1">
              {isOwner && (
                <button onClick={() => del.mutate()} className="btn-ghost p-2 text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {!isOwner && isLoggedIn() && (
                <button onClick={() => report.mutate()} className="btn-ghost p-2">
                  <Flag className="w-4 h-4" />
                </button>
              )}
            </span>
          </div>

          <div className="border-t border-ink-300 pt-3">
            <div className="text-xs font-semibold mb-2 text-ink-600 uppercase tracking-wider">Comments</div>
            {isLoggedIn() && (
              <div className="flex gap-2 mb-3">
                <input
                  className="input"
                  placeholder="Write a comment…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button disabled={!comment.trim() || send.isPending} onClick={() => send.mutate()} className="btn-primary">
                  Send
                </button>
              </div>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(comments.data?.items || []).map((row: any) => (
                <div key={row.comment.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-ink-100 flex items-center justify-center text-xs font-semibold">
                    {row.author.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 text-sm">
                    <span className="font-semibold">@{row.author.username}</span> <span className="text-ink-700">{row.comment.content}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
