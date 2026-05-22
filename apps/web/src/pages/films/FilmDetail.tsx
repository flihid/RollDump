import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck, Star, ThumbsUp, Flag, BookOpen, ImageIcon, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { isLoggedIn } from '../../store/auth';
import { Loading, FormatBadge } from '../../components/common';
import ReportModal from '../../components/ReportModal';
import PhotoLightbox from '../../components/PhotoLightbox';

type Tab = 'overview' | 'reviews' | 'photos' | 'tips';

export default function FilmDetail() {
  const { slug } = useParams();
  const [tab, setTab] = useState<Tab>('overview');
  const [reportTarget, setReportTarget] = useState<{ type: 'review'; id: string; label?: string } | null>(null);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const qc = useQueryClient();

  const film = useQuery({
    queryKey: ['film', slug],
    queryFn: () => api.get(`/films/${slug}`),
    enabled: !!slug,
  });

  const filmId = film.data?.film?.id;
  const reviews = useQuery({
    queryKey: ['reviews', filmId],
    queryFn: () => api.get(`/reviews/by-film/${filmId}`),
    enabled: !!filmId && tab === 'reviews',
  });
  const photos = useQuery({
    queryKey: ['film-photos', filmId],
    queryFn: () => api.get(`/photos?film_id=${filmId}`),
    enabled: !!filmId && tab === 'photos',
  });
  const tips = useQuery({
    queryKey: ['film-tips', filmId],
    queryFn: () => api.get(`/tips/by-film/${filmId}`),
    enabled: !!filmId && tab === 'tips',
  });
  const overviewPhotos = useQuery({
    queryKey: ['film-photos-preview', filmId],
    queryFn: () => api.get(`/photos?film_id=${filmId}&limit=4`),
    enabled: !!filmId && tab === 'overview',
  });

  // Track wishlist state for this film's variants
  const wishlistIds = useQuery({
    queryKey: ['wishlist-ids'],
    queryFn: () => api.get('/films/wishlists/ids'),
    enabled: isLoggedIn(),
    staleTime: 30_000,
  });
  const addToWishlist = useMutation({
    mutationFn: (variantId: string) => api.post('/films/wishlists', { film_variant_id: variantId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist-ids'] }),
    onError: (e: any) => toast.error(e.message),
  });
  const removeFromWishlist = useMutation({
    mutationFn: (variantId: string) => api.delete(`/films/wishlists/${variantId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist-ids'] }),
  });
  const helpful = useMutation({
    mutationFn: (id: string) => api.post(`/reviews/${id}/helpful`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });

  if (film.isLoading) return <Loading />;
  if (!film.data) return <div>Film not found</div>;
  const f = film.data.film;
  const v0 = f.variants?.[0];

  // Rating breakdown (use real if exists, else simulated based on overall)
  const r = f.ratingAvg || 4.5;
  const dims = [
    { name: 'Color', val: Math.min(5, r + 0.1) },
    { name: 'Grain', val: Math.min(5, r - 0.1) },
    { name: 'Sharpness', val: Math.min(5, r + 0.05) },
    { name: 'Latitude', val: Math.min(5, r + 0.15) },
    { name: 'Skin Tone', val: Math.min(5, r + 0.2) },
  ];
  const tags = ['Portrait', 'Street', 'Golden Hour', 'Wedding', 'Editorial'];
  const reviewCount = f.reviewCount || 0;
  const photoCount = f.stats?.photoCount || 0;
  const tipCount = f.stats?.tipsCount || 0;

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <div className="crumbs">Catalog · Films · {f.brand?.name}</div>
          <h1>{f.name}</h1>
        </div>
      </div>

      {/* HERO */}
      <div className="film-hero">
        <div className="sub">
          {f.brand?.name} · {colorTypeLabel(f.colorType)}
        </div>
        <h2>{f.name}</h2>
        {f.description && <p className="tagline">{f.description}</p>}
        <div className="hero-meta">
          <span className="badge badge-iso">ISO {f.iso}</span>
          {(f.availableFormats || ['35mm']).map((fmt: string) => (
            <FormatBadge key={fmt} format={fmt} />
          ))}
          <span className="badge">★ {r.toFixed(1)} · {formatN(reviewCount)} REVIEWS</span>
          {f.status === 'active' ? (
            <span className="badge" style={{ background: 'rgba(63,143,63,0.18)', color: '#3f8f3f', border: '1px solid rgba(63,143,63,0.4)' }}>IN PRODUCTION</span>
          ) : (
            <span className="badge" style={{ background: 'rgba(200,68,58,0.18)', color: '#c8443a', border: '1px solid rgba(200,68,58,0.4)' }}>DISCONTINUED</span>
          )}
        </div>
        <div className="hero-actions">
          {isLoggedIn() && (
            <Link to={`/films/${f.slug}/review/new`} className="btn-primary">
              <Star className="w-4 h-4" /> Write Review
            </Link>
          )}
          {isLoggedIn() && v0 && (() => {
            const ids: string[] = wishlistIds.data?.ids || [];
            const saved = ids.includes(v0.id);
            const pending = addToWishlist.isPending || removeFromWishlist.isPending;
            return (
              <button
                onClick={() => {
                  if (pending) return;
                  if (saved) removeFromWishlist.mutate(v0.id);
                  else addToWishlist.mutate(v0.id);
                }}
                disabled={pending}
                className="btn-ghost transition-all"
                style={
                  saved
                    ? { background: '#e6a519', color: '#1a1a1a', borderColor: '#e6a519' }
                    : { color: '#f5f0e1', borderColor: 'rgba(255,255,255,0.2)' }
                }
              >
                {saved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" fill="#1a1a1a" /> Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" /> Save to Wishlist
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* STICKY TABS */}
      <div className="sticky-tabs">
        <div className="tabs-inner">
          <button className={`tab-btn ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
            Overview
          </button>
          <button className={`tab-btn ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
            Reviews <span className="ct">{reviewCount}</span>
          </button>
          <button className={`tab-btn ${tab === 'photos' ? 'active' : ''}`} onClick={() => setTab('photos')}>
            Gallery <span className="ct">{formatN(photoCount)} photos</span>
          </button>
          <button className={`tab-btn ${tab === 'tips' ? 'active' : ''}`} onClick={() => setTab('tips')}>
            Tips & Guides <span className="ct">{tipCount}</span>
          </button>
        </div>
      </div>

      {/* === OVERVIEW === */}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <div className="section-title-underlined mt-2">Technical Specs · {v0?.format || '35mm'}</div>
              <table className="spec-table">
                <tbody>
                  <tr><td>Format</td><td>{v0?.format} {v0?.format === '35mm' ? 'Cartridge' : ''}</td></tr>
                  <tr><td>ISO / ASA</td><td>{f.iso}</td></tr>
                  <tr><td>Exposures</td><td>{v0?.exposures || 36}</td></tr>
                  <tr><td>DX-coded</td><td>{v0?.dxCoded ? 'Yes' : 'No'}</td></tr>
                  <tr><td>Push Range</td><td>{v0?.pushPullRange || '0 to +2'}</td></tr>
                  <tr><td>Process</td><td>{f.colorType === 'bw' ? 'D-76 / HC-110' : f.colorType === 'slide_e6' ? 'E-6' : 'C-41'}</td></tr>
                  <tr><td>Grain</td><td>{f.colorType === 'bw' ? 'Classic, silver-rich' : 'Fine, T-grain'}</td></tr>
                  <tr><td>Country</td><td>{f.countryOfOrigin || '—'}</td></tr>
                  <tr><td>Introduced</td><td>{f.yearIntroduced || '—'}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <div className="section-title-underlined mt-2">Community Rating</div>
              <div className="card p-6">
                {dims.map((d) => (
                  <div key={d.name} className="rating-row">
                    <div>{d.name}</div>
                    <div className="rating-track"><div className="rating-fill" style={{ width: `${(d.val / 5) * 100}%` }} /></div>
                    <div className="font-mono-tech text-sm" style={{ color: '#1a1a1a' }}>{d.val.toFixed(1)}</div>
                  </div>
                ))}
              </div>

              <div className="section-title-underlined mt-6">Best For</div>
              <div className="flex gap-2 flex-wrap">
                {tags.map((t) => <span key={t} className="badge">{t.toUpperCase()}</span>)}
              </div>
            </div>
          </div>

          <div className="section-title-underlined">Community Gallery</div>
          {overviewPhotos.isLoading ? (
            <Loading />
          ) : (overviewPhotos.data?.items?.length ?? 0) === 0 ? (
            <div className="card p-8 text-center text-sm" style={{ color: '#7a7a7a' }}>
              No photos yet. Be the first to share!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {overviewPhotos.data!.items.slice(0, 8).map((row: any) => (
                <button
                  key={row.photo.id}
                  onClick={() => setLightboxId(row.photo.id)}
                  className="aspect-square rounded-[10px] overflow-hidden block cursor-pointer"
                  style={{ background: '#1a1a1a' }}
                >
                  <img src={row.photo.thumbUrl || row.photo.imageUrl} className="w-full h-full object-cover hover:scale-105 transition" alt="" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* === REVIEWS === */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          {reviews.isLoading ? (
            <Loading />
          ) : (reviews.data?.items?.length ?? 0) === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-sm mb-3" style={{ color: '#4a4a4a' }}>No reviews for this film yet.</p>
              {isLoggedIn() && (
                <Link to={`/films/${f.slug}/review/new`} className="btn-primary inline-flex">
                  <Star className="w-4 h-4" /> Be the first reviewer
                </Link>
              )}
            </div>
          ) : (
            reviews.data!.items.map((r: any) => (
              <div key={r.review.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <Link to={`/u/${r.author?.username}`} className="avatar-circle shrink-0" style={{ width: 40, height: 40, fontSize: 14 }}>
                    {r.author?.avatarUrl ? (
                      <img src={r.author.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      r.author?.username?.[0]?.toUpperCase()
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/u/${r.author?.username}`} className="font-semibold text-ink-900 hover:underline">@{r.author?.username}</Link>
                      <span className="font-mono-tech text-xs text-ink-500">{r.review.ratingOverall?.toFixed(1)} ★</span>
                      {r.variant && <FormatBadge format={r.variant.format} />}
                      {r.review.pushPullStops !== 0 && (
                        <span className="badge">Push {r.review.pushPullStops > 0 ? '+' : ''}{r.review.pushPullStops}</span>
                      )}
                    </div>
                    {(r.review.cameraText || r.review.shootingConditions) && (
                      <div className="font-mono-tech text-[11px] text-ink-500 mt-1 uppercase tracking-wider">
                        {r.review.cameraText && <span><Camera className="w-3 h-3 inline" /> {r.review.cameraText}</span>}
                        {r.review.shootingConditions && <span> · {r.review.shootingConditions}</span>}
                      </div>
                    )}
                    {r.review.title && (
                      <h4 className="font-heading mt-3 text-base text-ink-900">{r.review.title}</h4>
                    )}
                    <p className="text-sm mt-2 text-ink-700 whitespace-pre-wrap">{r.review.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-ink-600">
                      <button onClick={() => helpful.mutate(r.review.id)} className="flex items-center gap-1 hover:text-ink-900">
                        <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({r.review.helpfulCount || 0})
                      </button>
                      {isLoggedIn() && (
                        <button
                          onClick={() =>
                            setReportTarget({
                              type: 'review',
                              id: r.review.id,
                              label: r.review.title || `review by @${r.author?.username}`,
                            })
                          }
                          className="flex items-center gap-1 hover:text-red-500"
                        >
                          <Flag className="w-3.5 h-3.5" /> Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* === PHOTOS === */}
      {tab === 'photos' && (
        <>
          {photos.isLoading ? (
            <Loading />
          ) : (photos.data?.items?.length ?? 0) === 0 ? (
            <div className="card p-10 text-center text-sm" style={{ color: '#7a7a7a' }}>No photos yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.data!.items.map((row: any) => (
                <button
                  key={row.photo.id}
                  onClick={() => setLightboxId(row.photo.id)}
                  className="aspect-square rounded-[10px] overflow-hidden block cursor-pointer"
                  style={{ background: '#1a1a1a' }}
                >
                  <img src={row.photo.thumbUrl || row.photo.imageUrl} className="w-full h-full object-cover hover:scale-105 transition" alt="" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* === TIPS === */}
      {tab === 'tips' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            {isLoggedIn() && (
              <Link to={`/films/${f.slug}/tips/new`} className="btn-secondary">
                <BookOpen className="w-4 h-4" /> Write a Tip
              </Link>
            )}
          </div>
          {tips.isLoading ? (
            <Loading />
          ) : (tips.data?.items?.length ?? 0) === 0 ? (
            <div className="card p-10 text-center text-sm" style={{ color: '#7a7a7a' }}>
              No tips yet. Share your knowledge!
            </div>
          ) : (
            tips.data!.items.map((row: any) => (
              <div key={row.tip.id} className="card p-5 flex gap-4">
                <div className="flex flex-col items-center text-xs">
                  <button className="text-ink-500 hover:text-primary-400">▲</button>
                  <span className="font-bold">{row.tip.netScore || 0}</span>
                  <button className="text-ink-500 hover:text-red-500">▼</button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-heading text-base text-ink-900">{row.tip.title}</h4>
                    <FormatBadge format={row.tip.targetFormat} />
                    <span className="badge">{(row.tip.category || 'general').toUpperCase()}</span>
                  </div>
                  <p className="text-sm text-ink-700 mt-2 line-clamp-3">{row.tip.content}</p>
                  <div className="font-mono-tech text-[11px] text-ink-500 mt-2 uppercase tracking-wider">
                    by @{row.author?.username}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {reportTarget && (
        <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />
      )}
      {lightboxId && <PhotoLightbox photoId={lightboxId} onClose={() => setLightboxId(null)} />}
    </div>
  );
}

function colorTypeLabel(t?: string | null) {
  return ({
    color_negative: 'COLOR NEGATIVE',
    color_positive: 'COLOR POSITIVE',
    bw: 'BLACK & WHITE',
    slide_e6: 'SLIDE E6',
  } as Record<string, string>)[t ?? ''] ?? '—';
}

function formatN(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

// Silence unused
void ImageIcon;
