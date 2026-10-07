
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import { ClientsPage, ConversationsPage, TicketsPage } from './pages/AdminResourcePages';
import IaMonitorPage from './pages/IaMonitorPage';
import SettingsPage from './pages/SettingsPage';
import ConversationDetailPage from './pages/ConversationDetailPage';
import IntentManagementPage from './pages/IntentManagementPage';
import OperatorChatPage from './pages/OperatorChatPage';
import ProfilePage from './pages/ProfilePage';
import { useChatStore } from './store/chatStore';
import { api } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, enabled, user, refresh } = useAuth();
  if (status === 'loading') return <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-background)] text-[var(--color-text)]">Cargando CRM...</div>;
  if (status === 'error') return <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[var(--color-background)] text-[var(--color-text)]"><p>No se pudo comprobar el acceso.</p><button type="button" onClick={refresh} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white">Reintentar</button></div>;
  if (enabled && !user) return <LoginPage />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const setIsConnected = useChatStore((state) => state.setIsConnected);

  useEffect(() => {
    let active = true;
    let checking = false;

    const checkConnection = async () => {
      if (checking) return;
      checking = true;
      const health = await api.checkHealth();
      if (active) setIsConnected(health.backend === 'connected');
      checking = false;
    };

    checkConnection();
    const interval = window.setInterval(checkConnection, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [setIsConnected]);

  return (
    <ThemeProvider>
      <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthGate>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/operator" replace />} />
          <Route path="/chat-preview" element={<ChatPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/conversations" element={<ConversationsPage />} />
          <Route path="/admin/conversations/:id" element={<ConversationDetailPage />} />
          <Route path="/admin/clients" element={<ClientsPage />} />
          <Route path="/admin/tickets" element={<TicketsPage />} />
          <Route path="/admin/ia-monitor" element={<IaMonitorPage />} />
          <Route path="/admin/intents" element={<IntentManagementPage />} />
          <Route path="/admin/settings" element={<AdminSettingsRoute />} />
          <Route path="/admin/operator" element={<OperatorChatPage />} />
          <Route path="/admin/profile" element={<AdminProfileRoute />} />
        </Routes>
        </AuthGate>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

const AdminSettingsRoute: React.FC = () => {
  const { enabled, user } = useAuth();
  return enabled && user?.role !== 'admin' ? <Navigate to="/admin/operator" replace /> : <SettingsPage />;
};

const AdminProfileRoute: React.FC = () => {
  const { enabled, user } = useAuth();
  return enabled && user?.role !== 'admin' ? <Navigate to="/admin/operator" replace /> : <ProfilePage />;
};

export default App;
