import { ReactNode } from 'react';
import { useNavigation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { Breadcrumbs } from './Breadcrumbs'; // 1. Importar o novo componente

const ProgressBar = () => (
  <div className="fixed top-20 left-0 right-0 h-0.5 z-[100] overflow-hidden bg-emerald-100">
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
      <Breadcrumbs /> {/* 2. Adicionar o componente aqui */}
      
      {/* O `pt-20` do `main` foi removido para que o conteúdo não salte.
          O espaçamento agora é gerido dentro de cada página. */}
      <main className="flex-1 w-full">
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