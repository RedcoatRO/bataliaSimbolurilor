
import React, { useState, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import DuelPage from './components/DuelPage';
import { GoogleIcon, BookOpenIcon } from './components/Icons';
import ThemeSwitcher from './components/ThemeSwitcher';
import RulesModal from './components/RulesModal'; // Import the new component
import type { DuelSettings } from './types';

type View = 'login' | 'dashboard' | 'duel';

const App: React.FC = () => {
  const [view, setView] = useState<View>('login');
  const [duelSettings, setDuelSettings] = useState<DuelSettings>({ difficulty: 2, excludedTopics: [] });
  // State to control the visibility of the Rules Modal
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

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
    <div className="min-h-screen w-full flex flex-col">
       <header className="w-full p-4 flex justify-between items-center glassmorphism fixed top-0 left-0 z-50">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-[var(--text-accent)]">Duelul Ideilor</h1>
        <div className="flex items-center gap-2 sm:gap-4">
            {view !== 'login' && (
                 <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <GoogleIcon className="h-5 w-5"/>
                    <span>Autentificat</span>
                 </div>
            )}
            {/* Button to open the rules modal */}
            <button
                onClick={() => setIsRulesModalOpen(true)}
                className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-gray-500/20 transition-colors duration-200"
                title="Vezi regulamentul jocului"
                aria-label="Vezi regulamentul"
            >
                <BookOpenIcon className="h-5 w-5" />
            </button>
            <ThemeSwitcher />
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-4 pt-20">
        {renderView()}
      </main>

      {/* Conditionally render the Rules Modal */}
      {isRulesModalOpen && <RulesModal onClose={() => setIsRulesModalOpen(false)} />}
    </div>
  );
};

export default App;
