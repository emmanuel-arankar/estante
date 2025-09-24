import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Lê os parâmetros da URL, com valores padrão.
  const query = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'relevance';

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newQuery = formData.get('q') as string;
    // Atualiza os parâmetros na URL, o que re-renderiza o componente.
    setSearchParams({ q: newQuery, sort: sortBy });
  };

  const handleSortChange = (newSort: string) => {
    setSearchParams({ q: query, sort: newSort });
  };
  
  // No mundo real, aqui você usaria um `useEffect` para buscar os resultados com base em `query` e `sortBy`.

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Buscar na Estante de Bolso</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Buscar por livros, autores, utilizadores..."
                className="pl-10 h-11"
              />
            </div>
            <Button type="submit" className="h-11">Buscar</Button>
          </form>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">Ordenar por:</span>
            <Button variant={sortBy === 'relevance' ? 'default' : 'outline'} size="sm" onClick={() => handleSortChange('relevance')}>Relevância</Button>
            <Button variant={sortBy === 'newest' ? 'default' : 'outline'} size="sm" onClick={() => handleSortChange('newest')}>Mais Recentes</Button>
            <Button variant={sortBy === 'rating' ? 'default' : 'outline'} size="sm" onClick={() => handleSortChange('rating')}>Avaliação</Button>
          </div>
          
          <div className="mt-8 bg-gray-50 p-6 rounded-lg min-h-[200px] flex items-center justify-center">
            {query ? (
              <p>Resultados da busca por: <strong>"{query}"</strong>, ordenado por <strong>"{sortBy}"</strong>.</p>
            ) : (
              <p className="text-gray-500">Comece a sua busca para ver os resultados.</p>
            )}
            {/* Aqui seriam renderizados os resultados da sua busca */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};