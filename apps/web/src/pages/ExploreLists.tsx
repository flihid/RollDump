import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';

interface ExploreList {
  id: string;
  title: string;
  slug: string;
  username: string;
  itemCount: number;
}

export default function ExploreLists() {
  const [lists, setLists] = useState<ExploreList[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExplore = async () => {
      try {
        const data = await fetchApi('/api/v1/lists/explore');
        setLists(data.lists || []);
      } catch (err) {
        console.error('Failed to fetch explore lists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExplore();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 pt-8 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <button 
            onClick={() => navigate(-1)}
            className="mb-8 text-sm text-gray-500 hover:text-gray-900 transition flex items-center gap-1"
          >
            &larr; Kembali
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Discover Collections 📂</h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Jelajahi kurasi film terbaik dari komunitas Rolldump untuk inspirasi karya Anda selanjutnya.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-3xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-6xl mb-6">🏜️</p>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada Koleksi Publik</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">Jadilah yang pertama membuat koleksi film favorit Anda dan bagikan ke komunitas!</p>
            <Link to="/films" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-lg inline-block">
              Mulai Kurasi Film
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map(list => (
              <Link
                key={list.id}
                to={`/profile/${list.username}/list/${list.slug}`}
                className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Decorative background shape */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {list.username.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-bold text-gray-500">@{list.username}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition leading-tight">
                    {list.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 mt-6">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 012-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      <span className="text-xs font-bold text-indigo-600 uppercase">{list.itemCount} Films</span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-8 text-3xl opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                  &rarr;
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
