import { useEffect, useRef } from 'react';

export function useBackgroundTimer(
  isRunning: boolean,
  onTick: () => void,
  intervalMs: number = 1000
) {
  const tickCallbackRef = useRef(onTick);
  const workerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    tickCallbackRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!isRunning) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tickCallbackRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    workerIntervalRef.current = window.setInterval(() => {
      tickCallbackRef.current();
    }, intervalMs);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (workerIntervalRef.current !== null) {
        clearInterval(workerIntervalRef.current);
        workerIntervalRef.current = null;
      }
    };
  }, [isRunning, intervalMs]);
}
