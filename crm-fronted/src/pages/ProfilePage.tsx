import React, { ChangeEvent, useEffect, useState } from 'react';
import { Camera, MapPin, Save } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../services/api';

interface Profile {
  name: string;
  role: string;
  about: string;
  photo: string;
  address: string;
  latitude: string;
  longitude: string;
  weekdayHours: string;
  saturdayHours: string;
  website: string;
}

const defaults: Profile = {
  name: 'Operador EPSA',
  role: 'Caja y atencion',
  about: 'Atencion al cliente de EPSA El Portillo',
  photo: '',
  address: 'Oficina central de atencion',
  latitude: '-17.3895',
  longitude: '-66.1568',
  weekdayHours: '14:00 - 18:00',
  saturdayHours: '08:00 - 12:00',
  website: '',
};

const field = 'mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile>(defaults);
  const [saved, setSaved] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('water-crm-profile');
    if (stored) setProfile({ ...defaults, ...JSON.parse(stored) });

    api.getWhatsAppProfile().then((businessProfile) => {
      if (!businessProfile) return;
      setProfile((current) => ({
        ...current,
        about: businessProfile.about || current.about,
        address: businessProfile.address || current.address,
        website: businessProfile.websites?.[0] || current.website,
        photo: businessProfile.profile_picture_url || current.photo,
      }));
    }).catch(() => {
      // The local profile remains available when Meta is temporarily unreachable.
    });
  }, []);

  const update = (key: keyof Profile, value: string) => setProfile((current) => ({ ...current, [key]: value }));
  const uploadPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update('photo', String(reader.result));
    setPhotoFile(file);
    reader.readAsDataURL(file);
  };
  const save = async () => {
    setSaving(true);
    setSaveError('');
    localStorage.setItem('water-crm-profile', JSON.stringify(profile));
    localStorage.setItem('water-crm-company-profile', JSON.stringify({
      displayName: profile.name,
      role: profile.role,
      photo: profile.photo,
    }));
    window.dispatchEvent(new CustomEvent('water-crm-profile-change'));
    try {
      await api.updateWhatsAppProfile({
        about: profile.about,
        address: profile.address,
        description: `${profile.name} - ${profile.role}. Horario: ${profile.weekdayHours}; sábados: ${profile.saturdayHours}.`,
        website: profile.website,
      }, photoFile);
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
      <h1 className="mt-2 text-3xl font-semibold">Perfil del operador</h1>
      <p className="mt-1 text-sm text-slate-400">Información visible para organizar la atención y la ubicación de la oficina.</p>
      {saved && <div className="mt-5 border border-emerald-700 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">Perfil guardado en este navegador.</div>}
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
            <label className="text-xs text-slate-400">Nombre interno<input value={profile.name} onChange={(e) => update('name', e.target.value)} className={field} /></label>
            <label className="text-xs text-slate-400">Cargo<input value={profile.role} onChange={(e) => update('role', e.target.value)} className={field} /></label>
            <label className="text-xs text-slate-400 sm:col-span-2">Descripción<textarea value={profile.about} onChange={(e) => update('about', e.target.value)} rows={3} className={field} /></label>
            <label className="text-xs text-slate-400 sm:col-span-2">Dirección<input value={profile.address} onChange={(e) => update('address', e.target.value)} className={field} /></label>
            <label className="text-xs text-slate-400">Latitud<input value={profile.latitude} onChange={(e) => update('latitude', e.target.value)} className={field} /></label>
            <label className="text-xs text-slate-400">Longitud<input value={profile.longitude} onChange={(e) => update('longitude', e.target.value)} className={field} /></label>
            <label className="text-xs text-slate-400">Lunes a viernes<input value={profile.weekdayHours} onChange={(e) => update('weekdayHours', e.target.value)} className={field} /></label>
            <label className="text-xs text-slate-400">Sábados<input value={profile.saturdayHours} onChange={(e) => update('saturdayHours', e.target.value)} className={field} /></label>
            <label className="text-xs text-slate-400 sm:col-span-2">Sitio web<input value={profile.website} onChange={(e) => update('website', e.target.value)} placeholder="https://..." className={field} /></label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3"><button disabled={saving} onClick={save} className="flex items-center gap-2 bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Actualizando WhatsApp...' : 'Guardar perfil'}</button><a href={`https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-slate-700 px-4 py-2 text-sm text-slate-300"><MapPin className="h-4 w-4" /> Ver ubicación</a></div>
        </section>
      </div>
    </main>
  </div>;
};

export default ProfilePage;
