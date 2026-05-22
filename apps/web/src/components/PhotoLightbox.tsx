import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ZoomIn, ZoomOut, Heart, MessageCircle, Share2, Flag, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { isLoggedIn } from '../store/auth';
import { FormatBadge, Spinner } from './common';
import ReportModal from './ReportModal';

/**
 * Modal photo viewer — image on the left, EXIF + comments panel on the right.
 * Used by gallery thumbnails so users don't lose context navigating away.
 */
export default function PhotoLightbox({ photoId, onClose }: { photoId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [zoom, setZoom] = useState(1);
  const [comment, setComment] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  const photo = useQuery({
    queryKey: ['photo', photoId],
    queryFn: () => api.get(`/photos/${photoId}`),
    enabled: !!photoId,
  });
  const comments = useQuery({
    queryKey: ['photo-comments', photoId],
    queryFn: () => api.get(`/comments/photo/${photoId}`),
    enabled: !!photoId,
  });

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  useEffect(() => {
    if (photo.data) {
      setLiked(!!photo.data.viewerHasLiked);
      setLikeCount(photo.data.likeCount ?? 0);
    }
  }, [photo.data]);

  const like = useMutation({
    mutationFn: () => api.post(`/likes/photo/${photoId}`),
    onSuccess: (data: any) => {
      setLiked(!!data.liked);
      setLikeCount((c) => c + (data.liked ? 1 : -1));
      qc.invalidateQueries({ queryKey: ['photo', photoId] });
      qc.invalidateQueries({ queryKey: ['user-photos'] });
    },
  });

  const send = useMutation({
    mutationFn: () => api.post(`/comments/photo/${photoId}`, { content: comment }),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['photo-comments', photoId] });
      qc.invalidateQueries({ queryKey: ['photo', photoId] });
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const p = photo.data?.photo;
  const author = photo.data?.author;
  const film = photo.data?.film;
  const variant = photo.data?.variant;
  const exif = (p?.exif as any) || {};

  return (
    <div className="modal-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div className="lightbox" onClick={(e) => e.stopPropagation()}>
        {/* === IMAGE PANE === */}
        <div className="lightbox-img">
          {photo.isLoading ? (
            <div className="text-ink-300"><Spinner /></div>
          ) : p?.imageUrl ? (
            <img
              src={p.imageUrl}
              alt={p.caption || 'Photo'}
              className="max-w-full max-h-full object-contain transition-transform"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            />
          ) : (
            <div className="text-ink-300">Photo unavailable</div>
          )}
          {/* Controls */}
          <div className="absolute top-4 right-4 flex gap-1.5 z-10">
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              className="w-9 h-9 rounded-full grid place-items-center text-ink-50 backdrop-blur-sm"
              style={{ background: 'rgba(245,240,225,0.15)' }}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
              className="w-9 h-9 rounded-full grid place-items-center text-ink-50 backdrop-blur-sm"
              style={{ background: 'rgba(245,240,225,0.15)' }}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full grid place-items-center text-ink-50 backdrop-blur-sm"
              style={{ background: 'rgba(245,240,225,0.15)' }}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* === INFO PANE === */}
        <div className="lightbox-info">
          {/* Author */}
          {author && (
            <div className="flex items-center gap-2.5 pb-4 border-b border-ink-300 mb-4">
              <Link to={`/u/${author.username}`} onClick={onClose} className="avatar-circle" style={{ width: 36, height: 36, fontSize: 13 }}>
                {author.avatarUrl ? (
                  <img src={author.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  author.username[0].toUpperCase()
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/u/${author.username}`} onClick={onClose} className="font-semibold text-sm text-ink-900 hover:underline">
                  @{author.username}
                </Link>
                <div className="font-mono-tech text-[11px] text-ink-500 uppercase tracking-wider">
                  {p?.createdAt && new Date(p.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            </div>
          )}

          {/* Caption */}
          {p?.caption && <p className="text-sm text-ink-700 mb-4">{p.caption}</p>}

          {/* EXIF grid */}
          <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-ink-500 mb-2">
            EXIF &amp; Metadata
          </div>
          <div className="grid grid-cols-2 gap-2 mb-5 font-mono-tech text-xs">
            {film && (
              <ExifItem k="Film" v={
                <Link to={`/films/${film.slug}`} onClick={onClose} className="link-amber hover:underline">
                  {film.name}
                </Link>
              } />
            )}
            {p?.iso && <ExifItem k="ISO" v={p.iso} />}
            {variant && <ExifItem k="Format" v={<FormatBadge format={variant.format} />} />}
            {p?.frameSize && <ExifItem k="Frame" v={p.frameSize} />}
            {p?.pushPullStops !== 0 && p?.pushPullStops != null && (
              <ExifItem k="Push/Pull" v={(p.pushPullStops > 0 ? '+' : '') + p.pushPullStops} />
            )}
            {(p?.shootingConditions || exif.lighting) && (
              <ExifItem k="Conditions" v={p?.shootingConditions || exif.lighting} />
            )}
            {(exif.camera || photo.data?.camera) && (
              <ExifItem k="Camera" v={exif.camera || `${photo.data.camera.brand} ${photo.data.camera.model}`} />
            )}
            {(exif.lens || photo.data?.lens) && (
              <ExifItem k="Lens" v={exif.lens || `${photo.data.lens.brand} ${photo.data.lens.model}`} />
            )}
            {exif.lab && <ExifItem k="Lab" v={exif.lab} />}
            {p?.location && <ExifItem k="Location" v={p.location} />}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-4">
            {isLoggedIn() ? (
              <button
                onClick={() => like.mutate()}
                disabled={like.isPending}
                className="btn-sm flex-1 !justify-center"
                style={{
                  background: liked ? '#e6a519' : '#1a1a1a',
                  color: liked ? '#1a1a1a' : '#f5f0e1',
                  borderRadius: 999,
                  padding: '8px 14px',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <Heart className="w-3.5 h-3.5" fill={liked ? '#1a1a1a' : 'none'} />
                {' '}{likeCount}
              </button>
            ) : (
              <div className="flex-1 text-center text-xs text-ink-500 py-2">
                <Heart className="w-4 h-4 inline mr-1" /> {likeCount}
              </div>
            )}
            <button
              onClick={() => document.getElementById('lbx-comment-input')?.focus()}
              className="btn-ghost btn-sm flex-1 !justify-center"
              style={{ padding: '8px 14px', fontSize: 13 }}
            >
              <MessageCircle className="w-3.5 h-3.5" /> {comments.data?.items?.length || photo.data?.commentCount || 0}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/photos/${photoId}`);
                toast.success('Link copied');
              }}
              className="btn-ghost btn-sm flex-1 !justify-center"
              style={{ padding: '8px 14px', fontSize: 13 }}
              title="Copy link"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            {isLoggedIn() && (
              <button
                onClick={() => setReportOpen(true)}
                className="btn-ghost btn-sm !justify-center"
                style={{ padding: '8px 12px', fontSize: 13 }}
                title="Report"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Open full page link */}
          <Link
            to={`/photos/${photoId}`}
            onClick={onClose}
            className="text-[11px] font-mono-tech uppercase tracking-wider link-amber block mb-4 hover:underline"
          >
            Open full view →
          </Link>

          {/* Comments */}
          <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-ink-500 mb-3">
            Comments ({comments.data?.items?.length || 0})
          </div>
          {isLoggedIn() && (
            <div className="flex gap-2 mb-3">
              <input
                id="lbx-comment-input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment…"
                className="input"
                style={{ fontSize: 13 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && comment.trim()) send.mutate();
                }}
              />
              <button
                disabled={!comment.trim() || send.isPending}
                onClick={() => send.mutate()}
                className="btn-primary btn-sm"
                style={{ padding: '8px 14px' }}
              >
                Send
              </button>
            </div>
          )}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {comments.isLoading && <div className="text-xs text-ink-500 text-center py-3">Loading…</div>}
            {!comments.isLoading && (comments.data?.items?.length ?? 0) === 0 && (
              <div className="text-xs text-ink-500 text-center py-3 italic">No comments yet — be the first.</div>
            )}
            {(comments.data?.items || []).map((row: any) => (
              <div key={row.comment.id} className="flex gap-2 text-sm">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: '#ede5cf', color: '#2d2d2d' }}
                >
                  {row.author.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/u/${row.author.username}`}
                    onClick={onClose}
                    className="font-semibold text-ink-900 hover:underline"
                  >
                    @{row.author.username}
                  </Link>{' '}
                  <span className="text-ink-700">{row.comment.content}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {reportOpen && p && (
        <ReportModal
          target={{
            type: 'photo',
            id: p.id,
            label: p.caption?.slice(0, 60) || `photo by @${author?.username}`,
          }}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}

function ExifItem({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="p-2 rounded" style={{ background: '#f5f0e1' }}>
      <div className="text-[10px] uppercase tracking-[0.1em] text-ink-500">{k}</div>
      <div className="font-semibold text-ink-900 mt-0.5">{v}</div>
    </div>
  );
}

void Camera;
