-- Catalogo Germania, versione 1 (DE-1).
-- GENERATO da scripts/seed-catalog.ts: non modificare a mano, rigenerare con `npx tsx scripts/seed-catalog.ts`.
-- Prerequisito: migrazioni supabase/migrations/20261106000100 … 20261106000500.
-- Idempotente: con la versione già pubblicata non scrive nulla e controlla solo i conteggi.
-- Tocca solo le tabelle del catalogo e la versione delle nazioni dei viaggi a righe; nessun dato di auth.
-- Dopo il controllo cancella le versioni precedenti della nazione (migrazione 20261119000000_cataloghi_superati.sql).

begin;

-- Prerequisiti: versione non superata, versione precedente pubblicata, tabelle dei traghetti presenti
do $pre$
begin
  if exists (select 1 from public.catalog_releases where country_code = 'DE' and status = 'pubblicata' and version > 1) then
    raise exception 'Il catalogo DE ha già una versione più recente di DE-1: questo seed è superato';
  end if;
  if to_regclass('public.place_photos') is null or to_regclass('public.place_tips') is null then
    raise exception 'Mancano le tabelle di foto e consigli: applicare prima supabase/migrations/20261110000100_foto_consigli.sql';
  end if;
end $pre$;

insert into public.countries (code, name, names, currency, timezone, language) values
  ('DE', 'Germania', '{"en":"Germany"}'::jsonb, 'EUR', 'Europe/Berlin', 'de')
on conflict (code) do nothing;

insert into public.catalog_releases (release_id, country_code, version, status, data_checked_until, notes, source_notes, road_factor, avg_kmh, road_calibrated, road_note, airport_radius_km) values
  ('DE-1', 'DE', 1, 'bozza', '2026-11-19', 'Prima selezione editoriale: città, musei, natura, parchi e aeroporti. Coordinate da Wikidata; foto Commons con licenza per file. Informazioni operative da verificare. Trasporti non ancora catalogati.', '[{"label":"Wikidata: dati strutturati CC0","url":"https://www.wikidata.org/wiki/Wikidata:Licensing","checkedAt":"2026-11-19","license":"CC0-1.0"},{"label":"Ente turistico · Germania","url":"https://www.germany.travel/en/home.html","checkedAt":"2026-11-19","note":"Consultato per il contesto e la copertura; testi e immagini non importati"}]'::jsonb, null, null, false, 'Parametri stradali non calibrati per questa nazione. I tempi del configuratore sono indicativi: calcolare i trasferimenti prima di attivare.', null)
on conflict (release_id) do nothing;

insert into public.place_keys (place_key, country_code) values
  ('de-berlino', 'DE'),
  ('de-porta-brandeburgo', 'DE'),
  ('de-museo-storia-naturale', 'DE'),
  ('de-zoo-berlino', 'DE'),
  ('de-potsdam', 'DE'),
  ('de-sanssouci', 'DE'),
  ('de-amburgo', 'DE'),
  ('de-miniatur-wunderland', 'DE'),
  ('de-lubecca', 'DE'),
  ('de-brema', 'DE'),
  ('de-colonia', 'DE'),
  ('de-duomo-colonia', 'DE'),
  ('de-francoforte', 'DE'),
  ('de-heidelberg', 'DE'),
  ('de-monaco', 'DE'),
  ('de-deutsches-museum', 'DE'),
  ('de-englischer-garten', 'DE'),
  ('de-fussen', 'DE'),
  ('de-neuschwanstein', 'DE'),
  ('de-norimberga', 'DE'),
  ('de-stoccarda', 'DE'),
  ('de-mercedes-museum', 'DE'),
  ('de-europa-park', 'DE'),
  ('de-friburgo', 'DE'),
  ('de-dresda', 'DE'),
  ('de-lipsia', 'DE'),
  ('de-bastei', 'DE'),
  ('de-ber', 'DE'),
  ('de-muc', 'DE'),
  ('de-fra', 'DE')
on conflict (place_key) do nothing;

-- Contenuto della versione: si scrive solo se è ancora in bozza
do $seed$
begin
  if not exists (select 1 from public.catalog_releases where release_id = 'DE-1' and status = 'bozza') then
    raise notice 'Versione DE-1 già pubblicata: nessuna scrittura, solo controllo';
    return;
  end if;
