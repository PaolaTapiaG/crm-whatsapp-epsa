import React from 'react';
import { initials } from '../../lib/format';

interface Props {
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'pending' | 'attention' | 'closed';
  src?: string;
}

const SIZES = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
};

const STATUS_COLORS = {
  online: 'bg-[var(--c-online)]',
  pending: 'bg-[var(--c-pending)]',
  attention: 'bg-[var(--c-attention)]',
  closed: 'bg-[var(--c-closed)]',
};

export const Avatar: React.FC<Props> = ({ name, size = 'md', status, src }) => (
  <div className="relative shrink-0">
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full bg-[var(--c-primary-soft)] font-semibold text-[var(--c-primary)] ring-1 ring-[var(--c-primary-border)] ${SIZES[size]}`}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
    {status && (
      <span
        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-panel ${STATUS_COLORS[status]}`}
      />
    )}
  </div>
);