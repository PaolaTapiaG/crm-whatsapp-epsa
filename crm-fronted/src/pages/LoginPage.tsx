import React, { useState } from 'react';
import { LockKeyhole, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (failure: any) {
      setError(failure?.response?.data?.error || 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-background)] px-4 text-[var(--color-text)]">
    <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]">
      <div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white"><MessageCircle className="h-6 w-6" /></span><div><h1 className="text-xl font-bold">EPSA CRM</h1><p className="text-sm text-[var(--color-text-muted)]">Acceso del equipo</p></div></div>
      <label className="block text-sm font-semibold">Correo<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" /></label>
      <label className="mt-4 block text-sm font-semibold">Contraseña<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" /></label>
      {error && <p role="alert" className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}
      <button type="submit" disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3 font-semibold text-white disabled:opacity-60"><LockKeyhole className="h-4 w-4" />{busy ? 'Ingresando...' : 'Ingresar'}</button>
    </form>
  </main>;
};

export default LoginPage;
