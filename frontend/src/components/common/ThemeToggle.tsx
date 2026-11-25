import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * ThemeToggle
 * 
 * Minimalist, high-contrast theme switcher styled in Koval SEO pill fashion:
 * - Toggles between Light (#ffffff) and Dark (#0a0a0c)
 * - Persists preference in localStorage
 * - Adds/removes 'dark' class on <html> element
 */
export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check saved preference or system preference
    const saved = localStorage.getItem('recall-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = saved ? saved === 'dark' : prefersDark;

    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setIsDark(document.documentElement.classList.contains('dark'));

    // Observe changes to <html> class so multiple toggles stay synchronized
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains('dark');
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('recall-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('recall-theme', 'light');
    }
    setIsDark(nextDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="tech-pill flex items-center gap-1.5 font-mono text-[11px] hover:bg-ink hover:text-ground transition-all cursor-pointer"
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <Sun className="w-3 h-3 text-yellow-400 rotate-0 transition-transform duration-300" />
          <span>/ light</span>
        </>
      ) : (
        <>
          <Moon className="w-3 h-3 text-ink rotate-0 transition-transform duration-300" />
          <span>/ dark</span>
        </>
      )}
    </button>
  );
};
