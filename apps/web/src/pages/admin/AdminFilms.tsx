import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ArrowLeft, ExternalLink, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function AdminFilms() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);

  const q = useQuery({
    queryKey: ['admin-films', search],
    queryFn: () =>
      api.get(`/films?limit=60&sort=recent${search ? `&q=${encodeURIComponent(search)}` : ''}`),
  });

  // Hard delete — the API removes the film row + cascades all variants/reviews/etc
  const del = useMutation({
    mutationFn: ({ id }: any) => api.delete(`/films/${id}`),
    onSuccess: () => {
      toast.success('Film deleted');
      qc.invalidateQueries({ queryKey: ['admin-films'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to delete'),
  });

  return (
    <div className="page-enter">
      <div className="topbar">
        <div>
          <button onClick={() => nav('/admin')} className="font-mono-tech text-xs uppercase tracking-wider text-ink-500 hover:text-ink-900 inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3 h-3" /> Admin Dashboard
          </button>
          <h1>Manage Films</h1>
        </div>
        <div className="topbar-right">
          <Link to="/admin/films/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Add Film
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="card p-3 mb-4 flex items-center gap-2">
        <Search className="w-4 h-4 ml-2 text-ink-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search films by name…"
          className="flex-1 bg-transparent outline-none text-sm"
        />
        <span className="font-mono-tech text-[10px] uppercase tracking-wider text-ink-500 mr-2">
          {q.data?.items?.length ?? 0} results
        </span>
      </div>

      {q.isLoading ? (
        <Loading />
      ) : (q.data?.items?.length ?? 0) === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-500">
          No films found{search ? ` for "${search}"` : ''}.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: '#ede5cf', color: '#4a4a4a' }}>
              <tr>
                <th className="text-left p-3 font-mono-tech text-[11px] uppercase tracking-wider">Name</th>
                <th className="text-left p-3 font-mono-tech text-[11px] uppercase tracking-wider">Brand</th>
                <th className="text-left p-3 font-mono-tech text-[11px] uppercase tracking-wider">ISO</th>
                <th className="text-left p-3 font-mono-tech text-[11px] uppercase tracking-wider">Type</th>
                <th className="text-left p-3 font-mono-tech text-[11px] uppercase tracking-wider">Status</th>
                <th className="text-left p-3 font-mono-tech text-[11px] uppercase tracking-wider">Reviews</th>
                <th className="text-right p-3 font-mono-tech text-[11px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(q.data?.items || []).map((f: any) => (
                <tr key={f.id} className="border-t border-ink-300 hover:bg-ink-200/50 transition">
                  <td className="p-3">
                    <Link to={`/films/${f.slug}`} className="font-semibold text-ink-900 hover:text-primary-600 inline-flex items-center gap-1">
                      {f.name}
                      <ExternalLink className="w-3 h-3 text-ink-500" />
                    </Link>
                  </td>
                  <td className="p-3 text-ink-700">{f.brand?.name || '—'}</td>
                  <td className="p-3 font-mono-tech">{f.iso}</td>
                  <td className="p-3 text-xs uppercase font-mono-tech text-ink-600">
                    {(f.colorType || '').replace(/_/g, ' ')}
                  </td>
                  <td className="p-3">
                    <span
                      className="badge"
                      style={
                        f.status === 'active'
                          ? { background: 'rgba(63,143,63,0.18)', color: '#3f8f3f', border: '1px solid rgba(63,143,63,0.4)' }
                          : f.status === 'discontinued'
                          ? { background: 'rgba(200,68,58,0.15)', color: '#c8443a', border: '1px solid rgba(200,68,58,0.4)' }
                          : undefined
                      }
                    >
                      {(f.status || 'active').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 font-mono-tech">{f.reviewCount ?? 0}</td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1 justify-end">
                      <Link
                        to={`/admin/films/${f.slug}/edit`}
                        className="px-2 py-1 rounded inline-flex items-center gap-1 text-xs hover:bg-ink-200"
                        title="Edit film"
                        style={{ color: '#c68a0e' }}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(f)}
                        className="px-2 py-1 rounded inline-flex items-center gap-1 text-xs hover:bg-red-50"
                        title="Delete film"
                        style={{ color: '#c8443a' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hard-delete confirmation modal — portaled to body to escape sidebar */}
      {confirmDelete &&
        createPortal(
          <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setConfirmDelete(null)}>
            <div
              className="card p-6 max-w-md w-full"
              style={{ background: '#fbf8ef' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full grid place-items-center"
                  style={{ background: 'rgba(200,68,58,0.15)', color: '#c8443a' }}
                >
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-ink-900">
                    Delete "{confirmDelete.name}"?
                  </h3>
                  <div className="text-xs text-ink-500 font-mono-tech uppercase tracking-wider">
                    Permanent · NOT reversible
                  </div>
                </div>
              </div>
              <p className="text-sm text-ink-700 mb-5">
                This permanently deletes the film, all its variants, reviews,
                tips, and wishlist entries. Photos that referenced this film
                will keep existing but lose their film tag. This action cannot
                be undone — consider using the EDIT page if you only want to
                fix info.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirmDelete(null)} className="btn-ghost">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    del.mutate({ id: confirmDelete.id });
                    setConfirmDelete(null);
                  }}
                  disabled={del.isPending}
                  className="btn-danger"
                >
                  {del.isPending ? 'Deleting…' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
