import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { z } from 'zod';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const emailSchema = z.string().trim().email({ message: "Email inválido" });
const passwordSchema = z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" });

export const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (error) throw error;
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="gradient-card shadow-card rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌸</div>
          <h1 className="text-3xl font-bold text-gold mb-2">Mystic Garden Pro</h1>
          <p className="text-muted-foreground">
            {isSignUp ? 'Crea tu cuenta' : 'Inicia sesión para continuar'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full"
            />
          </div>

          <div>
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
            className="w-full gradient-gold shadow-gold text-lg py-6"
            disabled={loading}
          >
            {loading ? 'Cargando...' : (isSignUp ? '📝 Crear cuenta' : '🔐 Entrar')}
          </Button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-gold hover:underline text-sm"
            disabled={loading}
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
};
