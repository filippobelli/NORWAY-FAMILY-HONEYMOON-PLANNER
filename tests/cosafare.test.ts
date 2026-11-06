import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ATTRACTION_INFO } from '../src/data/attractions';
import { DESTINATIONS, findDestination } from '../src/data/destinations';
import { OFFICIAL_SITES } from '../src/data/officialSites';
import { WIKI } from '../src/data/wiki';
import { bookingsOverview } from '../src/domain/bookings';
import { createEmptyTrip } from '../src/domain/defaults';
import { syncLegs } from '../src/domain/itinerary';
import { mergeTrips, resolveConflicts } from '../src/domain/merge';
import { migrateDocument } from '../src/domain/migrations';
import { planImpact } from '../src/domain/planImpact';
import { addPersonalActivity, attractionsForStop, filterAttractions, missingInfo, planAttraction, plannedOf, removeIdea, saveIdea, stopDays, stopThings, unplanActivity } from '../src/domain/thingsToDo';
import { tripSummary } from '../src/domain/tripSummary';
import type { Stop, Trip } from '../src/domain/types';
import { activityInfo } from '../src/domain/verification';

const oslo = findDestination('oslo')!;
const stop = (id: string, name: string, nights: number, lat: number, lng: number, destinationId?: string): Stop => ({ id, kind: 'luogo', destinationId, name, lat, lng, nights, notes: '', weatherPlanB: '' });
function tripWith(stops: Stop[], patch: Partial<Trip> = {}): Trip {
  const t = { ...createEmptyTrip(), startDate: '2027-08-01', stops, ...patch };
  return { ...t, legs: syncLegs(t.stops, t.legs) };
}
const osloTrip = () => tripWith([stop('o', 'Oslo', 3, oslo.lat, oslo.lng, 'oslo'), stop('b', 'Bergen', 2, 60.392, 5.324, 'bergen')]);
const plain = (t: Trip) => JSON.stringify({ stops: t.stops.map((s) => ({ ...s, ideas: undefined })), days: t.days });

// ---------- Catalogo e fonti ----------

test('Schede di Oslo: solo voci del catalogo, con sito ufficiale, fonti datate, coordinate Wikidata e nessun orario o prezzo', () => {
  for (const [id, info] of Object.entries(ATTRACTION_INFO)) {
    const d = findDestination(id);
    assert.ok(d, `scheda senza voce nel catalogo: ${id}`);
    assert.equal(info.base, 'oslo');
    assert.ok(OFFICIAL_SITES[id]?.url.startsWith('https://'), `sito ufficiale: ${id}`);
    assert.ok(info.sources.length >= 2 && info.sources.every((s) => s.url?.startsWith('https://') && s.checkedAt), `fonti: ${id}`);
    assert.equal(d!.coordsStatus, 'verificate');
    assert.match(d!.sources[0]!.url!, /wikidata\.org\/wiki\/Q\d+|openstreetmap\.org/);
    // Nessun orario o prezzo copiato nella scheda
    assert.doesNotMatch(JSON.stringify(info) + d!.description, /\b\d{1,2}[:.]\d{2}\b|kr\b|NOK|€/, `orari o prezzi in ${id}`);
  }
  // Ogni immagine indicata ha un elemento Wikidata: autore e licenza si leggono da Commons prima di mostrarla
  for (const id of ['munch', 'kontiki', 'teknisk', 'holmenkollen', 'vigeland']) assert.ok(WIKI[id]?.qid && WIKI[id]?.image, id);
});

test('Luoghi per la tappa: associati a Oslo, distanza dichiarata, TusenFryd indicato fuori città', () => {
  const t = osloTrip();
  const list = attractionsForStop(t, 'o');
  const ids = list.map((a) => a.d.id);
  for (const id of ['fram', 'folkemuseum', 'munch', 'kontiki', 'vigeland', 'teknisk', 'holmenkollen', 'tusenfryd']) assert.ok(ids.includes(id), id);
  assert.ok(!ids.includes('oslo') && !ids.includes('osl'), 'né la città né l\'aeroporto sono attrazioni');
  const tf = list.find((a) => a.d.id === 'tusenfryd')!;
  assert.equal(tf.outside, true);
  assert.ok(tf.km > 15);
  assert.equal(list.find((a) => a.d.id === 'munch')!.outside, false);
  // Bergen: schede del catalogo vicine, segnate come non verificate
  const bergen = attractionsForStop(t, 'b');
  assert.ok(bergen.some((a) => a.d.id === 'bergen-aquarium' && !a.info));
  assert.ok(missingInfo(bergen.find((a) => a.d.id === 'bergen-aquarium')!).some((m) => /non ancora verificata/.test(m)));
});

