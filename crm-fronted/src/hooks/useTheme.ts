// src/hooks/useTheme.ts
import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'water-crm-theme';

const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const readStoredMode = (): ThemeMode => {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'dark' || value === 'light' || value === 'system'
    ? value
    : 'system';
};

const applyTheme = (mode: ThemeMode) => {
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  const root = document.documentElement;

  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Para inputs nativos y scrollbars
  root.style.colorScheme = resolved;

  return resolved;
};

export const useTheme = () => {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    mode === 'system' ? getSystemTheme() : mode
  );

  // Aplica el tema cuando cambia el modo
  useEffect(() => {
    const next = applyTheme(mode);
    setResolved(next);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // Escucha cambios del sistema cuando mode === 'system'
  useEffect(() => {
    if (mode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const next = applyTheme('system');
      setResolved(next);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [mode]);

  // Sincroniza con eventos externos (ej. desde el AdminSidebar)
  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<ThemeMode>).detail;
      if (detail === 'light' || detail === 'dark' || detail === 'system') {
        setMode(detail);
      }
    };
    window.addEventListener('water-crm-theme-change', sync);
    return () => window.removeEventListener('water-crm-theme-change', sync);
  }, []);

  const toggle = useCallback(() => {
    setMode((current) => {
      // light → dark → system → light
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'system';
      return 'light';
    });
  }, []);

  const setLight = useCallback(() => setMode('light'), []);
  const setDark = useCallback(() => setMode('dark'), []);
  const setSystem = useCallback(() => setMode('system'), []);

  return {
    mode,        // 'light' | 'dark' | 'system'
    resolved,    // 'light' | 'dark' (lo que realmente se ve)
    isDark: resolved === 'dark',
    toggle,
    setLight,
    setDark,
    setSystem,
    setMode,
  };
};