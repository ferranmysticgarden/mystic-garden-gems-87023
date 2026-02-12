import { useEffect } from 'react';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

// Guard para evitar que el mismo código se intercambie dos veces
let lastProcessedCode: string | null = null;

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
          // Evitar procesar el mismo código dos veces (previene crash por doble intercambio)
          if (code === lastProcessedCode) {
            console.warn('[DeepLinks] Código ya procesado, ignorando duplicado');
            return;
          }
          lastProcessedCode = code;

          // Cerrar el navegador lo antes posible para evitar que se quede visible
          Browser.close().catch(() => {});

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
          // Cerrar el navegador lo antes posible para evitar que se quede visible
          Browser.close().catch(() => {});

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
    // Nota: evitamos removeAllListeners() para no romper otros listeners
    let handle: { remove: () => Promise<void> | void } | null = null;
    const sub = App.addListener('appUrlOpen', handleDeepLink);

    // Capacitor puede devolver handle directo o promesa según plataforma/typing
    Promise.resolve(sub)
      .then((h) => {
        handle = h;
      })
      .catch(() => {
        handle = null;
      });

    // Limpiar listener al desmontar
    return () => {
      try {
        handle?.remove?.();
      } catch {
        // ignore
      }
    };
  }, []);
};
