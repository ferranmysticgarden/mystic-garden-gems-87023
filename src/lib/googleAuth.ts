import { Browser } from '@capacitor/browser';
import { supabase } from '@/integrations/supabase/client';

export const NATIVE_OAUTH_CALLBACK_URL = 'https://mystic-garden-gems-87023.lovable.app/callback';

const isAllowedOAuthHost = (hostname: string) => {
  const allowedHosts = new Set<string>(['accounts.google.com']);

  try {
    allowedHosts.add(new URL(import.meta.env.VITE_SUPABASE_URL).hostname);
  } catch {
    // ignore malformed env in runtime validation fallback
  }

  return allowedHosts.has(hostname);
};

const assertValidOAuthUrl = (url: string) => {
  const oauthUrl = new URL(url);
  if (!isAllowedOAuthHost(oauthUrl.hostname)) {
    throw new Error('URL de autenticación inválida.');
  }
};

/**
 * Web login: Uses backend OAuth directly with explicit callback route.
 */
export const signInWithGoogleWeb = async (_redirectPath = '/', prompt = 'select_account') => {
  const redirectTo = `${window.location.origin}/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        prompt,
      },
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('No se pudo iniciar el login con Google.');

  assertValidOAuthUrl(data.url);
  window.location.assign(data.url);
};

/**
 * Native (Android) login: Uses Supabase OAuth with Custom Tabs / Browser plugin.
 */
export const signInWithGoogleNative = async (prompt = 'select_account') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: NATIVE_OAUTH_CALLBACK_URL,
      skipBrowserRedirect: true,
      queryParams: {
        prompt,
      },
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('No se pudo iniciar el login con Google.');

  assertValidOAuthUrl(data.url);
  await Browser.open({
    url: data.url,
    toolbarColor: '#1a0a2e',
    presentationStyle: 'fullscreen',
  });
};
