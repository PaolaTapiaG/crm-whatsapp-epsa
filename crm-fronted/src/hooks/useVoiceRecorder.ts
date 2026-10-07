import { useCallback, useRef, useState } from 'react';

export const useVoiceRecorder = (
  onComplete: (file: File) => Promise<void> | void,
  onError?: (msg: string) => void
) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      onError?.('Este navegador no permite grabar audio.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const mime = recorder.mimeType || 'audio/webm';
        const audio = new File(
          [new Blob(audioChunksRef.current, { type: mime })],
          'mensaje-de-voz.webm',
          { type: mime }
        );
        await onComplete(audio);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      onError?.('No se obtuvo permiso para usar el micrófono.');
    }
  }, [onComplete, onError]);

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  }, []);

  return { recording, start, stop };
};