import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../lib/api';

interface SearchResult {
  films: any[];
  users: any[];
  lists: any[];
}

export default function Omnibar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ films: [], users: [], lists: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Shortcut Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 10);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const data = await fetchApi(`/api/v1/search/autocomplete?q=${encodeURIComponent(query)}`);
          setResults(data);
        } catch (err) {
          console.error('Search failed:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults({ films: [], users: [], lists: [] });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasResults = results.films.length > 0 || results.users.length > 0 || results.lists.length > 0;

  const handleSelect = (type: string, item: any) => {
    setIsOpen(false);
    setQuery('');
    if (type === 'film') navigate(`/films/${item.slug}`);
    if (type === 'user') navigate(`/profile/${item.username}`);
    if (type === 'list') navigate(`/profile/${item.username}/list/${item.slug}`);
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === term.toLowerCase() 
        ? <span key={i} className="bg-yellow-200 text-gray-900 font-bold">{part}</span> 
        : part
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Search Input Trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-400 rounded-xl transition w-48 md:w-64 text-sm group"
      >
        <svg className="w-4 h-4 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <span className="flex-1 text-left">Cari film, orang...</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-white text-gray-400 rounded border border-gray-200">Ctrl K</kbd>
      </button>

      {/* Modal / Popover */}
      {isOpen && (
        <div className="absolute top-0 right-0 md:right-auto md:left-0 w-80 md:w-[450px] bg-white rounded-2xl shadow-2xl border border-gray-100 mt-0 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
             <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             <input 
               ref={inputRef}
               autoFocus
               type="text" 
               placeholder="Mulai mengetik untuk mencari..." 
               className="flex-1 outline-none text-gray-900 font-medium"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
             <button onClick={() => setIsOpen(false)} className="text-[10px] font-bold text-gray-400 hover:text-gray-600">ESC</button>
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2">
            {loading ? (
              <div className="p-8 text-center">
                 <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                 <p className="text-xs text-gray-400 font-medium">Mencari...</p>
              </div>
            ) : query.length < 2 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-sm font-medium">Ketik minimal 2 karakter...</p>
              </div>
            ) : !hasResults ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-sm font-medium">Tidak ada hasil ditemukan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Films */}
                {results.films.length > 0 && (
                  <div>
                    <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Films</p>
                    {results.films.map(film => (
                      <button 
                        key={film.id}
                        onClick={() => handleSelect('film', film)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl transition text-left group"
                      >
                        <div className="w-10 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          {film.imageUrl ? <img src={film.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">🎞️</div>}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition">{highlightMatch(film.name, query)}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{film.brand}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Users */}
                {results.users.length > 0 && (
                  <div>
                    <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Orang</p>
                    {results.users.filter(u => {
                      const userStr = localStorage.getItem('user');
                      const currentUser = userStr ? JSON.parse(userStr) : null;
                      return u.username !== currentUser?.username;
                    }).map(u => (
                      <button 
                        key={u.id}
                        onClick={() => handleSelect('user', u)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl transition text-left group"
                      >
                        <div className="w-10 h-10 bg-indigo-100 rounded-full overflow-hidden flex items-center justify-center text-indigo-600 font-bold">
                          {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition">@{highlightMatch(u.username, query)}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{u.fullName}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Lists */}
                {results.lists.length > 0 && (
                  <div>
                    <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Koleksi</p>
                    {results.lists.map(list => (
                      <button 
                        key={list.id}
                        onClick={() => handleSelect('list', list)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl transition text-left group"
                      >
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 text-lg">📂</div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition">{highlightMatch(list.title, query)}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">by @{list.username || 'user'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
             <span>Pilih hasil untuk navigasi</span>
             <div className="flex gap-2">
                <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded shadow-sm">⏎ ENTER</span>
                <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded shadow-sm">↑↓ NAVIGASI</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
