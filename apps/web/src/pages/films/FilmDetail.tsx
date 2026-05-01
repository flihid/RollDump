import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Camera, Award, Star, BookOpen, Image as ImageIcon, ThumbsUp, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { isLoggedIn } from '../../store/auth';
import { Loading, FormatBadge, ColorTypeBadge, StarRating } from '../../components/common';

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
    onSuccess: () => toast.success('Ditambahkan ke wishlist'),
    onError: (e: any) => toast.error(e.message),
  });

  const helpful = useMutation({
    mutationFn: (id: string) => api.post(`/reviews/${id}/helpful`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });

  const report = useMutation({
    mutationFn: ({ type, id, reason }: any) => api.post(`/reports/${type}/${id}`, { reason }),
    onSuccess: () => toast.success('Laporan diterima'),
  });

  const tipVote = useMutation({
    mutationFn: ({ id, voteType }: any) => api.post(`/tips/${id}/vote`, { vote_type: voteType }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tips'] }),
  });

  if (film.isLoading) return <Loading />;
  if (!film.data) return <div>Film tidak ditemukan</div>;

  const f = film.data.film;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="relative aspect-[16/6] bg-ink-200">
          {f.coverUrl && <img src={f.coverUrl} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              {f.brand && <span className="text-sm">{f.brand.name}</span>}
              <ColorTypeBadge value={f.colorType} />
              {f.status === 'discontinued' && <span className="badge bg-red-500/20 text-red-200">Discontinued</span>}
            </div>
            <h1 className="text-3xl font-bold">{f.name}</h1>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-white/80">
              <span>ISO {f.iso}</span>
              <span>•</span>
              <span>{f.countryOfOrigin}</span>
              <span>•</span>
              <span>Sejak {f.yearIntroduced}</span>
            </div>
          </div>
        </div>

        {/* Variant tabs */}
        <div className="px-4 sm:px-6 border-b border-ink-200 flex flex-wrap gap-1 -mb-px">
          <button
            onClick={() => setActiveFormat(null)}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${!activeFormat ? 'border-primary-600 text-primary-700' : 'border-transparent text-ink-600 hover:text-ink-900'}`}
          >
            Semua format
          </button>
          {variants.map((v: any) => (
            <button
              key={v.id}
              onClick={() => setActiveFormat(v.format)}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${activeFormat === v.format ? 'border-primary-600 text-primary-700' : 'border-transparent text-ink-600 hover:text-ink-900'}`}
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
                <Spec label="Eksposur" value={currentVariant.exposures} />
                <Spec label="Frame size" value={currentVariant.frameSize} />
                <Spec label="Push/Pull" value={currentVariant.pushPullRange} />
                <Spec label="DX coded" value={currentVariant.dxCoded === true ? 'Ya' : currentVariant.dxCoded === false ? 'Tidak' : '—'} />
                {currentVariant.msrpUsd && <Spec label="MSRP" value={`$${currentVariant.msrpUsd}`} />}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="card p-3">
              <div className="text-xs text-ink-500">Rating komunitas</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{(f.ratingAvg || 0).toFixed(1)}</span>
                <StarRating value={f.ratingAvg || 0} size="sm" />
              </div>
              <div className="text-xs text-ink-500 mt-0.5">dari {f.reviewCount || 0} review</div>
            </div>
            {isLoggedIn() && currentVariant && (
              <button
                onClick={() => wishlist.mutate(currentVariant.id)}
                className="btn-secondary w-full"
              >
                <Bookmark className="w-4 h-4" /> Tambah ke wishlist
              </button>
            )}
            {isLoggedIn() && (
              <Link to={`/films/${f.slug}/review/new`} className="btn-primary w-full">
                <Star className="w-4 h-4" /> Tulis review
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-200">
        <TabBtn active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} icon={<Star className="w-4 h-4" />} label={`Reviews (${f.stats?.reviewCount || 0})`} />
        <TabBtn active={activeTab === 'photos'} onClick={() => setActiveTab('photos')} icon={<ImageIcon className="w-4 h-4" />} label={`Foto (${f.stats?.photoCount || 0})`} />
        <TabBtn active={activeTab === 'tips'} onClick={() => setActiveTab('tips')} icon={<BookOpen className="w-4 h-4" />} label={`Tips (${f.stats?.tipsCount || 0})`} />
      </div>

      {/* Tab content */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {reviews.isLoading ? (
            <Loading />
          ) : reviews.data?.items?.length === 0 ? (
            <div className="card p-8 text-center text-sm text-ink-600">
              Belum ada review untuk format ini.{' '}
              {isLoggedIn() && (
                <Link to={`/films/${f.slug}/review/new`} className="text-primary-600 font-medium">Jadilah yang pertama!</Link>
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
                      <button onClick={() => helpful.mutate(r.review.id)} className="flex items-center gap-1 hover:text-primary-600">
                        <ThumbsUp className="w-3.5 h-3.5" /> Bermanfaat ({r.review.helpfulCount})
                      </button>
                      <button onClick={() => report.mutate({ type: 'review', id: r.review.id, reason: 'spam' })} className="flex items-center gap-1 hover:text-red-600">
                        <Flag className="w-3.5 h-3.5" /> Laporkan
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
            <div className="card p-8 text-center text-sm text-ink-600">Belum ada foto untuk format ini.</div>
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
                <BookOpen className="w-4 h-4" /> Tulis tips
              </Link>
            )}
          </div>
          {tips.isLoading ? (
            <Loading />
          ) : tips.data?.items?.length === 0 ? (
            <div className="card p-8 text-center text-sm text-ink-600">Belum ada tips. Bagikan pengetahuanmu!</div>
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
                  <div className="text-xs text-ink-500 mt-2">oleh @{row.author?.username}</div>
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
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${active ? 'border-primary-600 text-primary-700' : 'border-transparent text-ink-600 hover:text-ink-900'}`}
    >
      {icon} {label}
    </button>
  );
}
function Spec({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-ink-500">{label}</div>
      <div className="font-medium">{value || '—'}</div>
    </div>
  );
}
