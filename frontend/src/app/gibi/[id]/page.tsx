"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import Image from 'next/image';
import ListaComentarios from '@/components/ListaComentarios';   
import FormComentario from '@/components/FormComentario';     
import EstrelasAvaliacao from '@/components/EstrelasAvaliacao'; 
import { GibiFromApi } from '@/types'; 
import { useAuth } from '@/context/AuthContext'; 
import { toast } from 'sonner';
import { FaTrash, FaPencilAlt } from 'react-icons/fa'; 
import Link from 'next/link';

const GibiDetailsPage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter(); 
  const { isLoggedIn, user, token } = useAuth();
  const [gibi, setGibi] = useState<GibiFromApi | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [erro, setErro] = useState<string | null>(null); 
  const [refreshKey, setRefreshKey] = useState(0); 
  const [isDeleting, setIsDeleting] = useState(false);

  
  useEffect(() => {
    
    if (!id || typeof id !== 'string') {
      setErro("ID do gibi inválido ou não encontrado na URL.");
      setIsLoading(false);
      return;
    }

    const carregarGibi = async () => {
      setIsLoading(true);
      setErro(null); 
      const baseUrl = process.env.NEXT_PUBLIC_URL_API;
      const apiUrl = `${baseUrl}/gibi/${id}`;
      console.log('Buscando detalhes do gibi em:', apiUrl);

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorData = await response.json().catch(() => null); 
          const errorMessage = errorData?.error || `Erro HTTP: ${response.status}`;
          throw new Error(errorMessage);
        }
        const data: GibiFromApi = await response.json();
        setGibi(data); 
      } catch (error: unknown) {
        console.error('Erro ao buscar detalhes do gibi:', error);
        if (error instanceof Error) {
          setErro(error.message || 'Erro desconhecido ao carregar gibi.'); 
        } else {
          setErro('Erro desconhecido ao carregar gibi.');
        }
      } finally {
        setIsLoading(false); 
      }
    };

    carregarGibi();
  }, [id]); 

  const handleAcaoConcluida = () => {
    console.log('Ação (comentário/nota) concluída. Atualizando lista...');
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleDeleteGibi = async () => {
    if (!isLoggedIn || !token || !gibi) {
        toast.error("Ação não permitida ou gibi não carregado.");
        return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o gibi "${gibi.titulo}"? Esta ação não pode ser desfeita.`)) {
        return;
    }

    setIsDeleting(true); 
    const baseUrl = process.env.NEXT_PUBLIC_URL_API;
    const apiUrl = `${baseUrl}/gibi/${gibi.id}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`, 
            },
        });

        if (response.status === 204) { 
            toast.success('Gibi excluído com sucesso!');
            router.push('/'); 
        } else {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.erro || `Erro ao excluir gibi: ${response.status}`);
        }
    } catch (error: unknown) { 
      console.error("Erro ao excluir gibi:", error);
      let errorMessage = 'Erro desconhecido ao excluir gibi.'; 
      if (error instanceof Error) {
          errorMessage = error.message; 
      }
      toast.error(errorMessage); 
  } finally {
       setIsDeleting(false);
  }
};

  if (isLoading) {
    return <div className="container mx-auto p-8 text-center">Carregando...</div>;
  }

  if (erro) {
    return <div className="container mx-auto p-8 text-center text-red-600">Erro ao carregar: {erro}</div>;
  }

  if (!gibi) {
    return <div className="container mx-auto p-8 text-center">Gibi não encontrado.</div>;
  }

  const isOwner = isLoggedIn && user?.id === gibi?.usuarioId;

  const isAdmin = isLoggedIn && user?.role === 'ADMIN';

  const placeholderImg = '/images/placeholder-gibi.png'; 

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:space-x-8 mb-10">
        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 mb-6 md:mb-0">
          <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden shadow-lg bg-gray-200">
            <Image
              src={gibi.capaUrl || placeholderImg}
              alt={`Capa de ${gibi.titulo}`}
              layout="fill"
              objectFit="cover"
              priority
              onError={(e) => { (e.target as HTMLImageElement).src = placeholderImg; }}
            />
          </div>
        </div>

        <div className="w-full md:w-2/3 lg:w-3/4">
          <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-200">{gibi.titulo}</h1>
            {(isOwner || isAdmin) && (
              <div className="flex items-center space-x-3 flex-shrink-0">
                <Link href={`/gibi/${gibi.id}/editar`} className="flex items-center p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300" title="Alterar este Gibi" aria-disabled={isDeleting} onClick={(e: React.MouseEvent) => { if (isDeleting) e.preventDefault(); }}>
                  <FaPencilAlt className="h-4 w-4" />
                </Link>
                <button onClick={handleDeleteGibi} disabled={isDeleting} className="flex items-center p-2 text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 disabled:opacity-50" title="Excluir este Gibi">
                  {isDeleting ? (<svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : (<FaTrash className="h-5 w-5" />)}
                </button>
              </div>
            )}
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-200 mb-4">Ano: {gibi.ano}</p>
          {gibi.autor && <p className="text-md text-gray-700 dark:text-gray-200 mb-4">Autor: {gibi.autor}</p>} 
          <p className="text-base text-gray-800 dark:text-gray-200 mb-6 leading-relaxed">
            {gibi.sinopse || 'Sinopse não disponível.'}
          </p>

          <div className='mb-6 border-t pt-4 border-gray-400 dark:border-gray-200'>
             <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Avalie com Estrelas</h2>
             <EstrelasAvaliacao gibiId={gibi.id} onRatingAdded={handleAcaoConcluida} />
          </div>
          <div className='mb-10 border-t pt-4 border-gray-200 dark:border-gray-700'>
             <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Deixe seu Comentário</h2>
             <FormComentario gibiId={gibi.id} onCommentAdded={handleAcaoConcluida} />
          </div>
        </div>
      </div>
      <hr className="my-8 border-gray-300 dark:border-gray-700"/>
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Comentários e Avaliações</h2>
        <ListaComentarios
            gibiId={gibi.id}
            key={refreshKey}
            onCommentDeleted={handleAcaoConcluida}
            onCommentEdited={handleAcaoConcluida}
         />
      </div>
    </div>
  );
}
export default GibiDetailsPage;