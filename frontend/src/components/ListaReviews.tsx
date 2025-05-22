// components/ListaReviews.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FaStar, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ReviewFromApi } from '@/types';

const DisplayEstrelas: React.FC<{ nota: number }> = ({ nota }) => {
  const notaArredondada = Math.round(nota);
  return (
    <div className="flex items-center" title={`Avaliação: ${nota} de 5`}>
      {[...Array(5)].map((_, i) => (
        <FaStar
          key={i} size={16}
          color={i < notaArredondada ? '#ffc107' : '#e4e5e9'}
          style={{ marginRight: '1px' }}
        />
      ))}
    </div>
  );
};

interface ListaReviewsProps {
  gibiId: number;
  onReviewAction?: () => void;
  onRequestEdit?: (review: ReviewFromApi) => void;
}

const ListaReviews: React.FC<ListaReviewsProps> = ({
  gibiId,
  onReviewAction,
  onRequestEdit,
}) => {
  const { isLoggedIn, user, token } = useAuth();
  const [reviews, setReviews] = useState<ReviewFromApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState(''); // Para exibir erros na UI, se necessário
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const carregarReviews = async () => {
      if (!gibiId || gibiId <= 0) {
        setIsLoading(false);
        setReviews([]);
        setErro("ID do Gibi inválido para carregar reviews.");
        return;
      }
      setIsLoading(true);
      setErro(''); // Limpa erros anteriores
      try {
        const baseUrl = process.env.NEXT_PUBLIC_URL_API; // Ex: "http://localhost:3001/api"
        const apiUrl = `${baseUrl}/review/gibi/${gibiId}`;
        console.log("ListaReviews: Buscando de:", apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); // Tenta pegar o corpo do erro
          // Usa a mensagem de erro do backend (errorData.erro) ou uma mensagem padrão
          throw new Error(errorData.erro || `Erro ao carregar reviews: ${response.status}`);
        }
        const data: ReviewFromApi[] = await response.json();
        setReviews(data);
      } catch (error: unknown) {
        console.error("Erro ao carregar reviews:", error);
        let errorMessage = "Erro desconhecido ao carregar reviews.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setErro(errorMessage); // Define o estado de erro para ser exibido na UI
        // toast.error(errorMessage); // Opcional: pode mostrar toast aqui também, mas o estado 'erro' já exibe
      } finally {
        setIsLoading(false);
      }
    };
    carregarReviews();
  }, [gibiId]);


  const handleDelete = async (reviewId: number) => {
    if (!isLoggedIn || !token) {
        toast.error("Você precisa estar logado para excluir um review.");
        return;
    }
    if (!window.confirm('Tem certeza que deseja excluir este review? Esta ação não pode ser desfeita.')) return;

    setDeletingId(reviewId);
    const baseUrl = process.env.NEXT_PUBLIC_URL_API;
    const apiUrl = `${baseUrl}/review/${reviewId}`;
    console.log("Deletando review em:", apiUrl);
    try {
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 204) {
        toast.success('Review excluído com sucesso!');
        if (onReviewAction) {
          onReviewAction();
        }
      } else {
        const errorData = await response.json().catch(() => ({})); // Tenta pegar o corpo do erro
        throw new Error(errorData?.erro || `Erro ao excluir review: ${response.status}`);
      }
    } catch (error: unknown) {
      console.error("Erro ao excluir review:", error);
      let errorMessage = "Erro desconhecido ao excluir review.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage); // Mostra o erro específico no toast
    }
    finally { setDeletingId(null); }
  };

  const handleEditClick = (review: ReviewFromApi) => {
    if (onRequestEdit) {
      onRequestEdit(review);
    }
  };


  if (isLoading) { return <p className="text-center text-gray-500 dark:text-gray-400 py-4">Carregando reviews...</p>; }
  if (erro) { return <p className="text-red-500 text-sm text-center py-4">Erro ao carregar reviews: {erro}</p>; } // Exibe o erro
  if (reviews.length === 0) { return <p className="text-center text-gray-600 dark:text-gray-300 py-4">Ainda não há reviews para este gibi.</p>; }

  return (
    <div className="mt-8 space-y-5">
      {reviews.map(review => {
        const autorNome = review.usuario?.nome || 'Usuário Anônimo';
        const isAuthor = isLoggedIn && user?.id === review.usuarioId;
        const isAdmin = isLoggedIn && user?.role === 'ADMIN';
        const canDelete = isAuthor || isAdmin;
        const canEdit = isAuthor;

        const isDeletingThis = deletingId === review.id;

        // Mantendo as classes de estilização que você forneceu no JSX
        return (
          <div key={review.id} className={`p-4 rounded-lg shadow border transition-opacity duration-300 ${isDeletingThis ? 'opacity-50 pointer-events-none' : ''} bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`}>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-x-2">
              <p className="font-semibold text-gray-900 dark:text-gray-100 mr-2">
                {autorNome}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs flex-shrink-0">
                {new Date(review.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="mb-2"> <DisplayEstrelas nota={review.avaliacao} /> </div>
            <p className="text-gray-800 dark:text-gray-300 text-sm whitespace-pre-wrap my-2"> {review.conteudo} </p>

            {(canDelete || canEdit) && (
              <div className="flex items-center space-x-4 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                {canEdit && (
                  <button
                    onClick={() => handleEditClick(review)}
                    disabled={isDeletingThis}
                    className="flex items-center text-xs font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                    title="Editar Review"
                  >
                    <FaEdit className="mr-1 h-3 w-3" /> Editar
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={isDeletingThis}
                    className="flex items-center text-xs font-medium text-red-500 hover:text-red-700 dark:text-orange-400 dark:hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                    title="Excluir Review"
                  >
                    {isDeletingThis ? (
                      <svg className="animate-spin h-4 w-4 mr-1 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <FaTrash className="mr-1 h-3 w-3" />
                    )}
                    {isDeletingThis ? 'Excluindo...' : 'Excluir'}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ListaReviews;