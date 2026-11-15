import { useEffect, useLayoutEffect, useRef } from 'react';

/** One loop per mounted view; hidden tabs and long stalls never advance mission time. */
export function useAnimationFrame(callback, active = true) {
  const callbackRef = useRef(callback);
  useLayoutEffect(() => { callbackRef.current = callback; });
  useEffect(() => {
    if (!active) return;
    let id;
    let previous;
    const tick = (now) => {
      const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, 0.05);
      previous = now;
      callbackRef.current(dt, now / 1000);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [active]);
}
