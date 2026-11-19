import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { catalogNews, pendingUpgrades, upgradeCatalog } from '../src/domain/countries';

// Regola del 19/11/2026: il viaggio passa da solo all'ultima versione pubblicata e le vecchie si cancellano.

const latest = [{ code: 'NO', releaseId: 'NO-5', version: 5 }];

test('Aggiornamento automatico: versione vecchia, cancellata o viaggio senza nazioni → ultima versione', () => {
  assert.deepEqual(pendingUpgrades({ countries: [{ code: 'NO', releaseId: 'NO-3' }] }, latest), [{ code: 'NO', from: 'NO-3', to: latest[0] }]);
  // Viaggio salvato prima delle nazioni: vale NO-1, passa anche lui
  assert.equal(pendingUpgrades({ countries: undefined }, latest)[0]?.to.releaseId, 'NO-5');
  // Già all'ultima, o nazione senza versione pubblicata: nulla da fare
  assert.deepEqual(pendingUpgrades({ countries: [{ code: 'NO', releaseId: 'NO-5' }] }, latest), []);
  assert.deepEqual(pendingUpgrades({ countries: [{ code: 'SE', releaseId: 'SE-1' }] }, latest), []);
  // Mai all'indietro (es. i file dell'app, NO-2, con un viaggio già su NO-5)
  assert.deepEqual(pendingUpgrades({ countries: [{ code: 'NO', releaseId: 'NO-5' }] }, [{ code: 'NO', releaseId: 'NO-2', version: 2 }]), []);
});

test('Aggiornamento automatico: cambia solo la versione, tappe e idee restano', () => {
  const t = { countries: [{ code: 'NO', releaseId: 'NO-2' }], stops: [{ id: 's1', destinationId: 'bergen' }], favorites: ['oslo'] } as never;
  const u = upgradeCatalog(t, 'NO', 'NO-5') as unknown as { countries: unknown; stops: unknown; favorites: unknown };
  assert.deepEqual(u.countries, [{ code: 'NO', releaseId: 'NO-5' }]);
  assert.equal(u.stops, (t as { stops: unknown }).stops);
  assert.equal(u.favorites, (t as { favorites: unknown }).favorites);
});

test('Novità del catalogo: solo quelle tra le due versioni', () => {
  assert.equal(catalogNews('NO', 4, 5).length, 1);
  assert.equal(catalogNews('NO', 1, 5).length, 4);
  assert.deepEqual(catalogNews('NO', 5, 5), []);
  assert.deepEqual(catalogNews('SE', 1, 3), []);
});

test('Seed: dopo il controllo cancella le versioni precedenti; rieseguibile senza la precedente; superato se ne esiste una più nuova', () => {
  const sql = readFileSync('supabase/seed/catalogo-norvegia-v5.sql', 'utf8');
  const check = sql.indexOf('end $check$;');
  const purge = sql.indexOf("perform private.purge_superseded_releases('NO');");
  assert.ok(check > 0 && purge > check, 'la cancellazione viene dopo il controllo finale');
  assert.ok(purge < sql.lastIndexOf('commit;'), 'nella stessa transazione');
  assert.match(sql, /and not exists \(select 1 from public\.catalog_releases where release_id = 'NO-5' and status = 'pubblicata'\) then/);
  assert.match(sql, /status = 'pubblicata' and version > 5\) then\s+raise exception/);
  const mig = readFileSync('supabase/migrations/20261119000000_cataloghi_superati.sql', 'utf8');
  assert.match(mig, /drop constraint if exists catalog_releases_previous_release_id_fkey/);
  assert.match(mig, /delete from public\.catalog_releases r\s+where r\.country_code = p_country and r\.version < v_latest\.version/);
  assert.match(mig, /update public\.trip_countries/);
  assert.doesNotMatch(mig, /update public\.trips /, 'i viaggi in JSON li aggiorna l\'app, non la migrazione');
});
