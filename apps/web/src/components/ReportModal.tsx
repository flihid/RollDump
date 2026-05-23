import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

const REASONS = [
  {
    key: 'spam',
    label: 'Spam or misleading',
    desc: 'Unwanted commercial content, ads, or repetitive posts.',
    icon: '📩',
  },
  {
    key: 'harassment',
    label: 'Harassment or hate speech',
    desc: 'Bullying, threats, or attacks on a person or group.',
    icon: '⚠️',
  },
  {
    key: 'inappropriate',
    label: 'Inappropriate content',
    desc: 'Nudity, graphic violence, or NSFW outside the proper tag.',
    icon: '🚫',
  },
  {
    key: 'misinformation',
    label: 'Misinformation',
    desc: 'False or misleading claims about a film, process, or product.',
    icon: '❗',
  },
  {
    key: 'copyright',
    label: 'Copyright / not theirs',
    desc: 'Reposted from another shooter without credit.',
    icon: '©️',
  },
  {
    key: 'other',
    label: 'Something else',
    desc: 'Tell us what feels off — we read every report.',
    icon: '✏️',
  },
];

type ReportTarget = {
  type: 'photo' | 'review' | 'comment' | 'list' | 'tip' | 'user';
  id: string;
  label?: string;
};

export default function ReportModal({
  target,
  onClose,
}: {
  target: ReportTarget;
  onClose: () => void;
}) {
  const [reasonKey, setReasonKey] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: () =>
      api.post(`/reports/${target.type}/${target.id}`, {
        reason: reasonKey,
        detail: detail.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Report submitted. Thanks — we'll review it.");
      // Hide the reported content from this user immediately by busting caches
      qc.invalidateQueries({ queryKey: ['gallery'] });
      qc.invalidateQueries({ queryKey: ['user-photos'] });
      qc.invalidateQueries({ queryKey: ['film-photos'] });
      qc.invalidateQueries({ queryKey: ['film-photos-preview'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['photo'] });
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['film-tips'] });
      qc.invalidateQueries({ queryKey: ['lists'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to submit report'),
  });

  const valid = !!reasonKey && (reasonKey !== 'other' || detail.trim().length >= 5);

  return (
    <div className="modal-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div
        className="card p-6 max-w-lg w-full relative"
        style={{ background: '#fbf8ef', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full text-ink-500 hover:bg-ink-200"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full grid place-items-center"
            style={{ background: 'rgba(200,68,58,0.15)', color: '#c8443a' }}
          >
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading text-lg text-ink-900">Report {target.type}</h3>
            <div className="text-xs text-ink-500 font-mono-tech uppercase tracking-wider">
              {target.label ? `“${target.label}”` : `Help us keep RollDump safe`}
            </div>
          </div>
        </div>

        <p className="text-sm text-ink-700 mb-5">
          What's wrong with this {target.type}? Your report stays anonymous to the author.
          Pick the closest reason — you can add detail below.
        </p>

        {/* Reason picker */}
        <div className="space-y-2 mb-5">
          {REASONS.map((r) => {
            const active = reasonKey === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setReasonKey(r.key)}
                className="w-full flex gap-3 items-start text-left p-3 rounded-[10px] border-2 transition-all"
                style={{
                  borderColor: active ? '#e6a519' : '#dcd5bf',
                  background: active ? 'rgba(230,165,25,0.08)' : '#fbf8ef',
                }}
              >
                <div className="text-xl shrink-0">{r.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-ink-900">{r.label}</div>
                  <div className="text-xs text-ink-600 mt-0.5">{r.desc}</div>
                </div>
                {active && (
                  <div
                    className="w-5 h-5 rounded-full grid place-items-center shrink-0"
                    style={{ background: '#e6a519', color: '#1a1a1a' }}
                  >
                    <svg viewBox="0 0 12 12" width="10" height="10">
                      <path d="M2 6 L5 9 L10 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Optional detail (required for "other") */}
        <div className="field mb-5">
          <label>
            Additional detail
            {reasonKey === 'other' && <span style={{ color: '#c8443a' }}> *</span>}
            <span className="text-ink-500 font-mono-tech text-[10px] ml-2 uppercase tracking-wider">
              Optional, kept private
            </span>
          </label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder={
              reasonKey === 'other'
                ? 'Tell us what we should know (min 5 chars)…'
                : 'Add context if it helps the mod team…'
            }
            className="input"
          />
          <div className="hint">{detail.length}/500</div>
        </div>

        {/* Disclaimer */}
        <div
          className="flex gap-2 p-3 rounded-md mb-4"
          style={{ background: 'rgba(230,165,25,0.1)', border: '1px solid rgba(230,165,25,0.3)' }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#c68a0e' }} />
          <p className="text-xs text-ink-700">
            False or repeated bad-faith reports may result in restrictions on your account.
            Use blocking instead if you just don't want to see this user.
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost" disabled={submit.isPending}>
            Cancel
          </button>
          <button
            onClick={() => submit.mutate()}
            disabled={!valid || submit.isPending}
            className="btn-danger"
          >
            {submit.isPending ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
