import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Layout } from '../components/layout/Layout';

export const RedirectIfAuth = () => {
  const { user, loading } = useAuth();

  // Verifica o estado de autenticação
  if (loading) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  // Se o utilizador estiver autenticado, redireciona para a página de perfil
  if (user) {
    return <Navigate to="/profile/me" replace />;
  }

  // Se não estiver autenticado, renderiza a página solicitada (Login, Register, etc.)
  return <Outlet />;
};