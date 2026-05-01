import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import Header from '../components/Header';

interface Film {
  id: string;
  name: string;
  slug: string;
  brand: string;
  iso: number;
  type: string;
  imageUrl: string | null;
  availableFormats: string[];
}

const formatLabel: Record<string, string> = {
  '35mm': '35mm',
  '120': '120',
  'large_format': 'Large',
};

const formatColor: Record<string, string> = {
  '35mm': 'bg-amber-100 text-amber-800 border-amber-200',
  '120': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'large_format': 'bg-violet-100 text-violet-800 border-violet-200',
};

export default function FilmCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States from URL
  const [selectedIsos, setSelectedIsos] = useState<number[]>(
    searchParams.get('isos') ? searchParams.get('isos')!.split(',').map(Number) : []
  );
  const [selectedColor, setSelectedColor] = useState(searchParams.get('color_type') || '');
  const [selectedFormat, setSelectedFormat] = useState(searchParams.get('format') || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort_by') || 'newest');
  const [showFilters, setShowFilters] = useState(false);

  const fetchFilms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const data = await fetchApi(`/api/v1/films?${params.toString()}`);
      setFilms(data.films || []);
    } catch (err) {
      console.error('Error fetching films:', err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchFilms();
  }, [fetchFilms]);

  const updateFilters = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const toggleIso = (val: number) => {
    const newIsos = selectedIsos.includes(val)
      ? selectedIsos.filter(i => i !== val)
      : [...selectedIsos, val];
    
    setSelectedIsos(newIsos);
    
    const newParams = new URLSearchParams(searchParams);
    if (newIsos.length > 0) {
      newParams.set('isos', newIsos.join(','));
    } else {
      newParams.delete('isos');
    }
    setSearchParams(newParams);
  };

  const activeFilterCount = [
    searchParams.get('isos'),
    searchParams.get('color_type'),
    searchParams.get('format'),
    searchParams.get('brand')
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-8">
            <div className="sticky top-24 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Filter Teknis</h3>
                {activeFilterCount > 0 && (
                  <button 
                    onClick={() => {
                      setSearchParams(new URLSearchParams());
                      setSelectedIsos([]);
                      setSelectedColor('');
                      setSelectedFormat('');
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              
              {/* ISO Selection */}
              <div>
                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pilih ISO</label>
                 <div className="grid grid-cols-3 gap-2">
                    {[50, 100, 160, 200, 400, 800, 1600, 3200].map(val => (
                      <button 
                        key={val}
                        onClick={() => toggleIso(val)}
                        className={`py-2 rounded-xl text-xs font-black border transition ${selectedIsos.includes(val) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                      >
                        {val}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Color Type */}
              <div>
                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tipe Warna</label>
                 <div className="space-y-2">
                    {[
                      { id: '', label: 'Semua Tipe' },
                      { id: 'color', label: 'Color Negative' },
                      { id: 'bw', label: 'Black & White' }
                    ].map((t) => (
                      <button 
                        key={t.id}
                        onClick={() => {
                          setSelectedColor(t.id);
                          updateFilters('color_type', t.id);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition ${selectedColor === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Format */}
              <div>
                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Format</label>
                 <div className="space-y-2">
                    {[
                      { id: '', label: 'Semua Format' },
                      { id: '35mm', label: '35mm' },
                      { id: '120', label: '120' },
                      { id: 'large_format', label: 'Large' }
                    ].map((f) => (
                      <button 
                        key={f.id}
                        onClick={() => {
                          setSelectedFormat(f.id);
                          updateFilters('format', f.id);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition ${selectedFormat === f.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
             {/* Toolbar */}
             <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                   <Link to="/dashboard" className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400 hover:text-gray-900" title="Kembali">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                   </Link>
                   <h2 className="text-2xl font-black text-gray-900 tracking-tight">Katalog Film</h2>
                </div>

                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 font-bold uppercase text-[10px]">Urutkan:</span>
                      <select 
                        value={selectedSort}
                        onChange={(e) => {
                          setSelectedSort(e.target.value);
                          updateFilters('sort_by', e.target.value);
                        }}
                        className="bg-white border-none text-gray-900 font-bold rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm"
                      >
                        <option value="newest">Terbaru</option>
                        <option value="rating_avg">Rating Tertinggi</option>
                        <option value="review_count">Paling Populer</option>
                        <option value="alphabetical">Abjad (A-Z)</option>
                      </select>
                   </div>
                   
                   <button 
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden relative p-3 bg-white border border-gray-100 rounded-xl shadow-sm"
                   >
                     <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                     {activeFilterCount > 0 && (
                       <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">{activeFilterCount}</span>
                     )}
                   </button>
                </div>
             </div>

             {/* Results Grid */}
             {loading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 opacity-50">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[4/5] bg-gray-200 rounded-[32px] animate-pulse" />
                  ))}
               </div>
             ) : films.length === 0 ? (
               <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-gray-200">
                  <span className="text-6xl mb-6 block">🤷‍♂️</span>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Film Tidak Ditemukan</h3>
                  <p className="text-gray-500 mb-8">Coba sesuaikan filter pencarian Anda.</p>
                  <button 
                    onClick={() => {
                      setSearchParams(new URLSearchParams());
                      setSelectedIsos([]);
                      setSelectedColor('');
                      setSelectedFormat('');
                    }}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition"
                  >
                    Reset Semua Filter
                  </button>
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {films.map((film) => (
                    <Link 
                      key={film.id}
                      to={`/films/${film.slug}`}
                      className="group bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                    >
                       <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                          {film.imageUrl ? (
                            <img src={film.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">🎞️</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${film.type === 'color' ? 'bg-blue-500/80 text-white' : 'bg-gray-900/80 text-white'}`}>
                            {film.type}
                          </span>
                       </div>
                       <div className="p-6">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{film.brand}</p>
                          <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-indigo-600 transition line-clamp-1">{film.name}</h3>
                          <div className="flex items-center justify-between mt-4">
                             <span className="text-sm font-bold text-gray-600">ISO {film.iso}</span>
                             <div className="flex gap-1.5">
                               {film.availableFormats.map(f => (
                                 <span key={f} className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${formatColor[f]}`}>{formatLabel[f]}</span>
                               ))}
                             </div>
                          </div>
                       </div>
                    </Link>
                  ))}
               </div>
             )}
          </div>

        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] lg:hidden">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
           <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black text-gray-900">Filter Katalog</h3>
                 <button onClick={() => setShowFilters(false)} className="p-3 bg-gray-100 rounded-full text-gray-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              
              <div className="space-y-10 pb-8">
                 {/* ISO Selection */}
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pilih ISO</label>
                    <div className="flex flex-wrap gap-2">
                        {[50, 100, 160, 200, 400, 800, 1600, 3200].map(val => (
                          <button 
                            key={val}
                            onClick={() => toggleIso(val)}
                            className={`px-4 py-2.5 rounded-2xl text-sm font-black border transition ${selectedIsos.includes(val) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                          >
                            {val}
                          </button>
                        ))}
                    </div>
                 </div>

                 {/* Color Type */}
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tipe Warna</label>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: '', label: 'Semua Tipe' },
                          { id: 'color', label: 'Color Negative' },
                          { id: 'bw', label: 'Black & White' }
                        ].map((t) => (
                          <button 
                            key={t.id}
                            onClick={() => {
                              setSelectedColor(t.id);
                              updateFilters('color_type', t.id);
                            }}
                            className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition ${selectedColor === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-100'}`}
                          >
                            {t.label}
                          </button>
                        ))}
                    </div>
                 </div>

                 <button 
                    onClick={() => setShowFilters(false)}
                    className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black text-lg shadow-xl"
                 >
                    Lihat {films.length} Hasil
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
