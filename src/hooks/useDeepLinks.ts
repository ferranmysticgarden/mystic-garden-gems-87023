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
      console.log('Deep link received:', url);

      // Verificar si es un callback de autenticación
      // El formato esperado es: com.mysticgarden.game://callback#access_token=...
      if (url.includes('access_token') || url.includes('refresh_token')) {
        try {
          // Extraer el fragmento de la URL (después del #)
          const hashIndex = url.indexOf('#');
          if (hashIndex !== -1) {
            const fragment = url.substring(hashIndex + 1);
            const params = new URLSearchParams(fragment);
            
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              // Establecer la sesión manualmente
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (error) {
                console.error('Error setting session from deep link:', error);
              } else {
                console.log('Session established from deep link');
              }
            }
          }
        } catch (error) {
          console.error('Error processing deep link:', error);
        }
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
