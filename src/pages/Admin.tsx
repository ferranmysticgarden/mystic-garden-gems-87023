import { useAuth } from '@/hooks/useAuth';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AuthPage } from '@/components/AuthPage';
import { Navigate } from 'react-router-dom';

import { ADMIN_EMAILS } from '@/config/admin';

// Lista de emails de administradores
const Admin = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  // Verificar si el usuario es administrador
  if (!ADMIN_EMAILS.includes(user.email || '')) {
    return <Navigate to="/" />;
  }

  return <AdminDashboard />;
};

export default Admin;