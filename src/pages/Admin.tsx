import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AuthPage } from '@/components/AuthPage';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Admin = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [validating, setValidating] = useState(false);

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
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  // Server-validated admin check
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return <AdminDashboard />;
};

export default Admin;
