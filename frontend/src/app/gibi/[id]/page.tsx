// app/gibi/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import ListaReviews from '@/components/ListaReviews';
import FormTextoReview from '@/components/FormTextoReview'; // Certifique-se que este é o nome correto do seu arquivo/componente
import EstrelasAvaliacao from '@/components/EstrelasAvaliacao';
import { GibiFromApi, ReviewFromApi } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { FaTrash, FaPencilAlt } from 'react-icons/fa';
import Link from 'next/link';

const GibiDetailsPage: React.FC = () => {
  const params = useParams();
  const idGibiParam = params?.id as string | undefined;
  const router = useRouter();
  const { isLoggedIn, user, token, isLoading: isLoadingAuth } = useAuth();

  const [gibi, setGibi] = useState<GibiFromApi | null>(null);
  const [isLoadingGibi, setIsLoadingGibi] = useState(true);
  const [erroGibi, setErroGibi] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeletingGibi, setIsDeletingGibi] = useState(false);

  const [selectedStars, setSelectedStars] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState<string>('');
  const [existingReview, setExistingReview] = useState<ReviewFromApi | null>(null);
  const [isLoadingUserReview, setIsLoadingUserReview] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!idGibiParam || typeof idGibiParam !== 'string') {
      setErroGibi("ID do gibi inválido ou não encontrado na URL.");
      setIsLoadingGibi(false);
      return;
    }
    const carregarGibi = async () => {
      setIsLoadingGibi(true);
      setErroGibi(null);
      const baseUrl = process.env.NEXT_PUBLIC_URL_API; // Ex: "http://localhost:3001/api"
      const apiUrl = `${baseUrl}/gibi/${idGibiParam}`; // CORRETO: baseUrl já tem /api
      console.log('Buscando detalhes do gibi em:', apiUrl);
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData?.erro || `Erro HTTP: ${response.status} ao buscar gibi.`;
          throw new Error(errorMessage);
        }
        const data: GibiFromApi = await response.json();
        setGibi(data);
      } catch (error: unknown) {
        console.error('Erro ao buscar detalhes do gibi:', error);
        const message = error instanceof Error ? error.message : 'Erro desconhecido ao carregar gibi.';
        setErroGibi(message);
        toast.error(message);
      } finally {
        setIsLoadingGibi(false);
      }
    };
    carregarGibi();
  }, [idGibiParam]);

  const fetchUserReview = useCallback(async (clearFormIfNotFound = false) => {
    if (!isLoggedIn || !token || !gibi?.id) {
      setExistingReview(null);
      setSelectedStars(null);
      setReviewText('');
      return;
    }
    setIsLoadingUserReview(true);
    const baseUrl = process.env.NEXT_PUBLIC_URL_API;
    const apiUrl = `${baseUrl}/review/gibi/${gibi.id}/meu`; // CORRETO: baseUrl já tem /api
    console.log('Buscando review do usuário em:', apiUrl);
    try {
      const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data: ReviewFromApi = await response.json();
        setExistingReview(data);
        setSelectedStars(data.avaliacao);
        setReviewText(data.conteudo);
      } else if (response.status === 404) {
        setExistingReview(null);
        if (clearFormIfNotFound) {
          setSelectedStars(null);
          setReviewText('');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.message || `Não foi possível carregar seu review anterior: ${response.status}`;
        toast.error(message);
        setExistingReview(null);
        if (clearFormIfNotFound) { setSelectedStars(null); setReviewText('');}
      }
    } catch (error) {
      console.error("Erro de conexão ao buscar review do usuário:", error);
      toast.error("Erro de conexão ao buscar seu review.");
      setExistingReview(null);
      if (clearFormIfNotFound) { setSelectedStars(null); setReviewText('');}
    } finally {
      setIsLoadingUserReview(false);
    }
  }, [isLoggedIn, token, gibi?.id]); // gibi.id é a dependência correta aqui

  useEffect(() => {
    if (gibi?.id && isLoggedIn) {
      fetchUserReview(true);
    } else if (!isLoggedIn) {
      setExistingReview(null); setSelectedStars(null); setReviewText('');
    }
  }, [gibi?.id, isLoggedIn, fetchUserReview]); // fetchUserReview aqui como dependência está correto

  const handleEditReviewRequest = (reviewToEdit: ReviewFromApi) => {
    console.log("Solicitação para editar review:", reviewToEdit);
    setExistingReview(reviewToEdit);
    setSelectedStars(reviewToEdit.avaliacao);
    setReviewText(reviewToEdit.conteudo);
    const reviewFormSection = document.getElementById('review-form-section');
    if (reviewFormSection) {
      reviewFormSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleAcaoConcluida = useCallback(() => {
    console.log('Ação de review (ex: delete) na ListaReviews concluída. Atualizando dados...');
    setRefreshKey(prevKey => prevKey + 1);
    if (gibi?.id && isLoggedIn) {
      // Após uma ação na lista (como deletar), é crucial verificar se o review do usuário
      // ainda existe e limpar o formulário se necessário.
      fetchUserReview(true); // Passar true para limpar se o review do usuário foi deletado
    }
  }, [gibi?.id, isLoggedIn, fetchUserReview]); // Dependências corretas

  const handleReviewSubmit = async () => {
    if (!isLoggedIn || !token || !user) { toast.error("Você precisa estar logado para enviar um review."); return; }
    if (selectedStars === null || selectedStars < 1 || selectedStars > 5) { toast.warning("Por favor, selecione uma avaliação em estrelas (1 a 5)."); return; }
    if (!reviewText.trim()) { toast.warning("Por favor, escreva o conteúdo do seu review."); return; }
    if (!gibi?.id) { toast.error("ID do Gibi não encontrado para enviar o review."); return; }

    setIsSubmittingReview(true);
    const baseUrl = process.env.NEXT_PUBLIC_URL_API;
    let apiUrl = `${baseUrl}/review`; // CORRETO
    let method = 'POST';
    const reviewPayload = { gibiId: gibi.id, avaliacao: selectedStars, conteudo: reviewText };

    if (existingReview && existingReview.id) {
      apiUrl = `${baseUrl}/review/${existingReview.id}`; // CORRETO
      method = 'PUT';
    }
    console.log(`Enviando review para: ${apiUrl} com método ${method}`, reviewPayload);
    try {
      const response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(reviewPayload),
      });
      const responseData: ReviewFromApi | { erro?: string, message?: string } = await response.json().catch(() => null); // responseData pode ser Review ou erro

      if (!response.ok) {
        const apiError = responseData as { erro?: string, message?: string }; // Type assertion
        throw new Error(apiError?.erro || apiError?.message || `Erro ao ${method === 'POST' ? 'enviar' : 'atualizar'} review: ${response.status}`);
      }

      const submittedReview = responseData as ReviewFromApi; // Agora sabemos que é ReviewFromApi
      toast.success(`Review ${method === 'POST' ? 'enviado' : 'atualizado'} com sucesso!`);
      
      setRefreshKey(prevKey => prevKey + 1); // Atualiza a ListaReviews PRIMEIRO

      if (method === 'POST') {
        setExistingReview(submittedReview); // O review recém-criado é agora o "existente"
        setSelectedStars(null); // Limpa o formulário
        setReviewText('');      // Limpa o formulário
      } else { // PUT (atualização)
        setExistingReview(submittedReview);
        setSelectedStars(submittedReview.avaliacao);
        setReviewText(submittedReview.conteudo);
      }
    } catch (error: unknown) {
      let errorMessage = `Ocorreu um erro desconhecido ao ${method === 'POST' ? 'enviar' : 'atualizar'} o review.`;
      if (error instanceof Error) { errorMessage = error.message; }
      console.error(`Erro ao ${method === 'POST' ? 'enviar' : 'atualizar'} review:`, error);
      toast.error(errorMessage);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteGibi = async () => {
    if (!isLoggedIn || !token || !gibi) { toast.error("Ação não permitida ou gibi não carregado."); return; }
    if (!window.confirm(`Tem certeza que deseja excluir o gibi "${gibi.titulo}"? Esta ação não pode ser desfeita.`)) return;
    setIsDeletingGibi(true);
    const baseUrl = process.env.NEXT_PUBLIC_URL_API;
    const apiUrl = `${baseUrl}/gibi/${gibi.id}`; // CORRETO
    try {
      const response = await fetch(apiUrl, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
      if (response.status === 204) {
        toast.success('Gibi excluído com sucesso!');
        router.push('/');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.erro || `Erro ao excluir gibi: ${response.status}`);
      }
    } catch (error: unknown) {
      console.error("Erro ao excluir gibi:", error);
      let errorMessage = 'Erro desconhecido ao excluir gibi.';
      if (error instanceof Error) { errorMessage = error.message; }
      toast.error(errorMessage);
    } finally {
      setIsDeletingGibi(false);
    }
  };

  const handleStarChange = (rating: number) => setSelectedStars(rating);
  const handleTextChange = (text: string) => setReviewText(text);

  if (isLoadingAuth || isLoadingGibi) { return <div className="container mx-auto p-8 text-center text-gray-500 dark:text-gray-400">Carregando...</div>;}
  if (erroGibi) { return <div className="container mx-auto p-8 text-center text-red-600">Erro ao carregar: {erroGibi} <button onClick={() => idGibiParam && window.location.reload()} className="ml-2 px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500">Tentar Novamente</button></div>; }
  if (!gibi) { return <div className="container mx-auto p-8 text-center">Gibi não encontrado.</div>; }

  const isOwnerOfGibi = isLoggedIn && user?.id === gibi?.usuarioId;
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
              fill // fill é preferível a layout="fill" nas versões mais recentes do Next/Image
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw" // Exemplo de sizes prop
              style={{ objectFit: 'cover' }} // objectFit via style prop
              priority
              onError={(e) => { (e.target as HTMLImageElement).src = placeholderImg; }}
            />
          </div>
        </div>

        <div className="w-full md:w-2/3 lg:w-3/4">
          <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-200">{gibi.titulo}</h1>
            {(isOwnerOfGibi || isAdmin) && (
              <div className="flex items-center space-x-3 flex-shrink-0">
                <Link href={`/gibi/${gibi.id}/editar`} className="flex items-center p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300" title="Alterar este Gibi" aria-disabled={isDeletingGibi} onClick={(e: React.MouseEvent) => { if (isDeletingGibi) e.preventDefault(); }}>
                  <FaPencilAlt className="h-4 w-4" />
                </Link>
                <button onClick={handleDeleteGibi} disabled={isDeletingGibi} className="flex items-center p-2 text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 disabled:opacity-50" title="Excluir este Gibi">
                  {isDeletingGibi ? (
                    <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                   ) : (<FaTrash className="h-5 w-5" />)}
                </button>
              </div>
            )}
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-200 mb-4">Ano: {gibi.ano}</p>
          {gibi.autor && <p className="text-md text-gray-700 dark:text-gray-200 mb-4">Autor: {gibi.autor}</p>}
          <p className="text-base text-gray-800 dark:text-gray-200 mb-6 leading-relaxed">
            {gibi.sinopse || 'Sinopse não disponível.'}
          </p>

          <div id="review-form-section" className='my-6 p-4 border rounded-lg shadow-md bg-white dark:bg-gray-800'>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              {isLoadingUserReview ? "Carregando seu review..." : (existingReview?.id ? "Edite seu Review" : "Deixe seu Review")}
            </h2>
            {isLoggedIn ? (
              !isLoadingUserReview && (
                <>
                  <div className="mb-3">
                    <EstrelasAvaliacao
                      currentRating={selectedStars}
                      onStarChange={handleStarChange}
                      disabled={isSubmittingReview || isLoadingUserReview}
                    />
                  </div>
                  <div className="mb-4">
                    <FormTextoReview
                      currentText={reviewText}
                      onTextChange={handleTextChange}
                      disabled={isSubmittingReview || isLoadingUserReview}
                      placeholder="Escreva seu review aqui..."
                    />
                  </div>
                  <button
                    onClick={handleReviewSubmit}
                    disabled={isSubmittingReview || isLoadingUserReview}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed transition ease-in-out duration-150"
                  >
                    {isSubmittingReview ? (
                        <svg className="animate-spin inline-block mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : null}
                    {isSubmittingReview ? 'Enviando...' : (existingReview?.id ? 'Atualizar Review' : 'Enviar Review')}
                  </button>
                </>
              )
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Faça <Link href="/login" className="text-orange-500 hover:text-orange-600 hover:underline font-semibold">login</Link> para deixar seu review.
              </p>
            )}
            {isLoggedIn && isLoadingUserReview && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando seu review...</p>}
          </div>
        </div>
      </div>

      <hr className="my-8 border-gray-300 dark:border-gray-700"/>

      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Reviews dos Usuários</h2>
        {gibi?.id ? (
          <ListaReviews
            gibiId={gibi.id}
            key={refreshKey}
            onReviewAction={handleAcaoConcluida}
            onRequestEdit={handleEditReviewRequest}
          />
        ) : (
          !isLoadingGibi && <p className="text-center text-gray-500 dark:text-gray-400">Não foi possível carregar os reviews devido à falha ao carregar o gibi.</p>
        )}
      </div>
    </div>
  );
}
export default GibiDetailsPage;