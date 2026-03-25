import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(seconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      onExpireRef.current();
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, running]);

  const start = useCallback(() => {
    setRemaining(seconds);
    setRunning(true);
  }, [seconds]);

  const reset = useCallback(() => {
    setRemaining(seconds);
    setRunning(true);
  }, [seconds]);

  const stop = useCallback(() => {
    setRunning(false);
  }, []);

  return { remaining, running, start, reset, stop };
}
