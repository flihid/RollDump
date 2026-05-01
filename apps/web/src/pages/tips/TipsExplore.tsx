import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { api } from '../../lib/api';
import { Loading, EmptyState } from '../../components/common';

export default function TipsExplore() {
  // simple aggregated view: pick first 6 films and load tips
  const films = useQuery({ queryKey: ['films-for-tips'], queryFn: () => api.get('/films?limit=6') });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen /> Tips & Guide
        </h1>
        <p className="text-sm text-ink-600">Pilih film untuk membaca tips komunitas spesifik formatnya.</p>
      </div>
      {films.isLoading ? (
        <Loading />
      ) : films.data?.items?.length === 0 ? (
        <EmptyState title="Belum ada konten" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {films.data!.items.map((f: any) => (
            <Link key={f.id} to={`/films/${f.slug}`} className="card overflow-hidden hover:shadow-md transition">
              <div className="aspect-[3/4] bg-ink-200">
                {f.coverUrl && <img src={f.coverUrl} className="w-full h-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm truncate">{f.name}</div>
                <div className="text-xs text-ink-500">Lihat tips → tab "Tips"</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
