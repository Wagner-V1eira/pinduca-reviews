'use client'; 

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import { toast } from 'sonner';

interface FormData {
  titulo: string;
  ano: string;
  sinopse: string;
  capaUrl: string;
  autor: string;
}

export default function AdicionarGibiPage() {
  const router = useRouter();
  const { isLoggedIn, user, token, isLoading: isLoadingAuth } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    ano: '',
    sinopse: '',
    capaUrl: '',
    autor: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoadingAuth && !isLoggedIn) {
      toast.error('Você precisa estar logado para adicionar um gibi.');
      router.replace('/login');
    }
  }, [isLoggedIn, isLoadingAuth, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !user || !token) { 
      toast.error('Autenticação necessária.');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);

    const anoNum = Number(formData.ano);
    if (isNaN(anoNum) || anoNum < 1900 || anoNum > new Date().getFullYear() + 5) {
        setFormError('Ano inválido.');
        setIsSubmitting(false);
        toast.error('Ano inválido.');
        return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL_API;
    const apiUrl = `${baseUrl}/gibi`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
        body: JSON.stringify({
          titulo: formData.titulo,
          ano: anoNum, 
          sinopse: formData.sinopse || null, 
          capaUrl: formData.capaUrl || null, 
          autor: formData.autor || null,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.erro || `Erro ao cadastrar: ${response.status}`);
      }

      toast.success('Gibi cadastrado com sucesso!');
      setFormData({ titulo: '', ano: '', sinopse: '', capaUrl: '', autor: ''});
      router.push('/'); 

    } catch (error: unknown) {
      console.error("Erro ao cadastrar gibi:", error);
      const errorMessage = (error instanceof Error) ? error.message : "Erro desconhecido ao cadastrar.";
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth || !isLoggedIn) {
      return <div className="container mx-auto p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-200">Cadastrar Novo Gibi</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}

        <div>
          <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Título</label>
          <input type="text" name="titulo" id="titulo" required minLength={3} value={formData.titulo} onChange={handleChange} disabled={isSubmitting} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>

        <div>
          <label htmlFor="ano" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Ano de Publicação</label>
          <input type="number" name="ano" id="ano" required value={formData.ano} onChange={handleChange} disabled={isSubmitting} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>

        <div>
          <label htmlFor="capaUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-200">URL da Capa (Opcional)</label>
          <input type="url" name="capaUrl" id="capaUrl" value={formData.capaUrl} onChange={handleChange} disabled={isSubmitting} placeholder="https://exemplo.com/capa.jpg" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>

        <div>
          <label htmlFor="autor" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Autor (Opcional)</label>
          <input type="text" name="autor" id="autor" value={formData.autor} onChange={handleChange} disabled={isSubmitting} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>

        <div>
          <label htmlFor="sinopse" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Sinopse (Opcional)</label>
          <textarea name="sinopse" id="sinopse" rows={4} value={formData.sinopse} onChange={handleChange} disabled={isSubmitting} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
        </div>

        <div className="text-center">
          <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50">
            {isSubmitting ? 'Cadastrando...' : 'Cadastrar Gibi'}
          </button>
        </div>
      </form>
    </div>
  );
}