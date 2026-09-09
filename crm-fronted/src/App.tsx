
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import { ClientsPage, ConversationsPage, TicketsPage } from './pages/AdminResourcePages';
import IaMonitorPage from './pages/IaMonitorPage';
import SettingsPage from './pages/SettingsPage';
import ConversationDetailPage from './pages/ConversationDetailPage';
import IntentManagementPage from './pages/IntentManagementPage';
import OperatorChatPage from './pages/OperatorChatPage';
import ProfilePage from './pages/ProfilePage';

const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<OperatorChatPage />} />
        <Route path="/chat-preview" element={<ChatPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/conversations" element={<ConversationsPage />} />
        <Route path="/admin/conversations/:id" element={<ConversationDetailPage />} />
        <Route path="/admin/clients" element={<ClientsPage />} />
        <Route path="/admin/tickets" element={<TicketsPage />} />
        <Route path="/admin/ia-monitor" element={<IaMonitorPage />} />
        <Route path="/admin/intents" element={<IntentManagementPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
        <Route path="/admin/operator" element={<OperatorChatPage />} />
        <Route path="/admin/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
};

export default App;
