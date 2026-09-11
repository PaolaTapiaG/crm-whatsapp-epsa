import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Camera, MapPin, Save, Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../services/api';

interface Profile {
  name: string;
  about: string;
  photo: string;
  address: string;
  website: string;
}

interface DayHours {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
}

const defaults: Profile = {
  name: 'EPSA El Portillo',
  about: '',
  photo: '',
  address: '',
  website: '',
};

const defaultHours: DayHours[] = [
  { day: 'Lunes', enabled: true, open: '08:00', close: '18:00' },
  { day: 'Martes', enabled: true, open: '08:00', close: '18:00' },
  { day: 'Miércoles', enabled: true, open: '08:00', close: '18:00' },
  { day: 'Jueves', enabled: true, open: '08:00', close: '18:00' },
  { day: 'Viernes', enabled: true, open: '08:00', close: '18:00' },
  { day: 'Sábado', enabled: false, open: '08:00', close: '12:00' },
  { day: 'Domingo', enabled: false, open: '08:00', close: '12:00' },
];

const field = 'mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500';

const waterDropIcon = L.divIcon({
  className: 'water-drop-marker',
  html: '<span aria-hidden="true">&#128167;</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 30],
  popupAnchor: [0, -30],
});

interface InteractiveMapProps {
  position: { latitude: number; longitude: number };
  onPositionChange: (position: { latitude: number; longitude: number }) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ position, onPositionChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView([position.latitude, position.longitude], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    const marker = L.marker([position.latitude, position.longitude], { draggable: true, icon: waterDropIcon }).addTo(map);
    marker.on('dragend', () => {
      const point = marker.getLatLng();
      onPositionChange({ latitude: point.lat, longitude: point.lng });
    });
    map.on('click', (event) => {
      marker.setLatLng(event.latlng);
      onPositionChange({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    });
    mapRef.current = map;
    markerRef.current = marker;
    window.setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const point: L.LatLngExpression = [position.latitude, position.longitude];
    markerRef.current.setLatLng(point);
    mapRef.current.panTo(point);
  }, [position.latitude, position.longitude]);

  return <div ref={containerRef} className="h-56 w-full" />;
};

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile>(defaults);
  const [saved, setSaved] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [hours, setHours] = useState<DayHours[]>(defaultHours);
  const [mapQuery, setMapQuery] = useState('');
  const [mapPosition, setMapPosition] = useState({ latitude: -17.3895, longitude: -66.1568 });
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const exactLocationUrl = `https://www.openstreetmap.org/?mlat=${mapPosition.latitude}&mlon=${mapPosition.longitude}#map=18/${mapPosition.latitude}/${mapPosition.longitude}`;

  useEffect(() => {
    const stored = localStorage.getItem('water-crm-profile');
    const storedHours = localStorage.getItem('water-crm-profile-hours');
    if (stored) {
      const storedProfile = JSON.parse(stored);
      setProfile({ ...defaults, ...storedProfile });
      setHours(storedHours ? JSON.parse(storedHours) : storedProfile.hours || defaultHours);
      setMapQuery(storedProfile.address || '');
      if (storedProfile.mapPosition) {
        setMapPosition(storedProfile.mapPosition);
      } else {
        const storedLocation = localStorage.getItem('water-crm-company-location');
        if (storedLocation) {
          const location = JSON.parse(storedLocation);
          if (location.latitude && location.longitude) setMapPosition({ latitude: Number(location.latitude), longitude: Number(location.longitude) });
        }
      }
    } else if (storedHours) {
      setHours(JSON.parse(storedHours));
    }

    api.getWhatsAppProfile().then((businessProfile) => {
      if (!businessProfile) return;
      setProfile((current) => ({
        ...current,
        name: businessProfile.name || current.name,
        about: businessProfile.description || businessProfile.about || current.about,
        address: businessProfile.address || current.address,
        website: businessProfile.websites?.[0] || current.website,
        photo: businessProfile.profile_picture_url || current.photo,
      }));
      if (businessProfile.address) setMapQuery(businessProfile.address);
    }).catch(() => {
      // The local profile remains available when Meta is temporarily unreachable.
    });
  }, []);

