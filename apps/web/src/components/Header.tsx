import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Omnibar from './Omnibar';
import { fetchApi } from '../lib/api';

export default function Header() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Polling for demo, or use socket in production
      const timer = setInterval(fetchNotifications, 30000);
      return () => clearInterval(timer);
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await fetchApi('/api/v1/notifications');
      setNotifications(data.notifications || []);
    } catch (err) {}
  };

  const markRead = async (id: string) => {
    try {
      await fetchApi(`/api/v1/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
    } catch (err) {}
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-[50]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🎞️</span>
            <span className="hidden sm:inline">Rolldump</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/films" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition">Katalog</Link>
            <Link to="/explore/lists" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition">Koleksi</Link>
            <Link to="/discover" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition">Discover</Link>
            {user?.role === 'admin' && (
              <Link to="/admin/moderation" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition">Admin Panel</Link>
            )}
          </nav>
        </div>

        <div className="flex-1 max-w-md hidden md:block">
           <Omnibar />
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notifications Bell */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotif(!showNotif)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition relative"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotif && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Notifikasi</h3>
                      <button onClick={() => setShowNotif(false)} className="text-xs text-gray-400 hover:text-gray-600">Tutup</button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                          <p className="text-sm">Belum ada notifikasi</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => { markRead(n.id); }}
                            className={`p-4 flex gap-3 hover:bg-gray-50 cursor-pointer transition ${!n.isRead ? 'bg-indigo-50/50' : ''}`}
                          >
                            <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0 overflow-hidden">
                              {n.actor.avatarUrl ? (
                                <img src={n.actor.avatarUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold">
                                  {n.actor.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-700 leading-relaxed">
                                <span className="font-bold">@{n.actor.username}</span>{' '}
                                {n.type === 'new_follower' && 'mulai mengikuti Anda.'}
                                {n.type === 'new_like' && `menyukai ${n.targetType} Anda.`}
                                {n.type === 'new_comment' && `mengomentari ${n.targetType} Anda.`}
                              </p>
                              <span className="text-[10px] text-gray-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {!n.isRead && <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to={`/profile/${user.username}`} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-bold text-gray-700 hidden sm:inline">@{user.username}</span>
              </Link>
              <button
                onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                className="text-xs font-bold px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm font-bold px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md">
              Mulai
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
