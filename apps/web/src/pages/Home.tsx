import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Bell, Heart, MessageCircle, Share2, BookmarkPlus, ArrowUpToLine, Star, Flame, ListChecks, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { isLoggedIn, getUser } from '../store/auth';
import FilmCard from '../components/FilmCard';
import { Loading } from '../components/common';

export default function Home() {
  const trending = useQuery({ queryKey: ['trending'], queryFn: () => api.get('/films/trending') });
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
  // Discover content — merged from the old /discover page so Home is the
  // single source of truth for "what's happening + what to explore"
  const featuredLists = useQuery({
    queryKey: ['discover-lists'],
    queryFn: () => api.get('/lists?tab=trending'),
  });
  const brands = useQuery({
    queryKey: ['discover-brands'],
    queryFn: () => api.get('/brands'),
  });
  // Live stats from API — getUser() snapshot from localStorage doesn't have them
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me'),
    enabled: isLoggedIn(),
  });

  const loggedIn = isLoggedIn();
  const user = getUser();
  const stats = me.data?.user?.stats || {};
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
          <button
            onClick={() => document.dispatchEvent(new CustomEvent('open-global-search'))}
            className="search-trigger hidden md:flex"
          >
            <Search className="w-4 h-4" />
            <span>Search films, photographers, lists…</span>
            <span className="kbd">⌘K</span>
          </button>
        </div>
      </div>

      {/* === STAT GRID — personalized to the signed-in user === */}
      {loggedIn && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="lbl">Rolls This Year</div>
            <div className="val">{stats.rollCount ?? 0}</div>
            <div className="delta">
              {stats.rollCount > 0
                ? `${stats.photoCount ?? 0} frames captured`
                : 'Log your first roll'}
            </div>
          </div>
          <div className="stat-card">
            <div className="lbl">Total Photos</div>
            <div className="val">{(stats.photoCount ?? 0).toLocaleString()}</div>
            <div className="delta">
              {stats.photoCount > 0
                ? `Across ${stats.rollCount ?? 0} rolls`
                : 'Upload to start'}
            </div>
          </div>
          <div className="stat-card">
            <div className="lbl">Avg. Rating</div>
            <div className="val">{(stats.avgRating ?? 0).toFixed(1)}</div>
            <div className="delta" style={{ color: '#e6a519' }}>
              {stats.reviewCount > 0 ? `from ${stats.reviewCount} review${stats.reviewCount > 1 ? 's' : ''}` : 'Write a review'}
            </div>
          </div>
          <div className="stat-card is-accent">
            <div className="lbl">Followers</div>
            <div className="val">{(stats.followersCount ?? 0).toLocaleString()}</div>
            <div className="delta" style={{ color: '#ffd56b' }}>
              {stats.followersCount > 0 ? `Following ${stats.followingCount ?? 0}` : 'Share & build community'}
            </div>
          </div>
        </div>
      )}

      {/* === FEED GRID === */}
      <div className="feed-grid">
        {/* MAIN COLUMN */}
        <div>
          {/* Activity feed — photos, reviews, and lists from photographers
              you follow (or recent posters if you follow nobody yet). Always
              rendered ABOVE the trending films section so the feed feels
              social-first, per the design system Home Feed layout. */}
          {loggedIn && feed.data?.items?.length ? (
            <>
              <div className="section-title-underlined mb-3 flex items-center justify-between">
                <span>Latest from the community</span>
                <span className="font-mono-tech text-[10px] text-ink-500 uppercase tracking-wider normal-case">
                  Auto-refreshing
                </span>
              </div>
              {feed.data.items.map((it: any) => (
                <FeedItem key={`${it.type}-${it.id}`} item={it} />
              ))}
            </>
          ) : loggedIn && !feed.isLoading && feed.data?.items?.length === 0 ? (
            <div
              className="mb-7 px-6 sm:px-10 py-14 text-center rounded-[26px] relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #e6a519 0%, #c68a0e 100%)',
                color: '#1a1a1a',
              }}
            >
              <div
                className="absolute right-[-40px] top-[-40px] w-[240px] h-[240px] rounded-full pointer-events-none"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              />
              <div className="relative z-10">
                <div className="text-6xl mb-4">🎞️</div>
                <h2 className="text-3xl sm:text-4xl font-display mb-2">
                  Your feed starts here.
                </h2>
                <p className="text-sm sm:text-base mb-6 max-w-lg mx-auto" style={{ color: 'rgba(26,26,26,0.78)' }}>
                  Nothing in your feed yet. Upload your first roll, write a review,
                  or follow more photographers to see fresh activity show up here.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Link to="/upload" className="btn-secondary">📷 Upload Your First Roll</Link>
                  <Link to="/films" className="btn-ghost" style={{ borderColor: 'rgba(26,26,26,0.25)', color: '#1a1a1a' }}>
                    Browse Catalog
                  </Link>
                </div>
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

          {/* End-of-feed cue */}
          {loggedIn && feed.data?.items?.length > 0 && (
            <div className="card p-6 text-center mt-2">
              <div className="font-mono-tech text-[11px] uppercase tracking-wider text-ink-500 mb-2">
                You're all caught up
              </div>
              <p className="text-sm text-ink-600 mb-3">
                That's everything new from your network. Keep scrolling to discover more films and lists.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Link to="/films" className="btn-secondary">Browse Catalog</Link>
              </div>
            </div>
          )}

          {/* ===== MERGED DISCOVER SECTIONS =====
              Used to live on /discover. Pulled inline so Home is the single
              feed-of-everything: who's posting, what's trending, and what to
              explore next. */}

          {/* Trending films */}
          <section className="mt-10">
            <div className="section-title-underlined mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2">
                <Flame className="w-4 h-4" style={{ color: '#e6a519' }} />
                Trending Films
              </span>
              <Link to="/films?sort=trending" className="font-mono-tech text-[10px] text-ink-500 uppercase tracking-wider hover:text-ink-900">
                See all →
              </Link>
            </div>
            {trending.isLoading ? (
              <Loading />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(trending.data?.items || []).slice(0, 8).map((f: any, i: number) => (
                  <FilmCard key={f.id} film={f} delay={i * 40} />
                ))}
              </div>
            )}
          </section>

          {/* Featured lists */}
          <section className="mt-10">
            <div className="section-title-underlined mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2">
                <ListChecks className="w-4 h-4" style={{ color: '#e6a519' }} />
                Featured Lists
              </span>
              <Link to="/lists" className="font-mono-tech text-[10px] text-ink-500 uppercase tracking-wider hover:text-ink-900">
                See all →
              </Link>
            </div>
            {featuredLists.isLoading ? (
              <Loading />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(featuredLists.data?.items || []).slice(0, 4).map((row: any) => (
                  <Link
                    key={row.list.id}
                    to={`/lists/${row.list.id}`}
                    className="card p-4 hover:border-primary-500/50 transition-all"
                  >
                    <div className="font-heading font-bold text-ink-900">{row.list.title}</div>
                    <div className="text-xs text-ink-500 mt-0.5 font-mono-tech uppercase tracking-wider">
                      by @{row.author?.username} · {row.list.itemCount || 0} films
                    </div>
                    {row.list.description && (
                      <p className="text-sm text-ink-600 mt-2 line-clamp-2">{row.list.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Brands */}
          <section className="mt-10 mb-4">
            <div className="section-title-underlined mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#e6a519' }} />
                Brands
              </span>
              <Link to="/films" className="font-mono-tech text-[10px] text-ink-500 uppercase tracking-wider hover:text-ink-900">
                Browse catalog →
              </Link>
            </div>
            {brands.isLoading ? (
              <Loading />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {(brands.data?.items || []).slice(0, 8).map((b: any) => (
                  <Link
                    key={b.id}
                    to={`/films?brand=${b.slug}`}
                    className="card p-3 text-center hover:border-primary-500/50 hover:bg-ink-200/40 transition-all"
                  >
                    <div className="font-semibold text-sm text-ink-900 truncate">{b.name}</div>
                    <div className="text-[11px] text-ink-500 font-mono-tech mt-0.5">
                      {b.filmCount || 0} films
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* SIDEBAR */}
        <aside>
          {/* Film of the Day — design system .side-card + .fotd-cover */}
          {fotd && (
            <div className="side-card">
              <h4>🎞️ Film of the Day</h4>
              <Link to={`/films/${fotd.slug}`} className="block">
                <div className="fotd-cover">
                  {fotd.coverUrl && <img src={fotd.coverUrl} alt={fotd.name} />}
                  <span className="label">FOTD · ISO {fotd.iso}</span>
                </div>
                <div className="film-brand">{fotd.brand?.name}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#1a1a1a', marginTop: 2 }}>
                  {fotd.name}
                </div>
                <p className="text-sm mt-3 line-clamp-3" style={{ color: '#4a4a4a' }}>{fotd.description}</p>
                <button className="btn-ghost btn-sm mt-4 w-full justify-center !text-xs">
                  View Detail
                </button>
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          {loggedIn && (
            <div className="side-card">
              <h4>⚡ Quick Actions</h4>
              <Link to="/upload" className="btn-primary w-full mb-3 !justify-start">
                <ArrowUpToLine className="w-4 h-4" /> Start Bulk Upload
              </Link>
              <Link to="/films" className="btn-ghost w-full mb-3 !justify-start">
                <Star className="w-4 h-4" /> Write Review
              </Link>
              <Link to="/films" className="btn-ghost w-full !justify-start">
                <Search className="w-4 h-4" /> Browse Catalog
              </Link>
            </div>
          )}

          {/* Suggested users — design system .suggest-user rows */}
          {loggedIn && suggested.data?.items?.length > 0 && (
            <div className="side-card">
              <h4>✨ Photographers to Follow</h4>
              {suggested.data.items.slice(0, 5).map((u: any) => <SuggestUser key={u.id} u={u} />)}
            </div>
          )}

          {!loggedIn && (
            <div className="side-card text-center">
              <h4>Join RollDump</h4>
              <p className="text-sm mb-4" style={{ color: '#4a4a4a' }}>
                Free forever. Track unlimited rolls, write reviews, follow other shooters.
              </p>
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
    <div className="feed-item">
      {/* Header — design system .feed-header */}
      <div className="feed-header">
        <Link to={`/u/${actor}`} className="avatar">
          {item.author?.avatarUrl ? (
            <img src={item.author.avatarUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            actor[0]?.toUpperCase()
          )}
        </Link>
        <div className="meta-text">
          <div className="name">
            <Link to={`/u/${actor}`} className="hover:underline">@{actor}</Link>
            {' '}
            <span style={{ color: '#7a7a7a', fontWeight: 400 }}>{verb}</span>
          </div>
          <div className="time">
            {item.relativeTime || relTime(item.createdAt)}
            {item.filmName && ` · ${item.filmName.toUpperCase()}`}
          </div>
        </div>
      </div>

      {/* Photo (if any) — design system .photo-frame with EXIF overlay */}
      {item.imageUrl && (
        <Link to={`/photos/${item.id}`} className="photo-frame block">
          <img src={item.imageUrl} alt={item.caption || ''} />
          {(item.filmName || item.iso) && (
            <div className="photo-overlay">
              <div className="tech">
                {item.iso ? `ISO ${item.iso}` : ''}
                {item.filmName ? `${item.iso ? ' · ' : ''}${item.filmName}` : ''}
              </div>
            </div>
          )}
        </Link>
      )}

      {/* Actions — design system .feed-actions / .act-btn */}
      <div className="feed-actions">
        <button className="act-btn" aria-label="Like">
          <Heart /> {item.likeCount || 0}
        </button>
        <button className="act-btn" aria-label="Comment">
          <MessageCircle /> {item.commentCount || 0}
        </button>
        <button className="act-btn" aria-label="Share">
          <Share2 />
        </button>
        <button className="act-btn" style={{ marginLeft: 'auto' }} aria-label="Save">
          <BookmarkPlus /> Save
        </button>
      </div>

      {/* Caption — design system .feed-caption */}
      {item.caption && (
        <div className="feed-caption">
          <strong>@{actor}</strong> {item.caption}
        </div>
      )}
    </div>
  );
}

function SuggestUser({ u }: { u: any }) {
  return (
    <div className="suggest-user">
      <Link to={`/u/${u.username}`} className="avatar">
        {u.avatarUrl ? (
          <img src={u.avatarUrl} className="w-full h-full object-cover" alt="" />
        ) : (
          u.username[0]?.toUpperCase()
        )}
      </Link>
      <div className="meta">
        <div className="name truncate">{u.fullName || u.username}</div>
        <div className="handle truncate">
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
