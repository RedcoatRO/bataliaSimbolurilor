
import React, { useState, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import DuelPage from './components/DuelPage';
import { GoogleIcon } from './components/Icons';
import type { DuelSettings } from './types';

type View = 'login' | 'dashboard' | 'duel';

const App: React.FC = () => {
  const [view, setView] = useState<View>('login');
  const [duelSettings, setDuelSettings] = useState<DuelSettings>({ difficulty: 2, excludedTopics: [] });

  const handleLogin = useCallback(() => {
    setView('dashboard');
  }, []);

  const handleStartDuel = useCallback((settings: DuelSettings) => {
    setDuelSettings(settings);
    setView('duel');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setView('dashboard');
  }, []);

  const renderView = () => {
    switch (view) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'dashboard':
        return <DashboardPage onStartDuel={handleStartDuel} />;
      case 'duel':
        return <DuelPage settings={duelSettings} onEndDuel={handleBackToDashboard} />;
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#10101A] flex flex-col">
       <header className="w-full p-4 flex justify-between items-center bg-[#10101A]/80 backdrop-blur-sm fixed top-0 left-0 z-50">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white">Duelul Ideilor</h1>
        {view !== 'login' && (
             <div className="flex items-center gap-2 text-sm text-gray-300">
                <GoogleIcon className="h-5 w-5"/>
                <span>Autentificat</span>
             </div>
        )}
      </header>
      <main className="flex-grow flex items-center justify-center p-4 pt-20">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
