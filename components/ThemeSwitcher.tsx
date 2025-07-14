
import React from 'react';
import { useTheme } from './ThemeContext';
import { SunIcon, MoonIcon } from './Icons';

const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-gray-500/20 transition-colors duration-200"
      title={`Comută la tema ${theme === 'light' ? 'întunecată' : 'luminoasă'}`}
      aria-label="Comută tema"
    >
      {theme === 'light' ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeSwitcher;
