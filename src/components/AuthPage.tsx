import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión con Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="gradient-card shadow-card rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌸</div>
          <h1 className="text-3xl font-bold text-gold mb-2">Mystic Garden Pro</h1>
          <p className="text-muted-foreground">
            Inicia sesión para continuar
          </p>
        </div>

        <Button
          onClick={handleGoogleLogin}
          className="w-full gradient-gold shadow-gold text-lg py-6"
          disabled={loading}
          id="google-login-btn"
        >
          {loading ? 'Cargando...' : '🔐 Entrar con Google'}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Usa la misma cuenta de Google de tu dispositivo Android
        </p>
      </div>
    </div>
  );
};
