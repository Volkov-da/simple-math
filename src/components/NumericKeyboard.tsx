import React from 'react';
import { motion } from 'framer-motion';
import { Delete, Minus } from 'lucide-react';

interface NumericKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  className?: string;
}

export function NumericKeyboard({ 
  onKeyPress, 
  onBackspace, 
  onSubmit, 
  disabled = false,
  className = '' 
}: NumericKeyboardProps) {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫']
  ];

  const handleKeyClick = (key: string) => {
    if (disabled) return;
    
    if (key === '⌫') {
      onBackspace();
    } else if (key !== '') {
      onKeyPress(key);
    }
  };

  return (
    <motion.div
      className={`bg-white border-t border-gray-200 p-1 ${className}`}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-xs mx-auto">
        {/* Number keys grid */}
        <div className="grid grid-cols-3 gap-0.5 mb-1">
          {keys.map((row, rowIndex) => 
            row.map((key, colIndex) => (
              <motion.button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleKeyClick(key)}
                disabled={disabled}
                className={`
                  aspect-square flex items-center justify-center text-sm font-bold rounded-sm
                  transition-all duration-150 active:scale-95
                  ${key === '⌫' 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300' 
                    : key === ''
                    ? 'bg-transparent cursor-default'
                    : 'bg-gray-50 text-gray-800 hover:bg-gray-100 active:bg-gray-200'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                whileHover={!disabled ? { scale: 1.05 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
              >
                {key === '⌫' ? <Delete size={12} /> : key}
              </motion.button>
            ))
          )}
        </div>
        
        {/* Submit button */}
        <motion.button
          onClick={onSubmit}
          disabled={disabled}
          className={`
            w-full py-1 px-2 rounded-sm font-bold text-xs
            bg-gradient-to-r from-green-500 to-green-600 
            hover:from-green-600 hover:to-green-700
            text-white shadow-lg hover:shadow-xl
            transition-all duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
        >
          Submit
        </motion.button>
      </div>
    </motion.div>
  );
}
