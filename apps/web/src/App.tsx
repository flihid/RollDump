import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import { isLoggedIn, isAdmin } from './store/auth';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Onboarding from './pages/auth/Onboarding';

import Home from './pages/Home';
import Notifications from './pages/Notifications';

import FilmsList from './pages/films/FilmsList';
import FilmDetail from './pages/films/FilmDetail';
import BrandsList from './pages/films/BrandsList';
import Wishlist from './pages/films/Wishlist';

import WriteReview from './pages/reviews/WriteReview';

import Upload from './pages/photos/Upload';
import PhotoDetail from './pages/photos/PhotoDetail';
import GalleryAll from './pages/photos/GalleryAll';
import RollDetail from './pages/photos/RollDetail';

import WriteTip from './pages/tips/WriteTip';
import TipsExplore from './pages/tips/TipsExplore';

import ListsExplore from './pages/lists/ListsExplore';
import ListDetail from './pages/lists/ListDetail';
import ListNew from './pages/lists/ListNew';

import Profile from './pages/Profile';

import Settings from './pages/settings/Settings';
import SecuritySettings from './pages/settings/SecuritySettings';
import PrivacySettings from './pages/settings/PrivacySettings';
import NotificationSettings from './pages/settings/NotificationSettings';
import AccountSettings from './pages/settings/AccountSettings';
import PreferencesSettings from './pages/settings/PreferencesSettings';
import SessionsSettings from './pages/settings/SessionsSettings';
import BlockedSettings from './pages/settings/BlockedSettings';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFilms from './pages/admin/AdminFilms';
import AdminFilmNew from './pages/admin/AdminFilmNew';
import AdminFilmEdit from './pages/admin/AdminFilmEdit';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;
};
const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        {/* Public auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

        {/* App with shell */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          {/* /discover content merged into Home — redirect old links */}
          <Route path="/discover" element={<Navigate to="/" replace />} />
          <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />

          <Route path="/films" element={<FilmsList />} />
          <Route path="/films/:slug" element={<FilmDetail />} />
          <Route path="/films/:slug/review/new" element={<RequireAuth><WriteReview /></RequireAuth>} />
          <Route path="/films/:slug/tips/new" element={<RequireAuth><WriteTip /></RequireAuth>} />
          <Route path="/brands" element={<BrandsList />} />
          <Route path="/wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />

          <Route path="/photos" element={<GalleryAll />} />
          <Route path="/photos/:id" element={<PhotoDetail />} />
          <Route path="/upload" element={<RequireAuth><Upload /></RequireAuth>} />
          <Route path="/rolls/:id" element={<RollDetail />} />

          <Route path="/tips" element={<TipsExplore />} />

          <Route path="/lists" element={<ListsExplore />} />
          <Route path="/lists/new" element={<RequireAuth><ListNew /></RequireAuth>} />
          <Route path="/lists/:id" element={<ListDetail />} />

          <Route path="/u/:username" element={<Profile />} />

          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>}>
            <Route index element={<AccountSettings />} />
            <Route path="account" element={<AccountSettings />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="privacy" element={<PrivacySettings />} />
            <Route path="notifications" element={<NotificationSettings />} />
            <Route path="preferences" element={<PreferencesSettings />} />
            <Route path="sessions" element={<SessionsSettings />} />
            <Route path="blocked" element={<BlockedSettings />} />
          </Route>

          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/films" element={<RequireAdmin><AdminFilms /></RequireAdmin>} />
          <Route path="/admin/films/new" element={<RequireAdmin><AdminFilmNew /></RequireAdmin>} />
          <Route path="/admin/films/:slug/edit" element={<RequireAdmin><AdminFilmEdit /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
          <Route path="/admin/reports" element={<RequireAdmin><AdminReports /></RequireAdmin>} />
          <Route path="/admin/audit-logs" element={<RequireAdmin><AdminAuditLogs /></RequireAdmin>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

