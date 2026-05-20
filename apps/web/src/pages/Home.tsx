import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { isLoggedIn, getUser } from '../store/auth';
import { Loading, EmptyState } from '../components/common';
import FilmCard from '../components/FilmCard';
import FilmRoll3D from '../components/FilmRoll3D';
import RevealSection from '../components/RevealSection';

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
      {/* Hero */}
      <section className="hero-split -mt-2">
        <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-8 items-center px-6 sm:px-10 py-12 sm:py-16">
          <div className="max-w-2xl">
            {loggedIn && (
              <div className="text-xs uppercase tracking-[0.2em] text-primary-400 font-bold mb-3 animate-pulse">
                Welcome back, @{user?.username}
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl md:text-6xl leading-[1.02] text-ink-50">
              Track every roll.
              <br />
              <span className="text-primary-400 font-display-italic">Share every frame.</span>
            </h1>
            <p className="mt-5 text-ink-100 text-base sm:text-lg max-w-xl leading-relaxed">
              The social home for analog photographers. Catalog film stocks, log
              your rolls, and discover what others are shooting on 35mm, 120,
              and sheet film.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="stat-pill">🎞 35mm & 120</span>
              <span className="stat-pill">⭐ Community reviews</span>
              <span className="stat-pill">📷 Roll journal</span>
            </div>
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

          <div className="flex justify-center lg:justify-end">
            {heroFilm ? (
              <div className="relative">
                <FilmRoll3D
                  film={heroFilm}
                  size="hero"
                  autoSpin
                  interactive
                />
                <Link
                  to={`/films/${heroFilm.slug}`}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-primary-400 hover:text-primary-300 font-semibold uppercase tracking-wider"
                >
                  {heroFilm.name} →
                </Link>
              </div>
            ) : (
              <FilmRoll3D
                film={{ name: 'Portra 400', iso: 400, colorType: 'color_negative', brand: { name: 'Kodak' } }}
                size="hero"
                autoSpin
              />
            )}
          </div>
        </div>
        <div className="filmstrip-divider" />
      </section>

      {loggedIn && feed.data && feed.data.items?.length > 0 && (
        <RevealSection>
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
        </RevealSection>
      )}

      <RevealSection>
        <h2 className="section-title">
          <span>Trending this week</span>
          <Link to="/films" className="link-amber text-[10px] normal-case tracking-normal">
            All films →
          </Link>
        </h2>
        {trending.isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
            {(trending.data?.items || []).map((f: any, i: number) => (
              <FilmCard key={f.id} film={f} delay={i * 60} />
            ))}
          </div>
        )}
      </RevealSection>

      <RevealSection>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
            {(recent.data?.items || []).map((f: any, i: number) => (
              <FilmCard key={f.id} film={f} delay={i * 60} />
            ))}
          </div>
        )}
      </RevealSection>

      {!loggedIn && (
        <RevealSection>
          <section className="relative overflow-hidden rounded-xl border border-ink-600 bg-gradient-to-r from-ink-700 to-ink-800 px-6 sm:px-10 py-10 text-center">
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-30 hidden sm:block pointer-events-none">
              <FilmRoll3D
                film={{ name: 'Tri-X', iso: 400, colorType: 'bw', brand: { name: 'Kodak' } }}
                size="lg"
                autoSpin
                interactive={false}
              />
            </div>
            <h3 className="text-2xl sm:text-3xl font-semibold text-ink-50 relative z-10">
              Your darkroom journal, in your pocket.
            </h3>
            <p className="mt-2 text-ink-200 max-w-xl mx-auto relative z-10">
              Free forever. Log unlimited rolls, write reviews, and follow other shooters.
            </p>
            <Link to="/register" className="btn-primary mt-5 inline-flex relative z-10">
              Get started
            </Link>
          </section>
        </RevealSection>
      )}
    </div>
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
    <div className="card p-4 flex gap-3 hover:border-primary-500/40 hover:scale-[1.01] transition-all duration-200">
      <div className="w-9 h-9 rounded-full bg-primary-500 text-ink-900 flex items-center justify-center font-bold overflow-hidden shrink-0 ring-2 ring-primary-500/30">
        {item.author?.avatarUrl ? (
          <img src={item.author.avatarUrl} className="w-full h-full object-cover" alt="" />
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
        {item.title && <div className="text-sm mt-0.5 truncate text-ink-100">{item.title}</div>}
        {item.imageUrl && (
          <div className="mt-2 rounded-md overflow-hidden h-32 bg-ink-600 group">
            <img
              src={item.imageUrl}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              alt=""
            />
          </div>
        )}
      </div>
    </div>
  );
}
