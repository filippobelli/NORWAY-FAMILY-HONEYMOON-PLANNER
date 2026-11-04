import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Trascinamento delle tappe con i pointer event: l'HTML5 drag and drop non funziona sui telefoni.
// Col mouse parte dopo pochi pixel; col dito serve tenere premuto, così l'elenco continua a scorrere.

const LONG_PRESS_MS = 350;
const MOUSE_SLOP = 5;
const TOUCH_SLOP = 8;

interface Drag {
  id: string;
  name: string;
  /** Tappe senza quella trascinata, nell'ordine attuale */
  others: string[];
  from: number;
  /** Posizione di arrivo */
  to: number;
  x: number;
  y: number;
}

export function useStopDrag({ axis, disabled, onDrop }: { axis: 'x' | 'y'; disabled?: boolean; onDrop: (id: string, to: number) => void }) {
  const [drag, setDrag] = useState<Drag | null>(null);
  // pending: dito appoggiato, in attesa della pressione lunga; active: trascinamento in corso
  const gesture = useRef<'idle' | 'pending' | 'active'>('idle');
  const cancel = useRef<() => void>(() => undefined);

  useEffect(() => {
    // Il dito non deve far scorrere la pagina durante il trascinamento. Va registrato prima del tocco:
    // aggiunto dopo, il browser avrebbe già deciso che il gesto è uno scorrimento.
    const onTouchMove = (e: TouchEvent) => {
      if (gesture.current === 'active' && e.cancelable) e.preventDefault();
    };
    const onContextMenu = (e: Event) => {
      if (gesture.current !== 'idle') e.preventDefault();
    };
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('contextmenu', onContextMenu);
    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('contextmenu', onContextMenu);
      cancel.current();
    };
  }, []);

  const press = (e: ReactPointerEvent<HTMLElement>, id: string, name: string) => {
    if (disabled || e.button !== 0 || gesture.current !== 'idle') return;
    const list = e.currentTarget.closest<HTMLElement>('[data-stop-list]');
    if (!list) return;
    const items = () => [...list.querySelectorAll<HTMLElement>(':scope > [data-stop-id]')];
    const ids = items().map((el) => el.dataset.stopId ?? '');
    const from = ids.indexOf(id);
    if (from < 0 || ids.length < 2) return;
    const others = ids.filter((x) => x !== id);

    const mouse = e.pointerType === 'mouse';
    const startX = e.clientX;
    const startY = e.clientY;
    let x = startX;
    let y = startY;
    let to = from;
    let frame = 0;
    let timer = 0;
    gesture.current = 'pending';

    const measure = () => {
      const c = axis === 'y' ? y : x;
      to = items().filter((el) => {
        if (el.dataset.stopId === id) return false;
        // Conta la riga della tappa, non i giorni e il tratto che le stanno sotto
        const r = (el.querySelector('button') ?? el).getBoundingClientRect();
        return (axis === 'y' ? r.top + r.height / 2 : r.left + r.width / 2) < c;
      }).length;
      setDrag({ id, name, others, from, to, x, y });
    };
    // Vicino ai bordi la vista scorre da sola, anche con il puntatore fermo
    const autoScroll = () => {
      if (axis === 'y') {
        const dy = y < 100 ? -10 : y > window.innerHeight - 90 ? 10 : 0;
        if (dy) window.scrollBy(0, dy);
        if (dy) measure();
      } else {
        const box = list.parentElement;
        if (box) {
          const r = box.getBoundingClientRect();
          const dx = x < r.left + 40 ? -10 : x > r.right - 40 ? 10 : 0;
          if (dx) box.scrollLeft += dx;
          if (dx) measure();
        }
      }
      frame = requestAnimationFrame(autoScroll);
    };
    const activate = () => {
      gesture.current = 'active';
      document.body.classList.add('stop-dragging');
      if (!mouse) navigator.vibrate?.(15);
      measure();
      frame = requestAnimationFrame(autoScroll);
    };
    const onMove = (ev: PointerEvent) => {
      x = ev.clientX;
      y = ev.clientY;
      if (gesture.current === 'active') return measure();
      const moved = Math.hypot(x - startX, y - startY);
      if (mouse && moved > MOUSE_SLOP) activate();
      else if (!mouse && moved > TOUCH_SLOP) finish(false); // è uno scorrimento
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') finish(false);
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const finish = (commit: boolean) => {
      const wasActive = gesture.current === 'active';
      gesture.current = 'idle';
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey);
      cancel.current = () => undefined;
      document.body.classList.remove('stop-dragging');
      setDrag(null);
      if (!wasActive) return;
      // Il rilascio non deve valere anche come clic sulla tappa
      const swallow = (ev: Event) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 300);
      if (commit && to !== from) onDrop(id, to);
    };
    cancel.current = () => finish(false);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
    if (!mouse) timer = window.setTimeout(activate, LONG_PRESS_MS);
  };

  /** Classi della riga: quella trascinata e la linea che indica dove finirà */
  const rowClass = (id: string): string => {
    if (!drag) return '';
    if (id === drag.id) return 'is-dragged';
    if (drag.to === drag.from) return '';
    if (drag.others[drag.to] === id) return 'drop-before';
    if (drag.to === drag.others.length && drag.others[drag.others.length - 1] === id) return 'drop-after';
    return '';
  };

  const ghost: ReactNode = drag
    ? createPortal(
        <div className="stop-drag-ghost" aria-hidden="true" style={{ left: drag.x + 12, top: drag.y + 12 }}>
          {drag.name}
        </div>,
        document.body,
      )
    : null;

  return { press, rowClass, ghost };
}
