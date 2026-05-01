import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchApi } from '../lib/api';
import { Lightbox } from '../components/PhotoGallery';

interface UserProfile {
  id: string;
  username: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

interface UserPhoto {
  id: string;
  imageUrl: string;
  filmName: string;
  format: string;
}

const SkeletonLoader = () => (
  <div className="animate-pulse flex flex-col items-center">
    <div className="w-32 h-32 bg-gray-300 rounded-full mb-4"></div>
    <div className="w-48 h-6 bg-gray-300 rounded mb-2"></div>
    <div className="w-32 h-4 bg-gray-300 rounded mb-4"></div>
    <div className="w-64 h-20 bg-gray-300 rounded mb-4"></div>
  </div>
);

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'gallery' | 'lists' | 'wishlist'>('gallery');
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [lists, setLists] = useState<any[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [isSubmittingList, setIsSubmittingList] = useState(false);
  const [listForm, setListForm] = useState({ title: '', description: '', isPublic: true });
  const [photosLoading, setPhotosLoading] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false
  });

  
  const [editForm, setEditForm] = useState({
    fullName: '',
    bio: '',
    avatarUrl: '',
  });
  const [previewAvatar, setPreviewAvatar] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwner = currentUser.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await fetchApi(`/api/v1/users/${username}`);
        setProfile(data.user);
        setStats(data.stats);
        setEditForm({
          fullName: data.user.fullName || '',
          bio: data.user.bio || '',
          avatarUrl: data.user.avatarUrl || '',
        });
        setPreviewAvatar(data.user.avatarUrl || '');
      } catch (err) {
        toast.error('Gagal memuat profil');
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchProfile();
  }, [username]);

  const handleToggleFollow = async () => {
    if (!currentUser.id) {
      toast.error('Silakan login untuk mengikuti');
      return;
    }
    
    // Optimistic Update
    const prevIsFollowing = stats.isFollowing;
    const prevCount = stats.followersCount;
    
    setStats(prev => ({
      ...prev,
      isFollowing: !prevIsFollowing,
      followersCount: prevIsFollowing ? prevCount - 1 : prevCount + 1
    }));

    try {
      await fetchApi(`/api/v1/users/${username}/follow`, { method: 'POST' });
    } catch (err) {
      // Revert
      setStats(prev => ({
        ...prev,
        isFollowing: prevIsFollowing,
        followersCount: prevCount
      }));
      toast.error('Gagal memperbarui status ikuti');
    }
  };

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!username) return;
      setPhotosLoading(true);
      try {
        const data = await fetchApi(`/api/v1/users/${username}/photos`);
        setPhotos(data.photos || []);
      } catch (err) {
        console.error('Failed to fetch user photos:', err);
      } finally {
        setPhotosLoading(false);
      }
    };

    const fetchLists = async () => {
      if (!username) return;
      setListsLoading(true);
      try {
        // If owner, fetch from /my/lists to see private ones too
        const endpoint = isOwner ? '/api/v1/my/lists' : `/api/v1/users/${username}/lists`;
        const data = await fetchApi(endpoint);
        setLists(data.lists || []);
      } catch (err) {
        console.error('Failed to fetch user lists:', err);
      } finally {
        setListsLoading(false);
      }
    };

    const fetchWishlist = async () => {
      if (!username || !isOwner) return;
      setWishlistLoading(true);
      try {
        const data = await fetchApi('/api/v1/wishlists');
        setWishlist(data.wishlists || []);
      } catch (err) {
        console.error('Failed to fetch wishlist:', err);
      } finally {
        setWishlistLoading(false);
      }
    };

    if (username) {
      fetchPhotos();
      fetchLists();
      if (isOwner) fetchWishlist();
    }
  }, [username, isOwner]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran avatar maksimal 2MB');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Format harus JPG/PNG');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string);
        setEditForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await fetchApi('/api/v1/users/profile', {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setProfile(data.user);
      setIsEditing(false);
      toast.success('Perubahan disimpan');
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (listForm.title.length < 3) return toast.error('Judul minimal 3 karakter');
    setIsSubmittingList(true);
    try {
      const data = await fetchApi('/api/v1/lists', {
        method: 'POST',
        body: JSON.stringify({
          ...listForm,
          isPublic: listForm.isPublic ? 1 : 0
        }),
      });
      toast.success('List berhasil dibuat! 📂');
      setShowCreateList(false);
      setListForm({ title: '', description: '', isPublic: true });
      // Refresh lists
      const refreshData = await fetchApi(`/api/v1/users/${username}/lists`);
      setLists(refreshData.lists || []);
      // Redirect to list detail
      navigate(`/profile/${username}/list/${data.list.slug}`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat list');
    } finally {
      setIsSubmittingList(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center mt-20 text-xl text-gray-500">Profil tidak ditemukan.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 pt-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-4xl relative">
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 text-sm text-gray-500 hover:text-gray-900 transition flex items-center gap-1"
        >
          &larr; Kembali
        </button>

        {isOwner && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-6 right-6 text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
          >
            Edit Profil
          </button>
        )}

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-6 flex flex-col max-w-xl mx-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Edit Profil</h2>
              <button type="button" onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="relative group w-32 h-32 rounded-full overflow-hidden border-2 border-primary-500 bg-gray-100">
                {previewAvatar ? (
                  <img src={previewAvatar} alt="Preview Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>
                )}
                <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                  Ubah
                  <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
              <span className="text-xs text-gray-500">Max 2MB (JPG/PNG)</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={editForm.fullName}
                onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                placeholder="Ceritakan tentang fotografi Anda..."
              />
            </div>

            <button type="submit" className="w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition">
              Simpan Perubahan
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 bg-gray-100">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400 bg-gray-200">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">{profile.fullName || profile.username}</h1>
            <p className="text-gray-500 font-medium mb-4">@{profile.username}</p>
            
            {profile.bio && (
              <p className="text-gray-700 text-center max-w-md mb-8 italic">"{profile.bio}"</p>
            )}

            <div className="flex gap-10 mb-8 border-y border-gray-50 py-4 w-full justify-center">
              <div className="text-center group cursor-default">
                <p className="text-2xl font-black text-gray-900">{stats.followersCount}</p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Followers</p>
              </div>
              <div className="text-center group cursor-default">
                <p className="text-2xl font-black text-gray-900">{stats.followingCount}</p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Following</p>
              </div>
            </div>

            {!isOwner && (
              <button 
                onClick={handleToggleFollow}
                className={`mb-8 px-10 py-3 rounded-full font-black text-sm transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0 ${
                  stats.isFollowing 
                  ? 'bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                }`}
              >
                {stats.isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-100 w-full mb-8">
              <button 
                onClick={() => setActiveTab('gallery')}
                className={`pb-4 px-2 text-sm font-bold tracking-wider uppercase transition-all ${
                  activeTab === 'gallery' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Galeri ({photos.length})
              </button>
              <button 
                onClick={() => setActiveTab('lists')}
                className={`pb-4 px-2 text-sm font-bold tracking-wider uppercase transition-all ${
                  activeTab === 'lists' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Lists ({lists.length})
              </button>
              {isOwner && (
                <button 
                  onClick={() => setActiveTab('wishlist')}
                  className={`pb-4 px-2 text-sm font-bold tracking-wider uppercase transition-all ${
                    activeTab === 'wishlist' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Wishlist ({wishlist.length})
                </button>
              )}
              <button 
                onClick={() => setActiveTab('info')}
                className={`pb-4 px-2 text-sm font-bold tracking-wider uppercase transition-all ${
                  activeTab === 'info' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Info
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'gallery' ? (
              <div className="w-full">
                {photosLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-xl"></div>
                    ))}
                  </div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-4xl mb-4">📷</p>
                    <p className="text-gray-500 font-medium">Belum ada foto yang diunggah.</p>
                    {isOwner && (
                      <Link to="/films" className="text-primary-600 hover:underline text-sm mt-2 block">
                        Cari film dan mulai unggah karya Anda!
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {photos.map(photo => (
                      <div 
                        key={photo.id}
                        onClick={() => setActivePhotoId(photo.id)}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer shadow-sm hover:shadow-md transition-all"
                      >
                        <img src={photo.imageUrl} alt={photo.filmName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs font-bold truncate">{photo.filmName}</p>
                          <p className="text-white/70 text-[10px] uppercase font-bold">{photo.format}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'lists' ? (
              <div className="w-full">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-gray-800">Koleksi Terkurasi</h3>
                   {isOwner && (
                     <button 
                       onClick={() => setShowCreateList(true)}
                       className="text-xs font-bold px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                     >
                       + Buat List
                     </button>
                   )}
                </div>

                {listsLoading ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {[...Array(2)].map((_, i) => (
                       <div key={i} className="h-32 bg-gray-50 animate-pulse rounded-2xl" />
                     ))}
                   </div>
                ) : lists.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">Belum ada list.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {lists.map(list => (
                      <Link 
                        key={list.id} 
                        to={`/profile/${profile.username}/list/${list.slug}`}
                        className="group p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">{list.title}</h4>
                           {list.isPublic === 0 && <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase">Private</span>}
                        </div>
                        {list.description && <p className="text-xs text-gray-500 line-clamp-2 mb-4">{list.description}</p>}
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 012-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                           {list.itemCount} Item
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'wishlist' ? (
              <div className="w-full">
                <h3 className="font-bold text-gray-800 mb-6">Wishlist Film Saya ❤️</h3>
                {wishlistLoading ? (
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                     {[...Array(4)].map((_, i) => (
                       <div key={i} className="h-40 bg-gray-50 animate-pulse rounded-2xl" />
                     ))}
                   </div>
                ) : wishlist.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">Wishlist masih kosong.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlist.map(item => (
                      <Link 
                        key={item.id} 
                        to={`/films/${item.film.slug}`}
                        className="group flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="w-16 h-20 bg-gray-100 rounded-xl overflow-hidden">
                           {item.film.imageUrl ? <img src={item.film.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🎞️</div>}
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-gray-400 uppercase">{item.film.brand}</p>
                           <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">{item.film.name}</h4>
                           <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase">{item.format}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full text-center py-12 text-gray-400">
                Fitur Statistik Detail segera hadir!
              </div>
            )}
          </div>
        )}
      </div>

      {activePhotoId && (
        <Lightbox 
          photoId={activePhotoId} 
          onClose={() => setActivePhotoId(null)}
          onDeleteSuccess={() => {
            setActivePhotoId(null);
            setPhotos(prev => prev.filter(p => p.id !== activePhotoId));
          }}
        />
      )}
      {/* Create List Modal */}
      {showCreateList && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">✍️ Buat List Baru</h3>
              <button onClick={() => setShowCreateList(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleCreateList} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Judul List (Maks 60)</label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={listForm.title}
                  onChange={e => setListForm({...listForm, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black"
                  placeholder="Misal: Estetika Dreamy 120"
                />
                <div className="text-right text-[10px] text-gray-400 mt-1">{listForm.title.length}/60</div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi (Opsional)</label>
                <textarea
                  value={listForm.description}
                  onChange={e => setListForm({...listForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black resize-none text-sm"
                  placeholder="Apa tujuan list ini?"
                />
              </div>

              <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={listForm.isPublic}
                  onChange={e => setListForm({...listForm, isPublic: e.target.checked})}
                  className="w-4 h-4 rounded text-black focus:ring-black"
                />
                <span className="text-sm font-medium text-gray-700">Jadikan List Publik</span>
              </label>

              <button
                type="submit"
                disabled={isSubmittingList}
                className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
              >
                {isSubmittingList ? 'Membuat...' : 'Buat Koleksi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

