import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

export default function PrivacySettings() {
  const q = useQuery({ queryKey: ['privacy'], queryFn: () => api.get('/users/me/privacy') });
  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (q.data?.privacy) setForm(q.data.privacy);
  }, [q.data]);
  const save = useMutation({
    mutationFn: () => api.put('/users/me/privacy', form),
    onSuccess: () => toast.success('Privacy settings saved'),
  });

  if (q.isLoading) return <Loading />;
  return (
    <div className="card p-6 space-y-4">
      <h3 className="font-bold">Privacy</h3>
      <div>
        <label className="label">Profile visibility</label>
        <select className="input" value={form.profileVisibility || 'public'} onChange={(e) => setForm({ ...form, profileVisibility: e.target.value })}>
          <option value="public">Public</option>
          <option value="followers_only">Followers only</option>
          <option value="private">Private</option>
        </select>
      </div>
      <div>
        <label className="label">Who can mention me?</label>
        <select className="input" value={form.allowMentionsFrom || 'everyone'} onChange={(e) => setForm({ ...form, allowMentionsFrom: e.target.value })}>
          <option value="everyone">Everyone</option>
          <option value="followers">Followers</option>
          <option value="noone">No one</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!form.showEmail} onChange={(e) => setForm({ ...form, showEmail: e.target.checked })} />
        Show email on profile
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!form.showLocation} onChange={(e) => setForm({ ...form, showLocation: e.target.checked })} />
        Show location on profile
      </label>
      <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">Save</button>
    </div>
  );
}
