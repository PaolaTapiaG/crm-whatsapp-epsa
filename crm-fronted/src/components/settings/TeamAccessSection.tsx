import React, { useEffect, useState } from 'react';
import { KeyRound, UserPlus } from 'lucide-react';
import { api } from '../../services/api';
import type { CrmUser } from '../../types/auth';

type AuditEntry = { id: number; action: string; created_at: string; user?: { name: string }; details?: { status?: number } };

const fieldClass = 'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]';

const TeamAccessSection: React.FC = () => {
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'secretary'>('secretary');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api.getUsers().then(setUsers).catch(() => setError('No se pudo cargar el equipo.'));
    void api.getAudit().then(setAudit).catch(() => undefined);
  }, []);

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const next = await api.createUser({ name, email, password, role });
      setUsers((current) => [...current, next].sort((a, b) => a.name.localeCompare(b.name)));
      setName(''); setEmail(''); setPassword('');
      setAudit(await api.getAudit());
    } catch (failure: any) {
      setError(failure?.response?.data?.message || failure?.response?.data?.error || 'No se pudo crear el usuario.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="mt-6 border-t border-[var(--color-border)] pt-6">
    <div className="mb-5 flex items-center gap-3"><KeyRound className="h-5 w-5 text-[var(--color-primary)]" /><h2 className="text-lg font-bold">Acceso del equipo</h2></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Usuarios</h3>
        <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {users.map((user) => <div key={user.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div className="min-w-0"><p className="truncate font-semibold">{user.name}</p><p className="truncate text-xs text-[var(--color-text-muted)]">{user.email}</p></div><span className="text-xs text-[var(--color-text-muted)]">{user.role === 'admin' ? 'Administración' : 'Secretaría'}</span></div>)}
          {users.length === 0 && <p className="py-3 text-sm text-[var(--color-text-muted)]">No hay usuarios cargados.</p>}
        </div>
        <form onSubmit={createUser} className="mt-5 grid gap-3 sm:grid-cols-2">
          <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre completo" aria-label="Nombre completo" className={fieldClass} />
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Correo" aria-label="Correo" className={fieldClass} />
          <input required type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña (12 caracteres)" aria-label="Contraseña" className={fieldClass} />
          <select value={role} onChange={(event) => setRole(event.target.value as 'admin' | 'secretary')} aria-label="Rol" className={fieldClass}><option value="secretary">Secretaría</option><option value="admin">Administración</option></select>
          {error && <p role="alert" className="text-sm text-[var(--color-danger)] sm:col-span-2">{error}</p>}
          <button type="submit" disabled={busy} className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"><UserPlus className="h-4 w-4" />{busy ? 'Creando...' : 'Crear usuario'}</button>
        </form>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold">Actividad reciente</h3>
        <div className="max-h-80 divide-y divide-[var(--color-border)] overflow-y-auto border-y border-[var(--color-border)]">
          {audit.map((entry) => <div key={entry.id} className="flex items-start justify-between gap-3 py-2 text-xs"><div><p className="font-semibold">{entry.user?.name || 'Sistema'}</p><p className="break-all text-[var(--color-text-muted)]">{entry.action}</p></div><time className="shrink-0 text-[var(--color-text-muted)]">{new Date(entry.created_at).toLocaleString('es-BO')}</time></div>)}
          {audit.length === 0 && <p className="py-3 text-sm text-[var(--color-text-muted)]">Sin actividad registrada.</p>}
        </div>
      </div>
    </div>
  </section>;
};

export default TeamAccessSection;
