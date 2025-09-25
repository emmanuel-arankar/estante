import { ReactNode } from 'react';
import { useNavigation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { Breadcrumbs } from './Breadcrumbs';

const ProgressBar = () => (
  // O z-index do Header é 50, o da barra de progresso deve ser maior
  <div className="fixed top-20 left-0 right-0 h-0.5 z-[51] overflow-hidden bg-emerald-100">
    <div className="h-full bg-emerald-500 w-full animate-pulse" />
  </div>
);

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export const Layout = ({ children, showFooter = true }: LayoutProps) => {
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <Header />
      {isLoading && <ProgressBar />}
      <Breadcrumbs />
      
      <div className="pt-20">
        <main className="flex-1 w-full">
          {children}
        </main>
        {showFooter && <Footer />}
      </div>
      
      <Toaster
        position="top-right"
        containerStyle={{ top: '88px' }}
        gutter={8}
      />
    </div>
  );
};