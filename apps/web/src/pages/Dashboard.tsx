import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { fetchApi } from '../lib/api';
import { LikeButton } from '../components/SocialActions';

const TrendingCarousel = () => {
  const [films, setFilms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await fetchApi('/api/v1/films/trending?limit=10');
        setFilms(data.films || []);
      } catch (err) {
        console.error('Failed to fetch trending:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft - walk;
  };
  const handleMouseUp = () => setIsDragging(false);

  if (loading) return (
    <div className="flex gap-4 overflow-hidden">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-56 h-72 bg-gray-200 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ scrollBehavior: isDragging ? 'auto' : 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {films.map((film: any) => (
        <Link
          key={film.id}
          to={`/films/${film.slug}`}
          className="flex-shrink-0 w-56 group"
          onClick={e => isDragging && e.preventDefault()}
        >
          <div className="relative rounded-[32px] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
            <div className="aspect-[3/4] bg-gray-100">
              {film.imageUrl ? (
                <img src={film.imageUrl} alt={film.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🎞️</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{film.brand}</p>
              <h3 className="text-lg font-black leading-tight group-hover:text-indigo-300 transition">{film.name}</h3>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

const ActivityCard = ({ item }: { item: any }) => {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0 overflow-hidden">
           {item.user.avatarUrl ? (
             <img src={item.user.avatarUrl} className="w-full h-full object-cover" />
           ) : (
             item.user.username.charAt(0).toUpperCase()
           )}
        </div>
        <div>
          <p className="text-sm text-gray-600 leading-tight">
            <Link to={`/profile/${item.user.username}`} className="font-black text-gray-900 hover:text-indigo-600">@{item.user.username}</Link>
            <span className="mx-1.5 opacity-40">•</span>
            <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
          </p>
          <p className="text-xs font-bold text-gray-400 mt-0.5">
            {item.type === 'review' && `Mengulas ${item.targetName} (${item.extraInfo})`}
            {item.type === 'photo' && `Mengunggah foto ${item.targetName}`}
            {item.type === 'list' && `Membuat koleksi baru: ${item.targetName}`}
          </p>
        </div>
      </div>

      {item.type === 'photo' && (
        <div className="mb-4 rounded-2xl overflow-hidden aspect-square sm:aspect-video bg-gray-100">
           <img src={item.extraInfo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        </div>
      )}

      {item.content && (
        <p className="text-gray-700 text-sm leading-relaxed mb-6 line-clamp-3 italic">
          "{item.content}"
        </p>
      )}

      <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
        <LikeButton 
          entityId={item.id} 
          entityType={item.type as any} 
          initialLiked={false} 
          initialCount={0} 
          size="sm"
        />
        <Link 
          to={item.type === 'list' ? `/profile/${item.user.username}/list/${item.targetSlug}` : `/films/${item.targetSlug}`}
          className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition"
        >
          Lihat Detail →
        </Link>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observer = useRef<IntersectionObserver>();

  const lastElementRef = useCallback((node: any) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextCursor) {
        fetchMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, nextCursor]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/v1/feed');
      setFeed(data.items || []);
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error('Feed fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMore = async () => {
    if (isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const data = await fetchApi(`/api/v1/feed?cursor=${nextCursor}`);
      setFeed(prev => [...prev, ...(data.items || [])]);
      setNextCursor(data.nextCursor);
    } catch (err) {}
    setIsFetchingMore(false);
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-12">
          {/* Welcome Card */}
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl shadow-2xl shadow-indigo-200">
               {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Halo, {user.username}! 👋</h2>
              <p className="text-gray-400 font-bold mb-6">Siap untuk petualangan analog hari ini?</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link to="/films" className="px-6 py-2.5 bg-gray-900 text-white rounded-2xl text-xs font-black hover:bg-black transition shadow-lg">🎬 KATALOG</Link>
                <Link to="/discover" className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition shadow-lg">✨ DISCOVER</Link>
                <Link to="/explore/lists" className="px-6 py-2.5 bg-white text-gray-600 border border-gray-100 rounded-2xl text-xs font-black hover:bg-gray-50 transition shadow-sm">📂 KOLEKSI</Link>
              </div>
            </div>
          </div>

          <div className="space-y-8">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Feed Aktivitas</h3>
                <button onClick={fetchFeed} className="text-xs font-bold text-indigo-600 hover:underline">Refresh</button>
             </div>

             {loading ? (
               <div className="space-y-8">
                 {[...Array(3)].map((_, i) => (
                   <div key={i} className="bg-white h-64 rounded-[32px] animate-pulse" />
                 ))}
               </div>
             ) : feed.length === 0 ? (
               <div className="bg-white p-16 rounded-[40px] border border-dashed border-gray-200 text-center">
                  <div className="text-5xl mb-6">🏜️</div>
                  <h4 className="text-xl font-black text-gray-900 mb-2">Feed Masih Kosong</h4>
                  <p className="text-gray-400 font-bold mb-8 max-w-sm mx-auto">Follow fotografer lain untuk melihat aktivitas mereka di sini!</p>
                  <Link to="/discover" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20">Jelajahi Komunitas</Link>
               </div>
             ) : (
               <div className="space-y-8">
                 {feed.map((item, index) => (
                   <div key={item.id} ref={index === feed.length - 1 ? lastElementRef : null}>
                     <ActivityCard item={item} />
                   </div>
                 ))}
                 {isFetchingMore && (
                   <div className="flex justify-center p-8">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                   </div>
                 )}
                 {!nextCursor && feed.length > 0 && (
                   <div className="text-center py-12 border-t border-gray-100">
                      <p className="text-gray-400 font-black text-sm">Sudah sampai ujung! 🏁</p>
                      <Link to="/discover" className="text-indigo-600 font-black text-sm hover:underline mt-2 inline-block">Jelajahi komunitas untuk lebih banyak →</Link>
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-12">
          <div className="sticky top-24 space-y-12">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-6">🔥 Trending</h3>
              <TrendingCarousel />
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
               <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-4">Tips Cepat 💡</h3>
               <p className="text-gray-500 text-sm leading-relaxed mb-6">
                 "Ingat, overexposure 1 stop pada film warna negatif seringkali memberikan shadow yang lebih detail!"
               </p>
               <Link to="/discover" className="text-xs font-black text-indigo-600 hover:underline">Baca Guide Lengkap &rarr;</Link>
            </div>

            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
              &copy; 2026 Rolldump • Analog Lovers Community
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
