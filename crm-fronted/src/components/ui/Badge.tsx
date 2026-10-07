import React from 'react';

type Tone = 'online' | 'pending' | 'attention' | 'closed' | 'primary' | 'danger' | 'neutral';

interface Props {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

const TONES: Record<Tone, string> = {
  online: 'bg-[var(--c-online-soft)] text-[var(--c-online)]',
  pending: 'bg-[var(--c-pending-soft)] text-[var(--c-pending)]',
  attention: 'bg-[var(--c-attention-soft)] text-[var(--c-attention)]',
  closed: 'bg-[var(--c-closed-soft)] text-[var(--c-closed)]',
  primary: 'bg-[var(--c-primary-soft)] text-[var(--c-primary)]',
  danger: 'bg-[var(--c-danger-soft)] text-[var(--c-danger)]',
  neutral: 'bg-slate-100 text-slate-700',
};

export const Badge: React.FC<Props> = ({ tone = 'neutral', children, className = '' }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONES[tone]} ${className}`}
  >
    {children}
  </span>
);