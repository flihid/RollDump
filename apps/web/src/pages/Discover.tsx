import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import Header from '../components/Header';

interface Brand {
  brand: string;
  totalFilms: number;
}

interface DailyFeatured {
  id: string;
  name: string;
  slug: string;
  brand: string;
  iso: number;
  type: string;
  imageUrl: string;
  description: string;
  topReview: {
    content: string;
    rating: number;
    username: string;
  } | null;
}

export default function Discover() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [featured, setFeatured] = useState<DailyFeatured | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [brandsData, featuredData] = await Promise.all([
          fetchApi('/api/v1/brands'),
          fetchApi('/api/v1/discover/daily-featured')
        ]);
        setBrands(brandsData.brands || []);
        setFeatured(featuredData.featured || null);
      } catch (err) {
        console.error('Failed to fetch discover data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="h-96 bg-gray-200 rounded-3xl animate-pulse mb-12" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12 space-y-20">
        
        {/* Task 4: Film of the Day */}
        {featured && (
          <section className="relative overflow-hidden rounded-[40px] bg-gray-900 text-white shadow-2xl">
            <div className="absolute inset-0 opacity-40">
               {featured.imageUrl ? (
                 <img src={featured.imageUrl} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900" />
               )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
            
            <div className="relative z-10 p-8 md:p-16 max-w-2xl">
               <span className="inline-block px-4 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-lg shadow-indigo-500/40 animate-bounce">
                 ✨ RollDump Spotlight Hari Ini
               </span>
               <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter leading-none">
                 {featured.name}
               </h2>
               <div className="flex items-center gap-4 mb-8">
                 <span className="text-xl font-bold text-gray-400 uppercase tracking-widest">{featured.brand}</span>
                 <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                 <span className="text-xl font-bold text-indigo-400">ISO {featured.iso}</span>
               </div>

               {featured.topReview && (
                 <div className="mb-10 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 italic text-gray-200">
                    <p className="text-lg leading-relaxed mb-4">"{featured.topReview.content}"</p>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs not-italic">{featured.topReview.username.charAt(0).toUpperCase()}</div>
                       <span className="text-sm font-bold not-italic text-gray-400">@{featured.topReview.username}</span>
                    </div>
                 </div>
               )}

               <Link 
                 to={`/films/${featured.slug}`}
                 className="inline-flex items-center gap-3 px-10 py-5 bg-white text-gray-900 rounded-2xl font-black text-lg hover:bg-gray-100 transition shadow-xl transform hover:-translate-y-1 active:translate-y-0"
               >
                 Jelajahi Film Ini
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
               </Link>
            </div>
          </section>
        )}

        {/* Task 5: Brand Index */}
        <section>
           <div className="flex items-center justify-between mb-8">
             <div>
               <h2 className="text-3xl font-black text-gray-900 tracking-tight">Eksplorasi Brand 🏷️</h2>
               <p className="text-gray-500">Cari film berdasarkan produsen favorit Anda</p>
             </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {brands.map((b) => (
                <Link 
                  key={b.brand}
                  to={`/films?brand=${encodeURIComponent(b.brand)}`}
                  className="group p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 text-center"
                >
                   <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
                      {b.brand.toLowerCase().includes('kodak') ? '💛' : 
                       b.brand.toLowerCase().includes('fuji') ? '💚' : 
                       b.brand.toLowerCase().includes('ilford') ? '🖤' : '🎞️'}
                   </div>
                   <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-indigo-600 transition">{b.brand}</h3>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Terdapat {b.totalFilms} Roll</p>
                </Link>
              ))}
           </div>
        </section>

      </main>
    </div>
  );
}
