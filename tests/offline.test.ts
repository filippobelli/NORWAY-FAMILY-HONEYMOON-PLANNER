import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDiaryEntry, newDiaryEntry, setStopState, stopState, visibleDiary } from '../src/domain/actuals';
import { createEmptyTrip, normalizeTrip } from '../src/domain/defaults';
import { syncLegs } from '../src/domain/itinerary';
import { mergeTrips, resolveConflicts } from '../src/domain/merge';
import type { Stop, Trip } from '../src/domain/types';
import { adoptMerged, clearSyncState, enqueue, getLastSync, getOwner, getPending, holdForOwner, purgeTripData, pushOnce, readBase, restoreHold, setOwner, writeBase, type Kv, type SyncTransport } from '../src/services/storage/syncEngine';
import { loadLocalTrip, saveLocalTrip } from '../src/services/storage/local';

const stop = (id: string, name: string, nights = 2): Stop => ({ id, kind: 'luogo', name, lat: 60, lng: 7, nights, notes: '', weatherPlanB: '' });
function trip(): Trip {
  const stops = [stop('a', 'Oslo'), stop('b', 'Bergen')];
  return { ...createEmptyTrip(), id: 'viaggio', startDate: '2027-08-01', stops, legs: syncLegs(stops, []) };
}

/** Archivio locale con interfaccia Storage e limite facoltativo: simula spazio esaurito. */
class Mem implements Kv {
  m = new Map<string, string>();
  limit = Infinity;
  get length() {
    return this.m.size;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    let size = v.length + k.length;
    for (const [a, b] of this.m) if (a !== k) size += a.length + b.length;
    if (size > this.limit) throw new DOMException('Spazio esaurito', 'QuotaExceededError');
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

/** Server simulato: stessa regola del salvataggio condizionato su `updated_at`. */
class Server implements SyncTransport {
  row?: { trip: Trip; updated_at: string };
  writes = 0;
  clock = 0;
  offline = false;
  loseNextResponse = false;
  now() {
    return `2027-01-01T00:00:${String(++this.clock).padStart(2, '0')}Z`;
  }
  async getMeta() {
    if (this.offline) throw new Error('offline');
    return this.row ? { updated_at: this.row.updated_at, lastMutationId: this.row.trip.lastMutationId } : undefined;
  }
  async load() {
    if (!this.row) throw new Error('assente');
    return { trip: normalizeTrip(JSON.parse(JSON.stringify(this.row.trip))), updatedAt: this.row.updated_at };
  }
  async save(t: Trip, known: string | undefined) {
    if (this.offline) throw new Error('offline');
    if (known ? this.row?.updated_at !== known : Boolean(this.row)) return { kind: 'conflitto' as const };
    this.row = { trip: JSON.parse(JSON.stringify(t)) as Trip, updated_at: this.now() };
    this.writes++;
    if (this.loseNextResponse) {
      this.loseNextResponse = false;
      throw new Error('risposta persa');
    }
    return { kind: 'salvato' as const, updatedAt: this.row.updated_at };
  }
}

test('Offline: la modifica sopravvive alla riapertura e si sincronizza una sola volta', async () => {
  const kv = new Mem();
  const srv = new Server();
  const t = setStopState(trip(), 'a', 'visitata');
  srv.offline = true;
  assert.equal(enqueue(kv, t.id), true);
  await assert.rejects(pushOnce(kv, srv, t));
  assert.ok(getPending(kv, t.id), 'resta in coda dopo l\'errore di rete');
  // Riapertura: la coda è nell'archivio, non in memoria
  const reopened = new Mem();
  reopened.m = new Map(kv.m);
  srv.offline = false;
  assert.equal((await pushOnce(reopened, srv, t)).kind, 'salvato');
  assert.equal(srv.writes, 1);
  assert.equal(getPending(reopened, t.id), undefined);
  assert.equal((await pushOnce(reopened, srv, t)).kind, 'niente', 'nessun secondo invio');
  assert.equal(srv.writes, 1);
  assert.equal(stopState(srv.row!.trip, 'a'), 'visitata');
});

test('Sincronizzazione idempotente: risposta persa, nessun doppio salvataggio né falso conflitto', async () => {
  const kv = new Mem();
  const srv = new Server();
  const t = trip();
  enqueue(kv, t.id);
  srv.loseNextResponse = true;
  await assert.rejects(pushOnce(kv, srv, t));
  assert.equal(srv.writes, 1, 'il salvataggio è arrivato');
  assert.equal(getLastSync(kv, t.id), undefined, 'ma qui non si sa');
  const r = await pushOnce(kv, srv, t);
  assert.deepEqual(r, { kind: 'salvato', updatedAt: srv.row!.updated_at, ownEarlierWrite: true });
  assert.equal(srv.writes, 1, 'riconosciuta la propria scrittura');
  assert.equal(getPending(kv, t.id), undefined);
  assert.equal(getLastSync(kv, t.id), srv.row!.updated_at);
});

test('Sincronizzazione: risposta persa e nuova modifica nel frattempo, si invia la più recente', async () => {
  const kv = new Mem();
  const srv = new Server();
  const t = trip();
  enqueue(kv, t.id);
  await pushOnce(kv, srv, t);
  const t2 = { ...t, title: 'Primo' };
  enqueue(kv, t.id);
  srv.loseNextResponse = true;
  await assert.rejects(pushOnce(kv, srv, t2));
  const t3 = { ...t2, title: 'Secondo' };
  enqueue(kv, t.id);
  const r = await pushOnce(kv, srv, t3);
  assert.equal(r.kind, 'salvato');
  assert.equal(srv.row!.trip.title, 'Secondo');
  assert.equal(srv.writes, 3);
  assert.equal(getPending(kv, t.id), undefined);
});

test('Conflitti: voci di diario indipendenti si uniscono senza chiedere', async () => {
  const srv = new Server();
  const a = new Mem();
  const b = new Mem();
  const t = trip();
  enqueue(a, t.id);
  await pushOnce(a, srv, t);
  b.m = new Map(a.m);
  const fromB = addDiaryEntry(t, newDiaryEntry({ text: 'Da B' }));
  enqueue(b, t.id);
  await pushOnce(b, srv, fromB);
  const fromA = addDiaryEntry(t, newDiaryEntry({ text: 'Da A' }));
  enqueue(a, t.id);
  const r = await pushOnce(a, srv, fromA);
  assert.equal(r.kind, 'unito');
  if (r.kind !== 'unito') return;
  assert.deepEqual(visibleDiary(r.merge.trip).map((e) => e.text).sort(), ['Da A', 'Da B']);
  adoptMerged(a, r.merge.trip, r.merge.remote, r.remoteUpdatedAt);
  assert.equal((await pushOnce(a, srv, r.merge.trip)).kind, 'salvato');
  assert.equal(visibleDiary(srv.row!.trip).length, 2);
});

test('Conflitti tra dispositivi: ordine cambiato su entrambi, nessuna sovrascrittura finché non si sceglie', async () => {
  const srv = new Server();
  const a = new Mem();
  const b = new Mem();
  const t = trip();
  enqueue(a, t.id);
  await pushOnce(a, srv, t);
  b.m = new Map(a.m);
  const onB: Trip = { ...t, stops: [...t.stops].reverse(), title: t.title };
  enqueue(b, t.id);
  await pushOnce(b, srv, onB);
  const written = srv.writes;
  const onA: Trip = { ...t, stops: t.stops.map((s) => (s.id === 'a' ? { ...s, nights: 5 } : s)) };
  enqueue(a, t.id);
  const r = await pushOnce(a, srv, onA);
  assert.equal(r.kind, 'conflitto');
  assert.equal(srv.writes, written, 'nessuna scrittura');
  assert.deepEqual(srv.row!.trip.stops.map((s) => s.id), ['b', 'a'], 'il cloud è intatto');
  assert.ok(getPending(a, t.id), 'la modifica locale resta in coda');
  if (r.kind !== 'conflitto') return;
  assert.deepEqual(r.merge.conflicts.map((c) => c.id), ['piano']);
  assert.match(r.merge.conflicts[0]!.qui, /Oslo → Bergen/);
  assert.match(r.merge.conflicts[0]!.cloud, /Bergen → Oslo/);
  const mine = resolveConflicts(r.merge, { piano: 'qui' });
  assert.equal(mine.stops[0]!.nights, 5);
  const theirs = resolveConflicts(r.merge, { piano: 'cloud' });
  assert.deepEqual(theirs.stops.map((s) => s.id), ['b', 'a']);
  adoptMerged(a, mine, r.merge.remote, r.remoteUpdatedAt);
  assert.equal((await pushOnce(a, srv, mine)).kind, 'salvato');
  assert.equal(srv.row!.trip.stops[0]!.nights, 5);
});

test('Unione: dati indipendenti, stati di visita, senza base, impostazioni automatiche', () => {
  const base = trip();
  const local = { ...setStopState(base, 'a', 'visitata'), favorites: ['x'] };
  const remote = { ...setStopState(base, 'b', 'saltata'), favorites: ['y'], settings: { ...base.settings, nokPerEur: 11 } };
  const m = mergeTrips(base, local, remote);
  assert.deepEqual(m.conflicts, []);
  assert.equal(stopState(m.trip, 'a'), 'visitata');
  assert.equal(stopState(m.trip, 'b'), 'saltata');
  assert.deepEqual(m.trip.favorites, ['x', 'y']);
  assert.equal(m.trip.settings.nokPerEur, 11, 'il cambio automatico non è una scelta');
  // Stessa tappa in due stati diversi: si sceglie
  const c = mergeTrips(base, setStopState(base, 'a', 'visitata'), setStopState(base, 'a', 'saltata'));
  assert.deepEqual(c.conflicts.map((x) => x.id), ['tappa:a']);
  assert.equal(stopState(resolveConflicts(c, { 'tappa:a': 'cloud' }), 'a'), 'saltata');
  assert.equal(stopState(resolveConflicts(c, {}), 'a'), 'visitata');
  // Stessa voce modificata in due modi: restano entrambe
  const e = newDiaryEntry({ text: 'Originale' });
  const withE = addDiaryEntry(base, e);
  const edit = (x: string): Trip => ({ ...withE, diary: [{ ...e, text: x, updatedAt: 'z' }] });
  const d = mergeTrips(withE, edit('Mia'), edit('Sua'));
  assert.deepEqual(d.conflicts, []);
  assert.deepEqual(visibleDiary(d.trip).map((v) => v.text.split('\n')[0]).sort(), ['Mia', 'Sua']);
  // Voce eliminata su un lato: non ricompare
  const del = mergeTrips(withE, { ...withE, diary: [{ ...e, deletedAt: 'z', updatedAt: 'z' }] }, withE);
  assert.equal(visibleDiary(del.trip).length, 0);
  // Senza copia di base non si può sapere chi ha cambiato: si chiede, ma il diario si unisce
  const noBase = mergeTrips(undefined, { ...base, title: 'Mio' }, addDiaryEntry({ ...base, title: 'Suo' }, e));
  assert.deepEqual(noBase.conflicts.map((x) => x.id), ['titolo']);
  assert.equal(visibleDiary(noBase.trip).length, 1);
});

test('Cloud: riga assente o di un altro account non genera tentativi infiniti', async () => {
  const kv = new Mem();
  const srv = new Server();
  const t = trip();
  enqueue(kv, t.id);
  await pushOnce(kv, srv, t);
  srv.row = undefined;
  enqueue(kv, t.id);
  assert.equal((await pushOnce(kv, srv, t)).kind, 'assente');
  assert.equal(getLastSync(kv, t.id), undefined);
  assert.equal((await pushOnce(kv, srv, t)).kind, 'salvato', 'ricreato');
  // INSERT rifiutato e riga invisibile: è di un altro utente
  const other = new Mem();
  enqueue(other, t.id);
  const hidden: SyncTransport = { getMeta: async () => undefined, load: srv.load.bind(srv), save: async () => ({ kind: 'conflitto' }) };
  assert.equal((await pushOnce(other, hidden, t)).kind, 'inaccessibile');
});

test('Logout: nessun dato del viaggio resta per chi accede dopo; le modifiche si vedono prima', () => {
  const kv = new Mem();
  const t = trip();
  kv.setItem('nfhp.trip.v1', JSON.stringify(t));
  kv.setItem('nfhp.trip.v1.backup', 'x');
  kv.setItem('nfhp.configurator.v1', '{}');
  kv.setItem('nfhp.cloud.config', 'cfg');
  kv.setItem('nfhp.wiki.intro.q', 'pubblico');
  writeBase(kv, t);
  enqueue(kv, t.id);
  setOwner(kv, 'utente-1');
  assert.ok(getPending(kv, t.id), 'modifiche in attesa visibili prima di uscire');
  purgeTripData(kv);
  assert.deepEqual([...kv.m.keys()].sort(), ['nfhp.cloud.config', 'nfhp.wiki.intro.q']);
  assert.equal(getOwner(kv), undefined);
});

test('Cambio utente senza logout: dati messi da parte e restituiti solo al proprietario', () => {
  const kv = new Mem();
  const t = trip();
  kv.setItem('nfhp.trip.v1', JSON.stringify(t));
  enqueue(kv, t.id);
  assert.equal(holdForOwner(kv, 'utente-1'), true);
  assert.equal(kv.getItem('nfhp.trip.v1'), null);
  assert.equal(getPending(kv, t.id), undefined, 'il secondo utente non vede nulla');
  assert.equal(restoreHold(kv, 'utente-2'), false);
  assert.equal(restoreHold(kv, 'utente-1'), true);
  assert.ok(kv.getItem('nfhp.trip.v1'));
  assert.ok(getPending(kv, t.id), 'le modifiche non inviate tornano');
});

test('Storage esaurito: nessuna perdita silenziosa', () => {
  const kv = new Mem();
  (globalThis as { localStorage?: Kv }).localStorage = kv;
  try {
    const t = trip();
    assert.equal(saveLocalTrip(t), true);
    assert.equal(saveLocalTrip({ ...t, title: 'Secondo' }), true);
    assert.ok(kv.getItem('nfhp.trip.v1.backup'), 'copia precedente');
    // Occupa spazio: il backup è il primo a essere sacrificato, il viaggio si salva lo stesso
    kv.setItem('nfhp.wiki.intro.q', 'x'.repeat(5000));
    kv.limit = [...kv.m].reduce((a, [k, v]) => a + k.length + v.length, 0) - 5100;
    assert.equal(saveLocalTrip({ ...t, title: 'Terzo' }), true, 'libera le cache e salva');
    assert.equal(loadLocalTrip().trip?.title, 'Terzo');
    // Davvero senza spazio: errore dichiarato e il dato precedente resta leggibile
    kv.limit = 10;
    assert.equal(saveLocalTrip({ ...t, title: 'Quarto' }), false);
    assert.equal(loadLocalTrip().trip?.title, 'Terzo');
    assert.equal(enqueue(kv, t.id), false, 'la coda dichiara che non è durevole');
    assert.equal(readBase(kv, t.id), undefined);
    clearSyncState(kv, t.id);
  } finally {
    delete (globalThis as { localStorage?: Kv }).localStorage;
  }
});

test('Documento illeggibile o più recente: copia conservata, nessuna sovrascrittura', () => {
  const kv = new Mem();
  (globalThis as { localStorage?: Kv }).localStorage = kv;
  try {
    kv.setItem('nfhp.trip.v1', '{rotto');
    const r = loadLocalTrip();
    assert.match(r.error!, /non leggibili/);
    assert.equal(kv.getItem('nfhp.trip.v1.illeggibile'), '{rotto');
    assert.equal(r.readOnly, undefined);
    kv.setItem('nfhp.trip.v1', JSON.stringify({ schemaVersion: 99, id: 'x' }));
    const f = loadLocalTrip();
    assert.equal(f.readOnly, true);
    assert.match(f.error!, /più recente/);
  } finally {
    delete (globalThis as { localStorage?: Kv }).localStorage;
  }
});
