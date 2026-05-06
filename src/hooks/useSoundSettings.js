import { useCallback, useEffect, useMemo, useState } from 'react';

export function useSoundSettings({ userId, addToast }) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndFrom, setDndFrom] = useState('22:00');
  const [dndTo, setDndTo] = useState('07:00');

  const ensureAudioUnlocked = useCallback(async () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.001;
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.14);
      oscillator.onended = () => ctx.close();
      setAudioUnlocked(true);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.001;
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
      oscillator.onended = () => ctx.close();
    } catch (e) {
      // noop
    }
  }, []);

  const toggleSoundNotifications = useCallback(async () => {
    const next = !soundEnabled;
    if (next && !audioUnlocked) {
      const ok = await ensureAudioUnlocked();
      if (!ok) {
        addToast?.('Toque novamente para liberar o áudio.', 'warn');
        return;
      }
    }
    setSoundEnabled(next);
    if (next) playNotificationSound();
  }, [soundEnabled, playNotificationSound, ensureAudioUnlocked, audioUnlocked, addToast]);

  const isDndNow = useMemo(() => {
    if (!dndEnabled) return false;
    const now = new Date();
    const [fh, fm] = dndFrom.split(':').map(Number);
    const [th, tm] = dndTo.split(':').map(Number);
    const fromMin = fh * 60 + fm;
    const toMin = th * 60 + tm;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (fromMin === toMin) return true;
    if (fromMin < toMin) return nowMin >= fromMin && nowMin < toMin;
    return nowMin >= fromMin || nowMin < toMin;
  }, [dndEnabled, dndFrom, dndTo]);

  useEffect(() => {
    if (!userId) return;
    const stored = localStorage.getItem(`sound_notifications_${userId}`);
    setSoundEnabled(stored === 'true');
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(`sound_notifications_${userId}`, String(soundEnabled));
  }, [soundEnabled, userId]);

  useEffect(() => {
    if (!userId) return;
    const enabled = localStorage.getItem(`dnd_enabled_${userId}`);
    const from = localStorage.getItem(`dnd_from_${userId}`);
    const to = localStorage.getItem(`dnd_to_${userId}`);
    setDndEnabled(enabled === 'true');
    if (from) setDndFrom(from);
    if (to) setDndTo(to);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(`dnd_enabled_${userId}`, String(dndEnabled));
    localStorage.setItem(`dnd_from_${userId}`, dndFrom);
    localStorage.setItem(`dnd_to_${userId}`, dndTo);
  }, [dndEnabled, dndFrom, dndTo, userId]);

  return {
    soundEnabled,
    toggleSoundNotifications,
    playNotificationSound,
    dndEnabled,
    setDndEnabled,
    dndFrom,
    setDndFrom,
    dndTo,
    setDndTo,
    isDndNow
  };
}
