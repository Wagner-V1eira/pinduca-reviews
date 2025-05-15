import React, { useState, ChangeEvent } from 'react';

interface InputPesquisaProps {
  setPesquisa: React.Dispatch<React.SetStateAction<string>>;
}

const InputPesquisa: React.FC<InputPesquisaProps> = ({ setPesquisa }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setPesquisa(event.target.value); 
  };

  return (
    <input
      type="text"
      placeholder="Pesquisar gibis..."
      className="w-100 py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:border-blue-500 mb-6"
      value={inputValue}
      onChange={handleInputChange}
    />
  );
};

export default InputPesquisa;