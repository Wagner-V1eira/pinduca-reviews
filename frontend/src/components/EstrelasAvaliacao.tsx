// components/EstrelasAvaliacao.tsx
import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; 

interface EstrelasAvaliacaoProps {
  currentRating: number | null; 
  onStarChange: (rating: number) => void; 
  disabled?: boolean; 
}

const EstrelasAvaliacao: React.FC<EstrelasAvaliacaoProps> = ({
  currentRating,
  onStarChange,
  disabled = false, 
}) => {
  const { isLoggedIn } = useAuth(); 
  const [hover, setHover] = useState<number | null>(null);

  const handleClick = (novaAvaliacao: number) => {
    if (!disabled && isLoggedIn) {
      onStarChange(novaAvaliacao);
    }
  };

  const handleMouseEnter = (notaDaEstrela: number) => {
    if (!disabled && isLoggedIn) {
      setHover(notaDaEstrela);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled && isLoggedIn) {
      setHover(null);
    }
  };

  const ratingToShow = hover ?? currentRating;

  return (
    <div className="mt-0"> 
      <div className={`flex items-center ${disabled || !isLoggedIn ? 'opacity-50 pointer-events-none' : ''}`}>
        {[...Array(5)].map((_, i) => {
          const notaDaEstrela = i + 1;
          return (
            <FaStar
              key={notaDaEstrela}
              size={28} 
              color={notaDaEstrela <= (ratingToShow || 0) ? '#ffc107' : '#e4e5e9'} 
              style={{ 
                cursor: disabled || !isLoggedIn ? 'not-allowed' : 'pointer',
                marginRight: '4px',
              }}
              onClick={() => handleClick(notaDaEstrela)}
              onMouseEnter={() => handleMouseEnter(notaDaEstrela)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}
      </div>
    </div>
  );
};

export default EstrelasAvaliacao;