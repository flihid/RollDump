import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Camera, Award, Star, BookOpen, Image as ImageIcon, ThumbsUp, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { isLoggedIn } from '../../store/auth';
import { Loading, FormatBadge, ColorTypeBadge, StarRating } from '../../components/common';
import FilmRoll3D from '../../components/FilmRoll3D';
import { useCountUp } from '../../hooks/useCountUp';
import { useInView } from '../../hooks/useInView';

export default function FilmDetail() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState<'reviews' | 'photos' | 'tips'>('reviews');
  const [activeFormat, setActiveFormat] = useState<string | null>(null);
  const qc = useQueryClient();

  const film = useQuery({
    queryKey: ['film', slug],
    queryFn: () => api.get(`/films/${slug}`),
    enabled: !!slug,
  });

  const filmId = film.data?.film?.id;
  const variants = film.data?.film?.variants || [];
  const currentVariant = variants.find((v: any) => v.format === activeFormat) || variants[0];

  const reviews = useQuery({
    queryKey: ['reviews', filmId, activeFormat],
    queryFn: () => api.get(`/reviews/by-film/${filmId}${activeFormat ? `?format=${activeFormat}` : ''}`),
    enabled: !!filmId && activeTab === 'reviews',
  });
  const photos = useQuery({
    queryKey: ['photos', filmId, activeFormat],
    queryFn: () => api.get(`/photos?film_id=${filmId}${activeFormat ? `&format=${activeFormat}` : ''}`),
    enabled: !!filmId && activeTab === 'photos',
  });
  const tips = useQuery({
    queryKey: ['tips', filmId, activeFormat],
    queryFn: () => api.get(`/tips/by-film/${filmId}${activeFormat ? `?format=${activeFormat}` : ''}`),
    enabled: !!filmId && activeTab === 'tips',
  });

  const wishlist = useMutation({
    mutationFn: (variantId: string) => api.post('/films/wishlists', { film_variant_id: variantId }),
    onSuccess: () => toast.success('Added to wishlist'),
    onError: (e: any) => toast.error(e.message),
  });

  const helpful = useMutation({
    mutationFn: (id: string) => api.post(`/reviews/${id}/helpful`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });

  const report = useMutation({
    mutationFn: ({ type, id, reason }: any) => api.post(`/reports/${type}/${id}`, { reason }),
    onSuccess: () => toast.success('Report submitted'),
  });

  const tipVote = useMutation({
    mutationFn: ({ id, voteType }: any) => api.post(`/tips/${id}/vote`, { vote_type: voteType }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tips'] }),
  });

  if (film.isLoading) return <Loading />;
  if (!film.data) return <div>Film not found</div>;

  const f = film.data.film;

  return (
    <div className="space-y-6">
      {/* Hero — big interactive 3D roll on the right, meta on left */}
      <div className="card overflow-hidden page-enter">
        <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center p-6 sm:p-10 bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900">
          {/* ambient backlight matching roll palette */}
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 80% 50%, var(--roll-glow, rgba(240,138,0,0.18)), transparent 70%)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {f.brand && <span className="text-xs text-primary-400 uppercase tracking-[0.2em] font-bold">{f.brand.name}</span>}
              <ColorTypeBadge value={f.colorType} />
              {f.status === 'discontinued' && <span className="badge bg-red-500/20 text-red-200 border border-red-500/30">Discontinued</span>}
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-ink-900 leading-[1.05]">{f.name}</h1>
            <div className="flex items-center gap-3 mt-4 text-sm text-ink-700 flex-wrap">
              <span className="stat-pill">ISO {f.iso}</span>
              {f.countryOfOrigin && <span className="stat-pill">{f.countryOfOrigin}</span>}
              {f.yearIntroduced && <span className="stat-pill">Since {f.yearIntroduced}</span>}
            </div>
          </div>
          <div className="flex justify-center md:justify-end relative">
            <FilmRoll3D film={f} size="hero" autoSpin interactive hoverSpin />
          </div>
        </div>

        {/* Variant tabs */}
        <div className="px-4 sm:px-6 border-b border-ink-300 flex flex-wrap gap-1 -mb-px">
          <button
            onClick={() => setActiveFormat(null)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${!activeFormat ? 'border-primary-500 text-primary-400' : 'border-transparent text-ink-600 hover:text-ink-900'}`}
          >
            All formats
          </button>
          {variants.map((v: any) => (
            <button
              key={v.id}
              onClick={() => setActiveFormat(v.format)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeFormat === v.format ? 'border-primary-500 text-primary-400' : 'border-transparent text-ink-600 hover:text-ink-900'}`}
            >
              {v.format}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6 grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <p className="text-sm text-ink-700 leading-relaxed">{f.description}</p>
            {currentVariant && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <Spec label="Exposures" value={currentVariant.exposures} />
                <Spec label="Frame size" value={currentVariant.frameSize} />
                <Spec label="Push/Pull" value={currentVariant.pushPullRange} />
                <Spec label="DX coded" value={currentVariant.dxCoded === true ? 'Yes' : currentVariant.dxCoded === false ? 'No' : '—'} />
                {currentVariant.msrpUsd && <Spec label="MSRP" value={`$${currentVariant.msrpUsd}`} />}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <RatingCard ratingAvg={f.ratingAvg || 0} reviewCount={f.reviewCount || 0} />
            {isLoggedIn() && currentVariant && (
              <button
                onClick={() => wishlist.mutate(currentVariant.id)}
                className="btn-secondary w-full"
              >
                <Bookmark className="w-4 h-4" /> Add to wishlist
              </button>
            )}
            {isLoggedIn() && (
              <Link to={`/films/${f.slug}/review/new`} className="btn-primary w-full">
                <Star className="w-4 h-4" /> Write a review
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-300">
        <TabBtn active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} icon={<Star className="w-4 h-4" />} label={`Reviews (${f.stats?.reviewCount || 0})`} />
        <TabBtn active={activeTab === 'photos'} onClick={() => setActiveTab('photos')} icon={<ImageIcon className="w-4 h-4" />} label={`Photos (${f.stats?.photoCount || 0})`} />
        <TabBtn active={activeTab === 'tips'} onClick={() => setActiveTab('tips')} icon={<BookOpen className="w-4 h-4" />} label={`Tips (${f.stats?.tipsCount || 0})`} />
      </div>

      {/* Tab content */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {reviews.isLoading ? (
            <Loading />
          ) : reviews.data?.items?.length === 0 ? (
            <div className="card p-8 text-center text-sm text-ink-600">
              No reviews for this format yet.{' '}
              {isLoggedIn() && (
                <Link to={`/films/${f.slug}/review/new`} className="link-amber font-semibold">Be the first!</Link>
              )}
            </div>
          ) : (
            reviews.data!.items.map((r: any) => (
              <div key={r.review.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <Link to={`/u/${r.author?.username}`} className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-700 overflow-hidden">
                    {r.author?.avatarUrl ? <img src={r.author.avatarUrl} className="w-full h-full object-cover" /> : r.author?.username[0].toUpperCase()}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/u/${r.author?.username}`} className="font-semibold text-sm hover:underline">@{r.author?.username}</Link>
                      <StarRating value={r.review.ratingOverall} size="sm" />
                      {r.variant && <FormatBadge format={r.variant.format} />}
                      {r.review.pushPullStops !== 0 && (
                        <span className="badge">Push {r.review.pushPullStops > 0 ? '+' : ''}{r.review.pushPullStops}</span>
                      )}
                    </div>
                    {(r.review.cameraText || r.review.shootingConditions) && (
                      <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-2">
                        {r.review.cameraText && <span><Camera className="w-3 h-3 inline" /> {r.review.cameraText}</span>}
                        {r.review.shootingConditions && <span>• {r.review.shootingConditions}</span>}
                      </div>
                    )}
                    <p className="text-sm mt-2 whitespace-pre-wrap">{r.review.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-ink-600">
                      <button onClick={() => helpful.mutate(r.review.id)} className="flex items-center gap-1 hover:text-primary-400">
                        <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({r.review.helpfulCount})
                      </button>
                      <button onClick={() => report.mutate({ type: 'review', id: r.review.id, reason: 'spam' })} className="flex items-center gap-1 hover:text-red-400">
                        <Flag className="w-3.5 h-3.5" /> Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'photos' && (
        <div>
          {photos.isLoading ? (
            <Loading />
          ) : photos.data?.items?.length === 0 ? (
            <div className="card p-8 text-center text-sm text-ink-600">No photos for this format yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {photos.data!.items.map((row: any) => (
                <Link key={row.photo.id} to={`/photos/${row.photo.id}`} className="aspect-square bg-ink-200 overflow-hidden rounded-lg">
                  <img src={row.photo.thumbUrl || row.photo.imageUrl} className="w-full h-full object-cover hover:scale-105 transition" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tips' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            {isLoggedIn() && (
              <Link to={`/films/${f.slug}/tips/new`} className="btn-secondary">
                <BookOpen className="w-4 h-4" /> Write a tip
              </Link>
            )}
          </div>
          {tips.isLoading ? (
            <Loading />
          ) : tips.data?.items?.length === 0 ? (
            <div className="card p-8 text-center text-sm text-ink-600">No tips yet. Share your knowledge!</div>
          ) : (
            tips.data!.items.map((row: any) => (
              <div key={row.tip.id} className="card p-4 flex gap-3">
                <div className="flex flex-col items-center text-xs">
                  <button onClick={() => tipVote.mutate({ id: row.tip.id, voteType: 1 })} className="text-ink-400 hover:text-primary-600">
                    <Award className="w-4 h-4" />
                  </button>
                  <span className="font-semibold">{row.tip.netScore}</span>
                  <button onClick={() => tipVote.mutate({ id: row.tip.id, voteType: -1 })} className="text-ink-400 hover:text-purple-600">
                    <Award className="w-4 h-4 rotate-180" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{row.tip.title}</h4>
                    <FormatBadge format={row.tip.targetFormat} />
                    <span className="badge">{row.tip.category}</span>
                  </div>
                  <p className="text-sm text-ink-700 mt-1 line-clamp-3">{row.tip.content}</p>
                  <div className="text-xs text-ink-500 mt-2">by @{row.author?.username}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${active ? 'border-primary-500 text-primary-400' : 'border-transparent text-ink-600 hover:text-ink-900'}`}
    >
      {icon} {label}
    </button>
  );
}
function Spec({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-md border border-ink-300 bg-ink-50/40 p-3 transition hover:border-primary-500/40">
      <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className="font-semibold text-ink-900 mt-0.5">{value || '—'}</div>
    </div>
  );
}

function RatingCard({ ratingAvg, reviewCount }: { ratingAvg: number; reviewCount: number }) {
  const { ref, visible } = useInView();
  const countedReviews = useCountUp(reviewCount, visible, 900);
  const countedRating = useCountUp(Math.round(ratingAvg * 10), visible, 1100);
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className="card p-4 spotlight-card"
      onMouseMove={(e) => {
        const t = e.currentTarget;
        const r = t.getBoundingClientRect();
        t.style.setProperty('--mx', `${e.clientX - r.left}px`);
        t.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
    >
      <div className="text-[10px] uppercase tracking-wider text-ink-500">Community rating</div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-3xl font-bold text-ink-900 counter-num">
          {(countedRating / 10).toFixed(1)}
        </span>
        <StarRating value={ratingAvg} size="sm" />
      </div>
      <div className="text-xs text-ink-600 mt-1">
        from <span className="counter-num font-semibold text-ink-700">{countedReviews}</span> reviews
      </div>
    </div>
  );
}
