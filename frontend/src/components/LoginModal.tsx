'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes } from 'react-icons/fa'; 
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; 

interface LoginModalProps {
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async () => {
        setErrorMessage('');
        setIsLoading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_URL_API;
            const apiUrl = `${baseUrl}/login`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, senha }),
            });

            
            if (response.ok) {
                const data = await response.json(); 
                console.log('[LoginModal] Resposta API OK:', data);
                if (data.token && data.user && data.user.id && typeof data.user.nome === 'string') {
                    console.log('[LoginModal] Chamando context login com:', { token: data.token, user: data.user });
                    login(data.token, data.user); 
                    toast.success('Login realizado com sucesso!');
                    onClose(); 
                    router.push('/'); 
                } else {
                    console.error('[LoginModal] Login OK, mas token/user ausente ou incompleto na resposta:', data);
                    toast.error('Resposta de login inválida do servidor.');
                    setErrorMessage('Resposta inválida do servidor.');
                }
            } else {
                const errorData = await response.json().catch(() => ({ erro: `Erro HTTP: ${response.status}` }));
                console.error('Falha no login (API):', errorData);
                setErrorMessage(errorData.erro || `Erro ${response.status}.`);
                toast.error(errorData.erro || `Falha no login (${response.status})`);
            }
        } catch (error: unknown) { 
            console.error('Erro de conexão/fetch:', error);
             if (error instanceof Error) {
                 setErrorMessage(error.message || 'Erro de conexão.');
                 toast.error(error.message || 'Erro de conexão.');
             } else {
                 setErrorMessage('Erro de conexão desconhecido.');
                 toast.error('Erro de conexão desconhecido.');
             }
        } finally {
           setIsLoading(false); 
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500">
            <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full relative">
                <button
                    onClick={() => {
                        onClose(); 
                        router.push('/'); 
                    }}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                    <FaTimes className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold mb-4 text-gray-300">Entrar</h2>
                <p className="text-gray-300 mb-6">Entre com seu email e senha para acessar sua conta</p>
                {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
                <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">Email</label>
                    <input
                        type="email"
                        id="email"
                        className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-orange-400 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="senha" className="block text-gray-300 text-sm font-bold mb-2">Senha</label>
                    <input
                        type="password"
                        id="senha"
                        className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-orange-400 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="********"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)} disabled={isLoading}
                    />
                </div>
                <div className="flex items-center justify-center">
                    <button
                        className="bg-orange-400 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        type="button"
                        onClick={handleLogin}
                    >
                         Entrar
                    </button>
                </div>
                <div className="flex flex-col items-center mt-6">
                    <a href="/esqueci-senha" onClick={onClose} className="inline-block align-baseline font-bold text-sm text-orange-400 hover:text-orange-600">
                        Esqueci minha senha
                    </a>
                    <a href="/register" className="inline-block align-baseline font-bold text-sm text-orange-400 hover:text-orange-600 mt-2">
                        Não tem uma conta? Cadastre-se
                    </a>
                </div>
            </div>
            </div>
    );
};

export default LoginModal;