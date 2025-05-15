'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes } from 'react-icons/fa';
import { z } from 'zod';

const registerSchema = z.object({
    nome: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres" }),
    email: z.string().email({ message: "Email inválido" }),
    senha: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
    confirmarSenha: z.string().min(6, { message: "A confirmação da senha deve ter pelo menos 6 caracteres" }),
}).refine(data => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"]
});

const RegisterPage: React.FC = () => {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [erro, setErro] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            registerSchema.parse({ nome, email, senha, confirmarSenha });
            const baseUrl = process.env.NEXT_PUBLIC_URL_API;
            const apiUrl = `${baseUrl}/usuario`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nome, email, senha }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Cadastro bem-sucedido:", data); 
                router.push('/login');
            } else {
                console.error("Erro no cadastro:", data); 
                setErro(data.error || 'Erro ao cadastrar.');
            }
        } catch (error) {
            console.error('Erro geral no cadastro:', error);
            if (error instanceof z.ZodError) {
                if (error instanceof z.ZodError) {
                    setErro(error.errors[0].message);
                } else {
                    setErro('Erro inesperado.');
                }
            } else {
                setErro('Erro inesperado.');
            }
        }
    };

    const handleClose = () => {
        router.push('/');
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-600">
            <div className="bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 max-w-md w-full relative">
                <button onClick={handleClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 cursor-pointer">
                    <FaTimes className="h-6 w-6" />
                </button>
                <h2 className="block text-gray-200 text-center text-2xl font-bold mb-6">Cadastro</h2>
                {erro && <p className="text-orange-500 text-sm mb-4">{erro}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="nome">
                            Nome
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-orange-400 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            id="nome"
                            type="text"
                            placeholder="Nome completo"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-orange-400 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            id="email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="senha">
                            Senha
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-orange-400 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            id="senha"
                            type="password"
                            placeholder="Senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="confirmarSenha">
                            Confirmar Senha
                        </label>
                        <input
                            className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-orange-400 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            id="confirmarSenha"
                            type="password"
                            placeholder="Confirmar Senha"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex items-center justify-center">
                        <button
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            type="submit"
                        >
                            Cadastrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;