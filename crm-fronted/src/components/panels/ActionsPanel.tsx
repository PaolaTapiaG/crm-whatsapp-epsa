import React from 'react';

export const ActionsPanel: React.FC<{ title?: string; children?: React.ReactNode }> = ({
  title = 'Acciones',
  children,
}) => (
  <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
    <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">{title}</h3>
    <div className="space-y-2">{children}</div>
  </aside>
);

export default ActionsPanel;
