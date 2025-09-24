import { Suspense, lazy } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/ui/loading-spinner';

// Componentes de Rota
import { ProtectedRoute } from './ProtectedRoute';
import { RedirectIfAuth } from './RedirectIfAuth';

// Páginas de Erro e 404
import { ErrorPage } from '../pages/ErrorPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Importação da página de perfil e do seu loader
import { Profile, profileLoader } from '../pages/Profile';

// Importação dinâmica (Lazy Loading) para todas as páginas
const Home = lazy(() => import('../pages/Home').then(module => ({ default: module.Home })));
const Login = lazy(() => import('../pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('../pages/Register').then(module => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const EditProfile = lazy(() => import('../pages/EditProfile').then(module => ({ default: module.EditProfile })));
const Messages = lazy(() => import('../pages/Messages').then(module => ({ default: module.Messages })));
const Chat = lazy(() => import('../pages/Chat').then(module => ({ default: module.Chat })));
const Friends = lazy(() => import('../pages/Friends').then(module => ({ default: module.Friends })));
const Notifications = lazy(() => import('../pages/Notifications').then(module => ({ default: module.Notifications })));

const SuspenseFallback = () => (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
    </div>
);

const AppLayout = ({ showFooter = true }) => (
  <Layout showFooter={showFooter}>
    <Suspense fallback={<SuspenseFallback />}>
      <Outlet />
    </Suspense>
  </Layout>
);

export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <Home /> },
          {
            path: 'profile/:nickname',
            element: <Profile />,
            loader: profileLoader,
          },
        ],
      },
      {
        element: <RedirectIfAuth />,
        children: [
          {
            element: <AppLayout showFooter={false} />,
            children: [
              { path: 'login', element: <Login /> },
              { path: 'register', element: <Register /> },
              { path: 'forgot-password', element: <ForgotPassword /> },
            ]
          }
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: 'profile/edit', element: <EditProfile /> },
              { path: 'messages', element: <Messages /> },
              { path: 'chat/:receiverId', element: <Chat /> },
              { path: 'friends', element: <Friends /> },
              { path: 'notifications', element: <Notifications /> },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <Layout><NotFoundPage /></Layout>,
      },
    ],
  },
]);