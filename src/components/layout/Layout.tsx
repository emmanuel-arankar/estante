import { ReactNode } from 'react';
import { useNavigation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';

// Barra de progresso
const ProgressBar = () => (
  <div className="fixed top-0 left-0 right-0 h-1 z-[100] overflow-hidden bg-emerald-100">
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
      {isLoading && <ProgressBar />}
      
      <Header />
      <main className="flex-1 w-full pt-20">
        {children}
      </main>
      {showFooter && <Footer />}
      <Toaster
        position="top-right"
        containerStyle={{ top: '88px' }}
        gutter={8}
      />
    </div>
  );
};