test('Ricerca e filtri combinati; il conteggio corrisponde ai risultati', () => {
  const list = attractionsForStop(osloTrip(), 'o');
  assert.equal(filterAttractions(list, {}).length, list.length);
  const museums = filterAttractions(list, { categories: ['musei'] });
  assert.ok(museums.length > 0 && museums.every((a) => a.d.category === 'musei'));
  const q = filterAttractions(list, { q: 'heyerdahl' });
  assert.deepEqual(q.map((a) => a.d.id), ['kontiki']);
  const combo = filterAttractions(list, { categories: ['musei'], indoor: true, inCity: true, kids: true });
  assert.ok(combo.every((a) => a.d.category === 'musei' && a.d.kidScore === 3 && !a.outside && (a.info?.setting === 'al_coperto' || a.info?.setting === 'misto')));
  assert.ok(!filterAttractions(list, { inCity: true }).some((a) => a.d.id === 'tusenfryd'));
  assert.equal(filterAttractions(list, { q: 'nessun luogo così' }).length, 0);
  // «Al coperto» non include luoghi senza il dato
  assert.ok(filterAttractions(list, { indoor: true }).every((a) => a.info?.setting));
});

// ---------- Idee e pianificazione ----------

test('Salvare tra le idee non cambia il programma e non crea duplicati', () => {
  const t = osloTrip();
  const a = saveIdea(t, 'o', 'fram');
  assert.deepEqual(a.stops[0]!.ideas, ['fram']);
  assert.equal(plain(a), plain(t), 'tappe, notti e giornate invariate');
  assert.equal(saveIdea(a, 'o', 'fram'), a, 'nessun duplicato');
  assert.equal(saveIdea(t, 'o', 'non-esiste'), t);
  assert.equal(removeIdea(a, 'o', 'fram').stops[0]!.ideas!.length, 0);
});

test('Pianificare: solo giornate della tappa, attività collegata alla scheda, idea tolta, spostamento senza duplicati', () => {
  const t = saveIdea(osloTrip(), 'o', 'fram');
  const days = stopDays(t, 'o');
  assert.deepEqual(days.map((d) => d.index), [0, 1, 2]);
  // Giornata di un'altra tappa: rifiutata
  const bergenDay = stopDays(t, 'b')[0]!.key;
  assert.equal(planAttraction(t, 'o', 'fram', bergenDay), t);
  const p = planAttraction(t, 'o', 'fram', days[1]!.key);
  const act = p.days[days[1]!.key]!.activities[0]!;
  assert.equal(act.destinationId, 'fram');
  assert.equal(act.title, 'Museo Fram');
  assert.equal(act.durationMin, undefined, 'la durata resta la stima del catalogo');
  assert.deepEqual(p.stops[0]!.ideas, [], 'non è insieme idea e pianificata');
  assert.equal(stopThings(p, 'o').planned.length, 1);
  // Cambia giornata: stessa attività, nessuna copia
  const moved = planAttraction(p, 'o', 'fram', days[2]!.key);
  assert.equal(moved.days[days[1]!.key]!.activities.length, 0);
  assert.equal(moved.days[days[2]!.key]!.activities[0]!.id, act.id);
  assert.equal(planAttraction(moved, 'o', 'fram', days[2]!.key), moved, 'stesso giorno: nessun cambiamento');
  // Rimuovi dal giorno: torna tra le idee, la scheda resta
  const back = unplanActivity(moved, 'o', act.id);
  assert.equal(back.days[days[2]!.key]!.activities.length, 0);
  assert.deepEqual(back.stops[0]!.ideas, ['fram']);
  assert.ok(findDestination('fram'));
});

