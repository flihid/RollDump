import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Film, User, ListChecks, Camera, Plus, BookOpen, Star } from 'lucide-react';
import { api } from '../lib/api';
import FilmCover from './FilmCover';
import { isLoggedIn } from '../store/auth';

type Result = {
  id: string;
  kind: 'film' | 'user' | 'list' | 'camera' | 'brand' | 'action';
  title: string;
  subtitle?: string;
  to?: string;
  film?: any;       // for film cover rendering
  user?: any;       // for avatar
  hint?: string;    // mono kbd hint at right
  icon?: React.ReactNode;
};

const QUICK_ACTIONS: Result[] = [
  {
    id: 'qa-upload',
    kind: 'action',
    title: 'Start a Bulk Upload',
    subtitle: 'Log a new roll album',
    to: '/upload',
    icon: '+',
    hint: '⌘U',
  },
  {
    id: 'qa-films',
    kind: 'action',
    title: 'Browse Film Catalog',
    subtitle: 'Discover new stocks',
    to: '/films',
    icon: '▦',
  },
  {
    id: 'qa-lists',
    kind: 'action',
    title: 'Explore Lists',
    subtitle: 'Curated film picks from the community',
    to: '/lists',
    icon: '📚',
  },
];

const TYPE_ORDER = ['film', 'user', 'list', 'camera', 'action'] as const;

