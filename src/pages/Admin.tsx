import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AuthPage } from '@/components/AuthPage';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [validating, setValidating] = useState(false);
  const isSecretAccess = searchParams.get('secret') === '1';

  useEffect(() => {
    const validateAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      setValidating(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAdmin(false);
          return;
        }

        // Server-side admin validation via Edge Function
        const response = await supabase.functions.invoke('admin-validate', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.error) {
          console.error('Admin validation error:', response.error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(response.data?.isAdmin === true);
      } catch (error) {
        console.error('Admin validation failed:', error);
        setIsAdmin(false);
      } finally {
        setValidating(false);
      }
    };

    if (!loading) {
      validateAdmin();
    }
  }, [user, loading]);

  if (loading || validating || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={() => {}} onBack={() => navigate('/')} backLabel="Volver al menú principal" mode="admin" />;
  }

  if (!isAdmin && isSecretAccess) {
    return <AuthPage onAuthSuccess={() => setIsAdmin(null)} onBack={() => navigate('/')} backLabel="Volver al menú principal" mode="admin" />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Sin acceso al panel admin</h1>
            <p className="text-muted-foreground">
              Tu cuenta actual no tiene permisos de administrador. Inicia sesión con tu cuenta admin o vuelve al juego.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/')}>Volver al menú principal</Button>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                setIsAdmin(null);
              }}
            >
              Cambiar de cuenta
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <AdminDashboard onBack={() => navigate('/')} />;
};

export default Admin;
