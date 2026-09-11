import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bot, ChevronLeft, ChevronRight, Gauge, Inbox, MessageCircle, Moon, Settings, Sparkles, Sun, Ticket, Users, UserRound, Volume2, VolumeX } from 'lucide-react';

const items = [
  { path: '/admin', label: 'Resumen', icon: Gauge, end: true },
  { path: '/admin/conversations', label: 'Conversaciones', icon: Inbox },
  { path: '/admin/operator', label: 'Chat WA', icon: MessageCircle },
  { path: '/admin/clients', label: 'Clientes', icon: Users },
  { path: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { path: '/admin/ia-monitor', label: 'Monitor IA', icon: Bot },
  { path: '/admin/intents', label: 'Intenciones', icon: Sparkles },
  { path: '/admin/settings', label: 'Configuración', icon: Settings },
  { path: '/admin/profile', label: 'Perfil del operador', icon: UserRound },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed = false,
  onToggle,
  mobileOpen,
  onCloseMobile,
  soundEnabled,
  onToggleSound,
}) => {
  const [dark, setDark] = useState(() => localStorage.getItem('water-crm-theme') !== 'light');
  const showDetails = !collapsed;
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('water-crm-theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => {
    const syncTheme = (event: Event) => setDark(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener('water-crm-theme-change', syncTheme);
    return () => window.removeEventListener('water-crm-theme-change', syncTheme);
  }, []);

  return <>
  <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col overflow-y-auto border-r border-sky-200 bg-white text-slate-900 shadow-sm transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white ${collapsed ? 'w-16' : 'w-64'}`}>
    <div className={`border-b border-sky-100 py-6 dark:border-slate-800 ${collapsed ? 'px-2' : 'px-6'}`}>
      <div className="flex items-center justify-between gap-2">
        {showDetails && <p className="text-xs font-semibold uppercase text-sky-600">Water CRM IA</p>}
        <button onClick={onToggle} title={collapsed ? 'Expandir menú' : 'Contraer menú'} className="rounded-md p-1 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      {showDetails && <><h2 className="mt-2 text-lg font-semibold">EPSA El Portillo</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Operación WhatsApp</p></>}
    </div>
    <nav className={`flex-1 space-y-1 py-5 ${collapsed ? 'px-2' : 'px-3'}`}>
      {showDetails && <p className="px-3 pb-3 text-[10px] font-semibold uppercase text-slate-400">Navegación</p>}
      {items.map((item) => {
        const Icon = item.icon;
        return (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          title={collapsed ? item.label : undefined}
          onClick={onCloseMobile}
          className={({ isActive }) => `flex items-center rounded-md border-l-2 py-3 text-sm transition-colors ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-100' : 'border-transparent text-slate-600 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'}`}
        >
          <Icon className="h-4 w-4 text-sky-500" />
          {showDetails && item.label}
        </NavLink>
      );})}
    </nav>
    {showDetails && (
      <button onClick={onToggleSound} className="mx-3 mb-3 flex w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-md border border-sky-200 px-2 py-2 text-xs text-sky-700 dark:border-slate-700 dark:text-sky-200">
        {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        {soundEnabled ? 'Sonido activado' : 'Sonido apagado'}
      </button>
    )}
    <div className={`border-t border-sky-100 py-5 dark:border-slate-800 ${collapsed ? 'px-2 text-center' : 'px-6'}`}>
      <button title="Cambiar modo claro/oscuro" onClick={() => { const next = !dark; setDark(next); window.dispatchEvent(new CustomEvent('water-crm-theme-change', { detail: next })); }} className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-sky-200 px-2 py-2 text-xs text-sky-600 dark:border-slate-700 dark:text-sky-300">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{!collapsed && (dark ? 'Modo claro' : 'Modo oscuro')}</button>
      <NavLink to="/" title="Abrir CRM principal" onClick={onCloseMobile} className="text-xs text-sky-600 hover:text-sky-800 dark:text-sky-300">{showDetails ? 'Abrir CRM principal' : '↗'}</NavLink>
    </div>
  </aside>
  </>
};

export default AdminSidebar;
