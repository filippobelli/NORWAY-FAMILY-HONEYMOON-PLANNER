import { FILE_COUNTRY } from '../data/country';
import { computeDays, formatDateIt } from './itinerary';
import type { Trip } from './types';
import { hasCoords, tripSummary, type SummaryOptions, type TripSummary } from './tripSummary';

// Esportazioni del viaggio in formati standard, generate sul dispositivo senza rete:
// calendario iCalendar (RFC 5545), GPX 1.1, KML 2.2, pacchetto offline HTML. Nessun orario viene inventato:
// gli eventi con orario esistono solo se l'orario è stato inserito; gli altri sono eventi di giornata intera.

// ---------- iCalendar ----------

/** Scarto dall'UTC (minuti) di un fuso IANA in un istante */
function offsetMin(tz: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(at);
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const local = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') === 24 ? 0 : g('hour'), g('minute'));
  return Math.round((local - at.getTime()) / 60000);
}

/**
 * Fuso del calendario: quello della nazione del viaggio (dal catalogo). Per i fusi dell'Europa centrale (CET/CEST,
 * regole UE) si scrive il VTIMEZONE; per gli altri gli orari si scrivono in UTC, calcolati dal fuso della nazione.
 */
function zoneInfo(tz: string): { cet: boolean } {
  try {
    const jan = offsetMin(tz, new Date(Date.UTC(2027, 0, 15, 12)));
    const jul = offsetMin(tz, new Date(Date.UTC(2027, 6, 15, 12)));
    return { cet: jan === 60 && jul === 120 };
  } catch {
    return { cet: false };
  }
}
const cetVtimezone = (tz: string) => [
  'BEGIN:VTIMEZONE',
  `TZID:${tz}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

/** «DTSTART;TZID=…:AAAAMMGGTHHMM00» per i fusi CET, altrimenti l'istante in UTC */
function localStamp(prop: string, tz: string, cet: boolean, date: string, time: string): string {
  const d = date.replace(/-/g, '');
  const t = time.replace(':', '');
  if (cet) return `${prop};TZID=${tz}:${d}T${t}00`;
  const guess = new Date(`${date}T${time}:00Z`);
  const utc = new Date(guess.getTime() - offsetMin(tz, guess) * 60000);
  return `${prop}:${utc.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`;
}

export const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const ymd = (iso: string) => iso.slice(0, 10).replace(/-/g, '');
const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const validTime = (t?: string) => (t && /^([01]\d|2[0-3]):[0-5]\d$/.test(t) ? t : undefined);

/** Righe al massimo di 75 byte (UTF-8), come vuole la RFC 5545, senza spezzare un carattere. */
export function foldIcsLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const max = out.length === 0 ? 75 : 74;
    if (bytes + b > max) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function tripToIcs(trip: Trip, now = new Date(), tz: string = FILE_COUNTRY.timezone): string {
  const { cet } = zoneInfo(tz);
  const days = computeDays(trip);
  const stamp = utcStamp(now);
  const uid = (k: string) => `${trip.id}-${k.replace(/[^A-Za-z0-9-]/g, '-')}@norvegia-2027`;
  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Norway Family Honeymoon Planner//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${icsText(trip.title || 'Norvegia 2027')}`, `X-WR-TIMEZONE:${tz}`, ...(cet ? cetVtimezone(tz) : [])];
  const event = (props: string[]) => lines.push('BEGIN:VEVENT', ...props, 'END:VEVENT');

  for (const d of days) {
    const place = (d.sleepStop ?? d.wakeStop)?.name;
    const plan = trip.days[d.key];
    const desc: string[] = [];
    if (trip.dateTentative) desc.push('Date provvisorie.');
    for (const l of d.legs) {
      const from = trip.stops.find((s) => s.id === l.fromStopId)?.name ?? '—';
      const to = trip.stops.find((s) => s.id === l.toStopId)?.name ?? '—';
      desc.push(`Trasferimento ${from} → ${to}`);
    }
    for (const a of plan?.activities ?? []) desc.push(`Attività: ${a.title || 'senza titolo'}`);
    if (plan?.notes) desc.push(`Note: ${plan.notes}`);
    const acc = d.sleepStop ? trip.accommodations.find((a) => a.id === d.sleepStop!.accommodationId) : undefined;
    desc.push(d.sleepStop ? `Notte: ${d.sleepStop.kind === 'a_bordo' ? 'a bordo' : `${d.sleepStop.name}${acc ? ` · ${acc.name}` : ' · alloggio da scegliere'}`}` : 'Ultimo giorno');
    const geo = d.sleepStop && hasCoords(d.sleepStop) ? [`GEO:${d.sleepStop.lat.toFixed(5)};${d.sleepStop.lng.toFixed(5)}`] : [];
    event([
      `UID:${uid(`giorno-${d.date}`)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(d.date)}`,
      `DTEND;VALUE=DATE:${ymd(new Date(Date.parse(`${d.date}T00:00:00Z`) + 86_400_000).toISOString())}`,
      `SUMMARY:${icsText(`Giorno ${d.index + 1}${place ? ` · ${place}` : ''}`)}`,
      `DESCRIPTION:${icsText(desc.join('\n'))}`,
      ...(place ? [`LOCATION:${icsText(place)}`] : []),
      ...geo,
      'TRANSP:TRANSPARENT',
    ]);
    // Traghetti, navi e mezzi con orario inserito: eventi con l'ora; senza orario restano nella descrizione
    for (const l of d.legs) {
      for (const s of l.segments) {
        const t = validTime(s.departureTime);
        if (!t || s.mode === 'strada' || s.mode === 'non_calcolato' || s.flightId) continue;
        event([
          `UID:${uid(`tratto-${s.id}`)}`,
          `DTSTAMP:${stamp}`,
          localStamp('DTSTART', tz, cet, d.date, t),
          ...(s.durationMin ? [`DURATION:PT${Math.round(s.durationMin)}M`] : []),
          `SUMMARY:${icsText(s.label)}`,
          `DESCRIPTION:${icsText(`Orario inserito a mano: verificalo sul sito dell'operatore.${s.source?.url ? `\nFonte: ${s.source.url}` : ''}`)}`,
        ]);
      }
    }
  }
  for (const f of trip.flights ?? []) {
    const t = validTime(f.departureTime);
    if (!f.selected || !f.date || !t) continue;
    const arr = validTime(f.arrivalTime);
    event([
      `UID:${uid(`volo-${f.id}`)}`,
      `DTSTAMP:${stamp}`,
      localStamp('DTSTART', tz, cet, f.date, t),
      ...(arr && arr > t ? [localStamp('DTEND', tz, cet, f.date, arr)] : []),
      `SUMMARY:${icsText(`Volo ${f.fromAirport} → ${f.toAirport}${f.flightNumber ? ` (${f.airline} ${f.flightNumber})` : ''}`)}`,
      `DESCRIPTION:${icsText(`Volo del ${formatDateIt(f.date)}. Orari inseriti a mano: verificali con la compagnia.`)}`,
    ]);
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

// ---------- GPX e KML ----------

export const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const num = (n: number) => n.toFixed(6);

export function tripToGpx(trip: Trip, now = new Date()): string {
  const stops = trip.stops.filter(hasCoords);
  const accs = trip.accommodations.filter((a) => hasCoords(a) && trip.stops.some((s) => s.accommodationId === a.id));
  const out: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="Norway Family Honeymoon Planner" xmlns="http://www.topografix.com/GPX/1/1">',
    `  <metadata><name>${xml(trip.title || 'Norvegia 2027')}</name><time>${now.toISOString()}</time></metadata>`,
  ];
  stops.forEach((s) => {
    const i = trip.stops.indexOf(s);
    out.push(`  <wpt lat="${num(s.lat)}" lon="${num(s.lng)}"><name>${xml(`${i + 1}. ${s.name}`)}</name><desc>${xml(s.nights === 0 ? 'Di passaggio' : `${s.nights} notti`)}</desc><type>Tappa</type></wpt>`);
  });
  for (const a of accs) out.push(`  <wpt lat="${num(a.lat!)}" lon="${num(a.lng!)}"><name>${xml(a.name)}</name>${a.address ? `<desc>${xml(a.address)}</desc>` : ''}<type>Alloggio</type></wpt>`);
  if (stops.length > 1) {
    out.push(`  <rte><name>${xml('Ordine delle tappe')}</name>`);
    for (const s of stops) out.push(`    <rtept lat="${num(s.lat)}" lon="${num(s.lng)}"><name>${xml(s.name)}</name></rtept>`);
    out.push('  </rte>');
  }
  // Tracciati stradali già calcolati: solo dove esistono, le linee rette tra tappe non sono tracciati
  for (const l of trip.legs) {
    const pts = l.segments.flatMap((s) => s.geometry ?? []).filter(([la, lo]) => Number.isFinite(la) && Number.isFinite(lo));
    if (pts.length < 2) continue;
    const from = trip.stops.find((s) => s.id === l.fromStopId)?.name ?? '';
    const to = trip.stops.find((s) => s.id === l.toStopId)?.name ?? '';
    out.push(`  <trk><name>${xml(`${from} → ${to}`)}</name><trkseg>`);
    for (const [la, lo] of pts) out.push(`    <trkpt lat="${num(la)}" lon="${num(lo)}"/>`);
    out.push('  </trkseg></trk>');
  }
  out.push('</gpx>');
  return out.join('\n') + '\n';
}

export function tripToKml(trip: Trip): string {
  const stops = trip.stops.filter(hasCoords);
  const out: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    '<Document>',
    `  <name>${xml(trip.title || 'Norvegia 2027')}</name>`,
    '  <Folder><name>Tappe</name>',
  ];
  stops.forEach((s) => {
    const i = trip.stops.indexOf(s);
    out.push(`    <Placemark><name>${xml(`${i + 1}. ${s.name}`)}</name><description>${xml(s.nights === 0 ? 'Di passaggio' : `${s.nights} notti`)}</description><Point><coordinates>${num(s.lng)},${num(s.lat)},0</coordinates></Point></Placemark>`);
  });
  out.push('  </Folder>');
  if (stops.length > 1) {
    out.push(`  <Placemark><name>${xml('Ordine delle tappe (linee rette, non strade)')}</name><LineString><tessellate>1</tessellate><coordinates>${stops.map((s) => `${num(s.lng)},${num(s.lat)},0`).join(' ')}</coordinates></LineString></Placemark>`);
  }
  out.push('</Document>', '</kml>');
  return out.join('\n') + '\n';
}

