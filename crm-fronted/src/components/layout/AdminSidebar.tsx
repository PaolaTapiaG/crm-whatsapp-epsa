import React from 'react';

export const AdminSidebar: React.FC = () => {
  return (
    <aside className="w-72 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
        Sidebar
      </h2>
    </aside>
  );
};

export default AdminSidebar;
