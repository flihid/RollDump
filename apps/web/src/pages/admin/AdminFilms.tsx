import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function AdminFilms() {
  const q = useQuery({ queryKey: ['admin-films'], queryFn: () => api.get('/films?limit=60&sort=recent') });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Films</h1>
        <Link to="/admin/films/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add film
        </Link>
      </div>
      {q.isLoading ? (
        <Loading />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-600 text-ink-200">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Brand</th>
                <th className="text-left p-3">ISO</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Reviews</th>
              </tr>
            </thead>
            <tbody>
              {(q.data?.items || []).map((f: any) => (
                <tr key={f.id} className="border-t border-ink-600 hover:bg-ink-600/50">
                  <td className="p-3">
                    <Link to={`/films/${f.slug}`} className="font-medium hover:underline">{f.name}</Link>
                  </td>
                  <td className="p-3">{f.brand?.name}</td>
                  <td className="p-3">{f.iso}</td>
                  <td className="p-3"><span className="badge">{f.status}</span></td>
                  <td className="p-3">{f.reviewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
