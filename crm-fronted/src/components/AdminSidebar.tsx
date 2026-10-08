import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BellOff,
  Bot,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  MessageCircle,
  Menu,
  Moon,
  LogOut,
  Settings,
  Sun,
  Ticket,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { SidebarCounts } from '../lib/constants';
import { useAuth } from '../context/AuthContext';

export const SIDEBAR_WIDTH_EXPANDED = 248;
export const SIDEBAR_WIDTH_COMPACT = 82;

interface OperatorProfile {
  name: string;
  role: string;
  status: 'online' | 'offline';
  avatar?: string;
}

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  counts?: SidebarCounts;
  operator?: OperatorProfile;
}

const items = [
  { path: '/admin/operator', label: 'Conversaciones', icon: MessageCircle, end: true },
  { path: '/admin/clients', label: 'Contactos', icon: Users },
  { path: '/admin/ia-monitor', label: 'Automatizaciones', icon: Bot },
  { path: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { path: '/admin/conversations', label: 'Embudos', icon: GitBranch },
  { path: '/admin/intents', label: 'Respuestas rápidas', icon: Zap },
  { path: '/admin', label: 'Reportes', icon: BarChart3, end: true },
  { path: '/admin/settings', label: 'Configuración', icon: Settings },
];

const initials = (name: string) =>
  (name || 'EP')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed = false,
  onToggle,
  mobileOpen,
  onCloseMobile,
  soundEnabled = true,
  onToggleSound,
  counts = { all: 0, pending: 0, attention: 0, active: 0, closed: 0 },
  operator = { name: 'Equipo EPSA', role: 'Operación', status: 'online' },
}) => {
  const { mode, isDark, toggle } = useTheme();
  const { enabled, user, logout } = useAuth();
  const displayedOperator = enabled && user ? { name: user.name, role: user.role === 'admin' ? 'Administración' : 'Secretaría' } : operator;
  const [localMobileOpen, setLocalMobileOpen] = useState(false);
  const isMobileOpen = mobileOpen ?? localMobileOpen;
  const closeMobile = onCloseMobile ?? (() => setLocalMobileOpen(false));
  const compact = Boolean(collapsed && !isMobileOpen);

  return (
    <>
      {mobileOpen === undefined && !isMobileOpen && (
        <button type="button" onClick={() => setLocalMobileOpen(true)} aria-label="Abrir menú" className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--color-primary-border)] bg-[var(--color-primary)] text-white shadow-lg md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      )}
      <div
        aria-hidden={!isMobileOpen}
        className={`fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm transition md:hidden ${
          isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeMobile}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-md)] transition-all duration-200 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${compact ? 'md:w-[82px]' : 'md:w-[248px]'} w-[82vw] max-w-[292px]`}
      >
        <div className={`flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-4 ${compact ? 'justify-center' : ''}`}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-[0_10px_28px_rgba(22,199,102,0.28)]">
            <MessageCircle className="h-6 w-6" />
          </div>
          {!compact && (
            <div className="min-w-0">
              <p className="text-[17px] font-black leading-tight text-[var(--color-text)]">EPSA CRM</p>
              <p className="text-xs text-[var(--color-text-muted)]">CRM de WhatsApp</p>
            </div>
          )}
          {onToggle && (
            <button
              type="button"
              className="ml-auto hidden h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] md:flex"
              onClick={onToggle}
              aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
          {isMobileOpen && (
            <button
              type="button"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] md:hidden"
              onClick={closeMobile}
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {items.filter((item) => !enabled || user?.role === 'admin' || item.path !== '/admin/settings').map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                title={item.label}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                    isActive
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[inset_4px_0_0_var(--color-primary)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-text)]'
                  } ${compact ? 'justify-center' : ''}`
                }
              >
                <Icon className="h-[19px] w-[19px] shrink-0" />
                {!compact && <span className="font-semibold">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {!compact && (
          <div className="mx-3 mb-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <p className="text-[11px] font-bold uppercase text-[var(--color-text-muted)]">Operación hoy</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Metric label="Abiertas" value={counts.active} tone="text-[var(--color-primary)]" />
              <Metric label="Pendientes" value={counts.pending} tone="text-[var(--color-warning)]" />
              <Metric label="Urgentes" value={counts.attention} tone="text-[var(--color-danger)]" />
              <Metric label="Total" value={counts.all} tone="text-[var(--color-text)]" />
            </div>
          </div>
        )}

        <div className="border-t border-[var(--color-border)] p-3">
          {!compact && (
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-[var(--color-background)] p-2">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-sm font-bold text-[var(--color-primary)]">
                {initials(displayedOperator.name)}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--color-background)] bg-[var(--color-primary)]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{displayedOperator.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{displayedOperator.role}</p>
              </div>
            </div>
          )}
          <div className="flex justify-center gap-2">
            {enabled && user && <button type="button" title="Cerrar sesión" aria-label="Cerrar sesión" onClick={() => void logout()} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"><LogOut className="h-4 w-4" /></button>}
            {onToggleSound && (
              <button
                title={soundEnabled ? 'Silenciar notificaciones' : 'Activar sonido'}
                onClick={onToggleSound}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
              >
                {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </button>
            )}
            <button
              title="Cambiar modo claro/oscuro"
              onClick={toggle}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            >
              {mode === 'system' ? <Sun className="h-4 w-4" /> : isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const Metric: React.FC<{ label: string; value: number; tone: string }> = ({ label, value, tone }) => (
  <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2">
    <p className={`text-lg font-black ${tone}`}>{value}</p>
    <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
  </div>
);

export default AdminSidebar;
