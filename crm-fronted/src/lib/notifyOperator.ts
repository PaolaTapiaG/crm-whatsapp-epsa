// src/lib/notifyOperator.ts

let audioContext: AudioContext | null = null;

/**
 * Devuelve (y memoiza) un AudioContext. Algunos navegadores requieren
 * que se cree dentro de un gesto del usuario; por eso no lo instanciamos
 * hasta la primera llamada real.
 */
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (audioContext) return audioContext;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
    return audioContext;
  } catch {
    return null;
  }
};

export interface NotifyOptions {
  /** Si false, no reproduce sonido ni dispara notificación. */
  enabled?: boolean;
  /** Frecuencia del beep en Hz. Default 880 (A5). */
  frequency?: number;
  /** Duración del beep en segundos. Default 0.18. */
  duration?: number;
  /** Volumen 0..1. Default 0.05. */
  volume?: number;
  /** Si true, también dispara una Notification del sistema. Default true. */
  systemNotification?: boolean;
  /** Icono opcional para la notificación del sistema. */
  icon?: string;
  /** Tag para agrupar notificaciones (evita spam). */
  tag?: string;
}

/**
 * Reproduce un beep corto y (opcionalmente) dispara una notificación
 * del sistema. Nunca lanza: si el navegador bloquea audio o notificaciones,
 * falla silenciosamente.
 */
export const notifyOperator = (
  title: string,
  body: string,
  options: NotifyOptions = {}
): void => {
  const {
    enabled = true,
    frequency = 880,
    duration = 0.18,
    volume = 0.05,
    systemNotification = true,
    icon,
    tag,
  } = options;

  if (!enabled) return;

  // --- Beep con Web Audio API -------------------------------------------
  const ctx = getAudioContext();
  if (ctx) {
    try {
      // Algunos navegadores suspenden el contexto hasta un gesto del usuario.
      if (ctx.state === 'suspended') void ctx.resume();

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.value = volume;

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch {
      // Audio bloqueado: seguimos con la notificación del sistema.
    }
  }

  // --- Notification API --------------------------------------------------
  if (
    systemNotification &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    try {
      new Notification(title, { body, icon, tag });
    } catch {
      // Algunos navegadores (Safari viejo) requieren ServiceWorker.
    }
  }
};

/**
 * Pide permiso de notificaciones si aún no se ha decidido.
 * Devuelve el estado final.
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
};