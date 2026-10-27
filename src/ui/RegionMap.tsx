import { useEffect, useMemo, useRef, useState } from 'react';
import { DESTINATIONS, findDestination } from '../data/destinations';
import { COUNTIES, REGION_COUNTIES } from '../data/regionShapes';
import { BASE_IDS } from '../domain/configurator';
import type { Region } from '../domain/types';
import { loadLeaflet, TILE_OPTIONS, TILE_URL, type LeafletApi, type LLayerGroup, type LMap, type LPath } from '../services/map/leaflet';

export const REGIONS: Region[] = ['Oslo e Østlandet', 'Innlandet e montagne', 'Fiordi occidentali', 'Sørlandet e Rogaland', 'Trøndelag', 'Nordland e Lofoten', 'Troms e Finnmark'];

/** Un colore per regione, distinguibile anche sopra la mappa topografica */
export const REGION_COLOR: Record<Region, string> = {
  'Oslo e Østlandet': '#2563eb',
  'Innlandet e montagne': '#16a34a',
  'Fiordi occidentali': '#0891b2',
  'Sørlandet e Rogaland': '#ea580c',
  Trøndelag: '#9333ea',
  'Nordland e Lofoten': '#dc2626',
  'Troms e Finnmark': '#ca8a04',
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

interface Props {
  selected: Region[];
  /** Regioni sempre comprese perché lì ci sono gli aeroporti */
  forced: Region[];
  airportIds: string[];
  onToggle: (r: Region) => void;
}

export function RegionPicker({ selected, forced, airportIds, onToggle }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const ref = useRef<{ L: LeafletApi; map: LMap; marks: LLayerGroup; shapes: Map<Region, LPath[]> } | null>(null);
  const [state, setState] = useState<'caricamento' | 'pronta' | 'errore'>('caricamento');
  const [hover, setHover] = useState<Region | null>(null);
  const toggleRef = useRef(onToggle);
  toggleRef.current = onToggle;

  const info = useMemo(
    () =>
      Object.fromEntries(
        REGIONS.map((r) => {
          const counties = COUNTIES.filter((c) => REGION_COUNTIES[r].includes(c.nr)).map((c) => c.name);
          const dests = DESTINATIONS.filter((d) => d.region === r && d.category !== 'aeroporti');
          const bases = BASE_IDS.map((id) => findDestination(id)).filter((d) => d && d.region === r).map((d) => d!.name);
          return [r, { counties, count: dests.length, bases, examples: dests.filter((d) => d.kidScore === 3 && !bases.includes(d.name)).slice(0, 4).map((d) => d.name) }];
        }),
      ) as Record<Region, { counties: string[]; count: number; bases: string[]; examples: string[] }>,
    [],
  );

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !el.current) return;
        const map = L.map(el.current, { scrollWheelZoom: false, zoomControl: true, zoomSnap: 0.25 }).setView([65, 15], 4);
        L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
        const shapes = new Map<Region, LPath[]>();
        for (const r of REGIONS) {
          const list: LPath[] = [];
          for (const c of COUNTIES.filter((x) => REGION_COUNTIES[r].includes(x.nr))) {
            const p = L.polygon(c.rings, { color: REGION_COLOR[r], weight: 1, fillOpacity: 0.1 }) as LPath;
            p.bindTooltip(`<strong>${esc(r)}</strong><br>${esc(c.name)}`, { sticky: true });
            p.on('click', () => toggleRef.current(r));
            p.on('mouseover', () => setHover(r));
            p.on('mouseout', () => setHover((h) => (h === r ? null : h)));
            p.addTo(map);
            list.push(p);
          }
          shapes.set(r, list);
        }
        const marks = L.layerGroup().addTo(map);
        // La mappa nasce dentro un pannello appena disegnato: si ricalcola la misura prima di inquadrare la Norvegia
        const fit = () => {
          map.invalidateSize();
          map.fitBounds(L.latLngBounds([[57.95, 4.5], [71.2, 31.1]]), { padding: [4, 4] });
        };
        fit();
        window.setTimeout(fit, 150);
        ref.current = { L, map, marks, shapes };
        setState('pronta');
      })
      .catch(() => !cancelled && setState('errore'));
    return () => {
      cancelled = true;
      ref.current?.map.remove();
      ref.current = null;
    };
  }, []);

  // Colori delle regioni scelte, località base e aeroporti
  useEffect(() => {
    const m = ref.current;
    if (!m || state !== 'pronta') return;
    const on = new Set<Region>([...selected, ...forced]);
    for (const [r, list] of m.shapes) {
      const active = on.has(r);
      const lit = hover === r;
      for (const p of list) {
        p.setStyle({
          color: REGION_COLOR[r],
          weight: active || lit ? 2.5 : 1,
          opacity: active || lit ? 1 : 0.6,
          fillOpacity: active ? 0.38 : lit ? 0.22 : 0.06,
          dashArray: forced.includes(r) && !selected.includes(r) ? '6 4' : undefined,
        });
        if (active) p.bringToFront();
      }
    }
    m.marks.clearLayers();
    for (const id of BASE_IDS) {
      const d = findDestination(id);
      if (!d) continue;
      const active = on.has(d.region);
      const mk = m.L.circleMarker([d.lat, d.lng], {
        radius: active ? 5 : 3,
        color: '#ffffff',
        weight: 1.5,
        fillColor: active ? REGION_COLOR[d.region] : '#64748b',
        fillOpacity: 1,
      });
      mk.bindTooltip(esc(d.name), { permanent: active, direction: 'right', offset: [6, 0], className: 'region-label' });
      mk.addTo(m.marks);
    }
    for (const id of airportIds) {
      const a = findDestination(id);
      if (!a) continue;
      m.L.marker([a.lat, a.lng], {
        icon: m.L.divIcon({ className: 'airport-pin', html: '✈', iconSize: [22, 22] }),
        title: a.name,
      })
        .bindTooltip(esc(a.name), { direction: 'left' })
        .addTo(m.marks);
    }
  }, [selected, forced, airportIds, hover, state]);

  const shown = hover ?? null;

  return (
    <div className="region-picker">
      <div className="map-box">
        <div ref={el} className="map region-map" role="region" aria-label="Mappa delle regioni della Norvegia" />
        {state === 'caricamento' && <div className="map-overlay">Caricamento mappa…</div>}
        {state === 'errore' && <div className="map-overlay map-error">Mappa non disponibile: scegli le regioni dall'elenco.</div>}
      </div>
      <div className="region-list">
        <p className="muted small">Tocca una regione sulla mappa o nell'elenco. Le regioni degli aeroporti sono sempre comprese (bordo tratteggiato).</p>
        <ul>
          {REGIONS.map((r) => {
            const on = selected.includes(r);
            const isForced = forced.includes(r);
            const i = info[r];
            return (
              <li key={r} className={`region-item ${on || isForced ? 'on' : ''} ${shown === r ? 'lit' : ''}`} onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)}>
                <label>
                  <input type="checkbox" checked={on || isForced} disabled={isForced && !on} onChange={() => onToggle(r)} />
                  <span className="swatch" style={{ background: REGION_COLOR[r] }} aria-hidden />
                  <strong>{r}</strong>
                  {isForced && <span className="muted small"> · aeroporto</span>}
                </label>
                <div className="small muted">
                  Contee: {i.counties.join(', ')} · {i.count} {i.count === 1 ? 'meta' : 'mete'} nel catalogo
                </div>
                {i.bases.length > 0 && <div className="small">Dove dormire: {i.bases.join(', ')}</div>}
                {i.examples.length > 0 && <div className="small muted">Per i bambini: {i.examples.join(', ')}</div>}
              </li>
            );
          })}
        </ul>
        <p className="muted small">Confini: Kartverket (contee 2024), semplificati.</p>
      </div>
    </div>
  );
}
