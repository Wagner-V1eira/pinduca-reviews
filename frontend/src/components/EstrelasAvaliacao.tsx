import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; 
import { toast } from 'sonner';

interface EstrelasAvaliacaoProps {
  gibiId: number;
  onRatingAdded?: () => void;
}

const EstrelasAvaliacao: React.FC<EstrelasAvaliacaoProps> = ({ gibiId, onRatingAdded }) => {
  const { isLoggedIn, user, token } = useAuth();
  const [avaliacao, setAvaliacao] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async (novaAvaliacao: number) => {
    if (!isLoggedIn || !user || !token) { 
      toast.error('Você precisa estar logado para avaliar.');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setAvaliacao(novaAvaliacao);

    console.log('Enviando avaliação:', { gibiId, usuarioId: user.id, avaliacao: novaAvaliacao });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL_API;
      const apiUrl = `${baseUrl}/nota`;
      console.log('Enviando avaliação para:', apiUrl);

      const response = await fetch(apiUrl, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          gibiId: gibiId,
          usuarioId: user.id,       
          avaliacao: novaAvaliacao, 
        }),
      });

      if (!response.ok) {

         if (response.status === 401 || response.status === 403) {
             toast.error("Sua sessão expirou ou é inválida. Faça login novamente.");
         }
         const errorData = await response.json().catch(() => null);
         const errorMessage = errorData?.error || `Erro ao enviar avaliação: ${response.status}`;
         throw new Error(errorMessage);
      }

      const data = await response.json();
      toast.success('Avaliação enviada com sucesso!', data);
      toast.success('Avaliação processada!');
      if (onRatingAdded) {
        onRatingAdded();
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao avaliar.';
      console.error('Erro ao enviar avaliação:', error);
      toast.error(errorMessage || 'Erro desconhecido ao avaliar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-0">
      <div className={`flex items-center ${isSubmitting || !isLoggedIn ? 'opacity-50 pointer-events-none' : ''}`}>
        {[...Array(5)].map((_, i) => {
          const nota = i + 1;
          return (
            <FaStar
              key={nota}
              size={28}
              color={nota <= ((hover ?? avaliacao) || 0) ? '#ffc107' : '#e4e5e9'}
              style={{
                cursor: !isLoggedIn || isSubmitting ? 'not-allowed' : 'pointer',
                marginRight: '4px',
              }}
              onClick={() => isLoggedIn && !isSubmitting && handleClick(nota)}
              onMouseEnter={() => isLoggedIn && !isSubmitting && setHover(nota)}
              onMouseLeave={() => isLoggedIn && !isSubmitting && setHover(null)}
            />
          );
        })}
      </div>
       {!isLoggedIn && <p className="text-xs text-gray-200 mt-1">Faça login para avaliar.</p>}
    </div>
  );
};

export default EstrelasAvaliacao;