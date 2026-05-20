import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { api } from '../../lib/api';
import { Loading, EmptyState } from '../../components/common';
import FilmCard from '../../components/FilmCard';

export default function TipsExplore() {
  // Show a larger curated grid — same FilmCard (3D roll) used everywhere else
  const films = useQuery({
    queryKey: ['films-for-tips'],
    queryFn: () => api.get('/films?limit=18&sort=popular'),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-primary-400" /> Tips &amp; Guides
        </h1>
        <p className="text-sm text-ink-200 mt-1">
          Pick a film stock to read community tips for its specific format.
        </p>
      </div>
      {films.isLoading ? (
        <Loading />
      ) : films.data?.items?.length === 0 ? (
        <EmptyState title="No films yet" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
          {films.data!.items.map((f: any, i: number) => (
            <FilmCard key={f.id} film={f} delay={i * 40} />
          ))}
        </div>
      )}
    </div>
  );
}
