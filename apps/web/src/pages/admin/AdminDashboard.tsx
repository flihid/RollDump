import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Film, Star, Image, Flag, Shield } from 'lucide-react';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function AdminDashboard() {
  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats') });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="text-primary-600" />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>
      {stats.isLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Card icon={<Users />} label="Pengguna" value={stats.data?.users || 0} />
          <Card icon={<Film />} label="Film" value={stats.data?.films || 0} />
          <Card icon={<Star />} label="Review" value={stats.data?.reviews || 0} />
          <Card icon={<Image />} label="Foto" value={stats.data?.photos || 0} />
          <Card icon={<Flag />} label="Laporan" value={stats.data?.pendingReports || 0} highlight />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/admin/films" className="card p-4 hover:shadow-md">
          <div className="font-semibold">Kelola film</div>
          <div className="text-xs text-ink-500">Tambah, edit, nonaktifkan</div>
        </Link>
        <Link to="/admin/users" className="card p-4 hover:shadow-md">
          <div className="font-semibold">Kelola pengguna</div>
          <div className="text-xs text-ink-500">Suspend, ban, role</div>
        </Link>
        <Link to="/admin/reports" className="card p-4 hover:shadow-md">
          <div className="font-semibold">Antrian laporan</div>
          <div className="text-xs text-ink-500">Konten yang dilaporkan</div>
        </Link>
        <Link to="/admin/audit-logs" className="card p-4 hover:shadow-md">
          <div className="font-semibold">Audit log</div>
          <div className="text-xs text-ink-500">Trail tindakan admin</div>
        </Link>
      </div>
    </div>
  );
}

function Card({ icon, label, value, highlight }: any) {
  return (
    <div className={`card p-4 ${highlight ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="text-ink-500">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-ink-500">{label}</div>
    </div>
  );
}
