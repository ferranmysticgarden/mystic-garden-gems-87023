import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Hook para manejar el estado global de AdMob
export const useAdMob = () => {
  const [isNative, setIsNative] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const initialize = useCallback(async () => {
    if (!isNative || isInitialized) return;

    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.initialize({
        initializeForTesting: true,
      });
      setIsInitialized(true);
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
    }
  }, [isNative, isInitialized]);

  return {
    isNative,
    isInitialized,
    initialize,
  };
};