const GROUP_META: Record<string, { label: string; icon: React.ReactNode }> = {
  film:   { label: 'Films',         icon: <Film className="w-3.5 h-3.5" /> },
  user:   { label: 'Photographers', icon: <User className="w-3.5 h-3.5" /> },
  list:   { label: 'Lists',         icon: <ListChecks className="w-3.5 h-3.5" /> },
  camera: { label: 'Cameras',       icon: <Camera className="w-3.5 h-3.5" /> },
  brand:  { label: 'Brands',        icon: <Star className="w-3.5 h-3.5" /> },
  action: { label: 'Quick Actions', icon: <BookOpen className="w-3.5 h-3.5" /> },
};

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [data, setData] = useState<any>({ films: [], users: [], lists: [], brands: [], cameras: [] });
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

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
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  // Flatten results into one ordered list for keyboard nav
  const results = useMemo<Result[]>(() => {
    const out: Result[] = [];
    (data.films || []).forEach((f: any) =>
      out.push({
        id: `film:${f.id}`,
        kind: 'film',
        title: f.name,
        subtitle: `${f.brand?.name || 'Film'} · ISO ${f.iso}${f.ratingAvg ? ` · ★ ${Number(f.ratingAvg).toFixed(1)}` : ''}`,
        to: `/films/${f.slug}`,
        film: f,
      }),
    );
    (data.users || []).forEach((u: any) =>
      out.push({
        id: `user:${u.id}`,
        kind: 'user',
        title: u.fullName || u.username,
        subtitle: `@${u.username}`,
        to: `/u/${u.username}`,
        user: u,
      }),
    );
    (data.lists || []).forEach((l: any) =>
      out.push({
        id: `list:${l.id}`,
        kind: 'list',
        title: l.title,
        subtitle: `${l.itemCount || 0} films · ♡ ${l.likeCount || 0}`,
        to: `/lists/${l.id}`,
      }),
    );
    (data.cameras || []).forEach((c: any) =>
      out.push({
        id: `camera:${c.id}`,
        kind: 'camera',
        title: `${c.brand} ${c.model}`,
        subtitle: `${c.type || 'Camera'}${c.yearIntroduced ? ` · ${c.yearIntroduced}` : ''}`,
      }),
    );
    if (isLoggedIn()) {
      QUICK_ACTIONS.forEach((a) => out.push(a));
    }
    return out;
  }, [data]);

  // Group preserving the order in `results`
  const grouped = useMemo(() => {
    const map = new Map<string, Result[]>();
    for (const r of results) {
      const arr = map.get(r.kind) || [];
      arr.push(r);
      map.set(r.kind, arr);
    }
    return TYPE_ORDER.filter((k) => map.has(k)).map((k) => ({ kind: k, items: map.get(k)! }));
  }, [results]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    setActiveIdx(0);
  }, [results, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const r = results[activeIdx];
        if (r?.to) {
          nav(r.to);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, activeIdx, nav, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-overlay flex items-start justify-center px-4"
      style={{ paddingTop: '10vh', display: 'flex' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#fbf8ef', border: '1px solid #dcd5bf', boxShadow: '0 18px 40px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search films, photographers, lists, or actions…"
            className="w-full pl-14 pr-14 py-5 text-base outline-none bg-transparent text-ink-900 placeholder-ink-500"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-xs font-mono-tech"
            style={{ background: '#ede5cf', color: '#2d2d2d', border: '1px solid #dcd5bf' }}
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="border-t border-ink-300 max-h-[480px] overflow-y-auto">
          {loading && (
            <div className="py-10 text-center text-sm" style={{ color: '#7a7a7a' }}>
              <div className="inline-block w-4 h-4 border-2 border-ink-300 border-t-primary-500 rounded-full animate-spin mr-2" />
              Searching for "{q}"…
            </div>
          )}
          {!loading && q && results.length === 0 && (
            <div className="py-12 text-center px-6">
              <Search className="w-10 h-10 mx-auto mb-3" style={{ color: '#c9c2ae' }} />
              <div className="font-heading text-base text-ink-900 mb-1">No results for "{q}"</div>
              <div className="text-xs text-ink-500">Try a different keyword or check spelling</div>
            </div>
          )}
          {!loading && !q && (
            <div className="py-8 text-center px-6">
              <div className="font-mono-tech text-[11px] uppercase tracking-[0.18em] text-ink-500 mb-2">
                Press <Kbd>↑</Kbd> <Kbd>↓</Kbd> to navigate · <Kbd>↵</Kbd> to open
              </div>
              <div className="text-sm text-ink-600">
                Start typing to search films, photographers, or lists
              </div>
            </div>
          )}

          {!loading &&
            grouped.map(({ kind, items }) => (
              <div key={kind} className="py-1">
                <div
                  className="px-5 pt-3 pb-1 flex items-center gap-2"
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: '#7a7a7a',
                  }}
                >
                  {GROUP_META[kind].icon}
                  {GROUP_META[kind].label} · {items.length} result{items.length > 1 ? 's' : ''}
                </div>
                {items.map((r) => {
                  const idx = results.findIndex((x) => x.id === r.id);
                  const active = idx === activeIdx;
                  return (
                    <CmdItem
                      key={r.id}
                      r={r}
                      active={active}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onSelect={() => {
                        if (r.to) {
                          nav(r.to);
                          onClose();
                        }
                      }}
                      query={q}
                    />
                  );
                })}
              </div>
            ))}
        </div>

        {/* Footer */}
        <div
          className="flex gap-5 px-5 py-3 text-[11px] flex-wrap"
          style={{ background: '#ede5cf', borderTop: '1px solid #dcd5bf', color: '#4a4a4a' }}
        >
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd>
            Open
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>ESC</Kbd>
            Close
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
            anywhere
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CmdItem({
  r,
  active,
  onSelect,
  onMouseEnter,
  query,
}: {
  r: Result;
  active: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  query: string;
}) {
  const content = (
    <div
      onMouseEnter={onMouseEnter}
      onClick={onSelect}
      className="flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors"
      style={{
        background: active ? 'rgba(230,165,25,0.12)' : 'transparent',
      }}
    >
      {/* Thumb */}
      <div className="shrink-0">
        {r.kind === 'film' && r.film ? (
          <FilmCover film={r.film} size="sm" />
        ) : r.kind === 'user' && r.user ? (
          <div
            className="w-9 h-9 rounded-full grid place-items-center font-bold text-sm overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #e6a519, #c68a0e)', color: '#1a1a1a' }}
          >
            {r.user.avatarUrl ? (
              <img src={r.user.avatarUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              (r.user.username?.[0] || '?').toUpperCase()
            )}
          </div>
        ) : r.kind === 'action' ? (
          <div
            className="w-9 h-9 rounded-lg grid place-items-center text-base font-bold"
            style={{ background: '#e6a519', color: '#1a1a1a' }}
          >
            {typeof r.icon === 'string' ? r.icon : <Plus className="w-4 h-4" />}
          </div>
        ) : (
          <div
            className="w-9 h-9 rounded-lg grid place-items-center"
            style={{ background: 'linear-gradient(135deg, #3a3a3a, #5a4a3a)', color: '#e6a519' }}
          >
            {r.kind === 'list' ? <ListChecks className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink-900 truncate">
          {highlight(r.title, query)}
        </div>
        {r.subtitle && <div className="text-xs text-ink-500 truncate">{r.subtitle}</div>}
      </div>

      {/* Hint */}
      {r.hint && <span className="font-mono-tech text-[11px] text-ink-500 shrink-0">{r.hint}</span>}
      {active && !r.hint && (
        <span className="font-mono-tech text-[11px] text-ink-500 shrink-0">↵</span>
      )}
    </div>
  );

  if (r.to) {
    return (
      <Link to={r.to} onClick={onSelect} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="px-1.5 py-0.5 rounded text-[10px] font-mono-tech"
      style={{ background: '#fbf8ef', color: '#2d2d2d', border: '1px solid #dcd5bf' }}
    >
      {children}
    </kbd>
  );
}

function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span
        style={{ background: '#ffd56b', color: '#1a1a1a', padding: '0 2px', borderRadius: 2 }}
      >
        {text.slice(idx, idx + q.length)}
      </span>
      {text.slice(idx + q.length)}
    </>
  );
}
