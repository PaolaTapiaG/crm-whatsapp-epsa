import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bot, ChevronLeft, ChevronRight, ExternalLink, Gauge, Inbox, MapPin, MessageCircle, Moon, Settings, Sparkles, Sun, Ticket, Upload, Users, UserRound, Volume2, VolumeX } from 'lucide-react';

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
  companyProfile?: { displayName: string; role: string; photo: string };
  onCompanyProfileChange?: (profile: { displayName: string; role: string; photo: string }) => void;
  companyLocation?: { latitude: string; longitude: string; name: string; address: string };
  onCompanyLocationChange?: (location: { latitude: string; longitude: string; name: string; address: string }) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

const inputClass = 'w-full rounded-md border border-sky-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed = false,
  onToggle,
  mobileOpen,
  onCloseMobile,
  companyProfile,
  onCompanyProfileChange,
  companyLocation,
  onCompanyLocationChange,
  soundEnabled,
  onToggleSound,
}) => {
  const [dark, setDark] = useState(() => localStorage.getItem('water-crm-theme') !== 'light');
  const showDetails = !collapsed;
  const mapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(companyLocation?.address || companyLocation?.name || 'EPSA El Portillo')}`;
  const lookupLocation = async () => {
    if (!companyLocation) return;
    const query = companyLocation.address || companyLocation.name;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
    const [result] = await response.json();
    if (result?.lat && result?.lon) {
      onCompanyLocationChange?.({
        ...companyLocation,
        latitude: String(result.lat),
        longitude: String(result.lon),
        address: result.display_name || companyLocation.address,
      });
    }
  };

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
    {showDetails && companyProfile && companyLocation && (
      <section className="mx-3 mb-3 rounded-lg border border-sky-100 bg-sky-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-200"><UserRound className="h-4 w-4" /> Perfil del chat</p>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#25d366] text-sm font-bold text-slate-950">
            {companyProfile.photo ? <img src={companyProfile.photo} alt="" className="h-full w-full object-cover" /> : companyProfile.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{companyProfile.displayName}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{companyProfile.role}</p>
          </div>
        </div>
        <input value={companyProfile.displayName} onChange={(event) => onCompanyProfileChange?.({ ...companyProfile, displayName: event.target.value })} className={inputClass} />
        <input value={companyProfile.role} onChange={(event) => onCompanyProfileChange?.({ ...companyProfile, role: event.target.value })} className={`${inputClass} mt-2`} />
        <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-sky-200 bg-white px-2 py-2 text-xs text-sky-700 dark:border-slate-700 dark:bg-slate-950 dark:text-sky-200">
          <Upload className="h-4 w-4" />
          Actualizar foto
          <input type="file" accept="image/*" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onCompanyProfileChange?.({ ...companyProfile, photo: String(reader.result || '') });
            reader.readAsDataURL(file);
          }} />
        </label>
        <p className="mb-2 mt-4 flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-200"><MapPin className="h-4 w-4" /> Ubicacion</p>
        <input value={companyLocation.name} onChange={(event) => onCompanyLocationChange?.({ ...companyLocation, name: event.target.value })} className={inputClass} />
        <input value={companyLocation.address} onChange={(event) => onCompanyLocationChange?.({ ...companyLocation, address: event.target.value })} className={`${inputClass} mt-2`} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input value={companyLocation.latitude} onChange={(event) => onCompanyLocationChange?.({ ...companyLocation, latitude: event.target.value })} className={inputClass} />
          <input value={companyLocation.longitude} onChange={(event) => onCompanyLocationChange?.({ ...companyLocation, longitude: event.target.value })} className={inputClass} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button onClick={lookupLocation} className="rounded-md bg-[#25d366] px-2 py-2 text-xs font-semibold text-slate-950">Buscar</button>
          <button onClick={() => navigator.geolocation?.getCurrentPosition((position) => onCompanyLocationChange?.({ ...companyLocation, latitude: String(position.coords.latitude), longitude: String(position.coords.longitude) }))} className="rounded-md bg-sky-600 px-2 py-2 text-xs font-semibold text-white">Usar GPS</button>
          <a href={mapUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-md border border-sky-200 bg-white px-2 py-2 text-xs text-sky-700 dark:border-slate-700 dark:bg-slate-950 dark:text-sky-200">Mapa <ExternalLink className="h-3 w-3" /></a>
        </div>
        <button onClick={onToggleSound} className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-sky-200 bg-white px-2 py-2 text-xs text-sky-700 dark:border-slate-700 dark:bg-slate-950 dark:text-sky-200">
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {soundEnabled ? 'Sonido activado' : 'Sonido apagado'}
        </button>
      </section>
    )}
    <div className={`border-t border-sky-100 py-5 dark:border-slate-800 ${collapsed ? 'px-2 text-center' : 'px-6'}`}>
      <button title="Cambiar modo claro/oscuro" onClick={() => { const next = !dark; setDark(next); window.dispatchEvent(new CustomEvent('water-crm-theme-change', { detail: next })); }} className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-sky-200 px-2 py-2 text-xs text-sky-600 dark:border-slate-700 dark:text-sky-300">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{!collapsed && (dark ? 'Modo claro' : 'Modo oscuro')}</button>
      <NavLink to="/" title="Abrir CRM principal" onClick={onCloseMobile} className="text-xs text-sky-600 hover:text-sky-800 dark:text-sky-300">{showDetails ? 'Abrir CRM principal' : '↗'}</NavLink>
    </div>
  </aside>
  </>
};

export default AdminSidebar;
