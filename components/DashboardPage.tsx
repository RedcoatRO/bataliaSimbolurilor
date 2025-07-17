
import React, { useState, useCallback, useEffect } from 'react';
import { AiIcon } from './Icons';
import type { DuelSettings } from '../types';

interface DashboardPageProps {
  onStartDuel: (settings: DuelSettings) => void;
}

// Configurația pentru temele excluse
const EXCLUDED_TOPICS = [
    "Timp și Spațiu", "Iubire și Pierdere", "Dreptate și Etică", "Libertate și Determinism", 
    "Mitologie Greacă", "Mitologie Egipteană", "Mitologie Nordică", "Filosofie Stoică", 
    "Filosofie Existențialistă", "Ideile lui Platon", "Fizică Cuantică", "Biologie Genetică", 
    "Cosmologie", "Artă Suprarealistă", "Literatură Gotică", "Literatură Science-Fiction", 
    "Istoria Imperiului Roman", "Cultura Japoniei Feudale", "Renașterea Italiană", "Concepte din Psihanaliză"
];

// Configurația pentru temele favorite, structurată pe nivel de dificultate
const FAVORITE_THEMES_CONFIG: { [key: number]: { themes: string[], limit: number } } = {
    1: { limit: 1, themes: ["Animale", "Fenomene naturale", "Emoții simple", "Culori și forme", "Elemente magice", "Obiecte școlare", "Jucării și jocuri", "Alimente", "Locuri cunoscute", "Timp și spațiu"] },
    2: { limit: 3, themes: ["Supereroi și puteri", "Frica și curajul", "Emoții complexe", "Mitologie simplificată", "Elemente opuse", "Meserii fantastice", "Valori morale", "Tehnologie", "Natură", "Obstacole și salvare"] },
    3: { limit: 5, themes: ["Concepte morale", "Sentimente duale", "Putere și slăbiciune", "Libertate și constrângere", "Timp", "Mituri clasice", "Tehnologie și umanitate", "Identitate și alter ego", "Construire vs. distrugere", "Relații umane"] },
    4: { limit: 7, themes: ["Conștiință și inconștient", "Viață și moarte", "Sinele", "Rațiune vs. instinct", "Adevăr și iluzie", "Timpul subiectiv", "Teama de necunoscut", "Mitologie profundă", "Conflict interior", "Etica deciziei"] },
    5: { limit: 10, themes: ["Nimicul", "Arhetipuri", "Sinele multiplicat", "Sacrul și profanul", "Limbajul însuși", "Realitatea", "Libertatea absolută", "Ciclul vieții", "Destin și voință", "Limitele cunoașterii"] }
};

// Configurația pentru nivelul metaforic, bazată pe dificultate
const METAPHOR_CONFIG: { [key: number]: { min: number; max: number; default: number; label: string } } = {
    1: { min: 0, max: 3, default: 0, label: "Deloc Metaforic ↔ Puțin" },
    2: { min: 4, max: 6, default: 4, label: "Simplu ↔ Moderat" },
    3: { min: 7, max: 9, default: 7, label: "Moderat ↔ Abstract" },
    4: { min: 10, max: 15, default: 10, label: "Abstract ↔ Foarte Creativ" },
    5: { min: 16, max: 20, default: 16, label: "Poetic ↔ Absolut Metaforic" }
};


const DIFFICULTY_LABELS = ["Copil (9-10 ani)", "Începător", "Mediu", "Avansat", "Expert"];
const EXCLUSION_LIMITS: { [key: number]: number } = { 1: 11, 2: 9, 3: 7, 4: 5, 5: 3 };

