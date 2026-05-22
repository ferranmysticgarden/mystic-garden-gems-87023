import { AuthPage } from '@/components/AuthPage';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const navigate = useNavigate();

  return (
    <AuthPage
      onAuthSuccess={() => navigate('/admin?secret=1')}
      onBack={() => navigate('/admin?secret=1')}
      backLabel="Volver al menú admin"
      mode="admin"
      forceRecovery
    />
  );
};

export default ResetPassword;