import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/** Animates a number toward `target`. Jumps straight to the value when reduced motion is on. */
export function useCountUp(target: number, duration = 900): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState<number>(reduced ? target : 0);
  const previous = useRef<number>(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      previous.current = target;
      return undefined;
    }
    const from = previous.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      previous.current = next;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);

  return value;
}
