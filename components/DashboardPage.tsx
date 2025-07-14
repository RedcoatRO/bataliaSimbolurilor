
import React, { useState, useCallback, useEffect } from 'react';
import { AiIcon } from './Icons';
import type { DuelSettings } from '../types';

interface DashboardPageProps {
  onStartDuel: (settings: DuelSettings) => void;
}

const TOPICS = [
    "Timp și Spațiu", "Iubire și Pierdere", "Dreptate și Etică", "Libertate și Determinism", 
    "Mitologie Greacă", "Mitologie Egipteană", "Mitologie Nordică", "Filosofie Stoică", 
    "Filosofie Existențialistă", "Ideile lui Platon", "Fizică Cuantică", "Biologie Genetică", 
    "Cosmologie", "Artă Suprarealistă", "Literatură Gotică", "Literatură Science-Fiction", 
    "Istoria Imperiului Roman", "Cultura Japoniei Feudale", "Renașterea Italiană", "Concepte din Psihanaliză"
];

const DIFFICULTY_LABELS = ["Copil (9-10 ani)", "Începător", "Mediu", "Avansat", "Expert"];
// Mapping difficulty level to exclusion limit: 1-Copil, 2-Incepator, ..., 5-Expert
const EXCLUSION_LIMITS: { [key: number]: number } = { 1: 11, 2: 9, 3: 7, 4: 5, 5: 3 };

const DashboardPage: React.FC<DashboardPageProps> = ({ onStartDuel }) => {
  const [difficulty, setDifficulty] = useState(3);
  const [excludedTopics, setExcludedTopics] = useState<string[]>([]);
  
  // The limit is dynamically calculated based on the selected difficulty
  const exclusionLimit = EXCLUSION_LIMITS[difficulty] || 7;

  // This effect runs when difficulty changes. If the user has selected more topics
  // than the new limit allows, it trims the list.
  useEffect(() => {
    if (excludedTopics.length > exclusionLimit) {
      setExcludedTopics(prev => prev.slice(0, exclusionLimit));
    }
  }, [difficulty, exclusionLimit, excludedTopics.length]);

  // Callback to handle topic selection, respecting the dynamic limit
  const handleTopicToggle = useCallback((topic: string) => {
    setExcludedTopics(prev => {
      const isSelected = prev.includes(topic);
      if (isSelected) {
        return prev.filter(t => t !== topic);
      } else if (prev.length < exclusionLimit) {
        return [...prev, topic];
      }
      return prev; // Do nothing if limit is reached
    });
  }, [exclusionLimit]);

  const handleStartClick = () => {
      onStartDuel({ difficulty, excludedTopics });
  };
  
  // Helper function to get tooltip text for a topic button
  const getTopicTooltip = (topic: string, isSelected: boolean, isDisabled: boolean) => {
      if (isDisabled) return 'Limită de subiecte atinsă pentru acest nivel';
      if (isSelected) return `Apasă pentru a elimina "${topic}" de la excepții`;
      return `Apasă pentru a adăuga "${topic}" la excepții`;
  };

  return (
    <div className="w-full max-w-2xl text-left fade-in">
      <div className="bg-[#1C1C2E] p-8 rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-500/20">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Configurează Duelul</h2>

        {/* Difficulty Selector */}
        <div className="mb-8">
            <label htmlFor="difficulty" className="block text-lg font-semibold mb-3 text-purple-300">Nivel de Dificultate</label>
            <input
                id="difficulty"
                type="range"
                min="1"
                max="5"
                step="1"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                title={`Nivel selectat: ${DIFFICULTY_LABELS[difficulty - 1]}`}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
               {DIFFICULTY_LABELS.map((label, index) => <span key={index}>|</span>)}
            </div>
             <p className="text-center font-bold text-white mt-2 text-lg">{DIFFICULTY_LABELS[difficulty - 1]}</p>
        </div>

        {/* Excluded Topics Selector */}
        <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-purple-300">Subiecte de Evitat (max. {exclusionLimit})</h3>
            <div className="flex flex-wrap gap-2">
                {TOPICS.map(topic => {
                    const isSelected = excludedTopics.includes(topic);
                    const isDisabled = !isSelected && excludedTopics.length >= exclusionLimit;
                    return (
                        <button
                            key={topic}
                            onClick={() => handleTopicToggle(topic)}
                            disabled={isDisabled}
                            title={getTopicTooltip(topic, isSelected, isDisabled)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200
                                ${isSelected 
                                    ? 'bg-red-500 border-red-400 text-white' 
                                    : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/70'
                                }
                                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {topic}
                        </button>
                    );
                })}
            </div>
        </div>

        <button
          onClick={handleStartClick}
          title="Pornește un nou duel cu setările alese"
          className="w-full group bg-purple-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <AiIcon className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
          <span>Începe Duelul</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
