import { useEffect } from 'react';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

export const useDeepLinks = () => {
  useEffect(() => {
    // Solo ejecutar en plataformas nativas
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleDeepLink = async (event: URLOpenListenerEvent) => {
      const url = event.url;

      try {
        // Nota: no logueamos la URL completa porque puede contener códigos/tokens sensibles
        const parsed = new URL(url);

        // 1) Flujo PKCE (lo normal): devuelve ?code=... (o #code=...)
        const hashParams = new URLSearchParams(parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash);
        const code = parsed.searchParams.get('code') ?? hashParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error);
          }
          return;
        }

        // 2) Flujo implícito (fallback): #access_token=...&refresh_token=...
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session from deep link:', error);
          }
        }
      } catch (error) {
        console.error('Error processing deep link:', error);
      }
    };

    // Escuchar eventos de deep link
    App.addListener('appUrlOpen', handleDeepLink);

    // Limpiar listener al desmontar
    return () => {
      App.removeAllListeners();
    };
  }, []);
};
