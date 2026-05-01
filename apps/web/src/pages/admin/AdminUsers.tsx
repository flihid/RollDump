import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const list = useQuery({ queryKey: ['admin-users', q], queryFn: () => api.get(`/admin/users?q=${encodeURIComponent(q)}`) });

  const setStatus = useMutation({
    mutationFn: ({ id, status, reason }: any) => api.patch(`/admin/users/${id}/status`, { status, reason }),
    onSuccess: () => {
      toast.success('Status diubah');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
  const setRole = useMutation({
    mutationFn: ({ id, role }: any) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      toast.success('Role diubah');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold">Kelola pengguna</h1>
        <input className="input w-64" placeholder="Cari username/email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.isLoading ? (
        <Loading />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-600">
              <tr>
                <th className="text-left p-3">Username</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(list.data?.items || []).map((u: any) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3 font-medium">@{u.username}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <select value={u.role} onChange={(e) => setRole.mutate({ id: u.id, role: e.target.value })} className="input !py-1">
                      <option value="user">user</option>
                      <option value="contributor">contributor</option>
                      <option value="editor">editor</option>
                      <option value="moderator">moderator</option>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                  </td>
                  <td className="p-3"><span className="badge">{u.status}</span></td>
                  <td className="p-3 flex gap-1">
                    <button onClick={() => setStatus.mutate({ id: u.id, status: 'suspended', reason: 'Toxic behavior' })} className="btn-ghost text-xs">Suspend</button>
                    <button onClick={() => setStatus.mutate({ id: u.id, status: 'active' })} className="btn-ghost text-xs">Aktifkan</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
