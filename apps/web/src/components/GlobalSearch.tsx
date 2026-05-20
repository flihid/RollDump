import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Film, User, ListChecks, Camera } from 'lucide-react';
import { api } from '../lib/api';
import FilmRoll3D from './FilmRoll3D';

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [data, setData] = useState<any>({ films: [], users: [], lists: [], brands: [], cameras: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!open) document.dispatchEvent(new CustomEvent('open-global-search'));
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (!q.trim()) {
      setData({ films: [], users: [], lists: [], brands: [], cameras: [] });
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      api
        .get(`/search/autocomplete?q=${encodeURIComponent(q)}`)
        .then(setData)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-ink-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 border-b border-ink-200">
          <Search className="w-4 h-4 text-ink-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari film, kreator, list, kamera…"
            className="flex-1 py-3 outline-none text-sm"
          />
          <button onClick={onClose} className="p-1 hover:bg-ink-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading && <div className="py-8 text-center text-sm text-ink-500">Mencari…</div>}
          {!loading && q && allEmpty(data) && (
            <div className="py-8 text-center text-sm text-ink-500">Tidak ada hasil untuk "{q}".</div>
          )}
          {data.films?.length > 0 && (
            <Section title="Film" icon={<Film className="w-3.5 h-3.5" />}>
              {data.films.map((f: any) => (
                <Link
                  key={f.id}
                  to={`/films/${f.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-ink-50"
                >
                  <div className="w-12 h-14 flex items-center justify-center shrink-0">
                    <FilmRoll3D film={f} size="sm" interactive={false} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{f.name}</div>
                    <div className="text-xs text-ink-500 truncate">ISO {f.iso}</div>
                  </div>
                </Link>
              ))}
            </Section>
          )}
          {data.users?.length > 0 && (
            <Section title="Pengguna" icon={<User className="w-3.5 h-3.5" />}>
              {data.users.map((u: any) => (
                <Link
                  key={u.id}
                  to={`/u/${u.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-ink-50"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-semibold overflow-hidden">
                    {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : u.username[0].toUpperCase()}
                  </div>
                  <div className="text-sm">@{u.username}</div>
                </Link>
              ))}
            </Section>
          )}
          {data.lists?.length > 0 && (
            <Section title="Lists" icon={<ListChecks className="w-3.5 h-3.5" />}>
              {data.lists.map((l: any) => (
                <Link key={l.id} to={`/lists/${l.id}`} onClick={onClose} className="block px-4 py-2 hover:bg-ink-50 text-sm">
                  {l.title}
                </Link>
              ))}
            </Section>
          )}
          {data.cameras?.length > 0 && (
            <Section title="Kamera" icon={<Camera className="w-3.5 h-3.5" />}>
              {data.cameras.map((c: any) => (
                <div key={c.id} className="px-4 py-2 text-sm hover:bg-ink-50">
                  {c.brand} {c.model}
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="px-4 py-1 text-xs font-semibold text-ink-500 flex items-center gap-1.5">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}
function allEmpty(d: any) {
  return !(d.films?.length || d.users?.length || d.lists?.length || d.cameras?.length || d.brands?.length);
}
