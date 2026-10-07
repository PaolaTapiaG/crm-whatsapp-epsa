import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export const Card: React.FC<Props> = ({ children, className = '', padding = 'md' }) => (
  <div
    className={`rounded-xl border border-[var(--border-soft)] bg-[var(--bg-panel)] shadow-sm ${PADDING[padding]} ${className}`}
  >
    {children}
  </div>
);