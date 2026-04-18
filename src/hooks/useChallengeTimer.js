import { useCallback, useEffect, useRef, useState } from 'react';

export function useChallengeTimer() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const activeRef = useRef(false);
  const startedAtRef = useRef(0);
  const savedElapsedRef = useRef(0);
  const frameRef = useRef(0);

  const getElapsed = useCallback(() => {
    if (!activeRef.current) {
      return savedElapsedRef.current;
    }

    return savedElapsedRef.current + performance.now() - startedAtRef.current;
  }, []);

  const tick = useCallback(() => {
    if (!activeRef.current) {
      return;
    }

    setElapsedMs(getElapsed());
    frameRef.current = window.requestAnimationFrame(tick);
  }, [getElapsed]);

  const start = useCallback(() => {
    if (activeRef.current) {
      return;
    }

    activeRef.current = true;
    startedAtRef.current = performance.now();
    frameRef.current = window.requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    if (!activeRef.current) {
      return;
    }

    savedElapsedRef.current = getElapsed();
    activeRef.current = false;
    window.cancelAnimationFrame(frameRef.current);
    setElapsedMs(savedElapsedRef.current);
  }, [getElapsed]);

  const reset = useCallback(() => {
    activeRef.current = false;
    startedAtRef.current = 0;
    savedElapsedRef.current = 0;
    window.cancelAnimationFrame(frameRef.current);
    setElapsedMs(0);
  }, []);

  useEffect(() => {
    return () => {
      window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return {
    elapsedMs,
    start,
    stop,
    reset,
    getElapsed
  };
}
