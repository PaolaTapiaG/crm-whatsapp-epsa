import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { CrmUser } from '../types/auth';

interface AuthState {
  status: 'loading' | 'ready' | 'error';
  enabled: boolean;
  user: CrmUser | null;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [enabled, setEnabled] = useState(false);
  const [user, setUser] = useState<CrmUser | null>(null);

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const session = await api.getAuthSession();
      setEnabled(session.enabled);
      setUser(session.user);
      setStatus('ready');
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setEnabled(true);
        setUser(null);
        setStatus('ready');
      } else if ([404, 405].includes(error?.response?.status)) {
        setEnabled(false);
        setUser(null);
        setStatus('ready');
      } else {
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const login = async (email: string, password: string) => {
    const nextUser = await api.login(email, password);
    setUser(nextUser);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ status, enabled, user, refresh, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is missing');
  return context;
};
