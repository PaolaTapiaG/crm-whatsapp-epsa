import React from 'react';

export const TopBar: React.FC<{ title?: string; actions?: React.ReactNode }> = ({
  title = 'CRM',
  actions,
}) => (
  <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
    <h1 className="text-base font-semibold text-[var(--color-text)]">{title}</h1>
    {actions}
  </header>
);

export default TopBar;
