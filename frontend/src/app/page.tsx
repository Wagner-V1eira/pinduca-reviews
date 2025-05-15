'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import CardGibi from '@/components/CardGibi';
import { GibiCardData } from '@/types'; 

export default function HomePage() {
  const router = useRouter();
  const [gibis, setGibis] = useState<GibiCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); 
  const fetchGibis = useCallback(async (query: string) => { 
    setIsLoading(true);
    setError(null);

    const baseUrl = process.env.NEXT_PUBLIC_URL_API; 
    if (!baseUrl) {
        console.error("Variável NEXT_PUBLIC_URL_API não definida!");
        setError("Configuração de API ausente.");
        setIsLoading(false);
        return;
    }
    let apiUrl = `${baseUrl}/gibi`;

    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      apiUrl += `?q=${encodeURIComponent(trimmedQuery)}`;
    }

    console.log(`Frontend Client: Buscando gibis de ${apiUrl}`); 

    try {
      const res = await fetch(apiUrl, { cache: 'no-store' });

      if (!res.ok) {
          const errorData = await res.json().catch(()=>({erro: `Erro HTTP: ${res.status}`}));
          throw new Error(errorData.erro || `Erro: ${res.status}`);
      }
      const data: GibiCardData[] = await res.json();
      setGibis(data);

    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Erro desconhecido ao buscar gibis.";
        console.error("Frontend Client: Erro ao buscar gibis:", err);
        setError(errorMsg);
        toast.error(errorMsg);
        setGibis([]);
    } finally {
        setIsLoading(false);
    }
  }, []);
  useEffect(() => { fetchGibis(''); }, [fetchGibis]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchGibis(searchQuery); 
  };

  const handleCardClick = (id: number) => { router.push(`gibi/${id}`); };

  return (
    <div className="container mx-auto px-4 py-8 ">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">
        Catálogo de Gibis
      </h1>

      <form onSubmit={handleSearchSubmit} className="mb-8 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg shadow flex flex-col sm:flex-row gap-4 items-center">
          <input
              type="text"
              placeholder="Buscar por Título, Autor ou Ano..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-300 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
          />
          <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-700"
          >
              Pesquisar
          </button>
      </form>

      {isLoading ? (
        <p className="text-center text-gray-500 dark:text-gray-200 py-10">Carregando gibis...</p>
      ) : error ? (
        <p className="text-center text-red-500 py-10">Erro: {error}</p>
      ) : gibis.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-200 py-10">
          Nenhum gibi encontrado com os filtros aplicados.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {gibis.map((gibi) => (
            <CardGibi
               key={gibi.id}
               gibi={gibi} 
               onClick={() => handleCardClick(gibi.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}