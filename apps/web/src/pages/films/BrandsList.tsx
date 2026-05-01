import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Loading, FormatBadge } from '../../components/common';

export default function BrandsList() {
  const [params] = useSearchParams();
  const slug = params.get('slug');
  const brands = useQuery({ queryKey: ['brands'], queryFn: () => api.get('/brands') });
  const detail = useQuery({
    queryKey: ['brand', slug],
    queryFn: () => api.get(`/brands/${slug}`),
    enabled: !!slug,
  });

  if (slug && detail.data) {
    const b = detail.data.brand;
    const films = detail.data.films || [];
    return (
      <div className="space-y-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-ink-100 rounded-lg flex items-center justify-center font-bold text-2xl">{b.name[0]}</div>
          <div>
            <h1 className="text-2xl font-bold">{b.name}</h1>
            <div className="text-sm text-ink-600">{b.country} • Sejak {b.foundedYear}</div>
            {b.description && <p className="text-sm text-ink-700 mt-2">{b.description}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {films.map((f: any) => (
            <Link key={f.id} to={`/films/${f.slug}`} className="card overflow-hidden">
              <div className="aspect-[3/4] bg-ink-200">
                {f.coverUrl && <img src={f.coverUrl} className="w-full h-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm truncate">{f.name}</div>
                <div className="text-xs text-ink-500">ISO {f.iso}</div>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/brands" className="text-sm text-primary-600 hover:underline">← Lihat semua brand</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pabrikan Film</h1>
      {brands.isLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(brands.data?.items || []).map((b: any) => (
            <Link key={b.id} to={`/brands?slug=${b.slug}`} className="card p-5 text-center hover:shadow-md transition">
              <div className="w-14 h-14 mx-auto mb-3 bg-ink-100 rounded-lg flex items-center justify-center font-bold text-xl">{b.name[0]}</div>
              <div className="font-semibold">{b.name}</div>
              <FormatBadge format={`${b.filmCount} film`} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
