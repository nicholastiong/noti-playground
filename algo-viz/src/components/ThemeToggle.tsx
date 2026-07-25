'use client';

import { useEffect, useState } from 'react';

/**
 * Flips `data-theme` on <html> and remembers the choice. The layout runs a tiny
 * inline script before paint so a stored preference never flashes dark first.
 */
export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  // The real theme lives on <html>; sync after mount to avoid hydration drift.
  useEffect(() => {
    setLight(document.documentElement.dataset.theme === 'light');
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    if (next) document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem('theme', next ? 'light' : 'dark');
    } catch {
      /* private mode — the toggle still works for this visit */
    }
  };

  return (
    <button
      className="btn"
      onClick={toggle}
      title={light ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label="Toggle color theme"
    >
      {light ? '☾' : '☼'}
    </button>
  );
}
