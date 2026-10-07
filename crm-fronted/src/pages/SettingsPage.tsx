import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Building2, Camera, Globe2, Mail, MapPin, RefreshCw, Save, Settings as SettingsIcon } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../services/api';

type Settings = {
  model: string;
  temperature: string;
  maxTokens: string;
  opening: string;
  closing: string;
  simulator: boolean;
};

type WhatsAppProfile = {
  name: string;
  about: string;
  description: string;
  address: string;
  email: string;
  website: string;
  vertical: string;
  photo: string;
};

const settingsDefaults: Settings = {
  model: 'qwen3:8b',
  temperature: '0.35',
  maxTokens: '300',
  opening: '08:00',
  closing: '18:00',
  simulator: true,
};

const profileDefaults: WhatsAppProfile = {
  name: 'EPSA CRM',
  about: '',
  description: '',
  address: '',
  email: '',
  website: '',
  vertical: 'PROF_SERVICES',
  photo: '',
};

const verticalOptions = [
  { value: 'PROF_SERVICES', label: 'Servicios profesionales' },
  { value: 'UTILITY', label: 'Servicios publicos' },
  { value: 'OTHER', label: 'Otro' },
  { value: 'EDU', label: 'Educacion' },
  { value: 'GOVT', label: 'Gobierno' },
  { value: 'HEALTH', label: 'Salud' },
  { value: 'NONPROFIT', label: 'Sin fines de lucro' },
];

const fieldClass =
  'mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 disabled:cursor-not-allowed disabled:opacity-60';

