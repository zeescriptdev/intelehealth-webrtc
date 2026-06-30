import { useEffect, useRef } from 'react';

export interface RingtoneOptions {
  enabled?: boolean;
  url?: string;
  volume?: number;
}

export function useRingtone(active: boolean, options?: RingtoneOptions): void {
  const { enabled = true, url, volume = 0.18 } = options ?? {};
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active || !enabled) return undefined;

    if (url) {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = Math.min(1, Math.max(0, volume * 5));
      audio.play().catch(() => undefined);
      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }

    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return undefined;

    const ctx = new Ctx();
    ctx.resume?.().catch(() => undefined);

    const beep = () => {
      const start = ctx.currentTime;
      for (const freq of [440, 480]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.05);
        gain.gain.setValueAtTime(volume, start + 0.9);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 1.05);
      }
    };

    beep();
    timerRef.current = setInterval(beep, 3000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      ctx.close().catch(() => undefined);
    };
  }, [active, enabled, url, volume]);
}
