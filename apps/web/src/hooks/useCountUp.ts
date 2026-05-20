import { useEffect, useState } from 'react';

/**
 * Animates a number counting up from 0 to `target` when `enabled` becomes true.
 */
export function useCountUp(target: number, enabled = true, duration = 1200) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (target <= 0) {
      setVal(0);
      return;
    }
    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled, duration]);

  return val;
}
