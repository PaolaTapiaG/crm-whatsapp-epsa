import React from 'react';

export const ClientPanel: React.FC<{ name?: string; phone?: string }> = ({
  name = 'Cliente',
  phone = 'Sin teléfono',
}) => (
  <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
    <h3 className="text-sm font-semibold text-[var(--color-text)]">Cliente</h3>
    <div className="mt-3 space-y-2">
      <p className="font-medium text-[var(--color-text)]">{name}</p>
      <p className="text-sm text-[var(--color-text-muted)]">{phone}</p>
    </div>
  </aside>
);

export default ClientPanel;
