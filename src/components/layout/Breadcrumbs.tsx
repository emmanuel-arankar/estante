import { useMatches, Link, Params } from 'react-router-dom';
import React from 'react';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

// 1. Definimos uma interface para o nosso handle esperado
interface RouteHandle {
  crumb: (data: any, params: Params) => React.ReactNode;
}

// 2. Definimos o tipo de um "match" que passou na nossa verificação
type CrumbMatch = {
  id: string;
  pathname: string;
  params: Params;
  data: unknown;
  handle: RouteHandle;
};

export const Breadcrumbs = () => {
  const matches = useMatches() as CrumbMatch[];
  
  const crumbs = matches
    // Filtramos as rotas que têm um handle com a propriedade `crumb`
    .filter((match) => Boolean(match.handle?.crumb))
    .map((match) => {
      // Agora, TypeScript sabe que `match.handle.crumb` existe e é uma função
      const crumb = match.handle.crumb(match.data, match.params);
      return {
        crumb,
        pathname: match.pathname,
      };
    });

  if (crumbs.length <= 1) {
    return null;
  }

  return (
    <div className="bg-white/50 backdrop-blur-sm border-b sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2">
            <Breadcrumb>
                <BreadcrumbList>
                {crumbs.map(({ crumb, pathname }, index) => (
                    <BreadcrumbItem key={pathname}>
                    {index < crumbs.length - 1 ? (
                        <>
                        <BreadcrumbLink asChild>
                            <Link to={pathname} className="text-gray-600 hover:text-emerald-700 transition-colors">
                                {crumb}
                            </Link>
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                        </>
                    ) : (
                        <BreadcrumbPage className="text-gray-800 font-medium">
                            {crumb}
                        </BreadcrumbPage>
                    )}
                    </BreadcrumbItem>
                ))}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    </div>
  );
};