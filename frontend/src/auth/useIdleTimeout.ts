import { useCallback, useEffect, useRef, useState } from 'react';

interface UseIdleTimeoutOptions {
  /** Total idle time before onTimeout fires. */
  timeoutMs: number;
  /** How long before timeoutMs the warning countdown should start. */
  warningMs: number;
  onTimeout: () => void;
  enabled: boolean;
}

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'wheel', 'touchstart'] as const;

export function useIdleTimeout({ timeoutMs, warningMs, onTimeout, enabled }: UseIdleTimeoutOptions) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  // 0 rather than Date.now(): the real timestamp is set by the effect below on
  // mount (and on every enable/re-enable) before anything reads this ref -
  // useRef's argument is otherwise re-evaluated on every render for no reason.
  const lastActivityRef = useRef(0);
  // Once the warning is showing, passive activity (mouse moving over the modal,
  // etc.) is deliberately ignored - only the explicit "I'm still here" click
  // (via extend()) counts, so the countdown behaves like a real confirmation.
  const warningActiveRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const recordActivity = useCallback(() => {
    if (warningActiveRef.current) return;
    lastActivityRef.current = Date.now();
  }, []);

  const extend = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningActiveRef.current = false;
    setSecondsRemaining(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, recordActivity));
    return () => ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, recordActivity));
  }, [enabled, recordActivity]);

  useEffect(() => {
    if (!enabled) {
      warningActiveRef.current = false;
      setSecondsRemaining(null);
      return;
    }
    lastActivityRef.current = Date.now();
    const interval = setInterval(() => {
      const remaining = timeoutMs - (Date.now() - lastActivityRef.current);
      if (remaining <= 0) {
        warningActiveRef.current = false;
        setSecondsRemaining(null);
        onTimeoutRef.current();
      } else if (remaining <= warningMs) {
        warningActiveRef.current = true;
        setSecondsRemaining(Math.ceil(remaining / 1000));
      } else {
        warningActiveRef.current = false;
        setSecondsRemaining(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [enabled, timeoutMs, warningMs]);

  return { secondsRemaining, extend };
}
