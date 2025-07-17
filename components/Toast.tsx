
import React, { useEffect } from 'react';
import { ExclamationTriangleIcon } from './Icons';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  // Efect pentru a închide automat notificarea după 5 secunde.
  // Acest lucru previne ca ecranul să se umple de notificări.
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // 5 secunde

    // Curăță temporizatorul dacă componenta este demontată înainte de expirarea timpului.
    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);
  
  const isError = type === 'error';

  return (
    <div 
      className="fixed bottom-5 right-5 z-50 fade-in"
      role="alert"
      aria-live="assertive"
    >
      <div className={`flex items-center w-full max-w-xs p-4 rounded-lg shadow-lg glassmorphism border ${isError ? 'border-red-400/50' : 'border-green-400/50'}`} >
        <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${isError ? 'text-red-500 bg-red-100 dark:bg-red-900/40 dark:text-red-200' : 'text-green-500 bg-green-100 dark:bg-green-800 dark:text-green-200'}`}>
          {isError && <ExclamationTriangleIcon className="w-5 h-5" />}
          {/* Aici se poate adăuga o pictogramă de succes, dacă va fi necesar */}
          <span className="sr-only">{isError ? 'Error icon' : 'Success icon'}</span>
        </div>
        <div className="ml-3 text-sm font-normal text-[var(--text-secondary)]">{message}</div>
        <button 
          type="button" 
          className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-500/20 inline-flex items-center justify-center h-8 w-8 transition-colors"
          aria-label="Close"
          onClick={onClose}
          title="Închide notificarea"
        >
          <span className="sr-only">Close</span>
          <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
