import { iconSvg } from './icons';
import { useCatalog } from '../catalog/registry';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DESTINATIONS, findDestination } from '../data/destinations';
import { COUNTIES, REGION_COUNTIES } from '../data/regionShapes';
import { BASE_IDS } from '../domain/configurator';
import type { Region } from '../domain/types';
import { addBaseMap, loadLeaflet, type LeafletApi, type LLayerGroup, type LMap, type LPath } from '../services/map/leaflet';

// Blu per le regioni, rosso per quella evidenziata: Leaflet ha bisogno del colore esplicito
const BLU = '#2C5A68';
const ROSSO = '#C2462F';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

interface Props {
  /** Regioni da esplorare (comprese quelle degli aeroporti non tolte) */
  selected: Region[];
  /** Regioni dove si trovano gli aeroporti di arrivo e di ripartenza: si possono togliere */
  airportRegions: Region[];
  airportIds: string[];
  onToggle: (r: Region) => void;
}

export function RegionPicker({ selected, airportRegions, airportIds, onToggle }: Props) {
  const catalog = useCatalog();
  const regions = useMemo(() => Object.keys(catalog.regionCountry), [catalog.regionCountry]);
  const el = useRef<HTMLDivElement>(null);
  const ref = useRef<{ L: LeafletApi; map: LMap; marks: LLayerGroup; shapes: Map<Region, LPath[]> } | null>(null);
  const [state, setState] = useState<'caricamento' | 'pronta' | 'errore'>('caricamento');
  const [hover, setHover] = useState<Region | null>(null);
  const toggleRef = useRef(onToggle);
  toggleRef.current = onToggle;

  const info = useMemo(
    () =>
      Object.fromEntries(
        regions.map((r) => {
          const counties = COUNTIES.filter((c) => REGION_COUNTIES[r]?.includes(c.nr)).map((c) => c.name);
          const dests = DESTINATIONS.filter((d) => d.region === r && d.category !== 'aeroporti');
          const bases = BASE_IDS.map((id) => findDestination(id)).filter((d) => d && d.region === r).map((d) => d!.name);
          return [r, { counties, count: dests.length, bases, examples: dests.filter((d) => d.kidScore === 3 && !bases.includes(d.name)).slice(0, 4).map((d) => d.name) }];
        }),
      ) as Record<Region, { counties: string[]; count: number; bases: string[]; examples: string[] }>,
    [regions],
  );

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !el.current) return;
        const map = L.map(el.current, { scrollWheelZoom: false, zoomControl: true, zoomSnap: 0.25, zoomAnimation: false }).setView([65, 15], 4);
        // Le località scelte hanno già la loro etichetta: quelle del fondo si sovrapporrebbero
        void addBaseMap(L, map, () => cancelled, { labels: false });
        const shapes = new Map<Region, LPath[]>();
        for (const r of regions) {
          const list: LPath[] = [];
          for (const c of COUNTIES.filter((x) => REGION_COUNTIES[r]?.includes(x.nr))) {
            const p = L.polygon(c.rings, { color: BLU, weight: 1, fillOpacity: 0.1 }) as LPath;
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
          const points = DESTINATIONS.map((d) => [d.lat, d.lng] as [number, number]);
          if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [12, 12], maxZoom: 7 });
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
  }, [regions]);

  // Colori delle regioni scelte, località base e aeroporti
  useEffect(() => {
    const m = ref.current;
    if (!m || state !== 'pronta') return;
    const on = new Set<Region>(selected);
    for (const [r, list] of m.shapes) {
      const active = on.has(r);
      const lit = hover === r;
      for (const p of list) {
        p.setStyle({
          color: lit ? ROSSO : BLU,
          fillColor: BLU,
          weight: active || lit ? 2.5 : 1,
          opacity: active || lit ? 1 : 0.6,
          fillOpacity: active ? 0.38 : lit ? 0.22 : 0.06,
          // Regione dell'aeroporto tolta: bordo tratteggiato (ci si passa solo per arrivare o ripartire)
          dashArray: airportRegions.includes(r) && !active ? '6 4' : undefined,
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
        fillColor: active ? BLU : '#565F6B',
        fillOpacity: 1,
      });
      mk.bindTooltip(esc(d.name), { permanent: active, direction: 'right', offset: [6, 0], className: 'region-label' });
      mk.on('click', () => toggleRef.current(d.region));
      mk.addTo(m.marks);
    }
    for (const id of airportIds) {
      const a = findDestination(id);
      if (!a) continue;
      m.L.marker([a.lat, a.lng], {
        icon: m.L.divIcon({ className: 'airport-pin', html: iconSvg('plane'), iconSize: [22, 22] }),
        title: a.name,
      })
        .bindTooltip(esc(a.name), { direction: 'left' })
        .addTo(m.marks);
    }
  }, [selected, airportRegions, airportIds, hover, state]);

  const shown = hover ?? null;

  return (
    <div className="region-picker">
      <div className="map-box">
        <div ref={el} className="map region-map" role="region" aria-label="Mappa delle regioni e delle località del viaggio" />
        {state === 'caricamento' && <div className="map-overlay">Caricamento mappa…</div>}
        {state === 'errore' && <div className="map-overlay map-error">Mappa non disponibile: scegli le regioni dall'elenco.</div>}
      </div>
      <div className="region-list">
        <p className="muted small">
          Scegli le zone dall’elenco o tocca una località sulla mappa. Le zone degli aeroporti sono comprese all’inizio: puoi toglierle se vuoi passarci solo per il volo.
        </p>
        <ul>
          {regions.map((r) => {
            const on = selected.includes(r);
            const isAirport = airportRegions.includes(r);
            const i = info[r]!;
            return (
              <li key={r} className={`region-item ${on ? 'on' : ''} ${shown === r ? 'lit' : ''}`} onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)}>
                <label>
                  <input type="checkbox" checked={on} onChange={() => onToggle(r)} />
                  <strong>{r}</strong>
                  {isAirport && <span className="muted small">{on ? ' · aeroporto' : ' · solo aeroporto: arrivo o partenza, regione non esplorata'}</span>}
                </label>
                <div className="small muted">
                  {i.counties.length > 0 && `Contee: ${i.counties.join(', ')} · `}{i.count} {i.count === 1 ? 'luogo' : 'luoghi'} da visitare nel catalogo
                </div>
                {i.bases.length > 0 && <div className="small">Dove dormire: {i.bases.join(', ')}</div>}
                {i.examples.length > 0 && <div className="small muted">Per i bambini: {i.examples.join(', ')}</div>}
              </li>
            );
          })}
        </ul>
        <p className="muted small">{COUNTIES.length ? 'Confini disponibili: Kartverket, contee norvegesi 2024 semplificate. ' : ''}Per le zone senza confini cartografici sono mostrate le località del catalogo.</p>
      </div>
    </div>
  );
}
