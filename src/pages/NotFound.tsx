import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { BookX } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex justify-center">
          <div className="bg-red-100 p-4 rounded-full">
            <BookX className="h-16 w-16 text-red-600" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800">
          404 - Página Não Encontrada
        </h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Ups! Parece que o livro que procurava não está nesta prateleira.
        </p>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-8 py-3 text-lg">
          <Link to="/">Voltar à Página Inicial</Link>
        </Button>
      </motion.div>
    </div>
  );
};