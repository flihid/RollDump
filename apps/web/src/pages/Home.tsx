import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { isLoggedIn } from '../store/auth';
import { Loading, EmptyState, FormatBadge, StarRating } from '../components/common';

export default function Home() {
  const trending = useQuery({ queryKey: ['trending'], queryFn: () => api.get('/films/trending') });
  const recent = useQuery({ queryKey: ['films-recent'], queryFn: () => api.get('/films?sort=recent&limit=8') });
  const feed = useQuery({
    queryKey: ['feed'],
    queryFn: () => api.get('/feed'),
    enabled: isLoggedIn(),
  });

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-800 to-primary-900 text-white p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 rounded-full px-3 py-1 mb-3">
            <Sparkles className="w-3 h-3" /> Komunitas film analog Indonesia
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Setiap roll punya cerita.</h1>
          <p className="mt-3 text-white/80 text-sm sm:text-base">
            Review jujur, galeri tematik, dan tips dari sesama fotografer untuk 35mm, 120, hingga large format.
          </p>
          <div className="mt-5 flex gap-2 flex-wrap">
            <Link to="/films" className="btn-primary">Jelajahi katalog</Link>
            {!isLoggedIn() && (
              <Link to="/register" className="btn bg-white/10 text-white hover:bg-white/20 border border-white/20">
                Buat akun gratis
              </Link>
            )}
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, white, transparent 70%)' }} />
      </section>

      {isLoggedIn() && feed.data && feed.data.items?.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-3">Aktivitas teman</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {feed.data.items.slice(0, 6).map((it: any) => (
              <ActivityCard key={`${it.type}-${it.id}`} item={it} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="text-orange-500" /> Trending Minggu Ini
          </h2>
          <Link to="/films" className="text-sm text-primary-600 hover:underline">Lihat semua</Link>
        </div>
        {trending.isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {(trending.data?.items || []).map((f: any) => (
              <FilmCard key={f.id} film={f} />
            ))}
          </div>
        )}
      </section>

      {/* Recent */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Baru ditambahkan</h2>
          <Link to="/films" className="text-sm text-primary-600 hover:underline">Lihat semua</Link>
        </div>
        {recent.isLoading ? (
          <Loading />
        ) : recent.data?.items?.length === 0 ? (
          <EmptyState title="Belum ada film" description="Tambahkan film pertama untuk memulai." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {(recent.data?.items || []).map((f: any) => (
              <FilmCard key={f.id} film={f} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilmCard({ film }: { film: any }) {
  return (
    <Link to={`/films/${film.slug}`} className="card overflow-hidden group hover:shadow-md transition">
      <div className="aspect-[3/4] bg-ink-200 relative overflow-hidden">
        {film.coverUrl && <img src={film.coverUrl} alt={film.name} className="w-full h-full object-cover group-hover:scale-105 transition" />}
      </div>
      <div className="p-3">
        <div className="font-semibold text-sm leading-tight truncate">{film.name}</div>
        <div className="text-xs text-ink-500">{film.brand?.name}</div>
        <div className="flex items-center gap-1 mt-1.5">
          <StarRating value={film.ratingAvg || 0} size="sm" />
          <span className="text-xs text-ink-500">({film.reviewCount || 0})</span>
        </div>
        {film.availableFormats?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {film.availableFormats.slice(0, 3).map((f: string) => (
              <FormatBadge key={f} format={f} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function ActivityCard({ item }: { item: any }) {
  const actor = item.author?.username || 'seseorang';
  const verb = item.type === 'photo' ? 'mengunggah foto' : item.type === 'review' ? 'menulis review' : 'membuat list';
  return (
    <div className="card p-4 flex gap-3">
      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-700 overflow-hidden">
        {item.author?.avatarUrl ? <img src={item.author.avatarUrl} className="w-full h-full object-cover" /> : actor[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <Link to={`/u/${actor}`} className="font-semibold hover:underline">@{actor}</Link>{' '}
          <span className="text-ink-600">{verb}</span>
        </div>
        {item.title && <div className="text-sm mt-0.5 truncate">{item.title}</div>}
        {item.imageUrl && (
          <div className="mt-2 rounded-lg overflow-hidden h-32 bg-ink-200">
            <img src={item.imageUrl} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}