// ---------- Pacchetto offline (un solo file HTML) ----------

export function summaryToHtml(sum: TripSummary): string {
  const h = (s: string) => xml(s);
  const linkify = (s: string) => h(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
  const body = sum.sections
    .map(
      (sec) => `<section><h2>${h(sec.heading)}</h2>${
        sec.items.length === 0 ? `<p class="muted">${h(sec.empty ?? 'Nessun dato.')}</p>` : sec.items.map((it) => `<article><h3>${h(it.title)}</h3><ul>${it.lines.map((l) => `<li>${linkify(l)}</li>`).join('')}</ul></article>`).join('')
      }</section>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(sum.title)} · pacchetto offline</title>
<style>
:root{color-scheme:light dark}body{font:16px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;margin:0 auto;max-width:860px;padding:16px;color:#00205b;background:#fff}
h1{font-size:1.5rem;margin:0}h2{font-size:1.15rem;border-bottom:2px solid #ba0c2f;padding-bottom:4px;margin-top:28px}h3{font-size:1rem;margin:14px 0 4px}
ul{margin:0;padding-left:20px}.muted{color:#4a5468}.note{background:#e3eaf5;padding:10px 12px;border-radius:8px}a{color:#9b0a27;word-break:break-all}
@media (prefers-color-scheme:dark){body{background:#0b1426;color:#e3eaf5}.muted{color:#b7c2d6}.note{background:#16233d}a{color:#ff8fa5}}
@media print{body{max-width:none}a{color:inherit}}
</style></head><body>
<h1>${h(sum.title)}</h1><p class="muted">${h(sum.subtitle)}</p>
<p class="note">Pacchetto offline creato il ${h(new Date(sum.generatedAt).toLocaleString('it-IT'))}. Contiene solo i dati inseriti nel viaggio: non si aggiorna da solo. I link si aprono solo con la rete.</p>
${body}
</body></html>
`;
}

export function offlinePackage(trip: Trip, opts: SummaryOptions = {}): string {
  return summaryToHtml(tripSummary(trip, opts));
}

/** Nome di file sicuro, senza caratteri accentati problematici per alcuni sistemi. */
export function exportFileName(trip: Trip, ext: string, now = new Date()): string {
  const base = (trip.title || 'norvegia-2027')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[øØ]/g, 'o')
    .replace(/[æÆ]/g, 'ae')
    .replace(/[åÅ]/g, 'a')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${base || 'viaggio'}-${now.toISOString().slice(0, 10)}.${ext}`;
}