const sectionClass = 'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(settingsDefaults);
  const [profile, setProfile] = useState<WhatsAppProfile>(profileDefaults);
  const [profilePhoto, setProfilePhoto] = useState<File | undefined>();
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const initials = useMemo(() => {
    return profile.name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'EP';
  }, [profile.name]);

  useEffect(() => {
    const stored = localStorage.getItem('water-crm-settings');
    if (stored) setSettings({ ...settingsDefaults, ...JSON.parse(stored) });

    const storedProfile = localStorage.getItem('water-crm-profile');
    if (storedProfile) setProfile({ ...profileDefaults, ...JSON.parse(storedProfile) });

    loadWhatsAppProfile();
  }, []);

  const updateSetting = (key: keyof Settings, value: string | boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const updateProfile = (key: keyof WhatsAppProfile, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem('water-crm-settings', JSON.stringify(settings));
    setSettingsSaved(true);
    window.setTimeout(() => setSettingsSaved(false), 2500);
  };

  const loadWhatsAppProfile = async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const businessProfile = await api.getWhatsAppProfile();
      setProfile((current) => ({
        ...current,
        name: businessProfile.name || current.name,
        about: businessProfile.about || current.about,
        description: businessProfile.description || current.description || businessProfile.about || '',
        address: businessProfile.address || current.address,
        email: businessProfile.email || current.email,
        website: businessProfile.websites?.[0] || current.website,
        vertical: businessProfile.vertical || current.vertical,
        photo: businessProfile.profile_picture_url || current.photo,
      }));
    } catch (error: any) {
      setProfileError(error.response?.data?.error || error.message || 'No se pudo cargar el perfil de WhatsApp.');
    } finally {
      setProfileLoading(false);
    }
  };

  const uploadPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfilePhoto(file);
    const reader = new FileReader();
    reader.onload = () => updateProfile('photo', String(reader.result));
    reader.readAsDataURL(file);
  };

  const saveWhatsAppProfile = async () => {
    setProfileSaving(true);
    setProfileError('');
    try {
      const response = await api.updateWhatsAppProfile(
        {
          about: profile.about,
          description: profile.description || profile.about,
          address: profile.address,
          website: profile.website,
          email: profile.email,
          vertical: profile.vertical,
        },
        profilePhoto,
      );

      const confirmed = response?.success === true || response?.data?.success === true || response?.data?.data?.success === true;
      if (!confirmed) throw new Error(response?.error || 'WhatsApp no confirmo la actualizacion.');

      localStorage.setItem('water-crm-profile', JSON.stringify(profile));
      setProfilePhoto(undefined);
      setProfileSaved(true);
      window.setTimeout(() => setProfileSaved(false), 3000);
      loadWhatsAppProfile();
    } catch (error: any) {
      setProfileError(error.response?.data?.error || error.response?.data?.message || error.message || 'No se pudo actualizar el perfil.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-5 py-6 text-[var(--color-text)] md:ml-64 md:px-8">
      <AdminSidebar />
      <main className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Administracion</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--color-text)] md:text-4xl">Configuracion</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">Perfil publico, operacion e IA del CRM.</p>
          </div>
          <button
            type="button"
            onClick={loadWhatsAppProfile}
            disabled={profileLoading}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${profileLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {settingsSaved && <div className="mt-5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">Configuracion guardada en este navegador.</div>}
        {profileSaved && <div className="mt-5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">Perfil de WhatsApp actualizado.</div>}
        {profileError && <div className="mt-5 rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger)]/10 px-4 py-3 text-sm font-semibold text-[var(--color-danger)]">{profileError}</div>}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className={sectionClass}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--color-text)]">Perfil publico de WhatsApp</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Datos que ven los clientes al abrir el contacto de la empresa.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
              <div>
                <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-primary)] text-3xl font-black text-white shadow-[var(--shadow-sm)]">
                  {profile.photo ? <img src={profile.photo} alt="Logo de la empresa" className="h-full w-full object-cover" /> : initials}
                </div>
                <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]">
                  <Camera className="h-4 w-4" />
                  Subir logo
                  <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={uploadPhoto} className="hidden" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[var(--color-text-muted)] sm:col-span-2">
                  Nombre mostrado
                  <input value={profile.name} readOnly className={fieldClass} />
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] sm:col-span-2">
                  Info corta
                  <input maxLength={139} value={profile.about} onChange={(event) => updateProfile('about', event.target.value)} placeholder="Servicio de agua potable y atencion al cliente" className={fieldClass} />
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] sm:col-span-2">
                  Descripcion
                  <textarea maxLength={512} rows={4} value={profile.description} onChange={(event) => updateProfile('description', event.target.value)} placeholder="Describe la empresa, horarios generales o canales de soporte" className={fieldClass} />
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] sm:col-span-2">
                  Direccion
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-[18px] h-4 w-4 text-[var(--color-text-muted)]" />
                    <input value={profile.address} onChange={(event) => updateProfile('address', event.target.value)} placeholder="Av. principal, zona, ciudad" className={`${fieldClass} pl-9`} />
                  </div>
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Correo
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-[18px] h-4 w-4 text-[var(--color-text-muted)]" />
                    <input type="email" value={profile.email} onChange={(event) => updateProfile('email', event.target.value)} placeholder="contacto@empresa.com" className={`${fieldClass} pl-9`} />
                  </div>
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Sitio web
                  <div className="relative">
                    <Globe2 className="pointer-events-none absolute left-3 top-[18px] h-4 w-4 text-[var(--color-text-muted)]" />
                    <input type="url" value={profile.website} onChange={(event) => updateProfile('website', event.target.value)} placeholder="https://empresa.com" className={`${fieldClass} pl-9`} />
                  </div>
                </label>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] sm:col-span-2">
                  Rubro
                  <select value={profile.vertical} onChange={(event) => updateProfile('vertical', event.target.value)} className={fieldClass}>
                    {verticalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={profileSaving}
                onClick={saveWhatsAppProfile}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:brightness-95 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {profileSaving ? 'Guardando...' : 'Guardar perfil de WhatsApp'}
              </button>
            </div>
          </section>

          <aside className={sectionClass}>
            <h2 className="text-lg font-black text-[var(--color-text)]">Vista previa</h2>
            <div className="mt-5 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
              <div className="bg-[var(--color-primary)] px-5 py-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/20 text-xl font-black">
                    {profile.photo ? <img src={profile.photo} alt="Logo" className="h-full w-full object-cover" /> : initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black">{profile.name}</p>
                    <p className="text-sm text-white/80">Empresa</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-5 text-sm">
                <PreviewRow icon={<SettingsIcon className="h-4 w-4" />} label="Info" value={profile.about || 'Sin info corta'} />
                <PreviewRow icon={<MapPin className="h-4 w-4" />} label="Direccion" value={profile.address || 'Sin direccion'} />
                <PreviewRow icon={<Mail className="h-4 w-4" />} label="Correo" value={profile.email || 'Sin correo'} />
                <PreviewRow icon={<Globe2 className="h-4 w-4" />} label="Web" value={profile.website || 'Sin sitio web'} />
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className={sectionClass}>
            <h2 className="font-black text-[var(--color-text)]">Inteligencia artificial</h2>
            <label className="mt-5 block text-xs font-semibold text-[var(--color-text-muted)]">Modelo Ollama
              <select value={settings.model} onChange={(event) => updateSetting('model', event.target.value)} className={fieldClass}>
                <option>qwen3:8b</option>
                <option>llama3.2</option>
                <option>mistral</option>
              </select>
            </label>
            <label className="mt-4 block text-xs font-semibold text-[var(--color-text-muted)]">Temperatura
              <input type="number" min="0" max="1" step="0.05" value={settings.temperature} onChange={(event) => updateSetting('temperature', event.target.value)} className={fieldClass} />
            </label>
            <label className="mt-4 block text-xs font-semibold text-[var(--color-text-muted)]">Maximo de tokens
              <input type="number" value={settings.maxTokens} onChange={(event) => updateSetting('maxTokens', event.target.value)} className={fieldClass} />
            </label>
          </section>

          <section className={sectionClass}>
            <h2 className="font-black text-[var(--color-text)]">Atencion</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Apertura
                <input type="time" value={settings.opening} onChange={(event) => updateSetting('opening', event.target.value)} className={fieldClass} />
              </label>
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Cierre
                <input type="time" value={settings.closing} onChange={(event) => updateSetting('closing', event.target.value)} className={fieldClass} />
              </label>
            </div>
            <label className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-3 text-sm font-semibold text-[var(--color-text)]">
              <span>Simulador activo</span>
              <input type="checkbox" checked={settings.simulator} onChange={(event) => updateSetting('simulator', event.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
            </label>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={saveSettings} className="rounded-lg bg-[var(--color-text)] px-4 py-2.5 text-sm font-black text-[var(--color-background)] shadow-sm hover:opacity-90">Guardar configuracion local</button>
        </div>
      </main>
    </div>
  );
};

const PreviewRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex gap-3">
    <div className="mt-0.5 text-[var(--color-primary)]">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase text-[var(--color-text-muted)]">{label}</p>
      <p className="break-words text-[var(--color-text)]">{value}</p>
    </div>
  </div>
);

export default SettingsPage;
