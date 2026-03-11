import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * Hook para manejar el botón "atrás" de Android.
 * Recibe una función que devuelve `true` si la app debe cerrarse
 * (cuando ya no hay pantalla a la que volver).
 */
export const useBackButton = (onBack: () => boolean) => {
  const handler = useCallback(() => {
    const shouldExit = onBack();
    if (shouldExit) {
      // No hacer nada — dejar que ExitConfirmModal maneje la salida
    }
  }, [onBack]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: { remove: () => void } | null = null;

    const sub = App.addListener('backButton', handler);
    Promise.resolve(sub)
      .then((h) => { handle = h; })
      .catch(() => { handle = null; });

    return () => {
      try { handle?.remove?.(); } catch { /* ignore */ }
    };
  }, [handler]);
};
