-- Catalogo Danimarca, versione 1 (DK-1).
-- GENERATO da scripts/seed-catalog.ts: non modificare a mano, rigenerare con `npx tsx scripts/seed-catalog.ts`.
-- Prerequisito: migrazioni supabase/migrations/20261106000100 … 20261106000500.
-- Idempotente: con la versione già pubblicata non scrive nulla e controlla solo i conteggi.
-- Tocca solo le tabelle del catalogo e la versione delle nazioni dei viaggi a righe; nessun dato di auth.
-- Dopo il controllo cancella le versioni precedenti della nazione (migrazione 20261119000000_cataloghi_superati.sql).

begin;

-- Prerequisiti: versione non superata, versione precedente pubblicata, tabelle dei traghetti presenti
do $pre$
begin
  if exists (select 1 from public.catalog_releases where country_code = 'DK' and status = 'pubblicata' and version > 1) then
    raise exception 'Il catalogo DK ha già una versione più recente di DK-1: questo seed è superato';
  end if;
  if to_regclass('public.place_photos') is null or to_regclass('public.place_tips') is null then
    raise exception 'Mancano le tabelle di foto e consigli: applicare prima supabase/migrations/20261110000100_foto_consigli.sql';
  end if;
end $pre$;

insert into public.countries (code, name, names, currency, timezone, language) values
  ('DK', 'Danimarca', '{"en":"Denmark"}'::jsonb, 'DKK', 'Europe/Copenhagen', 'da')
on conflict (code) do nothing;

insert into public.catalog_releases (release_id, country_code, version, status, data_checked_until, notes, source_notes, road_factor, avg_kmh, road_calibrated, road_note, airport_radius_km) values
  ('DK-1', 'DK', 1, 'bozza', '2026-11-19', 'Prima selezione editoriale: città, musei, natura, parchi e aeroporti. Coordinate da Wikidata; foto Commons con licenza per file. Informazioni operative da verificare. Trasporti non ancora catalogati.', '[{"label":"Wikidata: dati strutturati CC0","url":"https://www.wikidata.org/wiki/Wikidata:Licensing","checkedAt":"2026-11-19","license":"CC0-1.0"},{"label":"Ente turistico · Danimarca","url":"https://www.visitdenmark.com/","checkedAt":"2026-11-19","note":"Consultato per il contesto e la copertura; testi e immagini non importati"}]'::jsonb, null, null, false, 'Parametri stradali non calibrati per questa nazione. I tempi del configuratore sono indicativi: calcolare i trasferimenti prima di attivare.', null)
on conflict (release_id) do nothing;

insert into public.place_keys (place_key, country_code) values
  ('dk-copenaghen', 'DK'),
  ('dk-tivoli', 'DK'),
  ('dk-museo-nazionale', 'DK'),
  ('dk-experimentarium', 'DK'),
  ('dk-bla-planet', 'DK'),
  ('dk-roskilde', 'DK'),
  ('dk-museo-vichingo', 'DK'),
  ('dk-kronborg', 'DK'),
  ('dk-louisiana', 'DK'),
  ('dk-odense', 'DK'),
  ('dk-egeskov', 'DK'),
  ('dk-svendborg', 'DK'),
  ('dk-aero', 'DK'),
  ('dk-aarhus', 'DK'),
  ('dk-den-gamle-by', 'DK'),
  ('dk-aros', 'DK'),
  ('dk-billund', 'DK'),
  ('dk-legoland', 'DK'),
  ('dk-lego-house', 'DK'),
  ('dk-ribe', 'DK'),
  ('dk-jutland-wadden', 'DK'),
  ('dk-aalborg', 'DK'),
  ('dk-skagen', 'DK'),
  ('dk-grenen', 'DK'),
  ('dk-thy', 'DK'),
  ('dk-ronne', 'DK'),
  ('dk-hammershus', 'DK'),
  ('dk-cph', 'DK'),
  ('dk-bll', 'DK'),
  ('dk-aal', 'DK')
on conflict (place_key) do nothing;

-- Contenuto della versione: si scrive solo se è ancora in bozza
do $seed$
begin
  if not exists (select 1 from public.catalog_releases where release_id = 'DK-1' and status = 'bozza') then
    raise notice 'Versione DK-1 già pubblicata: nessuna scrittura, solo controllo';
    return;
  end if;
