import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

const DEEPLINK_CALLBACK_BASE = 'com.mysticgarden.game://callback';

const setMeta = (name: string, content: string) => {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setCanonical = (href: string) => {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

export default function OAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const parsed = useMemo(() => {
    const url = new URL(window.location.href);
    const hashRaw = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hashRaw);

    const code = url.searchParams.get('code') ?? hashParams.get('code');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    const error = url.searchParams.get('error_description') ?? url.searchParams.get('error');

    return {
      code,
      accessToken,
      refreshToken,
      error,
    };
  }, []);

  const deepLinkUrl = useMemo(() => {
    if (parsed.code) {
      return `${DEEPLINK_CALLBACK_BASE}?code=${encodeURIComponent(parsed.code)}`;
    }

    if (parsed.accessToken && parsed.refreshToken) {
      return (
        `${DEEPLINK_CALLBACK_BASE}#access_token=${encodeURIComponent(parsed.accessToken)}` +
        `&refresh_token=${encodeURIComponent(parsed.refreshToken)}`
      );
    }

    return null;
  }, [parsed]);

  useEffect(() => {
    document.title = 'Callback de acceso | Mystic Garden';
    setMeta('description', 'Finalizando inicio de sesión de Mystic Garden. Volviendo a la app automáticamente.');
    setCanonical(window.location.origin + '/callback');
  }, []);

  useEffect(() => {
    if (parsed.error) {
      setStatus('error');
      setErrorMsg(decodeURIComponent(parsed.error));
      return;
    }

    if (!deepLinkUrl) {
      setStatus('missing');
      return;
    }

    setStatus('ready');

    // Intento automático (Android suele funcionar). En iOS puede requerir toque.
    const id = window.setTimeout(() => {
      window.location.href = deepLinkUrl;
    }, 350);

    return () => window.clearTimeout(id);
  }, [deepLinkUrl, parsed.error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <section className="gradient-card shadow-card rounded-2xl p-8 max-w-md w-full border border-primary/20">
        <header className="text-center mb-6">
          <div className="text-6xl mb-4">🌸</div>
          <h1 className="text-2xl font-bold text-gold">Acceso a Mystic Garden</h1>
          <p className="text-muted-foreground mt-2">
            {status === 'loading' && 'Preparando el acceso…'}
            {status === 'ready' && 'Volviendo a la app…'}
            {status === 'missing' && 'No he recibido el código de acceso.'}
            {status === 'error' && 'Hubo un error al iniciar sesión.'}
          </p>
        </header>

        {status === 'error' && (
          <div className="text-sm bg-muted/50 rounded-lg p-4 border border-border">
            <p className="font-medium">Detalle:</p>
            <p className="text-muted-foreground break-words mt-1">{errorMsg}</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Button
            type="button"
            className="w-full gradient-gold shadow-gold text-lg py-6"
            onClick={() => {
              if (deepLinkUrl) window.location.href = deepLinkUrl;
            }}
            disabled={!deepLinkUrl}
          >
            Abrir la app
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Si no se abre automáticamente, pulsa el botón. Luego la pantalla de login se cerrará sola.
          </p>
        </div>
      </section>
    </main>
  );
}