insert into public.regions (release_id, region_key, position, name, areas, sources) values
  ('DE-1', 'de-r1', 0, 'Berlino e Brandeburgo', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('DE-1', 'de-r2', 1, 'Amburgo e Germania settentrionale', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('DE-1', 'de-r3', 2, 'Renania e Germania occidentale', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('DE-1', 'de-r4', 3, 'Baviera', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('DE-1', 'de-r5', 4, 'Baden-Württemberg', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('DE-1', 'de-r6', 5, 'Sassonia e Turingia', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb);

insert into public.places (release_id, place_key, category, region_key, lat, lng, coords_status, local_name, visit_hours_min, visit_hours_max, difficulty, kid_score, reliability, is_base, day_visit, iata, official_url, official_kind, official_via, wikidata_qid, wiki_it, wiki_en, commons_image, base_place_key, address, setting, booking_advice, booking_url, hours_published, details_wikidata_qid, details_checked_at) values
  ('DE-1', 'de-berlino', 'citta', 'de-r1', 52.516666666667, 13.383333333333, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.berlin.de/', 'ente', 'Wikidata', 'Q64', 'Berlino', 'Berlin', 'Cityscape Berlin.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-porta-brandeburgo', 'musei', 'de-r1', 52.516272222222, 13.377722222222, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.visitberlin.de/de/ort/brandenburger-tor', 'attrazione', 'Wikidata', 'Q82425', 'Porta di Brandeburgo', 'Brandenburg Gate', 'Berlin-Brandenburg Gate overview.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-museo-storia-naturale', 'musei', 'de-r1', 52.5302, 13.3792, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.museumfuernaturkunde.berlin', 'attrazione', 'Wikidata', 'Q233098', 'Museum für Naturkunde', 'Museum für Naturkunde Berlin', 'Berlin, Mitte, Invalidenstrasse 43, Museum für Naturkunde.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-zoo-berlino', 'fauna', 'de-r1', 52.508333333333, 13.3375, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.zoo-berlin.de/', 'attrazione', 'Wikidata', 'Q154828', 'Zoologischer Garten Berlin', 'Berlin Zoo', 'Giraffe-berlin-zoo.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-potsdam', 'citta', 'de-r1', 52.4009309, 13.0591397, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.potsdam.de/', 'ente', 'Wikidata', 'Q1711', 'Potsdam', 'Potsdam', '2018-08-10 DE Potsdam, Havel, Potsdamer Stadtschloss, Charlottenhof 05609390 (49952695592).jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-sanssouci', 'musei', 'de-r1', 52.403257, 13.038626, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.spsg.de/schloesser-gaerten/objekt/schloss-sanssouci/', 'attrazione', 'Wikidata', 'Q151330', 'Palazzo di Sanssouci', 'Sanssouci', '.00 3591 Schloss Sanssouci in Potsdam.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-amburgo', 'citta', 'de-r2', 53.55, 10, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.hamburg.de/', 'ente', 'Wikidata', 'Q1055', 'Amburgo', 'Hamburg', 'Hamburg view St. Nikolai.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-miniatur-wunderland', 'musei', 'de-r2', 53.5438229, 9.9889448, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.miniatur-wunderland.de/', 'attrazione', 'Wikidata', 'Q685524', 'Miniatur Wunderland', 'Miniatur Wunderland', 'DungeonMiwula.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-lubecca', 'citta', 'de-r2', 53.869722222222, 10.686388888889, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.luebeck.de/', 'ente', 'Wikidata', 'Q2843', 'Lubecca', 'Lübeck', null, null, null, null, null, null, null, null, null),
  ('DE-1', 'de-brema', 'citta', 'de-r2', 53.075833333333335, 8.807222222222222, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.bremen.de/', 'ente', 'Wikidata', 'Q24879', 'Brema', 'Bremen', 'Bremen-rathaus-dom-buergerschaft.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-colonia', 'citta', 'de-r3', 50.942222222222, 6.9577777777778, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.stadt-koeln.de/', 'ente', 'Wikidata', 'Q365', 'Colonia (Germania)', 'Cologne', null, null, null, null, null, null, null, null, null),
  ('DE-1', 'de-duomo-colonia', 'musei', 'de-r3', 50.94138888888889, 6.958333333333333, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.koelner-dom.de/', 'attrazione', 'Wikidata', 'Q4176', 'Duomo di Colonia', 'Cologne Cathedral', null, null, null, null, null, null, null, null, null),
  ('DE-1', 'de-francoforte', 'citta', 'de-r3', 50.11055555555556, 8.682222222222222, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://frankfurt.de', 'ente', 'Wikidata', 'Q1794', 'Francoforte sul Meno', 'Frankfurt', 'Blick vom Kaiserdom über Frankfurt zur Skyline.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-heidelberg', 'citta', 'de-r5', 49.4093582, 8.694724, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.heidelberg.de/', 'ente', 'Wikidata', 'Q2966', 'Heidelberg', 'Heidelberg', 'Heidelberg corr.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-monaco', 'citta', 'de-r4', 48.1375, 11.575, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://stadt.muenchen.de/rathaus.html', 'ente', 'Wikidata', 'Q1726', 'Monaco di Baviera', 'Munich', null, null, null, null, null, null, null, null, null),
  ('DE-1', 'de-deutsches-museum', 'musei', 'de-r4', 48.13, 11.583333333333, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.deutsches-museum.de/', 'attrazione', 'Wikidata', 'Q131617', 'Deutsches Museum', 'Deutsches Museum', null, null, null, null, null, null, null, null, null),
  ('DE-1', 'de-englischer-garten', 'natura', 'de-r4', 48.152777777778, 11.591944444444, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.schloesser.bayern.de/deutsch/garten/objekte/mu_engl.htm', 'attrazione', 'Wikidata', 'Q260223', 'Englischer Garten', 'Englischer Garten', 'Aerial image of Englischer Garten in Munich (view from the southwest).jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-fussen', 'citta', 'de-r4', 47.56666666666667, 10.7, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.stadt-fuessen.de/', 'ente', 'Wikidata', 'Q262684', 'Füssen', 'Füssen', 'Füssen -.JPG', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-neuschwanstein', 'musei', 'de-r4', 47.5574885428434, 10.74944180794, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.neuschwanstein.com/', 'attrazione', 'Wikidata', 'Q4152', 'Castello di Neuschwanstein', 'Neuschwanstein Castle', 'Neuschwanstein Castle entrance gate.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-norimberga', 'citta', 'de-r4', 49.45388888888889, 11.0775, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.nuernberg.de/', 'ente', 'Wikidata', 'Q2090', 'Norimberga', 'Nuremberg', 'Nuremberg, view from Sinwell Tower 2012.06.16 - panoramio.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-stoccarda', 'citta', 'de-r5', 48.7775, 9.18, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.stuttgart.de/', 'ente', 'Wikidata', 'Q1022', 'Stoccarda', 'Stuttgart', 'Neues Schloss Schlossplatzspringbrunnen Jubiläumssäule Schlossplatz Stuttgart 2015 01.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-mercedes-museum', 'musei', 'de-r5', 48.78855, 9.23376, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.mercedes-benz.com/en/art-and-culture/museum/', 'attrazione', 'Wikidata', 'Q707377', 'Museo Mercedes-Benz', 'Mercedes-Benz Museum', 'Mercedes-Benz Museum 201312 02 sunset.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-europa-park', 'parchi', 'de-r5', 48.268333, 7.720833, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.europapark.de/', 'attrazione', 'Wikidata', 'Q159144', 'Europa-Park', 'Europa-Park', '2008-04-26-DSC 1978-c-Europapark.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-friburgo', 'citta', 'de-r5', 47.995, 7.85, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.freiburg.de/', 'ente', 'Wikidata', 'Q2833', 'Friburgo in Brisgovia', 'Freiburg im Breisgau', 'Schlossbergblick Freiburg i. B. 14.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-dresda', 'citta', 'de-r6', 51.0493286, 13.7381437, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.dresden.de/', 'ente', 'Wikidata', 'Q1731', 'Dresda', 'Dresden', 'DD-canaletto-blick.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-lipsia', 'citta', 'de-r6', 51.3406321, 12.3747329, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.leipzig.de/', 'ente', 'Wikidata', 'Q2079', 'Lipsia', 'Leipzig', 'Innenstadt Leipzig mit Thomaskirche von Panorama Tower 2013.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-bastei', 'natura', 'de-r6', 50.966666666667, 14.066666666667, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, null, null, null, 'Q671486', 'Bastei', 'Bastei', null, null, null, null, null, null, null, null, null),
  ('DE-1', 'de-ber', 'aeroporti', 'de-r1', 52.36224722222222, 13.500672222222223, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'BER', 'https://ber.berlin-airport.de/', 'attrazione', 'Wikidata', 'Q160556', 'Aeroporto di Berlino-Brandeburgo', 'Berlin Brandenburg Airport', null, null, null, null, null, null, null, null, null),
  ('DE-1', 'de-muc', 'aeroporti', 'de-r4', 48.35378333333333, 11.78608611111111, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'MUC', 'https://www.munich-airport.de/', 'attrazione', 'Wikidata', 'Q131402', 'Aeroporto di Monaco di Baviera', 'Munich Airport', 'Munich Airport Aerial View T1 T2 MAC.jpg', null, null, null, null, null, null, null, null),
  ('DE-1', 'de-fra', 'aeroporti', 'de-r3', 50.03330555555556, 8.570455555555556, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'FRA', 'https://www.frankfurt-airport.com/', 'attrazione', 'Wikidata', 'Q46033', 'Aeroporto di Francoforte sul Meno', 'Frankfurt Airport', 'FRA June2013.JPG', null, null, null, null, null, null, null, null);

insert into public.place_texts (release_id, place_key, lang, name, description, access, season, august_note, area, booking_note, seasonal_note, outside_note) values
  ('DE-1', 'de-berlino', 'it', 'Berlino', 'Capitale della Germania, con quartieri storici, musei e parchi lungo la Sprea.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-porta-brandeburgo', 'it', 'Porta di Brandeburgo', 'Porta monumentale di Berlino, punto di riferimento per esplorare il centro storico.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-museo-storia-naturale', 'it', 'Museo di storia naturale di Berlino', 'Museo dedicato alla storia naturale, con collezioni paleontologiche e zoologiche.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-zoo-berlino', 'it', 'Zoo di Berlino', 'Giardino zoologico nel quartiere del Tiergarten; percorsi, ingressi e servizi vanno controllati sul sito ufficiale.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-potsdam', 'it', 'Potsdam', 'Città del Brandeburgo con residenze prussiane e parchi storici.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-sanssouci', 'it', 'Palazzo di Sanssouci', 'Residenza prussiana a Potsdam, inserita nel paesaggio del parco di Sanssouci.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-amburgo', 'it', 'Amburgo', 'Città portuale sull’Elba, con canali, quartieri di magazzini e passeggiate sull’acqua.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-miniatur-wunderland', 'it', 'Miniatur Wunderland', 'Esposizione di plastici ferroviari e paesaggi in miniatura nella Speicherstadt di Amburgo.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-lubecca', 'it', 'Lubecca', 'Città anseatica con centro storico in mattoni e vie d’acqua.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-brema', 'it', 'Brema', 'Città anseatica sul Weser, con la piazza del mercato e il quartiere dello Schnoor.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-colonia', 'it', 'Colonia', 'Città sul Reno, con cattedrale gotica e musei.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-duomo-colonia', 'it', 'Duomo di Colonia', 'Cattedrale gotica nel centro di Colonia; accessi alla chiesa e alle torri hanno condizioni differenti.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-francoforte', 'it', 'Francoforte sul Meno', 'Città sul Meno, con musei, centro storico ricostruito e skyline contemporaneo.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-heidelberg', 'it', 'Heidelberg', 'Città universitaria sul Neckar, con centro storico e castello sulle pendici della valle.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-monaco', 'it', 'Monaco di Baviera', 'Capoluogo bavarese con musei, piazze e il parco dell’Englischer Garten.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-deutsches-museum', 'it', 'Deutsches Museum', 'Museo della scienza e della tecnica sull’Isola dei Musei di Monaco.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-englischer-garten', 'it', 'Englischer Garten', 'Parco urbano di Monaco con prati, corsi d’acqua e percorsi pedonali.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-fussen', 'it', 'Füssen', 'Località bavarese presso le Alpi dell’Allgäu, utilizzabile come base per i dintorni.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-neuschwanstein', 'it', 'Castello di Neuschwanstein', 'Castello ottocentesco presso Schwangau; visita interna e accesso alla zona richiedono verifiche separate.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-norimberga', 'it', 'Norimberga', 'Città della Franconia con centro storico, mura e musei.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-stoccarda', 'it', 'Stoccarda', 'Capoluogo del Baden-Württemberg, con musei e parchi.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-mercedes-museum', 'it', 'Mercedes-Benz Museum', 'Museo di Stoccarda dedicato alla storia dell’automobile e del marchio Mercedes-Benz.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-europa-park', 'it', 'Europa-Park', 'Parco divertimenti a Rust; apertura, biglietti e limiti delle attrazioni vanno verificati.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-friburgo', 'it', 'Friburgo in Brisgovia', 'Città ai margini della Foresta Nera, con centro pedonale e cattedrale.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-dresda', 'it', 'Dresda', 'Città sull’Elba con residenze, musei e architetture barocche ricostruite.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-lipsia', 'it', 'Lipsia', 'Città della Sassonia con tradizione musicale, musei e parchi.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-bastei', 'it', 'Bastei', 'Formazione rocciosa e belvedere nella Svizzera Sassone; percorsi e condizioni di accesso vanno controllati.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-ber', 'it', 'Aeroporto di Berlino Brandeburgo', 'Aeroporto dell’area di Berlino; collegamenti con la città e tempi di accesso da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-muc', 'it', 'Aeroporto di Monaco', 'Aeroporto dell’area di Monaco di Baviera; trasferimenti da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DE-1', 'de-fra', 'it', 'Aeroporto di Francoforte', 'Aeroporto dell’area di Francoforte sul Meno; terminal e trasferimenti da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null);

insert into public.place_sources (release_id, place_key, field, position, label, url, checked_at, license, method, note) values
  ('DE-1', 'de-berlino', 'coordinate', 0, 'Wikidata Q64 · P625', 'https://www.wikidata.org/wiki/Q64', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-berlino', 'scheda', 0, 'Wikidata Q64', 'https://www.wikidata.org/wiki/Q64', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-berlino', 'wikidata', 0, 'Wikidata Q64', 'https://www.wikidata.org/wiki/Q64', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-berlino', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-berlino', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.berlin.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-porta-brandeburgo', 'coordinate', 0, 'Wikidata Q82425 · P625', 'https://www.wikidata.org/wiki/Q82425', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-porta-brandeburgo', 'scheda', 0, 'Wikidata Q82425', 'https://www.wikidata.org/wiki/Q82425', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-porta-brandeburgo', 'wikidata', 0, 'Wikidata Q82425', 'https://www.wikidata.org/wiki/Q82425', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-porta-brandeburgo', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-porta-brandeburgo', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.visitberlin.de/de/ort/brandenburger-tor', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-museo-storia-naturale', 'coordinate', 0, 'Wikidata Q233098 · P625', 'https://www.wikidata.org/wiki/Q233098', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-museo-storia-naturale', 'scheda', 0, 'Wikidata Q233098', 'https://www.wikidata.org/wiki/Q233098', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-museo-storia-naturale', 'wikidata', 0, 'Wikidata Q233098', 'https://www.wikidata.org/wiki/Q233098', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-museo-storia-naturale', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-museo-storia-naturale', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.museumfuernaturkunde.berlin', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-zoo-berlino', 'coordinate', 0, 'Wikidata Q154828 · P625', 'https://www.wikidata.org/wiki/Q154828', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-zoo-berlino', 'scheda', 0, 'Wikidata Q154828', 'https://www.wikidata.org/wiki/Q154828', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-zoo-berlino', 'wikidata', 0, 'Wikidata Q154828', 'https://www.wikidata.org/wiki/Q154828', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-zoo-berlino', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-zoo-berlino', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.zoo-berlin.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-potsdam', 'coordinate', 0, 'Wikidata Q1711 · P625', 'https://www.wikidata.org/wiki/Q1711', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-potsdam', 'scheda', 0, 'Wikidata Q1711', 'https://www.wikidata.org/wiki/Q1711', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-potsdam', 'wikidata', 0, 'Wikidata Q1711', 'https://www.wikidata.org/wiki/Q1711', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-potsdam', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-potsdam', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.potsdam.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-sanssouci', 'coordinate', 0, 'Wikidata Q151330 · P625', 'https://www.wikidata.org/wiki/Q151330', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-sanssouci', 'scheda', 0, 'Wikidata Q151330', 'https://www.wikidata.org/wiki/Q151330', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-sanssouci', 'wikidata', 0, 'Wikidata Q151330', 'https://www.wikidata.org/wiki/Q151330', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-sanssouci', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-sanssouci', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.spsg.de/schloesser-gaerten/objekt/schloss-sanssouci/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-amburgo', 'coordinate', 0, 'Wikidata Q1055 · P625', 'https://www.wikidata.org/wiki/Q1055', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-amburgo', 'scheda', 0, 'Wikidata Q1055', 'https://www.wikidata.org/wiki/Q1055', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-amburgo', 'wikidata', 0, 'Wikidata Q1055', 'https://www.wikidata.org/wiki/Q1055', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-amburgo', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-amburgo', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.hamburg.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-miniatur-wunderland', 'coordinate', 0, 'Wikidata Q685524 · P625', 'https://www.wikidata.org/wiki/Q685524', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-miniatur-wunderland', 'scheda', 0, 'Wikidata Q685524', 'https://www.wikidata.org/wiki/Q685524', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-miniatur-wunderland', 'wikidata', 0, 'Wikidata Q685524', 'https://www.wikidata.org/wiki/Q685524', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-miniatur-wunderland', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-miniatur-wunderland', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.miniatur-wunderland.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-lubecca', 'coordinate', 0, 'Wikidata Q2843 · P625', 'https://www.wikidata.org/wiki/Q2843', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-lubecca', 'scheda', 0, 'Wikidata Q2843', 'https://www.wikidata.org/wiki/Q2843', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-lubecca', 'wikidata', 0, 'Wikidata Q2843', 'https://www.wikidata.org/wiki/Q2843', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-lubecca', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-lubecca', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.luebeck.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-brema', 'coordinate', 0, 'Wikidata Q24879 · P625', 'https://www.wikidata.org/wiki/Q24879', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-brema', 'scheda', 0, 'Wikidata Q24879', 'https://www.wikidata.org/wiki/Q24879', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-brema', 'wikidata', 0, 'Wikidata Q24879', 'https://www.wikidata.org/wiki/Q24879', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-brema', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-brema', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.bremen.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-colonia', 'coordinate', 0, 'Wikidata Q365 · P625', 'https://www.wikidata.org/wiki/Q365', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-colonia', 'scheda', 0, 'Wikidata Q365', 'https://www.wikidata.org/wiki/Q365', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-colonia', 'wikidata', 0, 'Wikidata Q365', 'https://www.wikidata.org/wiki/Q365', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-colonia', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-colonia', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.stadt-koeln.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-duomo-colonia', 'coordinate', 0, 'Wikidata Q4176 · P625', 'https://www.wikidata.org/wiki/Q4176', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-duomo-colonia', 'scheda', 0, 'Wikidata Q4176', 'https://www.wikidata.org/wiki/Q4176', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-duomo-colonia', 'wikidata', 0, 'Wikidata Q4176', 'https://www.wikidata.org/wiki/Q4176', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-duomo-colonia', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-duomo-colonia', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.koelner-dom.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-francoforte', 'coordinate', 0, 'Wikidata Q1794 · P625', 'https://www.wikidata.org/wiki/Q1794', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-francoforte', 'scheda', 0, 'Wikidata Q1794', 'https://www.wikidata.org/wiki/Q1794', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-francoforte', 'wikidata', 0, 'Wikidata Q1794', 'https://www.wikidata.org/wiki/Q1794', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-francoforte', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-francoforte', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://frankfurt.de', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-heidelberg', 'coordinate', 0, 'Wikidata Q2966 · P625', 'https://www.wikidata.org/wiki/Q2966', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-heidelberg', 'scheda', 0, 'Wikidata Q2966', 'https://www.wikidata.org/wiki/Q2966', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-heidelberg', 'wikidata', 0, 'Wikidata Q2966', 'https://www.wikidata.org/wiki/Q2966', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-heidelberg', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-heidelberg', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.heidelberg.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-monaco', 'coordinate', 0, 'Wikidata Q1726 · P625', 'https://www.wikidata.org/wiki/Q1726', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-monaco', 'scheda', 0, 'Wikidata Q1726', 'https://www.wikidata.org/wiki/Q1726', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-monaco', 'wikidata', 0, 'Wikidata Q1726', 'https://www.wikidata.org/wiki/Q1726', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-monaco', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-monaco', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://stadt.muenchen.de/rathaus.html', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-deutsches-museum', 'coordinate', 0, 'Wikidata Q131617 · P625', 'https://www.wikidata.org/wiki/Q131617', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-deutsches-museum', 'scheda', 0, 'Wikidata Q131617', 'https://www.wikidata.org/wiki/Q131617', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-deutsches-museum', 'wikidata', 0, 'Wikidata Q131617', 'https://www.wikidata.org/wiki/Q131617', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-deutsches-museum', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-deutsches-museum', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.deutsches-museum.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-englischer-garten', 'coordinate', 0, 'Wikidata Q260223 · P625', 'https://www.wikidata.org/wiki/Q260223', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-englischer-garten', 'scheda', 0, 'Wikidata Q260223', 'https://www.wikidata.org/wiki/Q260223', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-englischer-garten', 'wikidata', 0, 'Wikidata Q260223', 'https://www.wikidata.org/wiki/Q260223', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-englischer-garten', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-englischer-garten', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.schloesser.bayern.de/deutsch/garten/objekte/mu_engl.htm', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-fussen', 'coordinate', 0, 'Wikidata Q262684 · P625', 'https://www.wikidata.org/wiki/Q262684', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-fussen', 'scheda', 0, 'Wikidata Q262684', 'https://www.wikidata.org/wiki/Q262684', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-fussen', 'wikidata', 0, 'Wikidata Q262684', 'https://www.wikidata.org/wiki/Q262684', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-fussen', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-fussen', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.stadt-fuessen.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-neuschwanstein', 'coordinate', 0, 'Wikidata Q4152 · P625', 'https://www.wikidata.org/wiki/Q4152', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-neuschwanstein', 'scheda', 0, 'Wikidata Q4152', 'https://www.wikidata.org/wiki/Q4152', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-neuschwanstein', 'wikidata', 0, 'Wikidata Q4152', 'https://www.wikidata.org/wiki/Q4152', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-neuschwanstein', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-neuschwanstein', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.neuschwanstein.com/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-norimberga', 'coordinate', 0, 'Wikidata Q2090 · P625', 'https://www.wikidata.org/wiki/Q2090', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-norimberga', 'scheda', 0, 'Wikidata Q2090', 'https://www.wikidata.org/wiki/Q2090', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-norimberga', 'wikidata', 0, 'Wikidata Q2090', 'https://www.wikidata.org/wiki/Q2090', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-norimberga', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-norimberga', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.nuernberg.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-stoccarda', 'coordinate', 0, 'Wikidata Q1022 · P625', 'https://www.wikidata.org/wiki/Q1022', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-stoccarda', 'scheda', 0, 'Wikidata Q1022', 'https://www.wikidata.org/wiki/Q1022', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-stoccarda', 'wikidata', 0, 'Wikidata Q1022', 'https://www.wikidata.org/wiki/Q1022', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-stoccarda', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-stoccarda', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.stuttgart.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-mercedes-museum', 'coordinate', 0, 'Wikidata Q707377 · P625', 'https://www.wikidata.org/wiki/Q707377', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-mercedes-museum', 'scheda', 0, 'Wikidata Q707377', 'https://www.wikidata.org/wiki/Q707377', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-mercedes-museum', 'wikidata', 0, 'Wikidata Q707377', 'https://www.wikidata.org/wiki/Q707377', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-mercedes-museum', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-mercedes-museum', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.mercedes-benz.com/en/art-and-culture/museum/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-europa-park', 'coordinate', 0, 'Wikidata Q159144 · P625', 'https://www.wikidata.org/wiki/Q159144', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-europa-park', 'scheda', 0, 'Wikidata Q159144', 'https://www.wikidata.org/wiki/Q159144', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-europa-park', 'wikidata', 0, 'Wikidata Q159144', 'https://www.wikidata.org/wiki/Q159144', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-europa-park', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-europa-park', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.europapark.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-friburgo', 'coordinate', 0, 'Wikidata Q2833 · P625', 'https://www.wikidata.org/wiki/Q2833', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-friburgo', 'scheda', 0, 'Wikidata Q2833', 'https://www.wikidata.org/wiki/Q2833', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-friburgo', 'wikidata', 0, 'Wikidata Q2833', 'https://www.wikidata.org/wiki/Q2833', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-friburgo', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-friburgo', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.freiburg.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-dresda', 'coordinate', 0, 'Wikidata Q1731 · P625', 'https://www.wikidata.org/wiki/Q1731', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-dresda', 'scheda', 0, 'Wikidata Q1731', 'https://www.wikidata.org/wiki/Q1731', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-dresda', 'wikidata', 0, 'Wikidata Q1731', 'https://www.wikidata.org/wiki/Q1731', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-dresda', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-dresda', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.dresden.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-lipsia', 'coordinate', 0, 'Wikidata Q2079 · P625', 'https://www.wikidata.org/wiki/Q2079', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-lipsia', 'scheda', 0, 'Wikidata Q2079', 'https://www.wikidata.org/wiki/Q2079', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-lipsia', 'wikidata', 0, 'Wikidata Q2079', 'https://www.wikidata.org/wiki/Q2079', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-lipsia', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-lipsia', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.leipzig.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-bastei', 'coordinate', 0, 'Wikidata Q671486 · P625', 'https://www.wikidata.org/wiki/Q671486', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-bastei', 'scheda', 0, 'Wikidata Q671486', 'https://www.wikidata.org/wiki/Q671486', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-bastei', 'wikidata', 0, 'Wikidata Q671486', 'https://www.wikidata.org/wiki/Q671486', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-bastei', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-ber', 'coordinate', 0, 'Wikidata Q160556 · P625', 'https://www.wikidata.org/wiki/Q160556', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-ber', 'scheda', 0, 'Wikidata Q160556', 'https://www.wikidata.org/wiki/Q160556', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-ber', 'wikidata', 0, 'Wikidata Q160556', 'https://www.wikidata.org/wiki/Q160556', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-ber', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-ber', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://ber.berlin-airport.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-muc', 'coordinate', 0, 'Wikidata Q131402 · P625', 'https://www.wikidata.org/wiki/Q131402', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-muc', 'scheda', 0, 'Wikidata Q131402', 'https://www.wikidata.org/wiki/Q131402', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-muc', 'wikidata', 0, 'Wikidata Q131402', 'https://www.wikidata.org/wiki/Q131402', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-muc', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-muc', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.munich-airport.de/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DE-1', 'de-fra', 'coordinate', 0, 'Wikidata Q46033 · P625', 'https://www.wikidata.org/wiki/Q46033', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DE-1', 'de-fra', 'scheda', 0, 'Wikidata Q46033', 'https://www.wikidata.org/wiki/Q46033', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-fra', 'wikidata', 0, 'Wikidata Q46033', 'https://www.wikidata.org/wiki/Q46033', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DE-1', 'de-fra', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DE-1', 'de-fra', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.frankfurt-airport.com/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate');

-- operators: nessuna riga

-- voyages: nessuna riga

-- route_ports: nessuna riga

-- place_links: nessuna riga

insert into public.place_photos (release_id, place_key, position, commons_file, author, license, license_url, checked_at) values
  ('DE-1', 'de-berlino', 0, 'Cityscape Berlin.jpg', 'Thomas Wolf, www.foto-tw.de', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DE-1', 'de-porta-brandeburgo', 0, 'Berlin-Brandenburg Gate overview.jpg', 'Cezary p at Polish Wikipedia', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('DE-1', 'de-porta-brandeburgo', 1, 'Brandenburger Tor morgens.jpg', 'Thomas Wolf, www.foto-tw.de', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DE-1', 'de-museo-storia-naturale', 0, 'Berlin, Mitte, Invalidenstrasse 43, Museum für Naturkunde.jpg', 'Jörg Zägel', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DE-1', 'de-zoo-berlino', 0, 'Giraffe-berlin-zoo.jpg', 'Adamantios', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('DE-1', 'de-zoo-berlino', 1, 'Bahnhof Zoo Wegweiser Zoo.JPG', 'Cherubino', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DE-1', 'de-potsdam', 0, '2018-08-10 DE Potsdam, Havel, Potsdamer Stadtschloss, Charlottenhof 05609390 (49952695592).jpg', 'Paul Korecky', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0', '2026-11-19'),
  ('DE-1', 'de-sanssouci', 0, '.00 3591 Schloss Sanssouci in Potsdam.jpg', 'W. Bulach', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DE-1', 'de-sanssouci', 1, '.00 2522 Schloss Sanssouci in Potsdam.jpg', 'W. Bulach', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DE-1', 'de-amburgo', 0, 'Hamburg view St. Nikolai.jpg', 'kallerna', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DE-1', 'de-miniatur-wunderland', 0, 'DungeonMiwula.jpg', 'Gulp', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('DE-1', 'de-brema', 0, 'Bremen-rathaus-dom-buergerschaft.jpg', 'Klaus Grünberg', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DE-1', 'de-francoforte', 0, 'Blick vom Kaiserdom über Frankfurt zur Skyline.jpg', 'Jörg Braukmann', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DE-1', 'de-heidelberg', 0, 'Heidelberg corr.jpg', 'Miholz', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('DE-1', 'de-englischer-garten', 0, 'Aerial image of Englischer Garten in Munich (view from the southwest).jpg', 'Carsten Steger', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DE-1', 'de-fussen', 0, 'Füssen -.JPG', 'Wolkenkratzer', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DE-1', 'de-neuschwanstein', 0, 'Neuschwanstein Castle entrance gate.jpg', 'DestinationFearFan', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DE-1', 'de-neuschwanstein', 1, 'Neuschwanstein Castle 2024-02.jpg', 'Wilfredor', 'CC0', 'http://creativecommons.org/publicdomain/zero/1.0/deed.en', '2026-11-19'),
  ('DE-1', 'de-norimberga', 0, 'Nuremberg, view from Sinwell Tower 2012.06.16 - panoramio.jpg', 'YuTrofimov', 'CC BY 3.0', 'https://creativecommons.org/licenses/by/3.0', '2026-11-19'),
  ('DE-1', 'de-stoccarda', 0, 'Neues Schloss Schlossplatzspringbrunnen Jubiläumssäule Schlossplatz Stuttgart 2015 01.jpg', 'Julian Herzog (Website)', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0', '2026-11-19'),
  ('DE-1', 'de-mercedes-museum', 0, 'Mercedes-Benz Museum 201312 02 sunset.jpg', 'Julian Herzog (Website)', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0', '2026-11-19'),
  ('DE-1', 'de-europa-park', 0, '2008-04-26-DSC 1978-c-Europapark.jpg', 'Thomas Berwing', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DE-1', 'de-friburgo', 0, 'Schlossbergblick Freiburg i. B. 14.jpg', 'H.Helmlechner', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DE-1', 'de-dresda', 0, 'DD-canaletto-blick.jpg', 'Bgabel', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DE-1', 'de-lipsia', 0, 'Innenstadt Leipzig mit Thomaskirche von Panorama Tower 2013.jpg', 'Tuxyso', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DE-1', 'de-muc', 0, 'Munich Airport Aerial View T1 T2 MAC.jpg', 'Thomas Kniess', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DE-1', 'de-fra', 0, 'FRA June2013.JPG', 'Steffen Wurzel', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19');

-- place_tips: nessuna riga

end $seed$;

update public.catalog_releases set status = 'pubblicata', published_at = now() where release_id = 'DE-1' and status = 'bozza';

-- Controllo finale: se fallisce, la transazione si annulla
do $check$
declare
  v_n bigint;
begin
  if not exists (select 1 from public.countries where code = 'DE' and currency = 'EUR' and timezone = 'Europe/Berlin' and language = 'de') then
    raise exception 'Nazione DE: valuta, fuso o lingua diversi da quelli del seed';
  end if;
  perform now() at time zone 'Europe/Berlin';
  if not exists (select 1 from public.catalog_releases where release_id = 'DE-1' and status = 'pubblicata') then
    raise exception 'Versione DE-1 non pubblicata';
  end if;
  select count(*) into v_n from public.regions where release_id = 'DE-1';
  if v_n <> 6 then raise exception 'regions (release_id = ''DE-1''): attese 6 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'DE-1';
  if v_n <> 30 then raise exception 'places (release_id = ''DE-1''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_texts where release_id = 'DE-1';
  if v_n <> 30 then raise exception 'place_texts (release_id = ''DE-1''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_sources where release_id = 'DE-1';
  if v_n <> 149 then raise exception 'place_sources (release_id = ''DE-1''): attese 149 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.operators where release_id = 'DE-1';
  if v_n <> 0 then raise exception 'operators (release_id = ''DE-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.voyages where release_id = 'DE-1';
  if v_n <> 0 then raise exception 'voyages (release_id = ''DE-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.route_ports where release_id = 'DE-1';
  if v_n <> 0 then raise exception 'route_ports (release_id = ''DE-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_links where release_id = 'DE-1';
  if v_n <> 0 then raise exception 'place_links (release_id = ''DE-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'DE-1' and category = 'porti';
  if v_n <> 0 then raise exception 'places (release_id = ''DE-1'' and category = ''porti''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'DE-1' and coords_status = 'verificate';
  if v_n <> 30 then raise exception 'places (release_id = ''DE-1'' and coords_status = ''verificate''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'DE-1' and official_url is not null;
  if v_n <> 29 then raise exception 'places (release_id = ''DE-1'' and official_url is not null): attese 29 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'DE-1' and wikidata_qid is not null;
  if v_n <> 30 then raise exception 'places (release_id = ''DE-1'' and wikidata_qid is not null): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'DE-1' and base_place_key is not null;
  if v_n <> 0 then raise exception 'places (release_id = ''DE-1'' and base_place_key is not null): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_photos where release_id = 'DE-1';
  if v_n <> 27 then raise exception 'place_photos (release_id = ''DE-1''): attese 27 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_tips where release_id = 'DE-1';
  if v_n <> 0 then raise exception 'place_tips (release_id = ''DE-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places p join public.place_keys k on k.place_key = p.place_key where p.release_id = 'DE-1' and k.country_code <> 'DE';
  if v_n <> 0 then raise exception 'Chiavi di luogo registrate per un''altra nazione: %', v_n; end if;
  select count(*) into v_n from public.places p where p.release_id = 'DE-1' and not exists (select 1 from public.place_texts t where t.release_id = p.release_id and t.place_key = p.place_key and t.lang = 'it');
  if v_n <> 0 then raise exception 'Luoghi senza testo italiano: %', v_n; end if;
  raise notice 'Catalogo DE-1 pubblicato e controllato: 30 luoghi, 0 crociere, 0 porti in rotta';
end $check$;

-- Versioni precedenti: cancellate (i viaggi passano a questa, che le contiene)
do $purge$
begin
  if to_regprocedure('private.purge_superseded_releases(text)') is not null then
    perform private.purge_superseded_releases('DE');
  end if;
end $purge$;

commit;