const DashboardPage: React.FC<DashboardPageProps> = ({ onStartDuel }) => {
  const [difficulty, setDifficulty] = useState(3);
  const [excludedTopics, setExcludedTopics] = useState<string[]>([]);
  const [favoriteThemes, setFavoriteThemes] = useState<string[]>([]);
  const [metaphoricalLevel, setMetaphoricalLevel] = useState(METAPHOR_CONFIG[3].default);


  // Efect pentru a ajusta subiectele excluse la schimbarea dificultății
  useEffect(() => {
    if (excludedTopics.length > exclusionLimit) {
      setExcludedTopics(prev => prev.slice(0, exclusionLimit));
    }
  }, [difficulty, excludedTopics.length]); // dependency updated for correctness

  // Acest efect resetează temele favorite alese ori de câte ori se schimbă nivelul de dificultate.
  useEffect(() => {
    setFavoriteThemes([]);
  }, [difficulty]);
  
  // Acest efect resetează nivelul metaforic la valoarea implicită pentru noua dificultate.
  // Previne existența unui nivel metaforic invalid (ex: nivel 10 la dificultate 1).
  useEffect(() => {
    setMetaphoricalLevel(METAPHOR_CONFIG[difficulty].default);
  }, [difficulty]);


  // Callback pentru a gestiona selecția temelor favorite
  const handleFavoriteThemeToggle = useCallback((theme: string) => {
    setFavoriteThemes(prev => {
      const isSelected = prev.includes(theme);
      if (isSelected) {
        return prev.filter(t => t !== theme);
      } else if (prev.length < FAVORITE_THEMES_CONFIG[difficulty].limit) {
        return [...prev, theme];
      }
      return prev; // Nu face nimic dacă s-a atins limita
    });
  }, [difficulty]);
  
  // Callback pentru a gestiona selecția subiectelor excluse
  const handleTopicToggle = useCallback((topic: string) => {
    const exclusionLimit = EXCLUSION_LIMITS[difficulty];
    setExcludedTopics(prev => {
      const isSelected = prev.includes(topic);
      if (isSelected) {
        return prev.filter(t => t !== topic);
      } else if (prev.length < exclusionLimit) {
        return [...prev, topic];
      }
      return prev;
    });
  }, [difficulty]);

  const handleStartClick = () => {
      onStartDuel({ difficulty, excludedTopics, favoriteThemes, metaphoricalLevel });
  };
  
  const getTopicTooltip = (topic: string, isSelected: boolean, isDisabled: boolean) => {
      if (isDisabled) return 'Limită de subiecte atinsă pentru acest nivel';
      if (isSelected) return `Apasă pentru a elimina "${topic}" de la excepții`;
      return `Apasă pentru a adăuga "${topic}" la excepții`;
  };

  const exclusionLimit = EXCLUSION_LIMITS[difficulty];
  const currentFavoriteThemesConfig = FAVORITE_THEMES_CONFIG[difficulty];
  const favoriteThemeLimit = currentFavoriteThemesConfig.limit;

  return (
    <div className="w-full max-w-2xl text-left fade-in">
      <div className="glassmorphism p-8 rounded-2xl">
        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] text-center">Configurează Duelul</h2>

        {/* Difficulty Selector */}
        <div className="mb-8">
            <label htmlFor="difficulty" className="block text-lg font-semibold mb-3 text-[var(--text-accent)]">Nivel de Dificultate</label>
            <input id="difficulty" type="range" min="1" max="5" step="1" value={difficulty} onChange={(e) => setDifficulty(parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-400/30 rounded-lg appearance-none cursor-pointer" title={`Nivel selectat: ${DIFFICULTY_LABELS[difficulty - 1]}`}/>
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-2 px-1">
               {DIFFICULTY_LABELS.map((label, index) => <span key={index}>|</span>)}
            </div>
             <p className="text-center font-bold text-[var(--text-primary)] mt-2 text-lg">{DIFFICULTY_LABELS[difficulty - 1]}</p>
        </div>

        {/* Metaphorical Level Selector */}
        <div className="mb-8">
            <label htmlFor="metaphor" className="block text-lg font-semibold mb-3 text-[var(--text-accent)]">Nivel Metaforic</label>
            <input 
                id="metaphor" 
                type="range" 
                min={METAPHOR_CONFIG[difficulty].min} 
                max={METAPHOR_CONFIG[difficulty].max} 
                step="1" 
                value={metaphoricalLevel} 
                onChange={(e) => setMetaphoricalLevel(parseInt(e.target.value, 10))} 
                className="w-full h-2 bg-gray-400/30 rounded-lg appearance-none cursor-pointer"
                title={`Nivel metaforic selectat: ${metaphoricalLevel}`}
            />
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-2 px-1">
               <span className="font-mono">{METAPHOR_CONFIG[difficulty].min}</span>
               <span className="font-semibold">{METAPHOR_CONFIG[difficulty].label}</span>
               <span className="font-mono">{METAPHOR_CONFIG[difficulty].max}</span>
            </div>
             <p className="text-center font-bold text-[var(--text-primary)] mt-2 text-lg font-mono">{metaphoricalLevel}</p>
        </div>

        {/* Favorite Themes Selector */}
        <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-[var(--text-accent)]">Teme Favorite (alege max. {favoriteThemeLimit})</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3 -mt-2">Alege una sau mai multe teme pe care AI-ul să se concentreze. Acest lucru va ghida creativitatea duelului.</p>
            <div className="flex flex-wrap gap-2">
                {currentFavoriteThemesConfig.themes.map(theme => {
                    const isSelected = favoriteThemes.includes(theme);
                    const isDisabled = !isSelected && favoriteThemes.length >= favoriteThemeLimit;
                    return (
                        <button key={theme} onClick={() => handleFavoriteThemeToggle(theme)} disabled={isDisabled} title={isDisabled ? `Limită de ${favoriteThemeLimit} teme atinsă` : (isSelected ? `Elimină tema "${theme}"` : `Adaugă tema "${theme}"`)} className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ${isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-secondary)] hover:bg-gray-400/20'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {theme}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Excluded Topics Selector */}
        <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-[var(--text-accent)]">Subiecte de Evitat (max. {exclusionLimit})</h3>
            <div className="flex flex-wrap gap-2">
                {EXCLUDED_TOPICS.map(topic => {
                    const isSelected = excludedTopics.includes(topic);
                    const isDisabled = !isSelected && excludedTopics.length >= exclusionLimit;
                    return (
                        <button key={topic} onClick={() => handleTopicToggle(topic)} disabled={isDisabled} title={getTopicTooltip(topic, isSelected, isDisabled)} className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ${isSelected ? 'bg-red-500 border-red-400 text-white' : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-secondary)] hover:bg-gray-400/20'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {topic}
                        </button>
                    );
                })}
            </div>
        </div>

        <button onClick={handleStartClick} title="Pornește un nou duel cu setările alese" className="w-full group bg-[var(--button-primary-bg)] text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-[var(--button-primary-hover-bg)] transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3">
          <AiIcon className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
          <span>Începe Duelul</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;