import { useRouteError, Link, isRouteErrorResponse } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export const ErrorPage = () => {
  const error = useRouteError();
  let errorMessage: string;
  let errorStatus: number | string = 'Erro';

  if (isRouteErrorResponse(error)) {
    // Erros de rota (ex: 404, 401)
    errorMessage = error.data?.message || error.statusText;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    console.error(error);
    errorMessage = 'Ocorreu um erro inesperado.';
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-center p-4">
      <div className="bg-red-100 p-4 rounded-full mb-6">
        <AlertTriangle className="h-16 w-16 text-red-600" />
      </div>
      <h1 className="text-4xl md:text-6xl font-bold text-red-800">
        {errorStatus}
      </h1>
      <p className="text-xl text-red-700 mt-4 mb-8">
        Lamentamos, mas algo correu mal.
      </p>
      <pre className="bg-white p-4 rounded-md border border-red-200 text-left text-sm text-red-900 mb-8 overflow-auto max-w-full">
        {errorMessage}
      </pre>
      <Button asChild className="bg-red-600 hover:bg-red-700 rounded-full px-8 py-3 text-lg">
        <Link to="/">Voltar à Página Inicial</Link>
      </Button>
    </div>
  );
};