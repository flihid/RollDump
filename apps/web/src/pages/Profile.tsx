import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Globe, Image as ImageIcon, Star, ListChecks, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { getUser, isLoggedIn } from '../store/auth';
import { Loading, StarRating } from '../components/common';

export default function Profile() {
  const { username } = useParams();
  const me = getUser();
  const isMe = me?.username === username;
  const [tab, setTab] = useState<'photos' | 'reviews' | 'lists' | 'rolls'>('photos');

  const profile = useQuery({
    queryKey: ['user', username],
    queryFn: () => api.get(`/users/by-username/${username}`),
    enabled: !!username,
  });
  const userId = profile.data?.user?.id;
  const photos = useQuery({
    queryKey: ['user-photos', userId],
    queryFn: () => api.get(`/photos?user_id=${userId}`),
    enabled: !!userId && tab === 'photos',
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
    onSuccess: (data: any) => toast.success(data.following ? 'Following' : 'Unfollowed'),
  });
  const block = useMutation({
    mutationFn: () => api.post(`/users/by-username/${username}/block`),
    onSuccess: (data: any) => toast.success(data.blocked ? 'User blocked' : 'User unblocked'),
  });

  if (profile.isLoading) return <Loading />;
  if (!profile.data) return <div>User not found</div>;
  const u = profile.data.user;

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="h-32 sm:h-48 bg-gradient-to-br from-primary-300 to-primary-600 relative">
          {u.bannerUrl && <img src={u.bannerUrl} className="w-full h-full object-cover" />}
        </div>
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-primary-100 flex items-center justify-center font-bold text-3xl text-primary-700 overflow-hidden">
            {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : u.username[0].toUpperCase()}
          </div>
          <div className="mt-3 flex items-end justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">{u.fullName || u.username}</h1>
              <div className="text-sm text-ink-600">@{u.username}</div>
              {u.bio && <p className="text-sm mt-2 max-w-md">{u.bio}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-ink-500">
                {u.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{u.location}</span>}
                {u.websiteUrl && (
                  <a href={u.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary-600">
                    <Globe className="w-3 h-3" />
                    {u.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isMe ? (
                <Link to="/settings" className="btn-secondary">Edit profile</Link>
              ) : isLoggedIn() ? (
                <>
                  <button onClick={() => follow.mutate()} className="btn-primary">Follow</button>
                  <button onClick={() => block.mutate()} className="btn-ghost"><Shield className="w-4 h-4" /></button>
                </>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-5 max-w-md">
            <Stat label="Photos" value={u.stats?.photoCount || 0} />
            <Stat label="Reviews" value={u.stats?.reviewCount || 0} />
            <Stat label="Lists" value={u.stats?.listCount || 0} />
            <Stat label="Followers" value={u.stats?.followersCount || 0} />
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-ink-300">
        <TabBtn active={tab === 'photos'} onClick={() => setTab('photos')} icon={<ImageIcon className="w-4 h-4" />} label="Photos" />
        <TabBtn active={tab === 'rolls'} onClick={() => setTab('rolls')} icon={<ImageIcon className="w-4 h-4" />} label="Rolls" />
        <TabBtn active={tab === 'reviews'} onClick={() => setTab('reviews')} icon={<Star className="w-4 h-4" />} label="Reviews" />
        <TabBtn active={tab === 'lists'} onClick={() => setTab('lists')} icon={<ListChecks className="w-4 h-4" />} label="Lists" />
      </div>

      {tab === 'photos' && (
        photos.isLoading ? <Loading /> : (photos.data?.items?.length || 0) === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-600">No photos yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {photos.data!.items.map((row: any) => (
              <Link key={row.photo.id} to={`/photos/${row.photo.id}`} className="aspect-square bg-ink-200 rounded-lg overflow-hidden">
                <img src={row.photo.thumbUrl || row.photo.imageUrl} className="w-full h-full object-cover hover:scale-105 transition" />
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'rolls' && (
        rolls.isLoading ? <Loading /> : (rolls.data?.items?.length || 0) === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-600">No roll albums yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {rolls.data!.items.map((r: any) => (
              <Link key={r.id} to={`/rolls/${r.id}`} className="card p-3">
                <div className="font-semibold text-sm text-ink-900">{r.title}</div>
                <div className="text-xs text-ink-500">{r.photoCount} frames</div>
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'reviews' && (
        reviews.isLoading ? <Loading /> : (reviews.data?.items?.length || 0) === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-600">No reviews yet.</div>
        ) : (
          <div className="space-y-3">
            {reviews.data!.items.map((row: any) => (
              <Link key={row.review.id} to={`/films/${row.film.slug}`} className="card p-4 block card-hover">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-ink-900">{row.film.name}</span>
                  <StarRating value={row.review.ratingOverall} size="sm" />
                </div>
                <p className="text-sm text-ink-700 mt-2 line-clamp-2">{row.review.content}</p>
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'lists' && (
        lists.isLoading ? <Loading /> : (lists.data?.items?.length || 0) === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-600">No lists yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lists.data!.items.map((l: any) => (
              <Link key={l.id} to={`/lists/${l.id}`} className="card p-4 card-hover">
                <h3 className="font-bold text-ink-900">{l.title}</h3>
                <div className="text-xs text-ink-500 mt-1">{l.itemCount} films · ❤ {l.likeCount}</div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 ${active ? 'border-primary-600 text-primary-700' : 'border-transparent text-ink-600'}`}>
      {icon} {label}
    </button>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-bold text-lg">{value}</div>
      <div className="text-xs text-ink-500">{label}</div>
    </div>
  );
}
