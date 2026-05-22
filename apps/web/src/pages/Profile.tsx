import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Globe, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { getUser, isLoggedIn } from '../store/auth';
import { Loading, StarRating } from '../components/common';

type Tab = 'gallery' | 'rolls' | 'reviews' | 'lists' | 'achievements';

const ALL_ACHIEVEMENTS = [
  { key: 'first_roll', name: 'First Roll', sub: 'FIRST UPLOAD', ico: '🎞️' },
  { key: 'century', name: 'Century Club', sub: '100 PHOTOS', ico: '📸' },
  { key: 'tastemaker', name: 'Tastemaker', sub: '50 REVIEWS', ico: '⭐' },
  { key: 'hot_streak', name: 'Hot Streak', sub: '7 DAYS RUN', ico: '🔥' },
  { key: 'colorist', name: 'Colorist', sub: '10 COLOR ROLLS', ico: '🎨' },
  { key: 'mono_master', name: 'Monochrome Master', sub: '25 B&W ROLLS', ico: '⚫' },
  { key: 'large_format', name: 'Large Format Legend', sub: '5 LF ROLLS', ico: '🏔️' },
  { key: 'mentor', name: 'Mentor', sub: '10 TIPS · 100 UPVOTES', ico: '🎓' },
  { key: 'curator', name: 'Curator', sub: '5 LISTS · 500 FOLLOWS', ico: '📚' },
  { key: 'fotd', name: 'FOTD Featured', sub: 'FILM OF THE DAY', ico: '🏆' },
  { key: 'wedding', name: 'Wedding Pro', sub: 'PORTRA WEDDING ROLLS', ico: '💍' },
  { key: 'globetrotter', name: 'Globetrotter', sub: 'SHOOT IN 5 CITIES', ico: '✈️' },
];

