import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

type Settings = { model: string; temperature: string; maxTokens: string; opening: string; closing: string; simulator: boolean };
const defaults: Settings = { model: 'qwen3:8b', temperature: '0.35', maxTokens: '300', opening: '08:00', closing: '18:00', simulator: true };

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => { const stored = localStorage.getItem('water-crm-settings'); if (stored) setSettings({ ...defaults, ...JSON.parse(stored) }); }, []);
  const update = (key: keyof Settings, value: string | boolean) => setSettings((current) => ({ ...current, [key]: value }));
  const save = () => { localStorage.setItem('water-crm-settings', JSON.stringify(settings)); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-5 py-6 text-[var(--color-text)] md:px-8 md:ml-64">
      <AdminSidebar />
      <div className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Administración</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--color-text)]">Configuración</h1>
        <p className="mt-2 text-base text-[var(--color-text-muted)]">Parámetros operativos del simulador y de Ollama.</p>

        {saved && <div className="mt-5 border border-online bg-[var(--color-success)]/10 px-4 py-3 text-sm text-[var(--color-success)]">Configuración guardada en este navegador.</div>}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <h2 className="font-semibold text-[var(--color-text)]">Inteligencia artificial</h2>
            <label className="mt-5 block text-xs text-[var(--color-text-muted)]">Modelo Ollama
              <select value={settings.model} onChange={(e) => update('model', e.target.value)} className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-border-strong">
                <option>qwen3:8b</option>
                <option>llama3.2</option>
                <option>mistral</option>
              </select>
            </label>
            <label className="mt-4 block text-xs text-[var(--color-text-muted)]">Temperatura
              <input type="number" min="0" max="1" step="0.05" value={settings.temperature} onChange={(e) => update('temperature', e.target.value)} className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-border-strong" />
            </label>
            <label className="mt-4 block text-xs text-[var(--color-text-muted)]">Máximo de tokens
              <input type="number" value={settings.maxTokens} onChange={(e) => update('maxTokens', e.target.value)} className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-border-strong" />
            </label>
          </section>

          <section className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <h2 className="font-semibold text-[var(--color-text)]">Atención</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="text-xs text-[var(--color-text-muted)]">Apertura
                <input type="time" value={settings.opening} onChange={(e) => update('opening', e.target.value)} className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-border-strong" />
              </label>
              <label className="text-xs text-[var(--color-text-muted)]">Cierre
                <input type="time" value={settings.closing} onChange={(e) => update('closing', e.target.value)} className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-border-strong" />
              </label>
            </div>
            <label className="mt-5 flex items-center justify-between gap-3 text-sm text-[var(--color-text)]">
              <span>Simulador activo</span>
              <input type="checkbox" checked={settings.simulator} onChange={(e) => update('simulator', e.target.checked)} className="h-4 w-4 accent-slate-700" />
            </label>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={save} className="rounded-lg bg-text-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700">Guardar configuración</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
