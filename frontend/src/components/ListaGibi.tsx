'use client'; 

import React from 'react';
import { useRouter } from 'next/navigation';
import CardGibi from './CardGibi'; 
import { GibiFromApi, GibiCardData } from '../types/index';

interface ListaGibiProps {
  gibis: GibiFromApi[]; 
}

const ListaGibi: React.FC<ListaGibiProps> = ({ gibis }) => {
  const router = useRouter();

 
  const handleNavigateToGibi = (id: number) => {
    console.log(`Navegando para o gibi com ID: ${id}`);
    router.push(`/gibi/${id}`);
  };

 
  if (!gibis || gibis.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-200 mt-10">
        Nenhum gibi encontrado para exibir.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {gibis.map((gibi) => {
        const cardData: GibiCardData = {
          id: gibi.id,
          titulo: gibi.titulo,
          ano: gibi.ano,
          sinopse: gibi.sinopse,
          capaUrl: gibi.capaUrl,
          autor: null,
        };

        return (
          <CardGibi
            key={gibi.id}
            gibi={cardData} 
            onClick={() => handleNavigateToGibi(gibi.id)} 
          />
        );
      })}
    </div>
  );
};

export default ListaGibi;