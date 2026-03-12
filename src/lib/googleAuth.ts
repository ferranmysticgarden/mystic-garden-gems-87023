import { Browser } from '@capacitor/browser';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

export const NATIVE_OAUTH_CALLBACK_URL = 'https://mystic-garden-gems-87023.lovable.app/callback';
const PUBLISHED_WEB_ORIGIN = 'https://mystic-garden-gems-87023.lovable.app';

const isPreviewHost = () => {
  const hostname = window.location.hostname;
  return hostname.startsWith('id-preview--') || hostname.includes('lovableproject.com');
};

const isCustomDomain = () => {
  const hostname = window.location.hostname;

  return (
    !hostname.includes('lovable.app') &&
    !hostname.includes('lovableproject.com')
  );
};

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

export const signInWithGoogleWeb = async (redirectPath = '/', prompt = 'select_account') => {
  if (isCustomDomain()) {
    const redirectTo = new URL(redirectPath, window.location.origin).toString();

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
    return;
  }

  // For Lovable domains (preview or published), use managed OAuth
  const { error } = await lovable.auth.signInWithOAuth('google', {
    redirect_uri: window.location.origin,
    extraParams: {
      prompt,
    },
  });

  if (error) throw error;
};

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
