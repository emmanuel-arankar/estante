import { Suspense, lazy } from 'react';
import { createBrowserRouter, Outlet, useLocation, ScrollRestoration, Link, Params } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { motion, AnimatePresence } from 'framer-motion';

// Componentes de Rota
import { ProtectedRoute } from './ProtectedRoute';
import { RedirectIfAuth } from './RedirectIfAuth';

// Páginas de Erro e 404 (com nomes corrigidos)
import { Error } from '../pages/Error';
import { NotFound } from '../pages/NotFound';

// Importação das páginas e seus loaders/actions
import { Profile, profileLoader } from '../pages/Profile';
import { EditProfile, editProfileAction } from '../pages/EditProfile';

// Lazy loading para as páginas
const Home = lazy(() => import('../pages/Home').then(module => ({ default: module.Home })));
const Login = lazy(() => import('../pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('../pages/Register').then(module => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const Messages = lazy(() => import('../pages/Messages').then(module => ({ default: module.Messages })));
const Chat = lazy(() => import('../pages/Chat').then(module => ({ default: module.Chat })));
const Friends = lazy(() => import('../pages/Friends').then(module => ({ default: module.Friends })));
const Notifications = lazy(() => import('../pages/Notifications').then(module => ({ default: module.Notifications })));
const SearchPage = lazy(() => import('../pages/Search').then(module => ({ default: module.Search }))); // O nome do componente exportado é SearchPage

const SuspenseFallback = () => (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
    </div>
);

const AppLayout = ({ showFooter = true }) => {
  const location = useLocation();
  return (
    <Layout showFooter={showFooter}>
      <ScrollRestoration />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          <Suspense fallback={<SuspenseFallback />}>
            <Outlet />
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
};

export const router = createBrowserRouter([
  {
    errorElement: <Error />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        handle: { crumb: () => <Link to="/">Início</Link> },
        children: [
          { index: true, element: <Home /> },
          {
            path: 'profile/:nickname',
            element: <Profile />,
            loader: profileLoader,
            handle: { crumb: (_data: any, params: Params) => <span>{`@${params.nickname}`}</span> },
          },
          {
            path: 'search',
            element: <SearchPage />,
            handle: { crumb: () => <Link to="/search">Busca</Link> },
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
              { 
                path: 'profile/edit', 
                element: <EditProfile />,
                action: editProfileAction,
                handle: { crumb: () => <span>Editar Perfil</span> }
              },
              {
                path: 'messages',
                element: <Messages />,
                handle: { crumb: () => <Link to="/messages">Mensagens</Link> }
              },
              { path: 'chat/:receiverId', element: <Chat /> },
              {
                path: 'friends',
                element: <Friends />,
                handle: { crumb: () => <Link to="/friends">Amigos</Link> }
              },
              {
                path: 'notifications',
                element: <Notifications />,
                handle: { crumb: () => <Link to="/notifications">Notificações</Link> }
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <Layout><NotFound /></Layout>,
      },
    ],
  },
]);