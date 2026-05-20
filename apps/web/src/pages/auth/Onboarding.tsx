import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

const FORMATS = [
  { key: '35mm', label: '35mm' },
  { key: '120', label: 'Medium Format (120)' },
  { key: 'large_format', label: 'Large Format' },
  { key: 'instant', label: 'Instant' },
];
const COLOR = [
  { key: 'color_negative', label: 'Color Negative' },
  { key: 'bw', label: 'Black & White' },
  { key: 'slide_e6', label: 'Slide E6' },
];

export default function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [formats, setFormats] = useState<string[]>(['35mm']);
  const [colors, setColors] = useState<string[]>(['color_negative']);

  const suggested = useQuery({ queryKey: ['suggested'], queryFn: () => api.get('/users/suggested') });
  const [follows, setFollows] = useState<string[]>([]);

  const save = useMutation({
    mutationFn: async () => {
      await api.put('/users/me/preferences', {
        formatPreferences: formats,
        colorPreferences: colors,
      });
      for (const username of follows) {
        await api.post(`/users/by-username/${username}/follow`).catch(() => {});
      }
    },
    onSuccess: () => {
      toast.success('Selamat datang di RollDump!');
      nav('/');
    },
  });

  const toggle = (arr: string[], setArr: (a: string[]) => void, k: string) =>
    setArr(arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="card p-8 max-w-xl w-full">
        <div className="flex items-center gap-1 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-primary-500' : 'bg-ink-200'}`} />
          ))}
        </div>
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-ink-50">Favorite film formats?</h2>
            <p className="text-sm text-ink-200 mt-1">Pick one or more.</p>
            <div className="flex flex-wrap gap-2 mt-6">
              {FORMATS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggle(formats, setFormats, f.key)}
                  className={formats.includes(f.key) ? 'chip-active' : 'chip'}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setStep(2)} className="btn-primary">Next</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-ink-50">Favorite emulsion types?</h2>
            <div className="flex flex-wrap gap-2 mt-6">
              {COLOR.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggle(colors, setColors, f.key)}
                  className={colors.includes(f.key) ? 'chip-active' : 'chip'}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(1)} className="btn-ghost">Back</button>
              <button onClick={() => setStep(3)} className="btn-primary">Next</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-ink-50">Follow some photographers</h2>
            <p className="text-sm text-ink-600 mt-1">Mulai isi feed Anda.</p>
            <div className="grid grid-cols-2 gap-2 mt-6">
              {(suggested.data?.items || []).slice(0, 6).map((u: any) => {
                const f = follows.includes(u.username);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggle(follows, setFollows, u.username)}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${f ? 'border-primary-500 bg-primary-50' : 'border-ink-200'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-semibold text-primary-700 overflow-hidden">
                      {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : u.username[0].toUpperCase()}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">@{u.username}</div>
                      <div className="text-xs text-ink-500 truncate">{u.fullName}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(2)} className="btn-ghost">Back</button>
              <button disabled={save.isPending} onClick={() => save.mutate()} className="btn-primary">Finish</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
