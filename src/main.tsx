import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const el = document.getElementById('root');
if (!el) throw new Error('Elemento #root mancante');
createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Solo nella versione pubblicata: in sviluppo il service worker confonderebbe il ricaricamento dei file.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register('/sw.js')
      .then((r) => r.update().catch(() => undefined).then(() => navigator.serviceWorker.ready))
      .then((r) => {
        const urls = performance.getEntriesByType('resource').map((e) => e.name);
        r.active?.postMessage({ type: 'precache', urls });
      })
      .catch(() => undefined);
  });
}
