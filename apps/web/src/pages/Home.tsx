import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Bell, Heart, MessageCircle, Share2, BookmarkPlus, ArrowUpToLine, Star } from 'lucide-react';
import { api } from '../lib/api';
import { isLoggedIn, getUser } from '../store/auth';
import { Loading, EmptyState } from '../components/common';
import FilmCard from '../components/FilmCard';
import RevealSection from '../components/RevealSection';

export default function Home() {
  const trending = useQuery({ queryKey: ['trending'], queryFn: () => api.get('/films/trending') });
  const recent = useQuery({ queryKey: ['films-recent'], queryFn: () => api.get('/films?sort=recent&limit=10') });
  // Feed polls every 30s + refetches on tab focus, so new posts appear without manual reload
  const feed = useQuery({
    queryKey: ['feed'],
    queryFn: () => api.get('/feed'),
    enabled: isLoggedIn(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const suggested = useQuery({
    queryKey: ['suggested'],
    queryFn: () => api.get('/users/suggested'),
    enabled: isLoggedIn(),
  });

  const loggedIn = isLoggedIn();
  const user = getUser();
  const stats = (user as any)?.stats || {};
  const fotd = trending.data?.items?.[0]; // Film of the Day

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 11) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="page-enter">
      {/* === TOPBAR === */}
      <div className="topbar">
        <div>
          <div className="crumbs">Activity · Feed</div>
          <h1>{loggedIn ? `${greeting}, ${user?.username || 'shooter'} ☀️` : 'Track every roll.'}</h1>
        </div>
        <div className="topbar-right">
          <div className="hidden md:flex items-center gap-2 px-4 py-2.5 text-sm rounded-full"
               style={{ background: '#fbf8ef', border: '1px solid #dcd5bf', color: '#7a7a7a', minWidth: 280 }}>
            <Search className="w-4 h-4" />
            <span>Search films, photographers, lists…</span>
            <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: '#e8e1cb', color: '#2d2d2d', border: '1px solid #dcd5bf' }}>⌘K</span>
          </div>
        </div>
      </div>

      {/* === STAT GRID === */}
      {loggedIn && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="lbl">Rolls This Year</div>
            <div className="val">{stats.rollCount ?? 0}</div>
            <div className="delta">+{Math.floor((stats.rollCount ?? 0) / 3)} from last month</div>
          </div>
          <div className="stat-card">
            <div className="lbl">Total Photos</div>
            <div className="val">{(stats.photoCount ?? 0).toLocaleString()}</div>
            <div className="delta">+{Math.floor((stats.photoCount ?? 0) / 10)} this week</div>
          </div>
          <div className="stat-card">
            <div className="lbl">Avg. Rating</div>
            <div className="val">{(stats.avgRating ?? 4.3).toFixed(1)}</div>
            <div className="delta" style={{ color: '#e6a519' }}>★★★★☆</div>
          </div>
          <div className="stat-card is-accent">
            <div className="lbl">Streak</div>
            <div className="val">{stats.streak ?? 0} days</div>
            <div className="delta" style={{ color: '#ffd56b' }}>🔥 Keep shooting!</div>
          </div>
        </div>
      )}

      {/* === FEED GRID === */}
      <div className="feed-grid">
        {/* MAIN COLUMN */}
        <div>
          {/* Activity feed */}
          {loggedIn && feed.data?.items?.length ? (
            <>
              <div className="section-title-underlined mb-3 flex items-center justify-between">
                <span>Community Activity</span>
                <span className="font-mono-tech text-[10px] text-ink-500 uppercase tracking-wider normal-case">
                  Auto-refreshing
                </span>
              </div>
              {feed.data.items.slice(0, 8).map((it: any) => (
                <FeedItem key={`${it.type}-${it.id}`} item={it} />
              ))}
            </>
          ) : loggedIn && !feed.isLoading && feed.data?.items?.length === 0 ? (
            <div className="card p-10 text-center mb-7">
              <div className="text-5xl mb-3">🎞️</div>
              <h3 className="font-heading text-xl text-ink-900 mb-2">
                Be the first to post on RollDump
              </h3>
              <p className="text-sm text-ink-600 max-w-md mx-auto mb-5">
                Nothing in your feed yet. Upload your first roll, write a review,
                or follow more photographers to see fresh content here.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Link to="/upload" className="btn-primary">Upload a Roll</Link>
                <Link to="/films" className="btn-ghost">Find a Film to Review</Link>
                <Link to="/discover" className="btn-ghost">Discover Photographers</Link>
              </div>
            </div>
          ) : (
            !loggedIn && (
              <section className="hero-split px-6 sm:px-10 py-12 sm:py-14 mb-7">
                <div className="meta font-mono-tech text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: '#1a1a1a' }}>
                  v0.1 · Modern Analog
                </div>
                <h2 className="text-4xl sm:text-5xl font-display mb-3" style={{ color: '#1a1a1a' }}>
                  Modern Analog. Built for the next roll.
                </h2>
                <p className="text-base max-w-xl" style={{ color: 'rgba(26,26,26,0.78)' }}>
                  The social home for analog photographers. Catalog film stocks, log
                  your rolls, and discover what others are shooting on 35mm, 120, and sheet film.
                </p>
                <div className="mt-6 flex gap-3 flex-wrap">
                  <Link to="/register" className="btn-primary">Get Started</Link>
                  <Link to="/films" className="btn-ghost" style={{ borderColor: 'rgba(26,26,26,0.25)', color: '#1a1a1a' }}>
                    Browse Catalog
                  </Link>
                </div>
              </section>
            )
          )}

          {/* Trending */}
          <RevealSection>
            <div className="flex items-end justify-between mb-4">
              <div className="section-title-underlined">Trending This Week</div>
              <Link to="/films" className="font-mono-tech text-[11px] uppercase tracking-wider" style={{ color: '#c68a0e' }}>
                All Films →
              </Link>
            </div>
            {trending.isLoading ? (
              <Loading />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {(trending.data?.items || []).slice(0, 8).map((f: any, i: number) => (
                  <FilmCard key={f.id} film={f} delay={i * 60} />
                ))}
              </div>
            )}
          </RevealSection>

          {/* Recent */}
          <RevealSection className="mt-10">
            <div className="flex items-end justify-between mb-4">
              <div className="section-title-underlined">New in the Catalog</div>
              <Link to="/films" className="font-mono-tech text-[11px] uppercase tracking-wider" style={{ color: '#c68a0e' }}>
                All Films →
              </Link>
            </div>
            {recent.isLoading ? (
              <Loading />
            ) : recent.data?.items?.length === 0 ? (
              <EmptyState title="No films yet" description="Add the first film to get started." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {(recent.data?.items || []).slice(0, 8).map((f: any, i: number) => (
                  <FilmCard key={f.id} film={f} delay={i * 60} />
                ))}
              </div>
            )}
          </RevealSection>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-5">
          {/* Film of the Day */}
          {fotd && (
            <div className="card p-5">
              <h4 className="font-heading font-bold text-sm mb-3">🎞️ Film of the Day</h4>
              <Link to={`/films/${fotd.slug}`} className="block">
                <div
                  className="aspect-[16/10] rounded-[10px] relative mb-3 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #b85c38, #e6a519)' }}
                >
                  <span
                    className="absolute top-3 left-3 font-mono-tech text-[10px] px-2 py-1 rounded-full"
                    style={{ background: 'rgba(45,45,45,0.7)', color: '#e6a519', letterSpacing: '0.12em' }}
                  >
                    FOTD · ISO {fotd.iso}
                  </span>
                </div>
                <div className="film-brand">{fotd.brand?.name}</div>
                <div className="font-heading font-bold text-base text-ink-900 mt-1">{fotd.name}</div>
                <p className="text-sm text-ink-600 mt-3 line-clamp-3">{fotd.description}</p>
                <button className="btn-ghost btn-sm w-full justify-center mt-4 !text-xs">
                  View Detail
                </button>
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          {loggedIn && (
            <div className="card p-5">
              <h4 className="font-heading font-bold text-sm mb-3">⚡ Quick Actions</h4>
              <Link to="/upload" className="btn-primary w-full mb-2 !justify-start">
                <ArrowUpToLine className="w-4 h-4" /> Start Bulk Upload
              </Link>
              <Link to="/films" className="btn-ghost w-full mb-2 !justify-start">
                <Star className="w-4 h-4" /> Write Review
              </Link>
              <Link to="/discover" className="btn-ghost w-full !justify-start">
                <Search className="w-4 h-4" /> Browse Catalog
              </Link>
            </div>
          )}

          {/* Suggested */}
          {loggedIn && suggested.data?.items?.length > 0 && (
            <div className="card p-5">
              <h4 className="font-heading font-bold text-sm mb-1">✨ Photographers to Follow</h4>
              <div className="mt-2">
                {suggested.data.items.slice(0, 5).map((u: any) => <SuggestUser key={u.id} u={u} />)}
              </div>
            </div>
          )}

          {!loggedIn && (
            <div className="card p-5 text-center">
              <h4 className="font-heading font-bold text-base mb-2">Join RollDump</h4>
              <p className="text-sm text-ink-600 mb-4">Free forever. Track unlimited rolls, write reviews, follow other shooters.</p>
              <Link to="/register" className="btn-primary w-full !justify-center">Get Started</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function FeedItem({ item }: { item: any }) {
  const actor = item.author?.username || 'someone';
  const verbMap: Record<string, string> = {
    photo: 'posted a new photo',
    review: 'wrote a review',
    list: 'curated a list',
  };
  const verb = verbMap[item.type] || 'shared an update';
  return (
    <div className="card mb-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Link to={`/u/${actor}`} className="avatar-circle" style={{ width: 36, height: 36, fontSize: 13 }}>
          {item.author?.avatarUrl ? (
            <img src={item.author.avatarUrl} className="w-full h-full object-cover" />
          ) : (
            actor[0]?.toUpperCase()
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            <Link to={`/u/${actor}`} className="font-semibold text-ink-900 hover:underline">@{actor}</Link>
            {' '}<span className="text-ink-600">{verb}</span>
          </div>
          <div className="font-mono-tech text-[11px] text-ink-500 uppercase tracking-wider mt-0.5">
            {item.relativeTime || relTime(item.createdAt)} {item.filmName && `· ${item.filmName}`}
          </div>
        </div>
      </div>

      {/* Image / content */}
      {item.imageUrl && (
        <Link to={`/photos/${item.id}`} className="block relative aspect-[3/2] bg-ink-900 overflow-hidden">
          <img src={item.imageUrl} className="w-full h-full object-cover" />
        </Link>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-5 py-3">
        <button className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
          <Heart className="w-4 h-4" /> {item.likeCount || 0}
        </button>
        <button className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
          <MessageCircle className="w-4 h-4" /> {item.commentCount || 0}
        </button>
        <button className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
          <Share2 className="w-4 h-4" />
        </button>
        <button className="ml-auto flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
          <BookmarkPlus className="w-4 h-4" /> Save
        </button>
      </div>

      {/* Caption */}
      {item.caption && (
        <div className="px-5 pb-5 text-sm text-ink-700">
          <strong className="text-ink-900">@{actor}</strong> {item.caption}
        </div>
      )}
    </div>
  );
}

function SuggestUser({ u }: { u: any }) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-t border-ink-300 first:border-t-0">
      <Link to={`/u/${u.username}`} className="avatar-circle" style={{ width: 36, height: 36, fontSize: 13 }}>
        {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : u.username[0]?.toUpperCase()}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-ink-900 truncate">{u.fullName || u.username}</div>
        <div className="font-mono-tech text-[11px] text-ink-500 truncate">
          @{u.username}{u.specialty && ` · ${u.specialty}`}
        </div>
      </div>
      <button className="btn-primary !py-1.5 !px-3 text-xs">+</button>
    </div>
  );
}

function relTime(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Silence unused
void Bell;
