import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

const FORMATS = [
  { key: '35mm', label: '35mm', sub: 'CLASSIC FORMAT', ico: '🎞️' },
  { key: '120', label: '120 Medium', sub: '6×4.5 · 6×6 · 6×7', ico: '📷' },
  { key: 'large_format', label: 'Large Format', sub: '4×5 · 8×10', ico: '🖼️' },
  { key: 'instant', label: 'Instant', sub: 'POLAROID · INSTAX', ico: '⚡' },
  { key: 'half_frame', label: 'Half-Frame', sub: '18×24mm', ico: '⊟' },
  { key: '110', label: '110 / APS', sub: 'VINTAGE COMPACT', ico: '⬚' },
];

const EMULSIONS = [
  { key: 'color_negative', label: 'Color Negative', sub: 'C-41 PROCESS', ico: '🌈' },
  { key: 'bw', label: 'Black & White', sub: 'CLASSIC SILVER', ico: '⚫' },
  { key: 'slide_e6', label: 'Slide E6', sub: 'POSITIVE FILM', ico: '🎨' },
  { key: 'color_positive', label: 'Color Positive', sub: 'REVERSAL', ico: '🌅' },
];

export default function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [formats, setFormats] = useState<string[]>(['35mm']);
  const [colors, setColors] = useState<string[]>(['color_negative']);
  const [follows, setFollows] = useState<string[]>([]);
  const total = 4;

  const suggested = useQuery({
    queryKey: ['suggested'],
    queryFn: () => api.get('/users/suggested'),
    enabled: step === 3,
  });

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
      toast.success('Welcome to RollDump! 🎬');
      nav('/');
    },
  });

  const toggle = (arr: string[], setArr: (a: string[]) => void, k: string) =>
    setArr(arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#f5f0e1' }}>
      <div className="onb-wrap w-full">
        <div className="onb-progress">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={i < step ? 'active' : ''} />
          ))}
        </div>
        <div className="onb-step-label">Step {step} of {total}</div>

        {step === 1 && (
          <>
            <h2>What formats do you shoot?</h2>
            <p className="desc">We'll curate your feed based on these. Pick one or more — you can change later.</p>
            <div className="chip-grid">
              {FORMATS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggle(formats, setFormats, f.key)}
                  className={`onb-chip ${formats.includes(f.key) ? 'selected' : ''}`}
                >
                  <div className="chip-ico">{f.ico}</div>
                  <div className="chip-name">{f.label}</div>
                  <div className="chip-sub">{f.sub}</div>
                </button>
              ))}
            </div>
            <div className="onb-actions">
              <span className="skip" onClick={() => save.mutate()}>Skip for now</span>
              <button onClick={() => setStep(2)} className="btn-primary" disabled={formats.length === 0}>
                Next →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Favorite emulsion types?</h2>
            <p className="desc">Color or B&W? E6 slides? Tell us your vibe.</p>
            <div className="chip-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {EMULSIONS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggle(colors, setColors, c.key)}
                  className={`onb-chip ${colors.includes(c.key) ? 'selected' : ''}`}
                >
                  <div className="chip-ico">{c.ico}</div>
                  <div className="chip-name">{c.label}</div>
                  <div className="chip-sub">{c.sub}</div>
                </button>
              ))}
            </div>
            <div className="onb-actions">
              <button onClick={() => setStep(1)} className="btn-ghost">← Back</button>
              <button onClick={() => setStep(3)} className="btn-primary">Next →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Follow some photographers</h2>
            <p className="desc">Get inspiration from active shooters in the community.</p>
            <div className="space-y-2 mb-6">
              {(suggested.data?.items || []).slice(0, 6).map((u: any) => {
                const f = follows.includes(u.username);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggle(follows, setFollows, u.username)}
                    className="w-full flex items-center gap-3 p-3 rounded-[10px] border-2 text-left transition"
                    style={{
                      borderColor: f ? '#e6a519' : '#dcd5bf',
                      background: f ? 'rgba(230,165,25,0.08)' : '#fbf8ef',
                    }}
                  >
                    <div className="avatar-circle shrink-0">
                      {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : u.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-ink-900 truncate">@{u.username}</div>
                      <div className="font-mono-tech text-[11px] text-ink-500 truncate">
                        {u.fullName || 'Photographer'}
                      </div>
                    </div>
                    <div
                      className="text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: f ? '#e6a519' : '#1a1a1a', color: f ? '#1a1a1a' : '#e6a519' }}
                    >
                      {f ? '✓ Following' : '+ Follow'}
                    </div>
                  </button>
                );
              })}
              {(!suggested.data?.items || suggested.data.items.length === 0) && (
                <div className="card p-6 text-center text-sm" style={{ color: '#7a7a7a' }}>
                  No suggestions yet. Skip to finish.
                </div>
              )}
            </div>
            <div className="onb-actions">
              <button onClick={() => setStep(2)} className="btn-ghost">← Back</button>
              <button onClick={() => setStep(4)} className="btn-primary">Next →</button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2>You're all set! 🎉</h2>
            <p className="desc">Welcome to the analog community. Your feed is now curated.</p>
            <div className="card p-6 text-center mb-6">
              <div className="text-6xl mb-3">🎬</div>
              <h3 className="font-heading text-lg mb-2 text-ink-900">Start your journey</h3>
              <p className="text-sm text-ink-600 max-w-md mx-auto">
                Log your first roll, write a review, or just explore the catalog.
                The community can't wait to see what you shoot.
              </p>
            </div>
            <div className="onb-actions">
              <button onClick={() => setStep(3)} className="btn-ghost">← Back</button>
              <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">
                {save.isPending ? 'Finalizing…' : 'Enter RollDump →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
