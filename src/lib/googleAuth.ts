import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

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

export const signInWithGoogleWeb = async (redirectPath = '/', prompt = 'select_account') => {
  const redirectTo = new URL(redirectPath, window.location.origin).toString();

  if (isCustomDomain()) {
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

    const oauthUrl = new URL(data.url);
    if (!isAllowedOAuthHost(oauthUrl.hostname)) {
      throw new Error('URL de autenticación inválida.');
    }

    window.location.assign(data.url);
    return;
  }

  const { error } = await lovable.auth.signInWithOAuth('google', {
    redirect_uri: redirectTo,
    extraParams: {
      prompt,
    },
  });

  if (error) throw error;
};
