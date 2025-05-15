'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { toast } from 'sonner';
import { z } from 'zod';
import Link from 'next/link';

const resetPasswordFormSchema = z.object({
    novaSenha: z.string().min(6, { message: "A nova senha deve ter pelo menos 6 caracteres" }),
    confirmarNovaSenha: z.string(),
}).refine(data => data.novaSenha === data.confirmarNovaSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarNovaSenha"],
});


function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null); 

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const emailFromUrl = searchParams.get('email');
    if (tokenFromUrl) setToken(tokenFromUrl);
    if (emailFromUrl) setEmail(emailFromUrl);

    if (!tokenFromUrl || !emailFromUrl) {
        toast.error("Link de redefinição inválido ou incompleto.");
        router.replace('/esqueci-senha'); 
    }
  }, [searchParams, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
        toast.error("Token ou email ausente. Solicitação inválida.");
        return;
    }
    setFormError(null);
    setIsLoading(true);

    try {
        resetPasswordFormSchema.parse({ novaSenha, confirmarNovaSenha }); 

        const apiUrl = `${process.env.NEXT_PUBLIC_URL_API}/auth/reset-password`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token, novaSenha, confirmarNovaSenha }),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(data?.erro || `Erro ${response.status}`);
        }
        toast.success(data.message || "Senha redefinida com sucesso!");
        router.push('/login'); 

    } catch (error: unknown) {
        let errorMsg = "Erro ao redefinir senha.";
        if (error instanceof z.ZodError) {
            errorMsg = error.errors[0]?.message || "Erro de validação.";
        } else if (error instanceof Error) {
            errorMsg = error.message;
        }
        setFormError(errorMsg);
        toast.error(errorMsg);
    } finally {
        setIsLoading(false);
    }
  };

  if (!token || !email) { 
    return <div className="flex items-center justify-center min-h-screen"><p>Carregando ou link inválido...</p></div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-600 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-300">Redefinir Senha</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">{formError}</p>}
          <div>
            <label htmlFor="novaSenha" className="mr-4 font-bold text-center text-gray-800 dark:text-gray-300">Nova Senha</label>
            <input id="novaSenha" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required disabled={isLoading} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 disabled:opacity-50"/>
          </div>
          <div>
            <label htmlFor="confirmarNovaSenha" className="mr-4 font-bold text-center text-gray-800 dark:text-gray-300">Confirmar Nova Senha</label>
            <input id="confirmarNovaSenha" type="password" value={confirmarNovaSenha} onChange={(e) => setConfirmarNovaSenha(e.target.value)} required disabled={isLoading} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 disabled:opacity-50"/>
          </div>
          <div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-75 disabled:cursor-not-allowed">
              {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
            <Link href="/login" className="font-medium text-orange-400 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-600">
                Voltar para o Login
            </Link>
        </div>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
            <RedefinirSenhaForm />
        </Suspense>
    );
}