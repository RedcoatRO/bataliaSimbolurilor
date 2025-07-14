
import React from 'react';
import { GoogleIcon } from './Icons';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <div className="w-full max-w-sm text-center fade-in">
      <div className="glassmorphism p-8 rounded-2xl">
        <h2 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">Bun venit!</h2>
        <p className="text-[var(--text-secondary)] mb-8">Autentifică-te pentru a începe duelul creativității.</p>
        <button
          onClick={onLogin}
          title="Autentificare folosind contul Google"
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 border border-gray-300"
        >
          <GoogleIcon className="h-6 w-6" />
          <span>Autentificare cu Google</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
