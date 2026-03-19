import { useCallback } from 'react';
import { useAuth } from './useAuth';

export const useAttemptTracker = () => {
  const { user } = useAuth();
  const odId = user?.id || 'guest';

  const getAttempts = useCallback((levelNumber: number): number => {
    const key = `level-attempts-${odId}-${levelNumber}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
  }, [odId]);

  const incrementAttempt = useCallback((levelNumber: number): number => {
    const key = `level-attempts-${odId}-${levelNumber}`;
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    const newValue = current + 1;
    localStorage.setItem(key, String(newValue));
    return newValue;
  }, [odId]);

  const resetAttempts = useCallback((levelNumber: number): void => {
    const key = `level-attempts-${odId}-${levelNumber}`;
    localStorage.setItem(key, '0');
  }, [odId]);

  return { getAttempts, incrementAttempt, resetAttempts };
};