  const update = (key: keyof Profile, value: string) => setProfile((current) => ({ ...current, [key]: value }));
  const updateHour = (index: number, change: Partial<DayHours>) => setHours((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...change } : item));
  const searchAddress = async () => {
    if (!mapQuery.trim()) return;
    setSearchingAddress(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(mapQuery)}`, { headers: { Accept: 'application/json' } });
      const [result] = await response.json();
      if (!result?.lat || !result?.lon) throw new Error('No se encontró esa dirección.');
      const address = result.display_name || mapQuery;
      setMapPosition({ latitude: Number(result.lat), longitude: Number(result.lon) });
      setProfile((current) => ({ ...current, address }));
      setMapQuery(address);
    } catch (error: any) {
      setSaveError(error.message || 'No se pudo buscar la dirección.');
    } finally {
      setSearchingAddress(false);
    }
  };
  const selectMapPosition = async (position: { latitude: number; longitude: number }) => {
    setMapPosition(position);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.latitude}&lon=${position.longitude}`, { headers: { Accept: 'application/json' } });
      const result = await response.json();
      const address = result.display_name;
      if (address) {
        setMapQuery(address);
        update('address', address);
      }
    } catch {
      setSaveError('Se seleccionó la ubicación, pero no se pudo obtener su dirección.');
    }
  };
  const uploadPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update('photo', String(reader.result));
    setPhotoFile(file);
    reader.readAsDataURL(file);
  };
  const copyExactLocation = async () => {
    await navigator.clipboard.writeText(exactLocationUrl);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  };
  const save = async () => {
    setSaving(true);
    setSaveError('');
    localStorage.setItem('water-crm-profile-hours', JSON.stringify(hours));
    try {
      const response = await api.updateWhatsAppProfile({
        about: profile.about,
        address: profile.address,
        description: profile.about,
        website: profile.website,
      }, photoFile);
      const confirmed = response?.success === true
        || response?.data?.success === true
        || response?.data?.data?.success === true;
      if (!confirmed) {
        const details = response?.error?.message
          || response?.error?.error_user_msg
          || response?.error
          || (response ? JSON.stringify(response) : 'Respuesta vacía del backend.');
        throw new Error(`WhatsApp no confirmó la actualización del perfil: ${details}`);
      }
      localStorage.setItem('water-crm-profile', JSON.stringify({ ...profile, hours, mapPosition }));
      localStorage.setItem('water-crm-profile-hours', JSON.stringify(hours));
      localStorage.setItem('water-crm-company-location', JSON.stringify({
        latitude: String(mapPosition.latitude),
        longitude: String(mapPosition.longitude),
        name: profile.name,
        address: profile.address,
      }));
      setPhotoFile(undefined);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (error: any) {
      setSaveError(error.response?.data?.message || error.response?.data?.error || error.message || 'No se pudo actualizar WhatsApp Business.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="min-h-screen bg-slate-950 px-4 py-5 text-slate-100 md:ml-64 md:px-8">
    <AdminSidebar />
    <main className="mx-auto max-w-5xl">
      <p className="text-xs uppercase tracking-[0.2em] text-sky-400">Perfil de WhatsApp</p>
      <h1 className="mt-2 text-3xl font-semibold">Perfil</h1>
      <p className="mt-1 text-sm text-slate-400">Este es el único lugar para modificar la información y la foto que ven tus clientes en WhatsApp.</p>
      {saved && <div className="mt-5 border border-emerald-700 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">Meta confirmó la actualización del perfil de WhatsApp.</div>}
      {saveError && <div className="mt-5 border border-rose-700 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{saveError}</div>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <section className="border border-slate-800 bg-slate-900 p-5">
          <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-sky-600 text-3xl font-semibold text-white">
            {profile.photo ? <img src={profile.photo} alt="Foto de perfil" className="h-full w-full object-cover" /> : profile.name.slice(0, 2).toUpperCase()}
          </div>
          <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 border border-slate-700 px-3 py-2 text-sm text-sky-300 hover:bg-slate-800"><Camera className="h-4 w-4" /> Subir foto<input type="file" accept="image/*" onChange={uploadPhoto} className="hidden" /></label>
          <p className="mt-3 text-center text-xs text-slate-500">Usa una imagen cuadrada para que se vea bien en el perfil.</p>
        </section>
        <section className="border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold">Información del perfil</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-slate-400 sm:col-span-2">Nombre<input value={profile.name} readOnly className={`${field} cursor-not-allowed opacity-70`} /></label>
            <label className="text-xs text-slate-400 sm:col-span-2">Descripción<textarea value={profile.about} onChange={(e) => update('about', e.target.value)} placeholder="Escribe una descripción para tus clientes" rows={3} className={field} /></label>
            <div className="sm:col-span-2"><label className="text-xs text-slate-400">Dirección</label><div className="mt-2 flex gap-2"><input value={mapQuery} onChange={(e) => { setMapQuery(e.target.value); update('address', e.target.value); }} placeholder="Busca una dirección" className={field} /><button type="button" onClick={searchAddress} disabled={searchingAddress} title="Buscar dirección" className="mt-2 shrink-0 bg-sky-600 px-3 text-white disabled:opacity-50"><Search className="h-4 w-4" /></button></div><p className="mt-2 text-xs text-slate-500">WhatsApp guarda este campo como texto. Para ajustar el punto, haz clic en el mapa o arrastra la gota.</p><div className="mt-3 overflow-hidden border border-slate-700"><InteractiveMap position={mapPosition} onPositionChange={selectMapPosition} /></div><div className="mt-2 flex flex-wrap items-center gap-3"><button type="button" onClick={copyExactLocation} className="text-xs text-sky-300 hover:text-sky-200">{linkCopied ? 'Enlace copiado' : 'Copiar enlace exacto del punto'}</button><span className="text-xs text-slate-500">{mapPosition.latitude.toFixed(6)}, {mapPosition.longitude.toFixed(6)}</span></div><p className="mt-2 text-xs text-amber-300">El perfil de WhatsApp no admite coordenadas; para enviar un pin exacto usa el botón de ubicación del chat.</p></div>
            <label className="text-xs text-slate-400 sm:col-span-2">Sitio web<input value={profile.website} onChange={(e) => update('website', e.target.value)} placeholder="https://..." className={field} /></label>
          </div>
          <div className="mt-6 border-t border-slate-800 pt-5"><h3 className="font-semibold">Horario</h3><p className="mt-1 text-xs text-slate-500">Configura los días y horas de atención. Se guardan en el CRM.</p><div className="mt-4 space-y-2">{hours.map((item, index) => <div key={item.day} className="grid grid-cols-[1fr_auto_1fr_1fr] items-center gap-2 text-sm"><span className="text-slate-300">{item.day}</span><input type="checkbox" checked={item.enabled} onChange={(e) => updateHour(index, { enabled: e.target.checked })} className="h-4 w-4 accent-sky-500" /><input type="time" value={item.open} disabled={!item.enabled} onChange={(e) => updateHour(index, { open: e.target.value })} className={`${field} mt-0 disabled:opacity-40`} /><input type="time" value={item.close} disabled={!item.enabled} onChange={(e) => updateHour(index, { close: e.target.value })} className={`${field} mt-0 disabled:opacity-40`} /></div>)}</div></div>
          <div className="mt-5 flex flex-wrap gap-3"><button disabled={saving} onClick={save} className="flex items-center gap-2 bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Actualizando WhatsApp...' : 'Guardar perfil'}</button><a href={exactLocationUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-slate-700 px-4 py-2 text-sm text-slate-300"><MapPin className="h-4 w-4" /> Abrir punto exacto</a></div>
        </section>
      </div>
    </main>
  </div>;
};

export default ProfilePage;
