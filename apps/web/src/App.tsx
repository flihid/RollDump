import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import FilmCatalog from './pages/FilmCatalog';
import FilmDetail from './pages/FilmDetail';
import AdminAddFilm from './pages/AdminAddFilm';
import AdminDashboard from './pages/AdminDashboard';
import ListDetail from './pages/ListDetail';
import ExploreLists from './pages/ExploreLists';
import Discover from './pages/Discover';
import Dashboard from './pages/Dashboard';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';


const ProfileRedirect = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (user?.username) {
    return <Navigate to={`/profile/${user.username}`} replace />;
  }
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<ProfileRedirect />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/films" element={<FilmCatalog />} />
        <Route path="/films/:slug" element={<FilmDetail />} />
        <Route path="/explore/lists" element={<ExploreLists />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/profile/:username/list/:slug" element={<ListDetail />} />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/films/add"
          element={
            <PrivateRoute>
              <AdminAddFilm />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/moderation"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;

