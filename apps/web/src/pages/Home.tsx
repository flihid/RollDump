import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { isLoggedIn, getUser } from '../store/auth';
import { Loading, EmptyState, FormatBadge, StarRating } from '../components/common';

export default function Home() {
  const trending = useQuery({ queryKey: ['trending'], queryFn: () => api.get('/films/trending') });
  const recent = useQuery({ queryKey: ['films-recent'], queryFn: () => api.get('/films?sort=recent&limit=10') });
  const feed = useQuery({
    queryKey: ['feed'],
    queryFn: () => api.get('/feed'),
    enabled: isLoggedIn(),
  });

  const loggedIn = isLoggedIn();
  const user = getUser();
  const heroFilm = trending.data?.items?.[0];

  return (
    <div className="space-y-14">
      {/* Hero — Letterboxd-style: big serif headline over moody backdrop */}
      <section className="relative overflow-hidden rounded-xl -mt-2">
        <div className="absolute inset-0">
          {heroFilm?.coverUrl ? (
            <img
              src={heroFilm.coverUrl}
              alt=""
              className="w-full h-full object-cover opacity-40"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-ink-700 via-ink-800 to-primary-900/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-ink-800/60 to-ink-800/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-800/95 via-ink-800/50 to-transparent" />
        </div>
        <div className="relative z-10 px-6 sm:px-10 py-14 sm:py-20 max-w-2xl">
          {loggedIn && (
            <div className="text-xs uppercase tracking-[0.2em] text-primary-400 font-bold mb-3">
              Welcome back, @{user?.username}
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] text-ink-50">
            Track every roll.
            <br />
            <span className="text-primary-400 italic">Share every frame.</span>
          </h1>
          <p className="mt-5 text-ink-100 text-base sm:text-lg max-w-xl leading-relaxed">
            The social home for analog photographers. Catalog film stocks, log
            your rolls, and discover what others are shooting on 35mm, 120, and
            sheet film.
          </p>
          <div className="mt-7 flex gap-3 flex-wrap">
            <Link to="/films" className="btn-primary">
              Browse catalog
            </Link>
            {!loggedIn ? (
              <Link
                to="/register"
                className="btn bg-ink-50/10 text-ink-50 border border-ink-300/30 hover:bg-ink-50/15 backdrop-blur-sm"
              >
                Create account
              </Link>
            ) : (
              <Link
                to="/upload"
                className="btn bg-ink-50/10 text-ink-50 border border-ink-300/30 hover:bg-ink-50/15 backdrop-blur-sm"
              >
                Log a roll
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Activity from people you follow */}
      {loggedIn && feed.data && feed.data.items?.length > 0 && (
        <section>
          <h2 className="section-title">
            <span>From your network</span>
            <Link to="/discover" className="link-amber text-[10px] normal-case tracking-normal">
              See more →
            </Link>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {feed.data.items.slice(0, 6).map((it: any) => (
              <ActivityCard key={`${it.type}-${it.id}`} item={it} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section>
        <h2 className="section-title">
          <span>Trending this week</span>
          <Link to="/films" className="link-amber text-[10px] normal-case tracking-normal">
            All films →
          </Link>
        </h2>
        {trending.isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-6 gap-4">
            {(trending.data?.items || []).map((f: any) => (
              <FilmCard key={f.id} film={f} />
            ))}
          </div>
        )}
      </section>

      {/* Recent */}
      <section>
        <h2 className="section-title">
          <span>New in the catalog</span>
          <Link to="/films" className="link-amber text-[10px] normal-case tracking-normal">
            All films →
          </Link>
        </h2>
        {recent.isLoading ? (
          <Loading />
        ) : recent.data?.items?.length === 0 ? (
          <EmptyState title="No films yet" description="Add the first film to get started." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-6 gap-4">
            {(recent.data?.items || []).map((f: any) => (
              <FilmCard key={f.id} film={f} />
            ))}
          </div>
        )}
      </section>

      {/* CTA strip */}
      {!loggedIn && (
        <section className="relative overflow-hidden rounded-xl border border-ink-600 bg-gradient-to-r from-ink-700 to-ink-800 px-6 sm:px-10 py-10 text-center">
          <h3 className="text-2xl sm:text-3xl font-semibold text-ink-50">
            Your darkroom journal, in your pocket.
          </h3>
          <p className="mt-2 text-ink-200 max-w-xl mx-auto">
            Free forever. Log unlimited rolls, write reviews, and follow other
            shooters.
          </p>
          <Link to="/register" className="btn-primary mt-5 inline-flex">
            Get started
          </Link>
        </section>
      )}
    </div>
  );
}

function FilmCard({ film }: { film: any }) {
  return (
    <Link to={`/films/${film.slug}`} className="group block">
      <div className="stock-card mb-2">
        {film.coverUrl ? (
          <img
            src={film.coverUrl}
            alt={film.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300 text-xs uppercase tracking-wider p-3 text-center">
            {film.name}
          </div>
        )}
        {film.availableFormats?.[0] && (
          <div className="absolute top-2 left-2">
            <FormatBadge format={film.availableFormats[0]} />
          </div>
        )}
      </div>
      <div className="px-0.5">
        <div className="text-[10px] uppercase tracking-wider text-ink-200 mb-0.5">
          {film.brand?.name}
        </div>
        <div className="font-semibold text-sm text-ink-50 leading-tight line-clamp-2 group-hover:text-primary-400 transition-colors">
          {film.name}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <StarRating value={film.ratingAvg || 0} size="sm" />
          <span className="text-[11px] text-ink-300">({film.reviewCount || 0})</span>
        </div>
      </div>
    </Link>
  );
}

function ActivityCard({ item }: { item: any }) {
  const actor = item.author?.username || 'someone';
  const verb =
    item.type === 'photo'
      ? 'uploaded a photo'
      : item.type === 'review'
      ? 'wrote a review'
      : 'curated a list';
  return (
    <div className="card p-4 flex gap-3 hover:border-primary-500/40 transition">
      <div className="w-9 h-9 rounded-full bg-primary-500 text-ink-900 flex items-center justify-center font-bold overflow-hidden shrink-0">
        {item.author?.avatarUrl ? (
          <img src={item.author.avatarUrl} className="w-full h-full object-cover" />
        ) : (
          actor[0]?.toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <Link to={`/u/${actor}`} className="font-semibold text-ink-50 hover:text-primary-400">
            @{actor}
          </Link>{' '}
          <span className="text-ink-200">{verb}</span>
        </div>
        {item.title && (
          <div className="text-sm mt-0.5 truncate text-ink-100">{item.title}</div>
        )}
        {item.imageUrl && (
          <div className="mt-2 rounded-md overflow-hidden h-32 bg-ink-600">
            <img src={item.imageUrl} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}