export default function Profile() {
  const { username } = useParams();
  const me = getUser();
  const isMe = me?.username === username;
  const [tab, setTab] = useState<Tab>('gallery');

  const profile = useQuery({
    queryKey: ['user', username],
    queryFn: () => api.get(`/users/by-username/${username}`),
    enabled: !!username,
  });
  const userId = profile.data?.user?.id;

  const photos = useQuery({
    queryKey: ['user-photos', userId],
    queryFn: () => api.get(`/photos?user_id=${userId}`),
    enabled: !!userId && tab === 'gallery',
  });
  const reviews = useQuery({
    queryKey: ['user-reviews', userId],
    queryFn: () => api.get(`/reviews/by-user/${userId}`),
    enabled: !!userId && tab === 'reviews',
  });
  const lists = useQuery({
    queryKey: ['user-lists', userId],
    queryFn: () => api.get(`/lists/by-user/${userId}`),
    enabled: !!userId && tab === 'lists',
  });
  const rolls = useQuery({
    queryKey: ['user-rolls', userId],
    queryFn: () => api.get(`/photos/rolls/by-user/${userId}`),
    enabled: !!userId && tab === 'rolls',
  });

  const follow = useMutation({
    mutationFn: () => api.post(`/users/by-username/${username}/follow`),
    onSuccess: (data: any) => toast.success(data.following ? 'Now following' : 'Unfollowed'),
  });
  const block = useMutation({
    mutationFn: () => api.post(`/users/by-username/${username}/block`),
    onSuccess: (data: any) => toast.success(data.blocked ? 'User blocked' : 'Unblocked'),
  });

  if (profile.isLoading) return <Loading />;
  if (!profile.data) return <div>User not found</div>;
  const u = profile.data.user;
  const stats = u.stats || {};

  // Demo unlocked achievements (first 6 unlocked, rest locked)
  const unlocked = new Set(ALL_ACHIEVEMENTS.slice(0, Math.min(stats.achievementCount ?? 6, 12)).map((a) => a.key));

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <div className="crumbs">Profile · {u.username}</div>
          <h1>{u.fullName || u.username}</h1>
        </div>
      </div>

      {/* Cover banner */}
      <div className="profile-cover">
        {u.bannerUrl && (
          <img src={u.bannerUrl} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="profile-avatar-lg">
          {u.avatarUrl ? (
            <img src={u.avatarUrl} className="w-full h-full object-cover" />
          ) : (
            u.username[0]?.toUpperCase()
          )}
        </div>
      </div>

      {/* Info row */}
      <div className="profile-info">
        <div className="flex-1">
          <h1>{u.fullName || u.username}</h1>
          <div className="handle">@{u.username} · {u.location || 'Unknown'} · Since {new Date(u.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
          {u.bio && <p className="mt-3 text-ink-600 max-w-xl">{u.bio}</p>}
          <div className="flex flex-wrap items-center gap-4 mt-3 font-mono-tech text-[11px] uppercase tracking-wider text-ink-500">
            {u.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{u.location}</span>}
            {u.websiteUrl && (
              <a href={u.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-ink-900">
                <Globe className="w-3 h-3" />
                {u.websiteUrl.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isMe ? (
            <Link to="/settings" className="btn-ghost">Edit Profile</Link>
          ) : isLoggedIn() ? (
            <>
              <button onClick={() => follow.mutate()} className="btn-primary">+ Follow</button>
              <button onClick={() => block.mutate()} className="btn-ghost px-3">
                <Shield className="w-4 h-4" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Stat grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="lbl">Total Rolls</div>
          <div className="val">{stats.rollCount ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="lbl">Published Photos</div>
          <div className="val">{(stats.photoCount ?? 0).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="lbl">Followers</div>
          <div className="val">{(stats.followersCount ?? 0).toLocaleString()}</div>
        </div>
        <div className="stat-card is-accent">
          <div className="lbl">Badges Earned</div>
          <div className="val">{unlocked.size} / {ALL_ACHIEVEMENTS.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {([
          ['gallery', 'Gallery'],
          ['rolls', 'Rolls'],
          ['reviews', 'Reviews'],
          ['lists', 'Lists'],
          ['achievements', 'Achievements'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`tab-prf ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Gallery */}
      {tab === 'gallery' && (
        photos.isLoading ? <Loading /> : (photos.data?.items?.length ?? 0) === 0 ? (
          <div className="card p-10 text-center text-sm" style={{ color: '#7a7a7a' }}>No photos yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.data!.items.map((row: any) => (
              <Link
                key={row.photo.id}
                to={`/photos/${row.photo.id}`}
                className="aspect-square rounded-[10px] overflow-hidden block"
                style={{ background: '#1a1a1a' }}
              >
                <img src={row.photo.thumbUrl || row.photo.imageUrl} className="w-full h-full object-cover hover:scale-105 transition" />
              </Link>
            ))}
          </div>
        )
      )}

      {/* Rolls */}
      {tab === 'rolls' && (
        rolls.isLoading ? <Loading /> : (rolls.data?.items?.length ?? 0) === 0 ? (
          <div className="card p-10 text-center text-sm" style={{ color: '#7a7a7a' }}>No roll albums yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolls.data!.items.map((r: any) => (
              <Link key={r.id} to={`/rolls/${r.id}`} className="card card-hover p-5 block">
                <div className="font-mono-tech text-xs uppercase tracking-wider text-ink-500 mb-1">ROLL · {r.filmName || 'Film'}</div>
                <div className="font-heading font-bold text-base text-ink-900">{r.title}</div>
                <div className="text-xs text-ink-600 mt-2">{r.photoCount || 0} frames</div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Reviews */}
      {tab === 'reviews' && (
        reviews.isLoading ? <Loading /> : (reviews.data?.items?.length ?? 0) === 0 ? (
          <div className="card p-10 text-center text-sm" style={{ color: '#7a7a7a' }}>No reviews yet.</div>
        ) : (
          <div className="space-y-3">
            {reviews.data!.items.map((row: any) => (
              <Link key={row.review.id} to={`/films/${row.film.slug}`} className="card card-hover p-5 block">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading text-base text-ink-900">{row.film.name}</span>
                  <StarRating value={row.review.ratingOverall} size="sm" />
                </div>
                <p className="text-sm text-ink-700 mt-2 line-clamp-2">{row.review.content}</p>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Lists */}
      {tab === 'lists' && (
        lists.isLoading ? <Loading /> : (lists.data?.items?.length ?? 0) === 0 ? (
          <div className="card p-10 text-center text-sm" style={{ color: '#7a7a7a' }}>No lists yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lists.data!.items.map((l: any) => (
              <Link key={l.id} to={`/lists/${l.id}`} className="card card-hover p-5">
                <h3 className="font-heading font-bold text-base text-ink-900">{l.title}</h3>
                <div className="font-mono-tech text-[11px] text-ink-500 mt-1 uppercase tracking-wider">
                  {l.itemCount || 0} films · ♡ {l.likeCount || 0}
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Achievements */}
      {tab === 'achievements' && (
        <>
          <div className="section-title-underlined">Achievements ({unlocked.size} / {ALL_ACHIEVEMENTS.length})</div>
          <div className="section-sub">
            Unlocked badges glow in mustard. Complete challenges to earn more.
          </div>
          <div className="badge-grid">
            {ALL_ACHIEVEMENTS.map((a) => (
              <div key={a.key} className={`achv-badge ${unlocked.has(a.key) ? 'unlocked' : ''}`}>
                <div className="ring">{a.ico}</div>
                <h5>{a.name}</h5>
                <div className="desc-sm">{a.sub}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
