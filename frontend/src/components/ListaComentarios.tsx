'use client';

import React, { useState, useEffect } from 'react';
import { FaStar, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ComentarioComNota } from '@/types'; 


const DisplayEstrelas: React.FC<{ nota: number | null | undefined }> = ({ nota }) => {
  if (nota === null || nota === undefined || typeof nota !== 'number' || nota < 1 || nota > 5) {
    return <span className="text-xs text-gray-200 italic">(Sem avaliação registrada)</span>;
  }
  const notaArredondada = Math.round(nota); 
  return (
    <div className="flex items-center" title={`Avaliação: ${nota} de 5`}>
      {[...Array(5)].map((_, i) => (
        <FaStar
          key={i}
          size={16}
          color={i < notaArredondada ? '#ffc107' : '#e4e5e9'}
          style={{ marginRight: '1px' }}
        />
      ))}
    </div>
  );
};

interface ListaComentariosProps {
  gibiId: number;
  onCommentDeleted?: () => void;
  onCommentEdited?: () => void;
}

const ListaComentarios: React.FC<ListaComentariosProps> = ({
  gibiId,
  onCommentDeleted,
  onCommentEdited,
}) => {
  const { isLoggedIn, user, token } = useAuth(); 
  const [comentarios, setComentarios] = useState<ComentarioComNota[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const carregarComentarios = async () => {
      setIsLoading(true);
      setErro('');
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_URL_API}/comentario/${gibiId}`;
        console.log("ListaComentarios: Buscando de:", apiUrl);
        const response = await fetch(apiUrl); 
        if (!response.ok) { throw new Error(`Erro ao carregar: ${response.status}`); }
        const data: ComentarioComNota[] = await response.json();
        console.log("ListaComentarios: Dados recebidos:", data);
        setComentarios(data);
      } catch (error: unknown) {
        console.error('ListaComentarios: Erro ao buscar:', error);
        if (error instanceof Error) { setErro(error.message); }
        else { setErro('Erro ao carregar comentários.'); }
      } finally {
        setIsLoading(false);
      }
    };

    if (gibiId && gibiId > 0) {
      carregarComentarios();
    } else {
      setIsLoading(false);
      setComentarios([]);
    }

  }, [gibiId]);

  const handleStartEdit = (comentario: ComentarioComNota) => {
    setEditingId(comentario.id);
    setEditText(comentario.conteudo);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !isLoggedIn || !token) return;
    if (!editText.trim()) { toast.warning("O comentário não pode ficar vazio."); return; }

    setSavingId(editingId); 
    const baseUrl = process.env.NEXT_PUBLIC_URL_API;
    const apiUrl = `${baseUrl}/comentario/${editingId}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
        
        body: JSON.stringify({ conteudo: editText }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.erro || `Erro ao salvar: ${response.status}`);
      }
      toast.success('Comentário atualizado!');
      handleCancelEdit(); 
      if (onCommentEdited) onCommentEdited(); 
    } catch (error: unknown) {
      console.error("Erro ao salvar edição:", error);
      if (error instanceof Error) { toast.error(error.message || 'Erro ao salvar edição.'); }
      else { toast.error('Erro ao salvar edição.'); }
    } finally {
      setSavingId(null); 
    }
  };

  const handleDelete = async (comentarioId: number) => {
    if (!isLoggedIn || !token) { toast.error("Você precisa estar logado."); return; }
    if (!window.confirm('Tem certeza que deseja excluir este comentário?')) return;

    setDeletingId(comentarioId); 
    const baseUrl = process.env.NEXT_PUBLIC_URL_API;
    const apiUrl = `${baseUrl}/comentario/${comentarioId}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }, 
      });
      if (response.status === 204) { 
        toast.success('Comentário excluído!');
        if (onCommentDeleted) onCommentDeleted(); 
      } else { 
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.erro || `Erro ao excluir: ${response.status}`);
      }
    } catch (error: unknown) {
      console.error("Erro ao excluir comentário:", error);
      if (error instanceof Error) { toast.error(error.message || 'Erro ao excluir.'); }
      else { toast.error('Erro ao excluir.'); }
    } finally {
      setDeletingId(null); 
    }
  };

  if (isLoading) { return <p className="text-center text-gray-200 py-4">Carregando comentários...</p>; }
  if (erro) { return <p className="text-red-500 text-sm text-center py-4">{erro}</p>; }
  if (comentarios.length === 0) { return <p className="text-center text-gray-200 py-4">Ainda não há comentários para este gibi.</p>; }

  return (
    <div className="mt-8 space-y-5">
      {comentarios.map(comentario => {
        const notaDoUsuario = comentario.usuario?.notas?.[0]?.avaliacao;
        const isAuthor = isLoggedIn && user?.id === comentario.usuarioId;
        const isAdmin = isLoggedIn && user?.role === 'ADMIN';
        const canDelete = isAuthor || isAdmin; 
        const canEdit = isAuthor; 
        const isEditingThis = editingId === comentario.id;
        const isDeletingThis = deletingId === comentario.id;
        const isSavingThis = savingId === comentario.id;
        const isProcessing = isDeletingThis || isSavingThis; 

        return (
          <div key={comentario.id} className={`p-4 rounded-lg shadow border transition-opacity duration-300 ${isProcessing ? 'opacity-50' : ''} ${isEditingThis ? 'bg-orange-50 dark:bg-gray-700 border-orange-300 dark:border-orange-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-500'}`}>

            <div className="flex items-center justify-between mb-1 flex-wrap gap-x-2">
              <p className="font-semibold text-gray-900 dark:text-gray-100 mr-2">
                {comentario.usuario?.nome || 'Usuário Anônimo'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs flex-shrink-0">
                {new Date(comentario.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="mb-2">
              <DisplayEstrelas nota={notaDoUsuario} />
            </div>

            {isEditingThis ? (

              <div className="my-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:text-white focus:ring-orange-500 focus:border-orange-500"
                  disabled={isSavingThis}
                  autoFocus 
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button onClick={handleCancelEdit} disabled={isSavingThis} className="text-xs px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200">
                    Cancelar
                  </button>
                  <button onClick={handleSaveEdit} disabled={isSavingThis} className="text-xs px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 flex items-center">
                    {isSavingThis && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isSavingThis ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
             
            ) : (
              <p className="text-gray-800 dark:text-gray-300 text-sm whitespace-pre-wrap my-2">
                {comentario.conteudo}
              </p>
            )}

            {(canDelete || canEdit) && !isEditingThis && (
              <div className="flex items-center space-x-4 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              
                 {canEdit && (
                     <button
                       onClick={() => handleStartEdit(comentario)}
                       disabled={isDeletingThis || !!editingId} 
                       className="flex items-center text-xs font-medium text-orange-400 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                       title="Editar Comentário"
                     >
                       <FaEdit className="mr-1 h-3 w-3" /> Editar
                     </button>
                 )}
                 
                 {canDelete && (
                    <button
                      onClick={() => handleDelete(comentario.id)}
                      disabled={isDeletingThis || !!editingId} 
                      className="flex items-center text-xs font-medium text-red-600 hover:text-red-800 dark:text-orange-400 dark:hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                      title="Excluir Comentário"
                    >
                      {isDeletingThis ? (
                        <svg className="animate-spin h-3 w-3 mr-1 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
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

export default ListaComentarios;