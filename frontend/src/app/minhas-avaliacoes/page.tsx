'use client'; 

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';   
import CardGibi from '@/components/CardGibi';  
import { GibiCardData } from '@/types';       
import { toast } from 'sonner';               

export default function MinhasAvaliacoesPage() {
  const [meusGibis, setMeusGibis] = useState<GibiCardData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn, token, isLoading: isLoadingAuth } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isLoggedIn) {
        toast.error('Acesso negado. Faça login para ver suas avaliações.');
        router.replace('/');
      }
    }
  }, [isLoggedIn, isLoadingAuth, router]);

  useEffect(() => {
    if (isLoggedIn && token && !isLoadingAuth) {
      const fetchMeusGibis = async () => {
        setIsLoadingData(true); 
        setError(null);

        const baseUrl = process.env.NEXT_PUBLIC_URL_API;
        const apiUrl = `${baseUrl}/usuario/me/avaliacoes`;

        console.log("MinhasAvaliacoesPage: Buscando de:", apiUrl);

        try {
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store', 
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.erro || `Erro ao buscar dados: ${response.status}`);
          }

          const data: GibiCardData[] = await response.json();
          setMeusGibis(data);

        } catch (err: unknown) {
           const error = err instanceof Error ? err.message : String(err);
           console.error("MinhasAvaliacoesPage: Erro ao buscar:", err);
           setError(error || "Não foi possível carregar seus dados.");
           toast.error(error || "Não foi possível carregar seus dados.");
        } finally {
           setIsLoadingData(false);
        }
      };

      fetchMeusGibis();
    } else if (!isLoadingAuth) {
      setIsLoadingData(false);
      setMeusGibis([]);
    }
  }, [isLoggedIn, token, isLoadingAuth]);

  const handleCardClick = (id: number) => {
    router.push(`/gibi/${id}`);
  };

  if (isLoadingAuth) {
    return <div className="container mx-auto p-8 text-center text-gray-200">Verificando autenticação...</div>;
  }

  if (!isLoggedIn) {
     return <div className="container mx-auto p-8 text-center text-gray-200">Acesso negado. Redirecionando...</div>;
  }

  if (isLoadingData) {
     return <div className="container mx-auto p-8 text-center text-gray-200">Carregando suas avaliações...</div>;
  }

  if (error) {
      return <div className="container mx-auto p-8 text-center text-red-500">Erro: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-600 dark:text-gray-200">
        Gibis Avaliados e Comentados
      </h1>

      {meusGibis.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-200">
          Você ainda não contribuiu com nenhum review.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {meusGibis.map((gibi) => (
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