
import React from 'react';
import { GoogleIcon } from './Icons';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <div className="w-full max-w-sm text-center fade-in">
      <div className="bg-[#1C1C2E] p-8 rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-500/20">
        <h2 className="text-3xl font-bold mb-2 text-white">Bun venit!</h2>
        <p className="text-gray-400 mb-8">Autentifică-te pentru a începe duelul creativității.</p>
        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
        >
          <GoogleIcon className="h-6 w-6" />
          <span>Autentificare cu Google</span>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