test('Pianificato non è prenotato, verificato né visitato', () => {
  const p = planAttraction(osloTrip(), 'o', 'munch', stopDays(osloTrip(), 'o')[0]!.key);
  const act = plannedOf(p, 'o', 'munch')!.activity;
  assert.equal(act.costStatus, 'da_verificare');
  assert.equal(activityInfo(act).state, 'da_verificare');
  assert.equal(p.actuals?.activities[act.id], undefined);
  assert.ok(!bookingsOverview(p).rows.some((r) => r.title.includes('MUNCH')), 'le attività non compaiono come prenotazioni');
});

test('Attività personale: nessuna scheda né fonte inventata; resta personale', () => {
  const t = osloTrip();
  const k = stopDays(t, 'o')[0]!.key;
  const p = addPersonalActivity(t, k, '  Pomeriggio di riposo ');
  const a = p.days[k]!.activities[0]!;
  assert.equal(a.title, 'Pomeriggio di riposo');
  assert.equal(a.destinationId, undefined);
  assert.equal(stopThings(p, 'o').personal.length, 1);
  assert.equal(stopThings(p, 'o').planned.length, 0);
  assert.equal(addPersonalActivity(t, k, '   '), t);
  assert.equal(DESTINATIONS.length, new Set(DESTINATIONS.map((d) => d.id)).size, 'nessuna scheda nuova nel catalogo');
});

// ---------- Compatibilità, sincronizzazione, Piano B ----------

test('Viaggi salvati prima: senza idee si leggono, le attività personali restano personali', () => {
  const t = tripWith([stop('o', 'Oslo', 2, oslo.lat, oslo.lng, 'oslo')]);
  const old = { ...t, days: { 'o#0': { activities: [{ id: 'x', title: 'Cena con amici', costStatus: 'stimato' }, { id: 'y', title: 'Museo Fram', destinationId: 'fram', costStatus: 'da_verificare' }], notes: '', planB: '' } } };
  const doc = migrateDocument(JSON.parse(JSON.stringify(old))) as unknown as Trip;
  const th = stopThings(doc, 'o');
  assert.deepEqual(th.personal.map((p) => p.activity.title), ['Cena con amici']);
  assert.deepEqual(th.planned.map((p) => p.activity.destinationId), ['fram']);
  assert.equal(th.ideas.length, 0);
  // Idea che punta a una scheda non più esistente: ignorata, nessun errore
  const broken = { ...doc, stops: doc.stops.map((s) => ({ ...s, ideas: ['sparita'] })) };
  assert.equal(stopThings(broken, 'o').ideas.length, 0);
});

test('Sincronizzazione ed esportazione: riferimenti conservati, nessuna duplicazione', () => {
  const base = osloTrip();
  const local = saveIdea(base, 'o', 'fram');
  const remote = { ...base, title: 'Rinominato altrove' };
  const m = mergeTrips(base, local, remote);
  const merged = m.conflicts.length ? resolveConflicts(m, {}) : m.trip;
  assert.deepEqual(merged.stops[0]!.ideas, ['fram']);
  const twice = saveIdea(saveIdea(merged, 'o', 'fram'), 'o', 'fram');
  assert.deepEqual(twice.stops[0]!.ideas, ['fram']);
  const json = JSON.parse(JSON.stringify(planAttraction(local, 'o', 'fram', 'o#0'))) as Trip;
  assert.equal(json.days['o#0']!.activities[0]!.destinationId, 'fram');
  assert.ok(tripSummary(saveIdea(base, 'o', 'munch')).sections.find((s) => s.id === 'tappe')!.items[0]!.lines.some((l) => /Idee salvate.*MUNCH/.test(l)));
});

test('Piano B: le idee delle tappe tolte e le visite senza giornata compaiono nel confronto', () => {
  const t = planAttraction(saveIdea(osloTrip(), 'o', 'munch'), 'o', 'fram', 'o#1');
  const without = { ...t, stops: t.stops.filter((s) => s.id !== 'o') };
  const i = planImpact(t, { ...without, legs: syncLegs(without.stops, without.legs) });
  assert.ok(i.ideasLost.some((x) => /Oslo: 1 idea/.test(x)));
  assert.ok(i.unassigned.includes('Museo Fram'));
});
