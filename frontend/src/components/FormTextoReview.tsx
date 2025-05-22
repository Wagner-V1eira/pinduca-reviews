import React from 'react';

interface FormTextoReviewProps {
  currentText: string;
  onTextChange: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

const FormTextoReview: React.FC<FormTextoReviewProps> = ({
  currentText,
  onTextChange,
  placeholder = "Escreva seu review aqui...", 
  disabled = false,
  rows = 4, 
}) => {
  return (
    <div className="mt-0">
      <textarea
        value={currentText} 
        onChange={(e) => onTextChange(e.target.value)} 
        placeholder={placeholder}
        rows={rows}
        className="w-full p-3 border rounded-lg shadow-sm focus:ring focus:ring-orange-400 focus:border-orange-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 disabled:opacity-50" 
        disabled={disabled} 
      />
    </div>
  );
};

export default FormTextoReview;