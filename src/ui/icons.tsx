// Icone disegnate a mano: griglia 24, tratto uniforme, nessuna dipendenza. Colore dal testo circostante.

const PATHS = {
  mountain: 'M3 20 9.5 7.5l3.2 5.6 2.3-3.6L21 20Z M8 12.2l1.5 1.3 1.6-1.2',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M8 17h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16',
  plane: 'm21 15-8-5V4.5a1.5 1.5 0 0 0-3 0V10l-7 5v2l7-2.2V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-4.2l8 2.2Z',
  bed: 'M3 19v-6.5h18V19 M3 16h18 M3 12.5V6 M7 12.5V10a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v2.5',
  calendar: 'M4 9h16 M8 3v4 M16 3v4 M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5Z',
  wallet: 'M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3 M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5Z M16 13.5h.01',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M12 3v2.5 M12 18.5V21 M3 12h2.5 M18.5 12H21 M5.6 5.6l1.8 1.8 M16.6 16.6l1.8 1.8 M5.6 18.4l1.8-1.8 M16.6 7.4l1.8-1.8',
  phone: 'M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3Z M11 18h2',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6 7 7 M17 17l1.4 1.4 M5.6 18.4 7 17 M17 7l1.4-1.4',
  list: 'M9 6h11 M9 12h11 M9 18h11 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01',
  map: 'M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z M9 4v14 M15 6v14',
  book: 'M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5v-15Z M5 20.5A2.5 2.5 0 0 0 7.5 21H19v-3 M9 8h6',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  grip: 'M9 6h.01 M15 6h.01 M9 12h.01 M15 12h.01 M9 18h.01 M15 18h.01',
  car: 'M4 16v-3.5L6 7.8A2 2 0 0 1 7.8 6.5h8.4A2 2 0 0 1 18 7.8l2 4.7V16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z M4.5 12.5h15 M7 17v2 M17 17v2 M7.5 14.8h.01 M16.5 14.8h.01',
  ferry: 'M4 17 3 13h18l-1.5 4 M6 13V9h12v4 M9 9V6h6v3 M3 20c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1',
  ship: 'M12 3v4 M7 7h10l1.5 5h-13L7 7Z M3.5 12h17l-2 6h-13l-2-6Z M3 21c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1',
  train: 'M7 3h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Z M5 10h14 M12 3v7 M8.5 14h.01 M15.5 14h.01 M8 17l-2 4 M16 17l2 4',
  bus: 'M6 4h12a2 2 0 0 1 2 2v11H4V6a2 2 0 0 1 2-2Z M4 11h16 M7.5 14.5h.01 M16.5 14.5h.01 M7 17v2.5 M17 17v2.5',
  question: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8 M12 16.8h.01',
  pin: 'M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  note: 'M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17l-1 3Z M14 8l3 3',
  umbrella: 'M3 12a9 9 0 0 1 18 0H3Z M12 3V2 M12 12v6.5a2 2 0 0 0 4 0',
  clip: 'm20 11.5-8.2 8.2a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.7-7.7',
  warning: 'M12 4 2.8 20h18.4L12 4Z M12 10v4.5 M12 17.3h.01',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  skip: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M6 18 18 6',
  circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  progress: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3.2 2',
  close: 'M6 6l12 12 M18 6 6 18',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8L12 3.5Z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  cloud: 'M7 19a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.5 4.8 4.8 0 0 1 17.5 19H7Z',
  cloudOff: 'M4 4l16 16 M9.5 5.2A6 6 0 0 1 18 9.5a4.8 4.8 0 0 1 2.2 7.7 M16 19H7a4.5 4.5 0 0 1-.6-9c.1-.5.3-1 .5-1.4',
  sync: 'M4 12a8 8 0 0 1 13.7-5.6L20 8.5 M20 4v4.5h-4.5 M20 12a8 8 0 0 1-13.7 5.6L4 15.5 M4 20v-4.5h4.5',
  scale: 'M12 4v16 M7 20h10 M5 7h14 M5 7l-2.5 6a2.8 2.8 0 0 0 5 0L5 7Z M19 7l-2.5 6a2.8 2.8 0 0 0 5 0L19 7Z',
  building: 'M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16 M15 10h3a1 1 0 0 1 1 1v10 M3 21h18 M8.5 8h3 M8.5 12h3 M8.5 16h3',
  sparkle: 'M12 3.5 13.8 9l5.7 1.9-5.7 1.9L12 18.5l-1.8-5.7-5.7-1.9L10.2 9 12 3.5Z',
} as const;

export type IconName = keyof typeof PATHS;

/** Senza `label` è decorativa e nascosta agli screen reader: serve un testo accanto. */
export function Icon({ name, label, filled }: { name: IconName; label?: string; filled?: boolean }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Bandiera norvegese: 22×16, croce nordica decentrata verso l'asta. */
export function FlagMark() {
  return (
    <svg className="flag" viewBox="0 0 22 16" aria-hidden="true">
      <rect width="22" height="16" style={{ fill: 'var(--rosso)' }} />
      <path d="M6 0h4v16H6zM0 6h22v4H0z" style={{ fill: 'var(--bianco)' }} />
      <path d="M7 0h2v16H7zM0 7h22v2H0z" style={{ fill: 'var(--blu)' }} />
    </svg>
  );
}

/** Stessa icona come testo, per i segnaposto della mappa. */
export const iconSvg = (name: IconName) =>
  `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${PATHS[name]}"/></svg>`;
