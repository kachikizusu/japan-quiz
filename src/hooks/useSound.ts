import { useCallback, useRef } from 'react';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  return new Ctx();
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = getAudioContext();
    }
    return ctxRef.current;
  };

  const playTone = useCallback((
    freq: number,
    startTime: number,
    duration: number,
    gainValue: number,
    ctx: AudioContext
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, startTime);
    osc.type = 'sine';
    gain.gain.setValueAtTime(gainValue, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }, []);

  const playCorrect = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    // 明るい上昇音 C5→E5→G5
    playTone(523.25, t,       0.15, 0.3, ctx); // C5
    playTone(659.25, t + 0.12, 0.15, 0.3, ctx); // E5
    playTone(783.99, t + 0.24, 0.25, 0.35, ctx); // G5
  }, [playTone]);

  const playWrong = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    // 残念な下降音
    playTone(329.63, t,       0.15, 0.3, ctx); // E4
    playTone(261.63, t + 0.15, 0.3,  0.35, ctx); // C4
  }, [playTone]);

  return { playCorrect, playWrong };
}
