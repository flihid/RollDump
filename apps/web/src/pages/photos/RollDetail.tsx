import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function RollDetail() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ['roll', id], queryFn: () => api.get(`/photos/rolls/${id}`), enabled: !!id });
  if (q.isLoading) return <Loading />;
  if (!q.data) return <div>Roll tidak ditemukan</div>;
  const roll = q.data.roll;
  const photos = q.data.photos || [];
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="text-xs text-primary-600 font-semibold">ROLL ALBUM</div>
        <h1 className="text-2xl font-bold">{roll.title}</h1>
        <div className="text-sm text-ink-600">{photos.length} frame</div>
        {roll.labName && <div className="text-sm text-ink-600">Dikembangkan di {roll.labName}</div>}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {photos.map((p: any) => (
          <Link key={p.id} to={`/photos/${p.id}`} className="aspect-square bg-ink-200 rounded overflow-hidden">
            <img src={p.thumbUrl || p.imageUrl} className="w-full h-full object-cover" />
          </Link>
        ))}
      </div>
    </div>
  );
}
