import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { toast } from 'sonner';

interface FormComentarioProps {
  gibiId: number;
  onCommentAdded?: () => void;
}

const FormComentario: React.FC<FormComentarioProps> = ({ gibiId, onCommentAdded }) => {
  const { isLoggedIn, user, token } = useAuth();
  const [conteudo, setConteudo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !user || !token) {
       toast.error('Você precisa estar logado para comentar.');
       return;
    }
    if (!conteudo.trim()) {
       toast.warning('O comentário não pode estar vazio.');
       return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    console.log('Enviando comentário:', { conteudo, gibiId, usuarioId: user.id });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL_API;
      const apiUrl = `${baseUrl}/comentario`;
      console.log('Enviando comentário para:', apiUrl);
      const response = await fetch(apiUrl, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          conteudo,
          gibiId,
          usuarioId: user.id, 
        }),
      });

      if (!response.ok) {
         if (response.status === 401 || response.status === 403) {
             toast.error("Sua sessão expirou ou é inválida. Faça login novamente.");
         }
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `Erro ao enviar comentário: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Comentário enviado com sucesso!', data);
      toast.success('Comentário enviado com sucesso!');
      setConteudo(''); 

      if (onCommentAdded) {
        onCommentAdded(); 
      }

    } catch (error: unknown) {
      console.error('Erro ao enviar comentário:', error);
      let errorMessage = 'Erro desconhecido ao comentar.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return <p className="text-sm text-gray-600 dark:text-gray-200 mt-4">Você precisa estar logado para comentar.</p>;
  }

  return (
    <div className="mt-0">
      <form onSubmit={handleSubmit}>
        <textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Escreva seu comentário..."
          rows={4}
          className="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-orange-400 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          required
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className="mt-2 bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Comentário'}
        </button>
      </form>
    </div>
  );
};

export default FormComentario;