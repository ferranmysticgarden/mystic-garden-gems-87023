import { useEffect, useState, ReactNode } from 'react';
import { FEATURE_FLAGS } from '@/config/featureFlags';

interface Props {
  trigger: number;
  intensity?: 'light' | 'medium' | 'heavy';
  children: ReactNode;
}

export const ScreenShake = ({ trigger, intensity = 'medium', children }: Props) => {
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!FEATURE_FLAGS.screenShake || !trigger) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 350);
    return () => clearTimeout(t);
  }, [trigger]);
  const cls = shaking
    ? intensity === 'heavy' ? 'animate-[shake_0.35s_ease-in-out]' : 'animate-[shake_0.25s_ease-in-out]'
    : '';
  return <div className={cls}>{children}</div>;
};
