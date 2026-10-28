import { useEffect, useRef, useState } from 'react';
import { DESTINATIONS } from '../data/destinations';
import { coastalRoute } from '../domain/coastal';
import type { TransportMode, Trip } from '../domain/types';
import { loadLeaflet, TILE_OPTIONS, TILE_URL, type LeafletApi, type LLayerGroup, type LMap } from '../services/map/leaflet';
import { isAutoSegment } from '../domain/routeMerge';
import { MODE_COLOR, MODE_LABEL } from './common';

interface Props {
  trip: Trip;
  onAddDestination?: (destinationId: string) => void;
  height?: number;
  /** Tappa evidenziata: la mappa la centra */
  selectedStopId?: string;
  onSelectStop?: (stopId: string) => void;
}

/** Legenda: i mezzi principali sempre, bus e aereo solo se presenti nel viaggio. */
function legendModes(trip: Trip): TransportMode[] {
  const used = new Set(trip.legs.flatMap((l) => l.segments.map((s) => s.mode)));
  return (['strada', 'traghetto', 'costiera', 'treno', 'bus', 'aereo', 'non_calcolato'] as const).filter((m) => (m !== 'bus' && m !== 'aereo') || used.has(m));
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

export function MapView({ trip, onAddDestination, height, selectedStopId, onSelectStop }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ L: LeafletApi; map: LMap; layer: LLayerGroup } | null>(null);
  const [state, setState] = useState<'caricamento' | 'pronta' | 'errore'>('caricamento');
  const [error, setError] = useState('');
  const fitted = useRef(false);
  const addRef = useRef(onAddDestination);
  addRef.current = onAddDestination;
  const selectRef = useRef(onSelectStop);
  selectRef.current = onSelectStop;

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !el.current) return;
        const map = L.map(el.current, { scrollWheelZoom: true, zoomControl: true }).setView([65, 15], 4);
        L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
        const layer = L.layerGroup().addTo(map);
        mapRef.current = { L, map, layer };
        setState('pronta');
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError((e as Error).message);
          setState('errore');
        }
      });
    return () => {
      cancelled = true;
      mapRef.current?.map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const m = mapRef.current;
    if (!m || state !== 'pronta') return;
    const { L, map, layer } = m;
    layer.clearLayers();
    const pts: [number, number][] = [];
    const usedDest = new Set(trip.stops.map((s) => s.destinationId).filter(Boolean));

    if (trip.settings.showCatalogOnMap) {
      for (const d of DESTINATIONS) {
        if (usedDest.has(d.id)) continue;
        const marker = L.circleMarker([d.lat, d.lng], {
          radius: 5,
          color: '#475569',
          weight: 1,
          fillColor: '#cbd5e1',
          fillOpacity: 0.9,
        });
        const box = document.createElement('div');
        box.className = 'map-popup';
        box.innerHTML = `<strong>${esc(d.name)}</strong><br><small>${esc(d.region)} · posizione ${d.coordsStatus === 'verificate' ? 'verificata su OSM' : 'approssimativa'}</small>`;
        if (addRef.current) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn btn-small';
          btn.textContent = 'Aggiungi all\'itinerario';
          btn.onclick = () => addRef.current?.(d.id);
          box.appendChild(btn);
        }
        marker.bindPopup(box).bindTooltip(esc(d.name)).addTo(layer);
      }
    }

    const byId = new Map(trip.stops.map((s, i) => [s.id, { s, i }]));
    for (const leg of trip.legs) {
      const a = byId.get(leg.fromStopId);
      const b = byId.get(leg.toStopId);
      if (!a || !b) continue;
      // Tratto collegato alla tappa selezionata: più spesso, così si vede dove entra ed esce
      const touched = Boolean(selectedStopId) && (leg.fromStopId === selectedStopId || leg.toStopId === selectedStopId);
      const ends = `${a.i + 1}. ${esc(a.s.name)} → ${b.i + 1}. ${esc(b.s.name)}`;
      let drewGeometry = false;
      for (const seg of leg.segments) {
        if (seg.geometry && seg.geometry.length > 1) {
          L.polyline(seg.geometry, {
            color: MODE_COLOR[seg.mode],
            weight: touched ? 6 : 4,
            opacity: 0.85,
            dashArray: seg.mode === 'traghetto' ? '8 6' : undefined,
          })
            .bindTooltip(
              `${ends}<br>${esc(seg.label)}${seg.distanceKm ? ` · ${seg.distanceKm} km` : ''} · ${isAutoSegment(seg) ? 'calcolato (OSRM)' : 'tracciato inserito a mano'}`,
            )
            .addTo(layer);
          drewGeometry = true;
        } else if (seg.mode === 'costiera' && seg.coastalOptionId) {
          const o = trip.coastalOptions.find((x) => x.id === seg.coastalOptionId);
          const r = o ? coastalRoute(o.direction, o.fromPort, o.toPort) : undefined;
          if (r?.valid) {
            L.polyline(
              r.ports.map((p) => [p.lat, p.lng] as [number, number]),
              { color: MODE_COLOR.costiera, weight: 4, dashArray: '2 8', opacity: 0.9 },
            )
              .bindTooltip(`${ends}<br>${esc(seg.label)} (tracciato indicativo tra i porti)`)
              .addTo(layer);
            drewGeometry = true;
          }
        }
      }
      if (!drewGeometry) {
        const mode = leg.segments[0]?.mode ?? 'non_calcolato';
        L.polyline(
          [
            [a.s.lat, a.s.lng],
            [b.s.lat, b.s.lng],
          ],
          { color: MODE_COLOR[mode], weight: touched ? 3 : 2, dashArray: '1 7', opacity: 0.9 },
        )
          .bindTooltip(
            mode === 'non_calcolato'
              ? `${ends}<br>Collegamento non calcolato: linea indicativa, NON è una distanza stradale`
              : `${ends}<br>${MODE_LABEL[mode]}: tracciato non disponibile (linea indicativa)`,
          )
          .addTo(layer);
      }
    }

    trip.stops.forEach((s, i) => {
      pts.push([s.lat, s.lng]);
      const icon = L.divIcon({
        className: 'stop-pin-wrap',
        html: `<span class="stop-pin ${s.kind === 'a_bordo' ? 'stop-pin-ship' : ''} ${s.id === selectedStopId ? 'stop-pin-selected' : ''}">${i + 1}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([s.lat, s.lng], { icon, zIndexOffset: s.id === selectedStopId ? 2000 : 1000 })
        .bindTooltip(`${i + 1}. ${esc(s.name)} · ${s.nights} ${s.nights === 1 ? 'notte' : 'notti'}`)
        .on('click', () => selectRef.current?.(s.id))
        .addTo(layer);
    });

    if (pts.length > 0 && !fitted.current) {
      const b = L.latLngBounds(pts);
      if (b.isValid()) {
        map.fitBounds(b, { padding: [40, 40], maxZoom: 8 });
        fitted.current = true;
      }
    }
    if (pts.length === 0) fitted.current = false;
  }, [trip, state, selectedStopId]);

  // Centra la tappa selezionata (senza allontanare se si è già più vicini)
  useEffect(() => {
    const m = mapRef.current;
    if (!m || state !== 'pronta' || !selectedStopId) return;
    const s = trip.stops.find((x) => x.id === selectedStopId);
    if (s) m.map.setView([s.lat, s.lng], Math.max(m.map.getZoom(), 8));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStopId, state]);

  return (
    <div className="map-wrap">
      <div className="map-box">
        <div ref={el} className={height ? 'map' : 'map map-tall'} style={height ? { height } : undefined} role="region" aria-label="Mappa del viaggio" />
        {state === 'caricamento' && <div className="map-overlay">Caricamento mappa…</div>}
        {state === 'errore' && (
          <div className="map-overlay map-error" role="alert">
            <strong>Mappa non disponibile</strong>
            <span>{error}</span>
            <span>Il resto dell'app funziona: tappe, tratti e budget restano modificabili.</span>
          </div>
        )}
      </div>
      <div className="legend" aria-label="Legenda">
        {legendModes(trip).map((m) => (
          <span key={m}>
            <i style={{ background: MODE_COLOR[m] }} /> {MODE_LABEL[m]}
          </span>
        ))}
      </div>
    </div>
  );
}
