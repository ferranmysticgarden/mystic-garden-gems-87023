import { lazy, Suspense, useEffect, useState } from 'react';

// Load the heavy background (image + floating particles/butterflies/mushrooms) lazily
// so it doesn't block first paint of the menu.
const MysticBackground = lazy(() =>
  import('./MysticBackground').then(m => ({ default: m.MysticBackground }))
);

interface Props {
  /** Delay (ms) after mount before rendering the background. Default 250ms. */
  delayMs?: number;
}

/**
 * Renders MysticBackground after `delayMs` and only when the browser is idle.
 * Keeps first paint clear of heavy CSS animations and image decoding.
 */
export const DeferredMysticBackground = ({ delayMs = 250 }: Props) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const schedule = () => {
      const cb = () => { if (!cancelled) setShow(true); };
      const ric = (window as unknown as { requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
      if (typeof ric === 'function') {
        ric(cb, { timeout: 1000 });
      } else {
        setTimeout(cb, 0);
      }
    };
    const t = setTimeout(schedule, delayMs);
    return () => { cancelled = true; clearTimeout(t); };
  }, [delayMs]);

  if (!show) return null;
  return (
    <Suspense fallback={null}>
      <MysticBackground />
    </Suspense>
  );
};
