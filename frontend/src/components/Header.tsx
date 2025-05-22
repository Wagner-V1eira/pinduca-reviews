"use client";

import React from 'react'; 
import Link from 'next/link';
import Image from 'next/image';
import logo from '../../public/logo.png'; 
import { FaHome, FaStar, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaPlusCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onOpenLoginModal: () => void; 
}

const Header: React.FC<HeaderProps> = ({ onOpenLoginModal }) => {
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth();

  const handleMinhasAvaliacoesClick = () => {
    if (isLoggedIn) { 
      router.push('/minhas-avaliacoes'); 
    } else {
      onOpenLoginModal(); 
    }
  };

  const handleLogout = () => {
    logout(); 
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-orange-400 dark:bg-gray-600 py-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Image src={logo} width={40} height={40} alt="Logo Pinduca" className="rounded-full" priority />
          <Link href="/" className="text-white text-xl font-semibold">
            Pinduca Reviews
          </Link>
        </div>

        <div className="flex items-center space-x-6 justify-center flex-grow">
          <Link href="/" className="text-white hover:text-orange-400 flex items-center space-x-2">
            <FaHome /> <span>Início</span>
          </Link>
          <button onClick={handleMinhasAvaliacoesClick} className="text-white hover:text-orange-400 flex items-center space-x-2 cursor-pointer">
            <FaStar /> <span>Meus Reviews</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {isLoggedIn && user ? ( 
            <>
                          <Link
                href="/gibi/novo" 
                className="flex items-center text-white hover:text-orange-400 text-sm font-medium transition duration-150 ease-in-out"
                title="Adicionar novo gibi"
              >
                <FaPlusCircle className="mr-1" /> 
                <span className="hidden sm:inline">Adicionar Gibi</span>
              </Link>
              <span className="text-white text-sm hidden sm:inline">
                Olá, {user.nome} 
              </span>
              <button
                onClick={handleLogout} 
                className="bg-orange-400 hover:bg-orange-600 text-white text-sm font-medium py-1 px-3 rounded-md transition duration-150 ease-in-out flex items-center space-x-1"
                title="Sair"
              >
                <FaSignOutAlt />
                <span className="hidden md:inline">Sair</span> 
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onOpenLoginModal} 
                className="text-white hover:text-orange-400 flex items-center space-x-2"
              >
                <FaSignInAlt /> <span>Entrar</span>
              </button>
              <Link
                href="/register" 
                className="bg-orange-400 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center space-x-2"
              >
                <FaUserPlus /> <span>Cadastrar</span> 
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Header;