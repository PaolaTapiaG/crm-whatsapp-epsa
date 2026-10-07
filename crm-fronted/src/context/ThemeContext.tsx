import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  isDark: boolean;
  isSystem: boolean;
  setMode: (mode: ThemeMode) => void;
  setLight: () => void;
  setDark: () => void;
  setSystem: () => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'water-crm-theme';

const getSystemTheme = (): ResolvedTheme =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

const readStoredMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'dark' || value === 'light' || value === 'system' ? value : 'system';
};

const applyTheme = (mode: ThemeMode): ResolvedTheme => {
  const resolved: ResolvedTheme = mode === 'system' ? getSystemTheme() : mode;
  const root = document.documentElement;

  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;

  window.dispatchEvent(new CustomEvent('water-crm-theme-change', { detail: mode }));

  return resolved;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, defaultMode }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => defaultMode ?? readStoredMode());
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    mode === 'system' ? getSystemTheme() : mode
  );

  useEffect(() => {
    const next = applyTheme(mode);
    setResolved(next);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

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

  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = event.newValue;
      if (next === 'light' || next === 'dark' || next === 'system') {
        setModeState(next);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  const setLight = useCallback(() => setModeState('light'), []);
  const setDark = useCallback(() => setModeState('dark'), []);
  const setSystem = useCallback(() => setModeState('system'), []);

  const toggle = useCallback(() => {
    setModeState((current) => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'system';
      return 'light';
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolved,
      isDark: resolved === 'dark',
      isSystem: mode === 'system',
      setMode,
      setLight,
      setDark,
      setSystem,
      toggle,
    }),
    [mode, resolved, setMode, setLight, setDark, setSystem, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext debe usarse dentro de <ThemeProvider>.');
  }
  return ctx;
};

export const useTheme = useThemeContext;