insert into public.regions (release_id, region_key, position, name, areas, sources) values
  ('DK-1', 'dk-r1', 0, 'Copenaghen e Selandia', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('DK-1', 'dk-r2', 1, 'Fionia', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('DK-1', 'dk-r3', 2, 'Jutland meridionale e centrale', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('DK-1', 'dk-r4', 3, 'Jutland settentrionale', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('DK-1', 'dk-r5', 4, 'Bornholm', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb);

insert into public.places (release_id, place_key, category, region_key, lat, lng, coords_status, local_name, visit_hours_min, visit_hours_max, difficulty, kid_score, reliability, is_base, day_visit, iata, official_url, official_kind, official_via, wikidata_qid, wiki_it, wiki_en, commons_image, base_place_key, address, setting, booking_advice, booking_url, hours_published, details_wikidata_qid, details_checked_at) values
  ('DK-1', 'dk-copenaghen', 'citta', 'dk-r1', 55.676111111111, 12.568888888889, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.kk.dk/', 'ente', 'Wikidata', 'Q1748', 'Copenaghen', 'Copenhagen', 'Copenhagen - view from Christiansborg castle.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-tivoli', 'parchi', 'dk-r1', 55.673611111111, 12.568333333333, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.tivoli.dk', 'attrazione', 'Wikidata', 'Q110289', 'Giardini di Tivoli', 'Tivoli Gardens', 'CopenhagenTivoliEntrance.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-museo-nazionale', 'musei', 'dk-r1', 55.67472222222222, 12.574722222222222, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://nationalmuseet.dk/en', 'attrazione', 'Wikidata', 'Q648166', 'Museo nazionale danese', 'National Museum of Denmark', null, null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-experimentarium', 'musei', 'dk-r1', 55.726547421663, 12.579962758737, 'verificate', 'Experimentarium', null, null, null, null, 'da_verificare', false, true, null, 'https://www.experimentarium.dk/', 'attrazione', 'Wikidata', 'Q12310799', null, null, '20171005 Experimentarium Hellerup 0062 (37729624156).jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-bla-planet', 'fauna', 'dk-r1', 55.638, 12.656, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://denblaaplanet.dk', 'attrazione', 'Wikidata', 'Q31828', 'Acquario nazionale danese', 'National Aquarium Denmark', 'Ocean tanken.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-roskilde', 'citta', 'dk-r1', 55.641666666667, 12.080833333333, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'http://roskilde.dk/', 'ente', 'Wikidata', 'Q26563', 'Roskilde', 'Roskilde', 'Roskilde ratusz mpazdziora.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-museo-vichingo', 'musei', 'dk-r1', 55.650139, 12.078944, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.vikingeskibsmuseet.dk/', 'attrazione', 'Wikidata', 'Q1458032', 'Museo delle navi vichinghe di Roskilde', 'Viking Ship Museum (Roskilde)', 'View of Viking Ship Museum from Roskilde Fjord.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-kronborg', 'musei', 'dk-r1', 56.038611111111, 12.621944444444, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.kronborg.dk', 'attrazione', 'Wikidata', 'Q189358', 'Castello di Kronborg', 'Kronborg', 'KronborgCastle HCS.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-louisiana', 'musei', 'dk-r1', 55.969444444444, 12.543055555556, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://louisiana.dk/', 'attrazione', 'Wikidata', 'Q1410617', 'Louisiana Museum of Modern Art', 'Louisiana Museum of Modern Art', 'Louisiana Museum of Modern Art Hovedindgang.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-odense', 'citta', 'dk-r2', 55.4, 10.383333333333, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.odense.dk/', 'ente', 'Wikidata', 'Q25331', 'Odense', 'Odense', 'Odense rådhus.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-egeskov', 'musei', 'dk-r2', 55.176388888889, 10.489444444444, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.egeskov.dk', 'attrazione', 'Wikidata', 'Q857504', 'Castello di Egeskov', 'Egeskov Castle', 'Egeskov Slot spejling Edit 2.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-svendborg', 'citta', 'dk-r2', 55.059722222222, 10.61, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'http://www.Svendborg.dk/', 'ente', 'Wikidata', 'Q28031', 'Svendborg', 'Svendborg', 'Svendborg.3.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-aero', 'isole', 'dk-r2', 54.883333333333, 10.333333333333, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, null, null, null, 'Q27150', 'Ærø (isola)', 'Ærø', 'Arroe by Blaeu 1665 (cropped).jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-aarhus', 'citta', 'dk-r3', 56.156388888889, 10.209722222222, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://aarhus.dk', 'ente', 'Wikidata', 'Q25319', 'Aarhus', 'Aarhus', null, null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-den-gamle-by', 'musei', 'dk-r3', 56.15888889, 10.19166667, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.dengamleby.dk', 'attrazione', 'Wikidata', 'Q1186756', 'Den Gamle By', 'Den Gamle By', 'Den gamle by 2.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-aros', 'musei', 'dk-r3', 56.153888888889, 10.199611111111, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.aros.dk', 'attrazione', 'Wikidata', 'Q296962', 'ARoS Aarhus Kunstmuseum', 'ARoS Aarhus Kunstmuseum', 'ARoS "Your rainbow" panorama under construction.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-billund', 'citta', 'dk-r3', 55.7243, 9.1188, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://billund.dk/', 'ente', 'Wikidata', 'Q1701099', 'Billund', 'Billund, Denmark', 'Billund skyline.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-legoland', 'parchi', 'dk-r3', 55.73555556, 9.12611111, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.legoland.dk', 'attrazione', 'Wikidata', 'Q1063513', 'Legoland Billund', 'Legoland Billund Resort', 'LegoBillundTowerView.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-lego-house', 'musei', 'dk-r3', 55.730688, 9.114958, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.legohouse.com', 'attrazione', 'Wikidata', 'Q22087791', null, 'Lego House (Billund)', 'Lego House Billund.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-ribe', 'citta', 'dk-r3', 55.327222, 8.763056, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, null, null, null, 'Q322361', 'Ribe', 'Ribe', 'Ribe - udsigt mod øst.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-jutland-wadden', 'natura', 'dk-r3', 54.456, 8.646, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, null, null, null, 'Q1965925', 'Parchi nazionali del mare dei Wadden', 'Wadden Sea National Parks', '13-09-29-Sylt Jorsand-N3S 9266.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-aalborg', 'citta', 'dk-r4', 57.05, 9.9166666666667, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.enjoynordjylland.dk/aalborg', 'ente', 'Wikidata', 'Q25410', 'Aalborg', 'Aalborg', 'Aalborg NyTorv 2004 ubt.jpeg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-skagen', 'citta', 'dk-r4', 57.722222222222, 10.587777777778, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.toppenafdanmark.dk/', 'ente', 'Wikidata', 'Q215177', 'Skagen', 'Skagen', 'Daphnesvej, Skagen, 2007 ubt.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-grenen', 'natura', 'dk-r4', 57.7456, 10.6469, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, null, null, null, 'Q1537592', 'Grenen', 'Grenen', 'Grenen-2001.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-thy', 'natura', 'dk-r4', 56.947, 8.422, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://nationalparkthy.dk/', 'attrazione', 'Wikidata', 'Q1639749', 'Parco nazionale Thy', 'Thy National Park', 'Nørre Vorupør Coast 2012-11-18.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-ronne', 'citta', 'dk-r5', 55.1, 14.7, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'http://www.brk.dk', 'ente', 'Wikidata', 'Q690062', 'Rønne', 'Rønne', 'Rønne Bornholm - 52568086465.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-hammershus', 'musei', 'dk-r5', 55.271150759805, 14.755814574273, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, null, null, null, 'Q700384', null, 'Hammershus', 'Bornholm Hammershus 01.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-cph', 'aeroporti', 'dk-r1', 55.618055555556, 12.656111111111, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'CPH', 'http://www.cph.dk/', 'attrazione', 'Wikidata', 'Q206277', 'Aeroporto di Copenaghen', 'Copenhagen Airport', 'Copenhagen airport from air.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-bll', 'aeroporti', 'dk-r3', 55.740277777778, 9.1519444444444, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'BLL', 'https://www.bll.dk/en', 'attrazione', 'Wikidata', 'Q598121', 'Aeroporto di Billund', 'Billund Airport', 'Billund Airport from NE.jpg', null, null, null, null, null, null, null, null),
  ('DK-1', 'dk-aal', 'aeroporti', 'dk-r4', 57.092777777778, 9.8491666666667, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'AAL', 'https://www.aal.dk', 'attrazione', 'Wikidata', 'Q478620', 'Aeroporto di Aalborg', 'Aalborg Airport', 'Aalborg Lufthavn indgang.JPG', null, null, null, null, null, null, null, null);

insert into public.place_texts (release_id, place_key, lang, name, description, access, season, august_note, area, booking_note, seasonal_note, outside_note) values
  ('DK-1', 'dk-copenaghen', 'it', 'Copenaghen', 'Capitale danese con canali, palazzi, musei e parchi urbani.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-tivoli', 'it', 'Giardini di Tivoli', 'Parco divertimenti storico nel centro di Copenaghen; calendario e accessi alle attrazioni da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-museo-nazionale', 'it', 'Museo nazionale danese', 'Museo di Copenaghen dedicato alla storia e alle culture della Danimarca.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-experimentarium', 'it', 'Experimentarium', 'Centro scientifico interattivo a Hellerup, nell’area di Copenaghen.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-bla-planet', 'it', 'Den Blå Planet', 'Acquario a Kastrup, nell’area di Copenaghen, dedicato agli ambienti acquatici.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-roskilde', 'it', 'Roskilde', 'Città della Selandia con cattedrale e museo delle navi vichinghe.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-museo-vichingo', 'it', 'Museo delle navi vichinghe di Roskilde', 'Museo dedicato alle navi e alle tecniche di navigazione vichinghe presso il fiordo di Roskilde.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-kronborg', 'it', 'Castello di Kronborg', 'Castello a Helsingør sullo stretto dell’Øresund, associato all’ambientazione dell’Amleto.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-louisiana', 'it', 'Louisiana Museum of Modern Art', 'Museo d’arte moderna a Humlebæk, con spazi espositivi e giardino sul mare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-odense', 'it', 'Odense', 'Città della Fionia legata alla vita e alle fiabe di Hans Christian Andersen.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-egeskov', 'it', 'Castello di Egeskov', 'Castello circondato dall’acqua in Fionia, con giardini e aree di visita.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-svendborg', 'it', 'Svendborg', 'Città portuale della Fionia meridionale, di fronte all’arcipelago.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-aero', 'it', 'Ærø', 'Isola dell’arcipelago della Fionia meridionale; collegamenti in traghetto da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-aarhus', 'it', 'Aarhus', 'Città dello Jutland con musei, quartieri storici e lungomare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-den-gamle-by', 'it', 'Den Gamle By', 'Museo all’aperto ad Aarhus con edifici e ambienti di vita urbana di epoche diverse.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-aros', 'it', 'ARoS', 'Museo d’arte ad Aarhus con collezioni ed esposizioni contemporanee.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-billund', 'it', 'Billund', 'Località dello Jutland centrale legata alla storia dei mattoncini LEGO.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-legoland', 'it', 'LEGOLAND Billund', 'Parco divertimenti a Billund; calendario, biglietti e requisiti delle attrazioni da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-lego-house', 'it', 'LEGO House', 'Centro di esperienze e costruzioni LEGO nel centro di Billund.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-ribe', 'it', 'Ribe', 'Città dello Jutland sud-occidentale con centro storico e cattedrale.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-jutland-wadden', 'it', 'Parco nazionale del Mare dei Wadden', 'Area costiera danese di piane di marea e isole; uscite e maree richiedono preparazione e verifica.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-aalborg', 'it', 'Aalborg', 'Città sul Limfjord nello Jutland settentrionale.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-skagen', 'it', 'Skagen', 'Località dello Jutland settentrionale con spiagge e tradizione artistica.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-grenen', 'it', 'Grenen', 'Punta sabbiosa presso Skagen; condizioni del mare, accessi e indicazioni di sicurezza da controllare sul posto.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-thy', 'it', 'Parco nazionale Thy', 'Parco dello Jutland nord-occidentale con dune, brughiere e laghi.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-ronne', 'it', 'Rønne', 'Città portuale dell’isola di Bornholm, utilizzabile come base per l’isola.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-hammershus', 'it', 'Hammershus', 'Rovine di una fortezza nella parte settentrionale di Bornholm.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-cph', 'it', 'Aeroporto di Copenaghen', 'Aeroporto di Kastrup nell’area di Copenaghen; trasferimenti da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-bll', 'it', 'Aeroporto di Billund', 'Aeroporto dello Jutland centrale presso Billund; trasferimenti da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('DK-1', 'dk-aal', 'it', 'Aeroporto di Aalborg', 'Aeroporto dell’area di Aalborg; trasferimenti da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null);

insert into public.place_sources (release_id, place_key, field, position, label, url, checked_at, license, method, note) values
  ('DK-1', 'dk-copenaghen', 'coordinate', 0, 'Wikidata Q1748 · P625', 'https://www.wikidata.org/wiki/Q1748', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-copenaghen', 'scheda', 0, 'Wikidata Q1748', 'https://www.wikidata.org/wiki/Q1748', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-copenaghen', 'wikidata', 0, 'Wikidata Q1748', 'https://www.wikidata.org/wiki/Q1748', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-copenaghen', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-copenaghen', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.kk.dk/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-tivoli', 'coordinate', 0, 'Wikidata Q110289 · P625', 'https://www.wikidata.org/wiki/Q110289', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-tivoli', 'scheda', 0, 'Wikidata Q110289', 'https://www.wikidata.org/wiki/Q110289', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-tivoli', 'wikidata', 0, 'Wikidata Q110289', 'https://www.wikidata.org/wiki/Q110289', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-tivoli', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-tivoli', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.tivoli.dk', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-museo-nazionale', 'coordinate', 0, 'Wikidata Q648166 · P625', 'https://www.wikidata.org/wiki/Q648166', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-museo-nazionale', 'scheda', 0, 'Wikidata Q648166', 'https://www.wikidata.org/wiki/Q648166', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-museo-nazionale', 'wikidata', 0, 'Wikidata Q648166', 'https://www.wikidata.org/wiki/Q648166', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-museo-nazionale', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-museo-nazionale', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://nationalmuseet.dk/en', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-experimentarium', 'coordinate', 0, 'Wikidata Q12310799 · P625', 'https://www.wikidata.org/wiki/Q12310799', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-experimentarium', 'scheda', 0, 'Wikidata Q12310799', 'https://www.wikidata.org/wiki/Q12310799', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-experimentarium', 'wikidata', 0, 'Wikidata Q12310799', 'https://www.wikidata.org/wiki/Q12310799', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-experimentarium', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-experimentarium', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.experimentarium.dk/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-bla-planet', 'coordinate', 0, 'Wikidata Q31828 · P625', 'https://www.wikidata.org/wiki/Q31828', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-bla-planet', 'scheda', 0, 'Wikidata Q31828', 'https://www.wikidata.org/wiki/Q31828', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-bla-planet', 'wikidata', 0, 'Wikidata Q31828', 'https://www.wikidata.org/wiki/Q31828', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-bla-planet', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-bla-planet', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://denblaaplanet.dk', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-roskilde', 'coordinate', 0, 'Wikidata Q26563 · P625', 'https://www.wikidata.org/wiki/Q26563', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-roskilde', 'scheda', 0, 'Wikidata Q26563', 'https://www.wikidata.org/wiki/Q26563', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-roskilde', 'wikidata', 0, 'Wikidata Q26563', 'https://www.wikidata.org/wiki/Q26563', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-roskilde', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-roskilde', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://roskilde.dk/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-museo-vichingo', 'coordinate', 0, 'Wikidata Q1458032 · P625', 'https://www.wikidata.org/wiki/Q1458032', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-museo-vichingo', 'scheda', 0, 'Wikidata Q1458032', 'https://www.wikidata.org/wiki/Q1458032', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-museo-vichingo', 'wikidata', 0, 'Wikidata Q1458032', 'https://www.wikidata.org/wiki/Q1458032', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-museo-vichingo', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-museo-vichingo', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.vikingeskibsmuseet.dk/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-kronborg', 'coordinate', 0, 'Wikidata Q189358 · P625', 'https://www.wikidata.org/wiki/Q189358', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-kronborg', 'scheda', 0, 'Wikidata Q189358', 'https://www.wikidata.org/wiki/Q189358', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-kronborg', 'wikidata', 0, 'Wikidata Q189358', 'https://www.wikidata.org/wiki/Q189358', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-kronborg', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-kronborg', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.kronborg.dk', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-louisiana', 'coordinate', 0, 'Wikidata Q1410617 · P625', 'https://www.wikidata.org/wiki/Q1410617', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-louisiana', 'scheda', 0, 'Wikidata Q1410617', 'https://www.wikidata.org/wiki/Q1410617', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-louisiana', 'wikidata', 0, 'Wikidata Q1410617', 'https://www.wikidata.org/wiki/Q1410617', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-louisiana', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-louisiana', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://louisiana.dk/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-odense', 'coordinate', 0, 'Wikidata Q25331 · P625', 'https://www.wikidata.org/wiki/Q25331', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-odense', 'scheda', 0, 'Wikidata Q25331', 'https://www.wikidata.org/wiki/Q25331', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-odense', 'wikidata', 0, 'Wikidata Q25331', 'https://www.wikidata.org/wiki/Q25331', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-odense', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-odense', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.odense.dk/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-egeskov', 'coordinate', 0, 'Wikidata Q857504 · P625', 'https://www.wikidata.org/wiki/Q857504', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-egeskov', 'scheda', 0, 'Wikidata Q857504', 'https://www.wikidata.org/wiki/Q857504', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-egeskov', 'wikidata', 0, 'Wikidata Q857504', 'https://www.wikidata.org/wiki/Q857504', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-egeskov', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-egeskov', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.egeskov.dk', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-svendborg', 'coordinate', 0, 'Wikidata Q28031 · P625', 'https://www.wikidata.org/wiki/Q28031', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-svendborg', 'scheda', 0, 'Wikidata Q28031', 'https://www.wikidata.org/wiki/Q28031', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-svendborg', 'wikidata', 0, 'Wikidata Q28031', 'https://www.wikidata.org/wiki/Q28031', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-svendborg', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-svendborg', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.Svendborg.dk/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-aero', 'coordinate', 0, 'Wikidata Q27150 · P625', 'https://www.wikidata.org/wiki/Q27150', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-aero', 'scheda', 0, 'Wikidata Q27150', 'https://www.wikidata.org/wiki/Q27150', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-aero', 'wikidata', 0, 'Wikidata Q27150', 'https://www.wikidata.org/wiki/Q27150', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-aero', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-aarhus', 'coordinate', 0, 'Wikidata Q25319 · P625', 'https://www.wikidata.org/wiki/Q25319', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-aarhus', 'scheda', 0, 'Wikidata Q25319', 'https://www.wikidata.org/wiki/Q25319', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-aarhus', 'wikidata', 0, 'Wikidata Q25319', 'https://www.wikidata.org/wiki/Q25319', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-aarhus', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-aarhus', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://aarhus.dk', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-den-gamle-by', 'coordinate', 0, 'Wikidata Q1186756 · P625', 'https://www.wikidata.org/wiki/Q1186756', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-den-gamle-by', 'scheda', 0, 'Wikidata Q1186756', 'https://www.wikidata.org/wiki/Q1186756', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-den-gamle-by', 'wikidata', 0, 'Wikidata Q1186756', 'https://www.wikidata.org/wiki/Q1186756', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-den-gamle-by', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-den-gamle-by', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.dengamleby.dk', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-aros', 'coordinate', 0, 'Wikidata Q296962 · P625', 'https://www.wikidata.org/wiki/Q296962', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-aros', 'scheda', 0, 'Wikidata Q296962', 'https://www.wikidata.org/wiki/Q296962', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-aros', 'wikidata', 0, 'Wikidata Q296962', 'https://www.wikidata.org/wiki/Q296962', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-aros', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-aros', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.aros.dk', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-billund', 'coordinate', 0, 'Wikidata Q1701099 · P625', 'https://www.wikidata.org/wiki/Q1701099', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-billund', 'scheda', 0, 'Wikidata Q1701099', 'https://www.wikidata.org/wiki/Q1701099', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-billund', 'wikidata', 0, 'Wikidata Q1701099', 'https://www.wikidata.org/wiki/Q1701099', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-billund', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-billund', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://billund.dk/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-legoland', 'coordinate', 0, 'Wikidata Q1063513 · P625', 'https://www.wikidata.org/wiki/Q1063513', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-legoland', 'scheda', 0, 'Wikidata Q1063513', 'https://www.wikidata.org/wiki/Q1063513', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-legoland', 'wikidata', 0, 'Wikidata Q1063513', 'https://www.wikidata.org/wiki/Q1063513', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-legoland', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-legoland', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.legoland.dk', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-lego-house', 'coordinate', 0, 'Wikidata Q22087791 · P625', 'https://www.wikidata.org/wiki/Q22087791', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-lego-house', 'scheda', 0, 'Wikidata Q22087791', 'https://www.wikidata.org/wiki/Q22087791', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-lego-house', 'wikidata', 0, 'Wikidata Q22087791', 'https://www.wikidata.org/wiki/Q22087791', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-lego-house', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-lego-house', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.legohouse.com', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-ribe', 'coordinate', 0, 'Wikidata Q322361 · P625', 'https://www.wikidata.org/wiki/Q322361', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-ribe', 'scheda', 0, 'Wikidata Q322361', 'https://www.wikidata.org/wiki/Q322361', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-ribe', 'wikidata', 0, 'Wikidata Q322361', 'https://www.wikidata.org/wiki/Q322361', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-ribe', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-jutland-wadden', 'coordinate', 0, 'Wikidata Q1965925 · P625', 'https://www.wikidata.org/wiki/Q1965925', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-jutland-wadden', 'scheda', 0, 'Wikidata Q1965925', 'https://www.wikidata.org/wiki/Q1965925', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-jutland-wadden', 'wikidata', 0, 'Wikidata Q1965925', 'https://www.wikidata.org/wiki/Q1965925', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-jutland-wadden', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-aalborg', 'coordinate', 0, 'Wikidata Q25410 · P625', 'https://www.wikidata.org/wiki/Q25410', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-aalborg', 'scheda', 0, 'Wikidata Q25410', 'https://www.wikidata.org/wiki/Q25410', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-aalborg', 'wikidata', 0, 'Wikidata Q25410', 'https://www.wikidata.org/wiki/Q25410', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-aalborg', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-aalborg', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.enjoynordjylland.dk/aalborg', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-skagen', 'coordinate', 0, 'Wikidata Q215177 · P625', 'https://www.wikidata.org/wiki/Q215177', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-skagen', 'scheda', 0, 'Wikidata Q215177', 'https://www.wikidata.org/wiki/Q215177', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-skagen', 'wikidata', 0, 'Wikidata Q215177', 'https://www.wikidata.org/wiki/Q215177', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-skagen', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-skagen', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.toppenafdanmark.dk/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-grenen', 'coordinate', 0, 'Wikidata Q1537592 · P625', 'https://www.wikidata.org/wiki/Q1537592', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-grenen', 'scheda', 0, 'Wikidata Q1537592', 'https://www.wikidata.org/wiki/Q1537592', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-grenen', 'wikidata', 0, 'Wikidata Q1537592', 'https://www.wikidata.org/wiki/Q1537592', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-grenen', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-thy', 'coordinate', 0, 'Wikidata Q1639749 · P625', 'https://www.wikidata.org/wiki/Q1639749', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-thy', 'scheda', 0, 'Wikidata Q1639749', 'https://www.wikidata.org/wiki/Q1639749', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-thy', 'wikidata', 0, 'Wikidata Q1639749', 'https://www.wikidata.org/wiki/Q1639749', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-thy', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-thy', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://nationalparkthy.dk/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-ronne', 'coordinate', 0, 'Wikidata Q690062 · P625', 'https://www.wikidata.org/wiki/Q690062', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-ronne', 'scheda', 0, 'Wikidata Q690062', 'https://www.wikidata.org/wiki/Q690062', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-ronne', 'wikidata', 0, 'Wikidata Q690062', 'https://www.wikidata.org/wiki/Q690062', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-ronne', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-ronne', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.brk.dk', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-hammershus', 'coordinate', 0, 'Wikidata Q700384 · P625', 'https://www.wikidata.org/wiki/Q700384', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-hammershus', 'scheda', 0, 'Wikidata Q700384', 'https://www.wikidata.org/wiki/Q700384', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-hammershus', 'wikidata', 0, 'Wikidata Q700384', 'https://www.wikidata.org/wiki/Q700384', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-hammershus', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-cph', 'coordinate', 0, 'Wikidata Q206277 · P625', 'https://www.wikidata.org/wiki/Q206277', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-cph', 'scheda', 0, 'Wikidata Q206277', 'https://www.wikidata.org/wiki/Q206277', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-cph', 'wikidata', 0, 'Wikidata Q206277', 'https://www.wikidata.org/wiki/Q206277', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-cph', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-cph', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.cph.dk/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-bll', 'coordinate', 0, 'Wikidata Q598121 · P625', 'https://www.wikidata.org/wiki/Q598121', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-bll', 'scheda', 0, 'Wikidata Q598121', 'https://www.wikidata.org/wiki/Q598121', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-bll', 'wikidata', 0, 'Wikidata Q598121', 'https://www.wikidata.org/wiki/Q598121', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-bll', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-bll', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.bll.dk/en', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('DK-1', 'dk-aal', 'coordinate', 0, 'Wikidata Q478620 · P625', 'https://www.wikidata.org/wiki/Q478620', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('DK-1', 'dk-aal', 'scheda', 0, 'Wikidata Q478620', 'https://www.wikidata.org/wiki/Q478620', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-aal', 'wikidata', 0, 'Wikidata Q478620', 'https://www.wikidata.org/wiki/Q478620', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('DK-1', 'dk-aal', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('DK-1', 'dk-aal', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.aal.dk', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate');

-- operators: nessuna riga

-- voyages: nessuna riga

-- route_ports: nessuna riga

-- place_links: nessuna riga

insert into public.place_photos (release_id, place_key, position, commons_file, author, license, license_url, checked_at) values
  ('DK-1', 'dk-copenaghen', 0, 'Copenhagen - view from Christiansborg castle.jpg', 'Pudelek', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DK-1', 'dk-tivoli', 0, 'CopenhagenTivoliEntrance.jpg', 'Elgaard', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('DK-1', 'dk-experimentarium', 0, '20171005 Experimentarium Hellerup 0062 (37729624156).jpg', 'Johan Wessman / News Oresund', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0', '2026-11-19'),
  ('DK-1', 'dk-bla-planet', 0, 'Ocean tanken.jpg', 'Villy Fink Isaksen', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DK-1', 'dk-roskilde', 0, 'Roskilde ratusz mpazdziora.jpg', 'Mariusz Paździora', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DK-1', 'dk-museo-vichingo', 0, 'View of Viking Ship Museum from Roskilde Fjord.jpg', 'Jami430', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DK-1', 'dk-kronborg', 0, 'KronborgCastle HCS.jpg', 'H.C. Steensen', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DK-1', 'dk-louisiana', 0, 'Louisiana Museum of Modern Art Hovedindgang.jpg', 'Louisiana Museum of Modern Art / Kim Hansen', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DK-1', 'dk-odense', 0, 'Odense rådhus.jpg', 'Emelie Graven', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DK-1', 'dk-egeskov', 0, 'Egeskov Slot spejling Edit 2.jpg', 'Malene Thyssen', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('DK-1', 'dk-svendborg', 0, 'Svendborg.3.jpg', 'Erik Christensen', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('DK-1', 'dk-aero', 0, 'Arroe by Blaeu 1665 (cropped).jpg', 'Joan Blaeu', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('DK-1', 'dk-den-gamle-by', 0, 'Den gamle by 2.jpg', 'Nico-dk (talk) 21:08, 17 September 2009 (UTC)', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DK-1', 'dk-aros', 0, 'ARoS "Your rainbow" panorama under construction.jpg', 'Jon Wickmann', 'CC BY 3.0', 'https://creativecommons.org/licenses/by/3.0', '2026-11-19'),
  ('DK-1', 'dk-billund', 0, 'Billund skyline.jpg', 'HartOve', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0', '2026-11-19'),
  ('DK-1', 'dk-legoland', 0, 'LegoBillundTowerView.jpg', 'A.Christensen', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('DK-1', 'dk-lego-house', 0, 'Lego House Billund.jpg', 'MPhernambucq', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DK-1', 'dk-ribe', 0, 'Ribe - udsigt mod øst.jpg', 'Hubertus45', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('DK-1', 'dk-ribe', 1, 'RibeVue.jpg', 'Hjart', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DK-1', 'dk-jutland-wadden', 0, '13-09-29-Sylt Jorsand-N3S 9266.jpg', 'Ralf Roletschek', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DK-1', 'dk-aalborg', 0, 'Aalborg NyTorv 2004 ubt.jpeg', '© 2004 by Tomasz Sienicki [user: tsca, mail: tomasz.sienicki at gmail.com]', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('DK-1', 'dk-skagen', 0, 'Daphnesvej, Skagen, 2007 ubt.jpg', 'photo © 2007 by Tomasz Sienicki [user: tsca, mail: tomasz.sienicki at gmail.com]', 'CC BY 3.0', 'https://creativecommons.org/licenses/by/3.0', '2026-11-19'),
  ('DK-1', 'dk-skagen', 1, 'Skagen seen from the lighthouse 2009.jpg', 'De-okin (talk) 15:41, 25 July 2009 (UTC)', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DK-1', 'dk-skagen', 2, 'Skagen (Danemark).jpg', 'Jérémy Toma', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DK-1', 'dk-grenen', 0, 'Grenen-2001.jpg', 'Original uploader was Hansjorn at da.wikipedia', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('DK-1', 'dk-thy', 0, 'Nørre Vorupør Coast 2012-11-18.jpg', 'Slaunger', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DK-1', 'dk-ronne', 0, 'Rønne Bornholm - 52568086465.jpg', 'Werner Wilmes', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0', '2026-11-19'),
  ('DK-1', 'dk-hammershus', 0, 'Bornholm Hammershus 01.jpg', 'Unukorno', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0', '2026-11-19'),
  ('DK-1', 'dk-cph', 0, 'Copenhagen airport from air.jpg', 'kallerna', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('DK-1', 'dk-bll', 0, 'Billund Airport from NE.jpg', 'Nico-dk', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('DK-1', 'dk-aal', 0, 'Aalborg Lufthavn indgang.JPG', 'Simon Wedege Petersen', 'CC BY 3.0', 'https://creativecommons.org/licenses/by/3.0', '2026-11-19');

-- place_tips: nessuna riga

end $seed$;

update public.catalog_releases set status = 'pubblicata', published_at = now() where release_id = 'DK-1' and status = 'bozza';

-- Controllo finale: se fallisce, la transazione si annulla
do $check$
declare
  v_n bigint;
begin
  if not exists (select 1 from public.countries where code = 'DK' and currency = 'DKK' and timezone = 'Europe/Copenhagen' and language = 'da') then
    raise exception 'Nazione DK: valuta, fuso o lingua diversi da quelli del seed';
  end if;
  perform now() at time zone 'Europe/Copenhagen';
  if not exists (select 1 from public.catalog_releases where release_id = 'DK-1' and status = 'pubblicata') then
    raise exception 'Versione DK-1 non pubblicata';
  end if;
  select count(*) into v_n from public.regions where release_id = 'DK-1';
  if v_n <> 5 then raise exception 'regions (release_id = ''DK-1''): attese 5 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'DK-1';
  if v_n <> 30 then raise exception 'places (release_id = ''DK-1''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_texts where release_id = 'DK-1';
  if v_n <> 30 then raise exception 'place_texts (release_id = ''DK-1''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_sources where release_id = 'DK-1';
  if v_n <> 145 then raise exception 'place_sources (release_id = ''DK-1''): attese 145 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.operators where release_id = 'DK-1';
  if v_n <> 0 then raise exception 'operators (release_id = ''DK-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.voyages where release_id = 'DK-1';
  if v_n <> 0 then raise exception 'voyages (release_id = ''DK-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.route_ports where release_id = 'DK-1';
  if v_n <> 0 then raise exception 'route_ports (release_id = ''DK-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_links where release_id = 'DK-1';
  if v_n <> 0 then raise exception 'place_links (release_id = ''DK-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'DK-1' and category = 'porti';
  if v_n <> 0 then raise exception 'places (release_id = ''DK-1'' and category = ''porti''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'DK-1' and coords_status = 'verificate';
  if v_n <> 30 then raise exception 'places (release_id = ''DK-1'' and coords_status = ''verificate''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'DK-1' and official_url is not null;
  if v_n <> 25 then raise exception 'places (release_id = ''DK-1'' and official_url is not null): attese 25 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'DK-1' and wikidata_qid is not null;
  if v_n <> 30 then raise exception 'places (release_id = ''DK-1'' and wikidata_qid is not null): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'DK-1' and base_place_key is not null;
  if v_n <> 0 then raise exception 'places (release_id = ''DK-1'' and base_place_key is not null): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_photos where release_id = 'DK-1';
  if v_n <> 31 then raise exception 'place_photos (release_id = ''DK-1''): attese 31 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_tips where release_id = 'DK-1';
  if v_n <> 0 then raise exception 'place_tips (release_id = ''DK-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places p join public.place_keys k on k.place_key = p.place_key where p.release_id = 'DK-1' and k.country_code <> 'DK';
  if v_n <> 0 then raise exception 'Chiavi di luogo registrate per un''altra nazione: %', v_n; end if;
  select count(*) into v_n from public.places p where p.release_id = 'DK-1' and not exists (select 1 from public.place_texts t where t.release_id = p.release_id and t.place_key = p.place_key and t.lang = 'it');
  if v_n <> 0 then raise exception 'Luoghi senza testo italiano: %', v_n; end if;
  raise notice 'Catalogo DK-1 pubblicato e controllato: 30 luoghi, 0 crociere, 0 porti in rotta';
end $check$;

-- Versioni precedenti: cancellate (i viaggi passano a questa, che le contiene)
do $purge$
begin
  if to_regprocedure('private.purge_superseded_releases(text)') is not null then
    perform private.purge_superseded_releases('DK');
  end if;
end $purge$;

commit;
