import { useEffect, useState } from 'react';

// Modalità per dispositivo: non dipende mai dalla data o dal GPS. Senza una scelta segue la larghezza dello schermo.

export type AppMode = 'planning' | 'travel';
const KEY = 'nfhp.ui.mode';
const QUERY = '(max-width: 767px)';

function stored(): AppMode | undefined {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'planning' || v === 'travel' ? v : undefined;
  } catch {
    return undefined;
  }
}

const bySize = (): AppMode => (window.matchMedia?.(QUERY).matches ? 'travel' : 'planning');

export function useAppMode(): { mode: AppMode; setMode: (m: AppMode | undefined) => void } {
  const [choice, setChoice] = useState(stored);
  const [size, setSize] = useState(bySize);
  useEffect(() => {
    const m = window.matchMedia?.(QUERY);
    if (!m) return;
    const on = () => setSize(bySize());
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  useEffect(() => {
    const on = () => setChoice(stored());
    window.addEventListener('nfhp-mode', on);
    return () => window.removeEventListener('nfhp-mode', on);
  }, []);
  return {
    mode: choice ?? size,
    setMode: (m) => {
      try {
        if (m) localStorage.setItem(KEY, m);
        else localStorage.removeItem(KEY);
      } catch {
        /* senza storage la scelta vale finché la pagina resta aperta */
      }
      setChoice(m);
      window.dispatchEvent(new Event('nfhp-mode'));
    },
  };
}
