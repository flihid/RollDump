import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Globe, Shield, ShieldOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { getUser, isLoggedIn } from '../store/auth';
import { Loading, StarRating } from '../components/common';
import PhotoLightbox from '../components/PhotoLightbox';

type Tab = 'gallery' | 'rolls' | 'reviews' | 'lists' | 'achievements';

export default function Profile() {
  const { username } = useParams();
  const me = getUser();
  const isMe = me?.username === username;
  const [tab, setTab] = useState<Tab>('gallery');
  const [blockConfirm, setBlockConfirm] = useState<null | 'block' | 'unblock'>(null);
  const [selectedAchv, setSelectedAchv] = useState<any | null>(null);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [followersOpen, setFollowersOpen] = useState<null | 'followers' | 'following'>(null);
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ['user', username],
    queryFn: () => api.get(`/users/by-username/${username}`),
    enabled: !!username,
  });
  const userId = profile.data?.user?.id;
  const u = profile.data?.user;
  const isBlocked = !!u?.isBlocked;
  const isBlockedBy = !!u?.isBlockedBy;
  const isFollowing = !!u?.isFollowing;

  const photos = useQuery({
    queryKey: ['user-photos', userId],
    queryFn: () => api.get(`/photos?user_id=${userId}`),
    enabled: !!userId && tab === 'gallery' && !isBlocked && !isBlockedBy,
  });
  const reviews = useQuery({
    queryKey: ['user-reviews', userId],
    queryFn: () => api.get(`/reviews/by-user/${userId}`),
    enabled: !!userId && tab === 'reviews' && !isBlocked && !isBlockedBy,
  });
  const lists = useQuery({
    queryKey: ['user-lists', userId],
    queryFn: () => api.get(`/lists/by-user/${userId}`),
    enabled: !!userId && tab === 'lists' && !isBlocked && !isBlockedBy,
  });
  const rolls = useQuery({
    queryKey: ['user-rolls', userId],
    queryFn: () => api.get(`/photos/rolls/by-user/${userId}`),
    enabled: !!userId && tab === 'rolls' && !isBlocked && !isBlockedBy,
  });

  // Real achievements: catalog + unlocked
  const allAchievements = useQuery({
    queryKey: ['achievements-catalog'],
    queryFn: () => api.get('/achievements'),
  });
  const unlockedAchievements = useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: () => api.get(`/achievements/users/${userId}`),
    enabled: !!userId,
  });

  const follow = useMutation({
    mutationFn: () => api.post(`/users/by-username/${username}/follow`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', username] });
    },
  });
  const block = useMutation({
    mutationFn: () => api.post(`/users/by-username/${username}/block`),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['user', username] });
      qc.invalidateQueries({ queryKey: ['user-photos'] });
      qc.invalidateQueries({ queryKey: ['user-reviews'] });
      qc.invalidateQueries({ queryKey: ['user-lists'] });
      qc.invalidateQueries({ queryKey: ['user-rolls'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['comments'] });
      setBlockConfirm(null);
      toast.success(data.blocked ? `@${u?.username} blocked` : `@${u?.username} unblocked`);
    },
  });

  if (profile.isLoading) return <Loading />;
  if (!profile.data) return <div className="card p-10 text-center">User not found</div>;

  const stats = u.stats || {};
  const allList: any[] = allAchievements.data?.items || [];
  const unlocked: any[] = unlockedAchievements.data?.items || [];
  const unlockedKeys = new Set(unlocked.map((a) => a.key));

  // Hidden-content state: someone the viewer has blocked, or who blocked the viewer
  const hideContent = isBlocked || isBlockedBy;

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
          <img src={u.bannerUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
        )}
        <div className="profile-avatar-lg">
          {u.avatarUrl ? (
            <img src={u.avatarUrl} className="w-full h-full object-cover" alt={u.username} />
          ) : (
            u.username[0]?.toUpperCase()
          )}
        </div>
      </div>

      {/* Info row */}
      <div className="profile-info">
        <div className="flex-1">
          <h1>{u.fullName || u.username}</h1>
          <div className="handle">
            @{u.username} · {u.location || 'Unknown'} · Since{' '}
            {new Date(u.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>
          {u.bio && !hideContent && <p className="mt-3 text-ink-600 max-w-xl">{u.bio}</p>}
          {!hideContent && (
            <div className="flex flex-wrap items-center gap-4 mt-3 font-mono-tech text-[11px] uppercase tracking-wider text-ink-500">
              {u.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {u.location}
                </span>
              )}
              {u.websiteUrl && (
                <a href={u.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-ink-900">
                  <Globe className="w-3 h-3" />
                  {u.websiteUrl.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isMe ? (
            <Link to="/settings" className="btn-ghost">Edit Profile</Link>
          ) : isLoggedIn() ? (
            <>
              {!isBlocked && !isBlockedBy && (
                <button onClick={() => follow.mutate()} className={isFollowing ? 'btn-ghost' : 'btn-primary'}>
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </button>
              )}
              <button
                onClick={() => setBlockConfirm(isBlocked ? 'unblock' : 'block')}
                className="btn-ghost px-3"
                title={isBlocked ? 'Unblock' : 'Block'}
                style={isBlocked ? { background: '#c8443a', color: 'white', borderColor: '#c8443a' } : undefined}
              >
                {isBlocked ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Blocked content guard */}
      {hideContent && (
        <div className="card p-10 text-center mt-4">
          <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: isBlocked ? '#c8443a' : '#7a7a7a' }} />
          <h3 className="font-heading text-lg mb-2">
            {isBlocked ? 'You blocked this user' : 'Content unavailable'}
          </h3>
          <p className="text-sm text-ink-600 max-w-md mx-auto">
            {isBlocked
              ? "You won't see this user's photos, reviews, or lists. Unblock them above to restore visibility."
              : "This user has restricted access to their content."}
          </p>
        </div>
      )}

      {!hideContent && (
        <>
          {/* Stat grid — followers & following as separate clickable cards */}
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="stat-card">
              <div className="lbl">Total Rolls</div>
              <div className="val">{stats.rollCount ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="lbl">Published Photos</div>
              <div className="val">{(stats.photoCount ?? 0).toLocaleString()}</div>
            </div>
            <button
              type="button"
              onClick={() => setFollowersOpen('followers')}
              className="stat-card text-left cursor-pointer hover:border-ink-400 transition"
              title="View followers"
            >
              <div className="lbl">Followers</div>
              <div className="val">{(stats.followersCount ?? 0).toLocaleString()}</div>
              <div className="delta" style={{ color: '#c68a0e' }}>View list →</div>
            </button>
            <button
              type="button"
              onClick={() => setFollowersOpen('following')}
              className="stat-card text-left cursor-pointer hover:border-ink-400 transition"
              title="View following"
            >
              <div className="lbl">Following</div>
              <div className="val">{(stats.followingCount ?? 0).toLocaleString()}</div>
              <div className="delta" style={{ color: '#c68a0e' }}>View list →</div>
            </button>
          </div>
          <div className="stat-grid" style={{ marginTop: -8, gridTemplateColumns: '1fr' }}>
            <div className="stat-card is-accent">
              <div className="lbl">Badges Earned</div>
              <div className="val">
                {unlocked.length} / {allList.length || 12}
              </div>
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
          {tab === 'gallery' &&
            (photos.isLoading ? (
              <Loading />
            ) : (photos.data?.items?.length ?? 0) === 0 ? (
              <div className="card p-10 text-center text-sm" style={{ color: '#7a7a7a' }}>No photos yet.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.data!.items.map((row: any) => (
                  <button
                    key={row.photo.id}
                    onClick={() => setLightboxId(row.photo.id)}
                    className="aspect-square rounded-[10px] overflow-hidden block relative group cursor-pointer"
                    style={{ background: '#1a1a1a' }}
                  >
                    <img
                      src={row.photo.thumbUrl || row.photo.imageUrl}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      alt=""
                    />
                    {row.viewerHasLiked && (
                      <span
                        className="absolute top-2 right-2 text-lg"
                        style={{ color: '#e6a519', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}
                      >
                        ♥
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}

          {/* Rolls */}
          {tab === 'rolls' &&
            (rolls.isLoading ? (
              <Loading />
            ) : (rolls.data?.items?.length ?? 0) === 0 ? (
              <div className="card p-10 text-center text-sm" style={{ color: '#7a7a7a' }}>No roll albums yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rolls.data!.items.map((r: any) => (
                  <Link key={r.id} to={`/rolls/${r.id}`} className="card card-hover p-5 block">
                    <div className="font-mono-tech text-xs uppercase tracking-wider text-ink-500 mb-1">
                      ROLL · {r.filmName || 'Film'}
                    </div>
                    <div className="font-heading font-bold text-base text-ink-900">{r.title}</div>
                    <div className="text-xs text-ink-600 mt-2">{r.photoCount || 0} frames</div>
                  </Link>
                ))}
              </div>
            ))}

          {/* Reviews */}
          {tab === 'reviews' &&
            (reviews.isLoading ? (
              <Loading />
            ) : (reviews.data?.items?.length ?? 0) === 0 ? (
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
            ))}

          {/* Lists */}
          {tab === 'lists' &&
            (lists.isLoading ? (
              <Loading />
            ) : (lists.data?.items?.length ?? 0) === 0 ? (
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
            ))}

          {/* Achievements */}
          {tab === 'achievements' && (
            <>
              <div className="section-title-underlined">
                Achievements ({unlocked.length} / {allList.length})
              </div>
              <div className="section-sub">
                Unlocked badges glow mustard. Click any badge to see how to earn it.
              </div>
              {allAchievements.isLoading ? (
                <Loading />
              ) : (
                <div className="badge-grid">
                  {allList.map((a: any) => (
                    <button
                      key={a.key}
                      onClick={() => setSelectedAchv(a)}
                      className={`achv-badge text-center w-full ${unlockedKeys.has(a.key) ? 'unlocked' : ''}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="ring">{a.icon || '🏅'}</div>
                      <h5>{a.name}</h5>
                      <div className="desc-sm">{a.points} PTS</div>
                    </button>
                  ))}
                </div>
              )}
              {isMe && (
                <div className="mt-6 flex justify-center">
                  <RecomputeButton />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* === BLOCK / UNBLOCK CONFIRMATION MODAL === */}
      {blockConfirm && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setBlockConfirm(null)}>
          <div className="card p-6 max-w-md w-full" style={{ background: '#fbf8ef' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full grid place-items-center"
                style={{
                  background: blockConfirm === 'block' ? 'rgba(200,68,58,0.15)' : 'rgba(230,165,25,0.18)',
                  color: blockConfirm === 'block' ? '#c8443a' : '#c68a0e',
                }}
              >
                {blockConfirm === 'block' ? <Shield className="w-6 h-6" /> : <ShieldOff className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-heading text-lg text-ink-900">
                  {blockConfirm === 'block' ? `Block @${u.username}?` : `Unblock @${u.username}?`}
                </h3>
                <div className="text-xs text-ink-500 font-mono-tech uppercase tracking-wider">
                  {blockConfirm === 'block' ? 'This can be undone' : 'You can re-block anytime'}
                </div>
              </div>
            </div>
            <p className="text-sm text-ink-700 mb-5">
              {blockConfirm === 'block'
                ? "They won't be able to see your profile, photos, or interact with you. You also won't see any of their photos, reviews, tips, lists, or comments anywhere on RollDump. Any existing follow relationship between you will be removed."
                : `You'll see @${u.username}'s photos, reviews, tips, lists, and comments again. Their profile will be visible to you, and they can interact with your content if they're not blocking you.`}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBlockConfirm(null)} className="btn-ghost">Cancel</button>
              <button
                onClick={() => block.mutate()}
                disabled={block.isPending}
                className={blockConfirm === 'block' ? 'btn-danger' : 'btn-primary'}
              >
                {block.isPending
                  ? blockConfirm === 'block' ? 'Blocking…' : 'Unblocking…'
                  : blockConfirm === 'block' ? 'Block User' : 'Unblock User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === ACHIEVEMENT DETAIL MODAL === */}
      {selectedAchv && (
        <AchievementModal
          achv={selectedAchv}
          unlocked={unlockedKeys.has(selectedAchv.key)}
          unlockedRecord={unlocked.find((a) => a.key === selectedAchv.key)}
          isMe={isMe}
          ownerUsername={u.username}
          onClose={() => setSelectedAchv(null)}
        />
      )}

      {/* === PHOTO LIGHTBOX === */}
      {lightboxId && <PhotoLightbox photoId={lightboxId} onClose={() => setLightboxId(null)} />}

      {/* === FOLLOWERS / FOLLOWING MODAL === */}
      {followersOpen && (
        <FollowersModal
          username={u.username}
          kind={followersOpen}
          onClose={() => setFollowersOpen(null)}
          onSwitch={(k) => setFollowersOpen(k)}
        />
      )}
    </div>
  );
}

function FollowersModal({
  username,
  kind,
  onClose,
  onSwitch,
}: {
  username: string;
  kind: 'followers' | 'following';
  onClose: () => void;
  onSwitch: (k: 'followers' | 'following') => void;
}) {
  const q = useQuery({
    queryKey: ['user-followers', username, kind],
    queryFn: () => api.get(`/users/by-username/${username}/${kind}`),
  });

  return (
    <div className="modal-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div className="card p-0 max-w-md w-full overflow-hidden" style={{ background: '#fbf8ef' }} onClick={(e) => e.stopPropagation()}>
        {/* Header with tabs */}
        <div className="flex items-center border-b border-ink-300">
          <button
            onClick={() => onSwitch('followers')}
            className="flex-1 py-3 font-heading text-sm font-bold transition"
            style={{
              background: kind === 'followers' ? '#1a1a1a' : 'transparent',
              color: kind === 'followers' ? '#e6a519' : '#4a4a4a',
            }}
          >
            Followers
          </button>
          <button
            onClick={() => onSwitch('following')}
            className="flex-1 py-3 font-heading text-sm font-bold transition"
            style={{
              background: kind === 'following' ? '#1a1a1a' : 'transparent',
              color: kind === 'following' ? '#e6a519' : '#4a4a4a',
            }}
          >
            Following
          </button>
          <button onClick={onClose} className="w-12 h-12 grid place-items-center text-ink-500 hover:text-ink-900">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-3">
          {q.isLoading ? (
            <div className="py-8 text-center text-sm text-ink-500">Loading…</div>
          ) : (q.data?.items?.length ?? 0) === 0 ? (
            <div className="py-10 text-center">
              <div className="text-sm font-semibold text-ink-900 mb-1">
                {kind === 'followers' ? 'No followers yet' : "Not following anyone"}
              </div>
              <div className="text-xs text-ink-500">
                {kind === 'followers'
                  ? 'Share your roll and people will start following.'
                  : 'Explore /discover to find photographers to follow.'}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-ink-300">
              {q.data!.items.map((u: any) => (
                <Link
                  key={u.id}
                  to={`/u/${u.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 py-3 px-2 hover:bg-ink-200 rounded transition"
                >
                  <div className="avatar-circle shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      (u.username[0] || '?').toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-ink-900 truncate">{u.fullName || u.username}</div>
                    <div className="font-mono-tech text-[11px] text-ink-500 truncate">@{u.username}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AchievementModal({
  achv,
  unlocked,
  unlockedRecord,
  isMe,
  ownerUsername,
  onClose,
}: {
  achv: any;
  unlocked: boolean;
  unlockedRecord?: any;
  isMe: boolean;
  ownerUsername: string;
  onClose: () => void;
}) {
  // Only fetch viewer's own progress if they're looking at THEIR OWN profile.
  // On someone else's profile, "how to earn" + progress is irrelevant —
  // it's their badge, not yours.
  const progress = useQuery({
    queryKey: ['achv-progress', achv.key],
    queryFn: () => api.get(`/achievements/progress/${achv.key}`),
    enabled: isLoggedIn() && isMe && !unlocked,
  });
  const p = progress.data;
  const pct = p ? Math.min(100, Math.round((p.progress / Math.max(1, p.threshold)) * 100)) : 0;
  const unlockedDate = unlockedRecord?.unlockedAt
    ? new Date(unlockedRecord.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="modal-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div className="card p-7 max-w-md w-full relative" style={{ background: '#fbf8ef' }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full text-ink-500 hover:bg-ink-200"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div
            className={`w-24 h-24 rounded-full grid place-items-center text-5xl mx-auto mb-4 ${unlocked ? '' : 'grayscale opacity-50'}`}
            style={
              unlocked
                ? {
                    background: 'linear-gradient(135deg, #e6a519, #c68a0e)',
                    boxShadow: '0 0 0 6px rgba(230,165,25,0.2)',
                  }
                : { background: '#e8e1cb' }
            }
          >
            {achv.icon || '🏅'}
          </div>
          <h2 className="font-heading text-2xl text-ink-900 mb-1">{achv.name}</h2>
          <div className="font-mono-tech text-[11px] text-ink-500 uppercase tracking-wider mb-4">
            {unlocked ? '✓ EARNED' : `${achv.points} PTS · LOCKED`}
          </div>
          <p className="text-sm text-ink-700 mb-5">{achv.description}</p>

          {/* === Unlocked state === */}
          {unlocked && (
            <div className="p-4 rounded-md" style={{ background: 'rgba(230,165,25,0.15)' }}>
              <div className="text-sm text-ink-900 font-semibold">
                {isMe ? '🎉 Congrats — you earned this!' : `@${ownerUsername} earned this badge`}
              </div>
              {unlockedDate && (
                <div className="text-xs text-ink-700 mt-1 font-mono-tech uppercase tracking-wider">
                  on {unlockedDate}
                </div>
              )}
              <div className="text-xs text-ink-700 mt-1">+{achv.points} points</div>
            </div>
          )}

          {/* === Locked: only show progress on YOUR OWN profile === */}
          {!unlocked && isMe && p && (
            <>
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-mono-tech text-[11px] uppercase tracking-wider text-ink-500">Your progress</span>
                <span className="font-mono-tech text-sm text-ink-900">
                  {p.progress} / {p.threshold}
                </span>
              </div>
              <div className="rating-track">
                <div className="rating-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-ink-500 mt-3">
                {pct >= 100
                  ? 'Eligible! Click "Check for new achievements" to claim it.'
                  : `${p.threshold - p.progress} more to unlock`}
              </div>
            </>
          )}

          {/* Locked on someone else's profile — no progress, just the description */}
          {!unlocked && !isMe && (
            <div className="p-3 rounded-md" style={{ background: '#ede5cf' }}>
              <div className="text-sm text-ink-700">
                @{ownerUsername} hasn't earned this badge yet.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecomputeButton() {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => api.post('/achievements/recompute'),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['user-achievements'] });
      qc.invalidateQueries({ queryKey: ['user'] });
      if (data.earned?.length) {
        toast.success(`🎉 Unlocked ${data.earned.length} new achievement${data.earned.length > 1 ? 's' : ''}!`);
      } else {
        toast('No new achievements yet — keep shooting!');
      }
    },
  });
  return (
    <button onClick={() => m.mutate()} disabled={m.isPending} className="btn-secondary">
      {m.isPending ? 'Checking…' : '✨ Check for new achievements'}
    </button>
  );
}
