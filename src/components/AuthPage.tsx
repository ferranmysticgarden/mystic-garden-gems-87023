import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { NATIVE_OAUTH_CALLBACK_URL, signInWithGoogleNative, signInWithGoogleWeb } from '@/lib/googleAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { z } from 'zod';
import { Lock, ShieldAlert } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: () => void;
  onBack?: () => void;
  backLabel?: string;
  mode?: 'default' | 'admin';
  forceRecovery?: boolean;
}

const emailSchema = z.string().trim().email({ message: "Email inválido" });
const passwordSchema = z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" });

// Para login/confirmación en móvil nativo usamos una URL https permitida por el backend
// que luego “salta” de vuelta a la app con deep link.

export const AuthPage = ({ onAuthSuccess, onBack, backLabel = 'Volver', mode = 'default', forceRecovery = false }: AuthPageProps) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(mode === 'default' ? false : false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRecovery, setIsRecovery] = useState(forceRecovery);
  const [recoveryReady, setRecoveryReady] = useState(!forceRecovery);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isAdminMode = mode === 'admin';

  useEffect(() => {
    const isRecoveryUrl = () => {
      if (typeof window === 'undefined') return false;
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const queryParams = new URLSearchParams(window.location.search);
      return (
        forceRecovery ||
        window.location.pathname === '/reset-password' ||
        hashParams.get('type') === 'recovery' ||
        queryParams.get('type') === 'recovery'
      );
    };

    const prepareRecoverySession = async () => {
      setRecoveryError(null);
      if (typeof window === 'undefined' || !isRecoveryUrl()) {
        setRecoveryReady(true);
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const queryParams = new URLSearchParams(window.location.search);
      const code = queryParams.get('code') || hashParams.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState(null, '', window.location.pathname);
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          window.history.replaceState(null, '', window.location.pathname);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('El enlace de recuperación no es válido o ha caducado. Pide otro email de recuperación.');
        }
      } catch (error: any) {
        const message = error?.message || 'No se pudo preparar el enlace de recuperación';
        setRecoveryError(message);
        toast.error(message);
        return;
      } finally {
        setRecoveryReady(true);
      }
    };

    // Detectar si llegamos desde un link de recuperación y bloquear el auto-acceso al dashboard.
    if (isRecoveryUrl()) {
      setIsRecovery(true);
      setRecoveryReady(false);
      void prepareRecoverySession();
    } else {
      setRecoveryReady(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        return;
      }
      if (event === 'SIGNED_IN' && session?.user && !isRecovery && !isRecoveryUrl()) {
        onAuthSuccess();
      }
    });

    return () => subscription.unsubscribe();
  }, [onAuthSuccess, isRecovery, forceRecovery]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryReady || recoveryError) {
      toast.error(recoveryError || 'Espera unos segundos, estamos preparando el enlace de recuperación.');
      return;
    }
    try {
      passwordSchema.parse(newPassword);
    } catch (err: any) {
      toast.error(err?.errors?.[0]?.message || 'Contraseña inválida');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Contraseña actualizada. Ya puedes entrar.');
      setIsRecovery(false);
      setNewPassword('');
      setConfirmPassword('');
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      onAuthSuccess();
    } catch (e: any) {
      toast.error(e.message || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);

       if (isSignUp && !isAdminMode) {
        const emailRedirectTo = Capacitor.isNativePlatform()
          ? NATIVE_OAUTH_CALLBACK_URL
          : `${window.location.origin}/`;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: {
              display_name: email.split('@')[0],
            },
          },
        });

        if (error) throw error;

        // Enviar email de notificación (sin esperar respuesta)
        if (data.user) {
          supabase.functions
            .invoke('send-registration-email', {
              body: {
                email,
                displayName: email.split('@')[0],
              },
            })
            .catch((err) => console.error('Error sending registration email:', err));
        }

        toast.success('¡Cuenta creada! Ahora puedes iniciar sesión');
        setIsSignUp(false);
       } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success('¡Bienvenido!');
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      emailSchema.parse(email);
    } catch {
      toast.error('Escribe tu email arriba y vuelve a pulsar "¿Olvidaste tu contraseña?"');
      return;
    }
    setLoading(true);
    try {
      const redirectTo = Capacitor.isNativePlatform()
        ? NATIVE_OAUTH_CALLBACK_URL
        : `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      toast.success('Te hemos enviado un email para restablecer la contraseña.');
    } catch (e: any) {
      toast.error(e.message || 'No se pudo enviar el email de recuperación');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      if (Capacitor.isNativePlatform()) {
        await signInWithGoogleNative('select_account');
      } else {
        await signInWithGoogleWeb('/', 'select_account');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className={`shadow-card rounded-2xl p-8 max-w-md w-full border ${isAdminMode ? 'bg-card/95 border-destructive/30 ring-1 ring-destructive/20' : 'gradient-card border-primary/20'}`}>
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            className="mb-4 px-0 text-muted-foreground hover:text-foreground"
            onClick={onBack}
          >
            ← {backLabel}
          </Button>
        )}

        <div className="text-center mb-8">
          <div className={`mb-4 flex justify-center ${isAdminMode ? 'text-destructive' : ''}`}>
            {isAdminMode ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10">
                <ShieldAlert className="h-8 w-8" />
              </div>
            ) : (
              <div className="text-6xl">🌸</div>
            )}
          </div>
          {isAdminMode && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-destructive">
              <Lock className="h-3.5 w-3.5" />
              Acceso restringido
            </div>
          )}
          <h1 className={`mb-2 text-3xl font-bold ${isAdminMode ? 'text-foreground' : 'text-gold'}`}>
            {isAdminMode ? 'Menú admin' : 'Mystic Garden Pro'}
          </h1>
          <p className="text-muted-foreground">
            {isRecovery
              ? 'Define tu nueva contraseña'
              : isAdminMode
              ? 'Panel privado para administración del juego'
              : isSignUp
                ? 'Crea tu cuenta'
                : 'Inicia sesión para continuar'}
          </p>
        </div>

        {isRecovery ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {!recoveryReady && (
              <div className="rounded-xl border border-border/60 bg-background/30 px-4 py-3 text-center text-sm text-muted-foreground">
                Preparando enlace de recuperación...
              </div>
            )}
            <div>
              <label className="mb-2 block text-left text-sm font-medium text-foreground/90">
                Nueva contraseña
              </label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading || !recoveryReady}
                required
                minLength={6}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-2 block text-left text-sm font-medium text-foreground/90">
                Repetir contraseña
              </label>
              <Input
                type="password"
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || !recoveryReady}
                required
                minLength={6}
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              className={`w-full text-lg py-6 ${isAdminMode ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'gradient-gold shadow-gold'}`}
              disabled={loading || !recoveryReady}
            >
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </Button>
          </form>
        ) : (
          <>


        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="mb-2 block text-left text-sm font-medium text-foreground/90">
              {isAdminMode ? 'Usuario' : 'Email'}
            </label>
            <Input
              type="email"
              placeholder={isAdminMode ? 'Usuario admin' : 'Email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-2 block text-left text-sm font-medium text-foreground/90">
              Contraseña
            </label>
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            className={`w-full text-lg py-6 ${isAdminMode ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'gradient-gold shadow-gold'}`}
            disabled={loading}
          >
            {loading ? 'Cargando...' : isAdminMode ? 'Entrar al menú admin' : (isSignUp ? '📝 Crear cuenta' : '🔐 Entrar')}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              disabled={loading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>

        {!isAdminMode && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">o continúa con</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full text-lg py-6"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <div className="text-center mt-6">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-gold hover:underline text-sm"
                disabled={loading}
              >
                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </button>
            </div>
          </>
        )}

        {isAdminMode && (
          <div className="mt-6 rounded-xl border border-border/60 bg-background/30 px-4 py-3 text-center text-sm text-muted-foreground">
            Solo usuarios autorizados pueden entrar en este panel.
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};
