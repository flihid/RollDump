import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Loading, FormatBadge } from '../../components/common';
import FilmCard from '../../components/FilmCard';

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
          <div className="w-16 h-16 bg-ink-600 rounded-lg flex items-center justify-center font-bold text-2xl text-ink-50">{b.name[0]}</div>
          <div>
            <h1 className="text-2xl font-bold text-ink-50">{b.name}</h1>
            <div className="text-sm text-ink-300">{b.country} · Since {b.foundedYear}</div>
            {b.description && <p className="text-sm text-ink-100 mt-2">{b.description}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {films.map((f: any) => (
            <FilmCard key={f.id} film={f} />
          ))}
        </div>
        <Link to="/brands" className="text-sm link-amber">← All brands</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink-50">Film Brands</h1>
      {brands.isLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(brands.data?.items || []).map((b: any) => (
            <Link key={b.id} to={`/brands?slug=${b.slug}`} className="card card-hover p-5 text-center transition">
              <div className="w-14 h-14 mx-auto mb-3 bg-ink-600 rounded-lg flex items-center justify-center font-bold text-xl text-ink-50">{b.name[0]}</div>
              <div className="font-semibold text-ink-50">{b.name}</div>
              <FormatBadge format={`${b.filmCount} films`} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
