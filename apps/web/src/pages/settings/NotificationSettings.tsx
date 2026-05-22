import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { Loading } from '../../components/common';

const TYPES = ['new_follower', 'new_like', 'new_comment', 'mention', 'review_helpful', 'list_liked', 'admin_announcement'];

export default function NotificationSettings() {
  const q = useQuery({ queryKey: ['notif-prefs'], queryFn: () => api.get('/users/me/notification-preferences') });
  const [inApp, setInApp] = useState<Record<string, boolean>>({});
  const [email, setEmail] = useState<Record<string, boolean>>({});
  const [push, setPush] = useState<Record<string, boolean>>({});
  const [digest, setDigest] = useState('weekly');

  useEffect(() => {
    const p = q.data?.preferences;
    if (p) {
      setInApp(p.inAppEnabled || {});
      setEmail(p.emailEnabled || {});
      setPush(p.pushEnabled || {});
      setDigest(p.digestFrequency || 'weekly');
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: () =>
      api.put('/users/me/notification-preferences', {
        inAppEnabled: inApp,
        emailEnabled: email,
        pushEnabled: push,
        digestFrequency: digest,
      }),
    onSuccess: () => toast.success('Preferences saved'),
  });

  if (q.isLoading) return <Loading />;

  return (
    <div className="card p-6 space-y-4">
      <h3 className="font-bold">Notifications</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-500 text-xs">
              <th>Event</th>
              <th>In-App</th>
              <th>Email</th>
              <th>Push</th>
            </tr>
          </thead>
          <tbody>
            {TYPES.map((t) => (
              <tr key={t} className="border-t border-ink-300">
                <td className="py-2 pr-2">{t}</td>
                <td><input type="checkbox" checked={!!inApp[t]} onChange={(e) => setInApp({ ...inApp, [t]: e.target.checked })} /></td>
                <td><input type="checkbox" checked={!!email[t]} onChange={(e) => setEmail({ ...email, [t]: e.target.checked })} /></td>
                <td><input type="checkbox" checked={!!push[t]} onChange={(e) => setPush({ ...push, [t]: e.target.checked })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <label className="label">Email digest</label>
        <select className="input w-auto" value={digest} onChange={(e) => setDigest(e.target.value)}>
          <option value="off">Off</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">Save</button>
    </div>
  );
}
