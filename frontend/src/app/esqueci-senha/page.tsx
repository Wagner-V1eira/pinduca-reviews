'use client';
import React, { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    const apiUrl = `${process.env.NEXT_PUBLIC_URL_API}/auth/request-password-reset`;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.erro || `Erro ${response.status}`);
      }
      toast.success(data.message || "Solicitação enviada!");
      setMessage(data.message || "Se seu e-mail estiver cadastrado, você receberá um link para redefinir sua senha.");
      setEmail('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage || 'Erro ao processar solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

 return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-600 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
          Esqueceu sua Senha?
        </h2>
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Digite seu e-mail e enviaremos um link para você criar uma nova senha.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endereço de E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 disabled:opacity-50"
              disabled={isLoading || !!message}
            />
          </div>

          {message && (
            <p className="text-sm text-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 p-3 rounded-md border border-green-300 dark:border-green-600">
              {message}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !!message}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center mt-6"> 
            <Link href="/login" className="font-medium text-orange-500 hover:text-orange-600 dark:text-orange-500 dark:hover:text-orange-600 hover:underline">
                Lembrou a senha? Voltar para o Login
            </Link>
        </div>
      </div>
    </div>
  );
}