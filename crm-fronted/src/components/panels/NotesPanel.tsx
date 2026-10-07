import React from 'react';

export const NotesPanel: React.FC<{ notes?: string[] }> = ({ notes = [] }) => (
  <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
    <h3 className="text-sm font-semibold text-[var(--color-text)]">Notas</h3>
    <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
      {notes.length > 0 ? (
        notes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)
      ) : (
        <li>No hay notas</li>
      )}
    </ul>
  </aside>
);

export default NotesPanel;
