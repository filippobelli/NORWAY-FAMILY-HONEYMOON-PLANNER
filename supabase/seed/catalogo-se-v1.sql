-- Catalogo Svezia, versione 1 (SE-1).
-- GENERATO da scripts/seed-catalog.ts: non modificare a mano, rigenerare con `npx tsx scripts/seed-catalog.ts`.
-- Prerequisito: migrazioni supabase/migrations/20261106000100 … 20261106000500.
-- Idempotente: con la versione già pubblicata non scrive nulla e controlla solo i conteggi.
-- Tocca solo le tabelle del catalogo: nessun viaggio, nessun dato di auth.

begin;

insert into public.countries (code, name, names, currency, timezone, language) values
  ('SE', 'Svezia', '{"en":"Sweden"}'::jsonb, 'SEK', 'Europe/Stockholm', 'sv')
on conflict (code) do nothing;

insert into public.catalog_releases (release_id, country_code, version, status, data_checked_until, notes, source_notes, road_factor, avg_kmh, road_calibrated, road_note, airport_radius_km) values
  ('SE-1', 'SE', 1, 'bozza', '2026-11-19', 'Prima selezione editoriale: città, musei, natura, parchi e aeroporti. Coordinate da Wikidata; foto Commons con licenza per file. Informazioni operative da verificare. Trasporti non ancora catalogati.', '[{"label":"Wikidata: dati strutturati CC0","url":"https://www.wikidata.org/wiki/Wikidata:Licensing","checkedAt":"2026-11-19","license":"CC0-1.0"},{"label":"Ente turistico · Svezia","url":"https://visitsweden.com/","checkedAt":"2026-11-19","note":"Consultato per il contesto e la copertura; testi e immagini non importati"}]'::jsonb, null, null, false, 'Parametri stradali non calibrati per questa nazione. I tempi del configuratore sono indicativi: calcolare i trasferimenti prima di attivare.', null)
on conflict (release_id) do nothing;

insert into public.place_keys (place_key, country_code) values
  ('se-stoccolma', 'SE'),
  ('se-vasa', 'SE'),
  ('se-skansen', 'SE'),
  ('se-junibacken', 'SE'),
  ('se-tekniska', 'SE'),
  ('se-drottningholm', 'SE'),
  ('se-uppsala', 'SE'),
  ('se-sigtuna', 'SE'),
  ('se-goteborg', 'SE'),
  ('se-universeum', 'SE'),
  ('se-liseberg', 'SE'),
  ('se-marstrand', 'SE'),
  ('se-malmo', 'SE'),
  ('se-lund', 'SE'),
  ('se-ystad', 'SE'),
  ('se-soderasen', 'SE'),
  ('se-kalmar', 'SE'),
  ('se-oland', 'SE'),
  ('se-vimmerby', 'SE'),
  ('se-astrid-lindgren', 'SE'),
  ('se-visby', 'SE'),
  ('se-faro', 'SE'),
  ('se-falun', 'SE'),
  ('se-miniera-falun', 'SE'),
  ('se-ostersund', 'SE'),
  ('se-kiruna', 'SE'),
  ('se-abisko', 'SE'),
  ('se-arn', 'SE'),
  ('se-got', 'SE'),
  ('se-mmx', 'SE')
on conflict (place_key) do nothing;

-- Contenuto della versione: si scrive solo se è ancora in bozza
do $seed$
begin
  if not exists (select 1 from public.catalog_releases where release_id = 'SE-1' and status = 'bozza') then
    raise notice 'Versione SE-1 già pubblicata: nessuna scrittura, solo controllo';
    return;
  end if;
insert into public.regions (release_id, region_key, position, name, areas, sources) values
  ('SE-1', 'se-r1', 0, 'Stoccolma e Svezia centrale', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('SE-1', 'se-r2', 1, 'Göteborg e costa occidentale', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('SE-1', 'se-r3', 2, 'Scania e Svezia meridionale', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('SE-1', 'se-r4', 3, 'Småland e Öland', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('SE-1', 'se-r5', 4, 'Gotland', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('SE-1', 'se-r6', 5, 'Dalarna e Svezia settentrionale', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb);

insert into public.places (release_id, place_key, category, region_key, lat, lng, coords_status, local_name, visit_hours_min, visit_hours_max, difficulty, kid_score, reliability, is_base, day_visit, iata, official_url, official_kind, official_via, wikidata_qid, wiki_it, wiki_en, commons_image, base_place_key, address, setting, booking_advice, booking_url, hours_published, details_wikidata_qid, details_checked_at) values
  ('SE-1', 'se-stoccolma', 'citta', 'se-r1', 59.329444444444, 18.068611111111, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://start.stockholm/', 'ente', 'Wikidata', 'Q1754', 'Stoccolma', 'Stockholm', 'Stockholm gamlastan etc.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-vasa', 'musei', 'se-r1', 59.32807, 18.09139, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.vasamuseet.se/', 'attrazione', 'Wikidata', 'Q901371', 'Museo Vasa', 'Vasa Museum', 'Vasa model.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-skansen', 'musei', 'se-r1', 59.32445, 18.101, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://skansen.se', 'attrazione', 'Wikidata', 'Q725108', 'Skansen', 'Skansen', 'Skansen Entré 2015a.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-junibacken', 'musei', 'se-r1', 59.329444444444, 18.088888888889, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.junibacken.se/', 'attrazione', 'Wikidata', 'Q1713506', 'Junibacken', 'Junibacken', 'Junibacken 2007.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-tekniska', 'musei', 'se-r1', 59.3325, 18.11861111, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.tekniskamuseet.se/', 'attrazione', 'Wikidata', 'Q177550', 'Museo nazionale svedese di scienza e tecnologia', 'National Museum of Science and Technology (Sweden)', 'Swedish national museum of science and technology 20061026 001.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-drottningholm', 'musei', 'se-r1', 59.321694, 17.886383, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.kungligaslotten.se/english/royal-palaces-and-sites/drottningholm-palace.html', 'attrazione', 'Wikidata', 'Q208559', 'Castello di Drottningholm', 'Drottningholm Palace', 'Drottningholm Palace (by Pudelek) 3.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-uppsala', 'citta', 'se-r1', 59.849760548324, 17.638946597524, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'http://www.uppsala.se', 'ente', 'Wikidata', 'Q25286', 'Uppsala', 'Uppsala', 'Uppsala vanalinn suveõhtul.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-sigtuna', 'citta', 'se-r1', 59.61731, 17.72361, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.sigtuna.se', 'ente', 'Wikidata', 'Q3183470', 'Sigtuna', 'Sigtuna', 'Stora gatan i Sigtuna nr 1.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-goteborg', 'citta', 'se-r2', 57.7075, 11.9675, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://goteborg.se/', 'ente', 'Wikidata', 'Q25287', 'Göteborg', 'Gothenburg', 'Göteborg 2503 stitch (28573994096).jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-universeum', 'musei', 'se-r2', 57.695555555556, 11.989166666667, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.universeum.se', 'attrazione', 'Wikidata', 'Q388667', null, 'Universeum', 'Universeum2.JPG', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-liseberg', 'parchi', 'se-r2', 57.695555555556, 11.99, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.liseberg.com', 'attrazione', 'Wikidata', 'Q1413270', 'Liseberg', 'Liseberg', 'Liseberg, 20221223.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-marstrand', 'isole', 'se-r2', 57.88576929949, 11.580885793696, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.marstrand.se', 'attrazione', 'Wikidata', 'Q406556', 'Marstrand', 'Marstrand', 'Marstrand - KMB - 16000300022826 (cropped).jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-malmo', 'citta', 'se-r3', 55.583333333333336, 13, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'http://www.malmo.se', 'ente', 'Wikidata', 'Q2211', 'Malmö', 'Malmö', 'Centrala Malmö.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-lund', 'citta', 'se-r3', 55.708313018551, 13.199164196669, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'http://www.lund.se', 'ente', 'Wikidata', 'Q2167', 'Lund', 'Lund', 'Stortorget lund 080508.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-ystad', 'citta', 'se-r3', 55.434619741448, 13.825365282235, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.ystad.se/', 'ente', 'Wikidata', 'Q28287', 'Ystad', 'Ystad', 'Ystad stortorget.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-soderasen', 'natura', 'se-r3', 56.024143280350344, 13.2300891594342, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.nationalpark-soderasen.lst.se/', 'attrazione', 'Wikidata', 'Q1530442', 'Parco nazionale Söderåsen', 'Söderåsen', 'Kopparhatten.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-kalmar', 'citta', 'se-r4', 56.66428611111111, 16.365633333333335, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.kalmar.se/', 'ente', 'Wikidata', 'Q26345', 'Kalmar', 'Kalmar', 'Kalmar collage.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-oland', 'isole', 'se-r4', 56.733333333333, 16.666666666667, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.oland.se', 'attrazione', 'Wikidata', 'Q239276', 'Öland', 'Öland', 'Resmo,Kvarnar vid Gynge hög 01.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-vimmerby', 'citta', 'se-r4', 57.668639398054, 15.855066742328, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, null, null, null, 'Q634231', 'Vimmerby', 'Vimmerby', 'Torget i Vimmerby.JPG', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-astrid-lindgren', 'parchi', 'se-r4', 57.674444444444, 15.843611111111, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://astridlindgrensvarld.se', 'attrazione', 'Wikidata', 'Q750684', 'Il mondo di Astrid Lindgren', 'Astrid Lindgren''s World', 'Astrid Lindgrens Värld - Entré.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-visby', 'citta', 'se-r5', 57.628997457133, 18.307108945039, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'http://www.visby.se/', 'ente', 'Wikidata', 'Q54757', 'Visby', 'Visby', 'Visby 13-.JPG', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-faro', 'isole', 'se-r5', 57.933333333333, 19.15, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, null, null, null, 'Q1004693', 'Fårö', 'Fårö', 'Rauks (3881539849).jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-falun', 'citta', 'se-r6', 60.602736713846, 15.656063817692, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'http://www.falun.se', 'ente', 'Wikidata', 'Q26509', 'Falun', 'Falun', 'Falun från Radiohuset.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-miniera-falun', 'musei', 'se-r6', 60.604722222222, 15.630833333333, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, null, null, null, 'Q636194', 'Falu koppargruva', 'Falun Mine', 'Falu koppargruva July 2017 01.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-ostersund', 'citta', 'se-r6', 63.179175, 14.63600638888889, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.ostersund.se', 'ente', 'Wikidata', 'Q26515', 'Östersund', 'Östersund', 'Östersund from Frösön.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-kiruna', 'citta', 'se-r6', 67.8488888888889, 20.302777777777777, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, null, null, null, 'Q83232', 'Kiruna', 'Kiruna', 'Kiruna montage.png', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-abisko', 'natura', 'se-r6', 68.32429948502646, 18.68073066647587, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://sverigesnationalparker.se/en/choose-park---list/abisko-national-park/', 'attrazione', 'Wikidata', 'Q953092', 'Parco nazionale Abisko', 'Abisko National Park', 'Abiskojåkka.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-arn', 'aeroporti', 'se-r1', 59.651944444444, 17.918611111111, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'ARN', 'https://www.swedavia.com/arlanda/', 'attrazione', 'Wikidata', 'Q223499', 'Aeroporto di Stoccolma-Arlanda', 'Stockholm Arlanda Airport', 'Arlanda 1 Publish.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-got', 'aeroporti', 'se-r2', 57.66, 12.291111111111, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'GOT', 'https://www.swedavia.com/landvetter/', 'attrazione', 'Wikidata', 'Q1137115', 'Aeroporto di Göteborg-Landvetter', 'Göteborg Landvetter Airport', 'GOT D-AEMD.jpg', null, null, null, null, null, null, null, null),
  ('SE-1', 'se-mmx', 'aeroporti', 'se-r3', 55.53, 13.371388888889, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'MMX', 'http://www.swedavia.com/malmo/', 'attrazione', 'Wikidata', 'Q898922', 'Aeroporto di Malmö-Sturup', 'Malmö Airport', 'Sturup airport.jpg', null, null, null, null, null, null, null, null);

insert into public.place_texts (release_id, place_key, lang, name, description, access, season, august_note, area, booking_note, seasonal_note, outside_note) values
  ('SE-1', 'se-stoccolma', 'it', 'Stoccolma', 'Capitale svedese distribuita su isole, con centro storico, musei e lungofiume.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-vasa', 'it', 'Museo Vasa', 'Museo di Stoccolma dedicato alla nave seicentesca Vasa.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-skansen', 'it', 'Skansen', 'Museo all’aperto sull’isola di Djurgården con edifici storici e aree dedicate agli animali.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-junibacken', 'it', 'Junibacken', 'Centro di esperienze a Stoccolma dedicato alla letteratura per l’infanzia.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-tekniska', 'it', 'Tekniska museet', 'Museo della scienza e della tecnica nell’area di Stoccolma.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-drottningholm', 'it', 'Palazzo di Drottningholm', 'Residenza reale sull’isola di Lovön, con giardini e edifici storici.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-uppsala', 'it', 'Uppsala', 'Città universitaria a nord di Stoccolma, con cattedrale e giardini.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-sigtuna', 'it', 'Sigtuna', 'Località storica sulle rive del lago Mälaren.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-goteborg', 'it', 'Göteborg', 'Città portuale della costa occidentale con canali, musei e parchi.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-universeum', 'it', 'Universeum', 'Centro scientifico di Göteborg con esposizioni dedicate a natura e tecnologia.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-liseberg', 'it', 'Liseberg', 'Parco divertimenti a Göteborg; calendario e requisiti delle attrazioni da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-marstrand', 'it', 'Marstrand', 'Località costiera e insulare del Bohuslän, con fortezza e porto.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-malmo', 'it', 'Malmö', 'Città della Scania sull’Øresund con parchi e quartieri contemporanei.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-lund', 'it', 'Lund', 'Città universitaria della Scania con cattedrale e centro storico.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-ystad', 'it', 'Ystad', 'Città costiera della Scania con edifici a graticcio e porto.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-soderasen', 'it', 'Parco nazionale Söderåsen', 'Parco della Scania con boschi e valloni; sentieri e accessibilità da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-kalmar', 'it', 'Kalmar', 'Città sullo stretto di Kalmar con castello e collegamento stradale verso Öland.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-oland', 'it', 'Öland', 'Isola del Baltico con paesaggi rurali, costa e aree naturali.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-vimmerby', 'it', 'Vimmerby', 'Località dello Småland legata alla scrittrice Astrid Lindgren.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-astrid-lindgren', 'it', 'Il mondo di Astrid Lindgren', 'Parco tematico a Vimmerby ispirato ai personaggi di Astrid Lindgren; apertura e spettacoli da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-visby', 'it', 'Visby', 'Città di Gotland con cinta muraria medievale e centro storico.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-faro', 'it', 'Fårö', 'Isola a nord di Gotland con costa e formazioni rocciose; collegamento locale da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-falun', 'it', 'Falun', 'Città della Dalarna legata alla storia dell’estrazione del rame.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-miniera-falun', 'it', 'Miniera di Falun', 'Sito minerario storico della Dalarna; visite sotterranee, età minima e accessi da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-ostersund', 'it', 'Östersund', 'Città del Jämtland sul lago Storsjön.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-kiruna', 'it', 'Kiruna', 'Città della Lapponia svedese, interessata dallo spostamento del centro urbano.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-abisko', 'it', 'Parco nazionale Abisko', 'Parco della Lapponia con ambienti montani; meteo, stagione e difficoltà dei sentieri da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-arn', 'it', 'Aeroporto di Stoccolma Arlanda', 'Aeroporto dell’area di Stoccolma; terminal e trasferimenti da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-got', 'it', 'Aeroporto di Göteborg Landvetter', 'Aeroporto dell’area di Göteborg; trasferimenti da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('SE-1', 'se-mmx', 'it', 'Aeroporto di Malmö', 'Aeroporto dell’area di Malmö; trasferimenti verso la città da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null);

insert into public.place_sources (release_id, place_key, field, position, label, url, checked_at, license, method, note) values
  ('SE-1', 'se-stoccolma', 'coordinate', 0, 'Wikidata Q1754 · P625', 'https://www.wikidata.org/wiki/Q1754', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-stoccolma', 'scheda', 0, 'Wikidata Q1754', 'https://www.wikidata.org/wiki/Q1754', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-stoccolma', 'wikidata', 0, 'Wikidata Q1754', 'https://www.wikidata.org/wiki/Q1754', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-stoccolma', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-stoccolma', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://start.stockholm/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-vasa', 'coordinate', 0, 'Wikidata Q901371 · P625', 'https://www.wikidata.org/wiki/Q901371', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-vasa', 'scheda', 0, 'Wikidata Q901371', 'https://www.wikidata.org/wiki/Q901371', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-vasa', 'wikidata', 0, 'Wikidata Q901371', 'https://www.wikidata.org/wiki/Q901371', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-vasa', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-vasa', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.vasamuseet.se/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-skansen', 'coordinate', 0, 'Wikidata Q725108 · P625', 'https://www.wikidata.org/wiki/Q725108', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-skansen', 'scheda', 0, 'Wikidata Q725108', 'https://www.wikidata.org/wiki/Q725108', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-skansen', 'wikidata', 0, 'Wikidata Q725108', 'https://www.wikidata.org/wiki/Q725108', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-skansen', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-skansen', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://skansen.se', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-junibacken', 'coordinate', 0, 'Wikidata Q1713506 · P625', 'https://www.wikidata.org/wiki/Q1713506', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-junibacken', 'scheda', 0, 'Wikidata Q1713506', 'https://www.wikidata.org/wiki/Q1713506', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-junibacken', 'wikidata', 0, 'Wikidata Q1713506', 'https://www.wikidata.org/wiki/Q1713506', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-junibacken', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-junibacken', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.junibacken.se/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-tekniska', 'coordinate', 0, 'Wikidata Q177550 · P625', 'https://www.wikidata.org/wiki/Q177550', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-tekniska', 'scheda', 0, 'Wikidata Q177550', 'https://www.wikidata.org/wiki/Q177550', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-tekniska', 'wikidata', 0, 'Wikidata Q177550', 'https://www.wikidata.org/wiki/Q177550', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-tekniska', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-tekniska', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.tekniskamuseet.se/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-drottningholm', 'coordinate', 0, 'Wikidata Q208559 · P625', 'https://www.wikidata.org/wiki/Q208559', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-drottningholm', 'scheda', 0, 'Wikidata Q208559', 'https://www.wikidata.org/wiki/Q208559', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-drottningholm', 'wikidata', 0, 'Wikidata Q208559', 'https://www.wikidata.org/wiki/Q208559', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-drottningholm', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-drottningholm', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.kungligaslotten.se/english/royal-palaces-and-sites/drottningholm-palace.html', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-uppsala', 'coordinate', 0, 'Wikidata Q25286 · P625', 'https://www.wikidata.org/wiki/Q25286', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-uppsala', 'scheda', 0, 'Wikidata Q25286', 'https://www.wikidata.org/wiki/Q25286', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-uppsala', 'wikidata', 0, 'Wikidata Q25286', 'https://www.wikidata.org/wiki/Q25286', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-uppsala', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-uppsala', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.uppsala.se', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-sigtuna', 'coordinate', 0, 'Wikidata Q3183470 · P625', 'https://www.wikidata.org/wiki/Q3183470', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-sigtuna', 'scheda', 0, 'Wikidata Q3183470', 'https://www.wikidata.org/wiki/Q3183470', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-sigtuna', 'wikidata', 0, 'Wikidata Q3183470', 'https://www.wikidata.org/wiki/Q3183470', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-sigtuna', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-sigtuna', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.sigtuna.se', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-goteborg', 'coordinate', 0, 'Wikidata Q25287 · P625', 'https://www.wikidata.org/wiki/Q25287', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-goteborg', 'scheda', 0, 'Wikidata Q25287', 'https://www.wikidata.org/wiki/Q25287', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-goteborg', 'wikidata', 0, 'Wikidata Q25287', 'https://www.wikidata.org/wiki/Q25287', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-goteborg', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-goteborg', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://goteborg.se/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-universeum', 'coordinate', 0, 'Wikidata Q388667 · P625', 'https://www.wikidata.org/wiki/Q388667', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-universeum', 'scheda', 0, 'Wikidata Q388667', 'https://www.wikidata.org/wiki/Q388667', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-universeum', 'wikidata', 0, 'Wikidata Q388667', 'https://www.wikidata.org/wiki/Q388667', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-universeum', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-universeum', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.universeum.se', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-liseberg', 'coordinate', 0, 'Wikidata Q1413270 · P625', 'https://www.wikidata.org/wiki/Q1413270', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-liseberg', 'scheda', 0, 'Wikidata Q1413270', 'https://www.wikidata.org/wiki/Q1413270', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-liseberg', 'wikidata', 0, 'Wikidata Q1413270', 'https://www.wikidata.org/wiki/Q1413270', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-liseberg', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-liseberg', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.liseberg.com', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-marstrand', 'coordinate', 0, 'Wikidata Q406556 · P625', 'https://www.wikidata.org/wiki/Q406556', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-marstrand', 'scheda', 0, 'Wikidata Q406556', 'https://www.wikidata.org/wiki/Q406556', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-marstrand', 'wikidata', 0, 'Wikidata Q406556', 'https://www.wikidata.org/wiki/Q406556', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-marstrand', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-marstrand', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.marstrand.se', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-malmo', 'coordinate', 0, 'Wikidata Q2211 · P625', 'https://www.wikidata.org/wiki/Q2211', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-malmo', 'scheda', 0, 'Wikidata Q2211', 'https://www.wikidata.org/wiki/Q2211', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-malmo', 'wikidata', 0, 'Wikidata Q2211', 'https://www.wikidata.org/wiki/Q2211', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-malmo', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-malmo', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.malmo.se', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-lund', 'coordinate', 0, 'Wikidata Q2167 · P625', 'https://www.wikidata.org/wiki/Q2167', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-lund', 'scheda', 0, 'Wikidata Q2167', 'https://www.wikidata.org/wiki/Q2167', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-lund', 'wikidata', 0, 'Wikidata Q2167', 'https://www.wikidata.org/wiki/Q2167', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-lund', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-lund', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.lund.se', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-ystad', 'coordinate', 0, 'Wikidata Q28287 · P625', 'https://www.wikidata.org/wiki/Q28287', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-ystad', 'scheda', 0, 'Wikidata Q28287', 'https://www.wikidata.org/wiki/Q28287', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-ystad', 'wikidata', 0, 'Wikidata Q28287', 'https://www.wikidata.org/wiki/Q28287', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-ystad', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-ystad', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.ystad.se/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-soderasen', 'coordinate', 0, 'Wikidata Q1530442 · P625', 'https://www.wikidata.org/wiki/Q1530442', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-soderasen', 'scheda', 0, 'Wikidata Q1530442', 'https://www.wikidata.org/wiki/Q1530442', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-soderasen', 'wikidata', 0, 'Wikidata Q1530442', 'https://www.wikidata.org/wiki/Q1530442', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-soderasen', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-soderasen', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.nationalpark-soderasen.lst.se/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-kalmar', 'coordinate', 0, 'Wikidata Q26345 · P625', 'https://www.wikidata.org/wiki/Q26345', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-kalmar', 'scheda', 0, 'Wikidata Q26345', 'https://www.wikidata.org/wiki/Q26345', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-kalmar', 'wikidata', 0, 'Wikidata Q26345', 'https://www.wikidata.org/wiki/Q26345', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-kalmar', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-kalmar', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.kalmar.se/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-oland', 'coordinate', 0, 'Wikidata Q239276 · P625', 'https://www.wikidata.org/wiki/Q239276', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-oland', 'scheda', 0, 'Wikidata Q239276', 'https://www.wikidata.org/wiki/Q239276', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-oland', 'wikidata', 0, 'Wikidata Q239276', 'https://www.wikidata.org/wiki/Q239276', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-oland', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-oland', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.oland.se', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-vimmerby', 'coordinate', 0, 'Wikidata Q634231 · P625', 'https://www.wikidata.org/wiki/Q634231', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-vimmerby', 'scheda', 0, 'Wikidata Q634231', 'https://www.wikidata.org/wiki/Q634231', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-vimmerby', 'wikidata', 0, 'Wikidata Q634231', 'https://www.wikidata.org/wiki/Q634231', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-vimmerby', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-astrid-lindgren', 'coordinate', 0, 'Wikidata Q750684 · P625', 'https://www.wikidata.org/wiki/Q750684', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-astrid-lindgren', 'scheda', 0, 'Wikidata Q750684', 'https://www.wikidata.org/wiki/Q750684', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-astrid-lindgren', 'wikidata', 0, 'Wikidata Q750684', 'https://www.wikidata.org/wiki/Q750684', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-astrid-lindgren', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-astrid-lindgren', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://astridlindgrensvarld.se', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-visby', 'coordinate', 0, 'Wikidata Q54757 · P625', 'https://www.wikidata.org/wiki/Q54757', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-visby', 'scheda', 0, 'Wikidata Q54757', 'https://www.wikidata.org/wiki/Q54757', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-visby', 'wikidata', 0, 'Wikidata Q54757', 'https://www.wikidata.org/wiki/Q54757', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-visby', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-visby', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.visby.se/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-faro', 'coordinate', 0, 'Wikidata Q1004693 · P625', 'https://www.wikidata.org/wiki/Q1004693', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-faro', 'scheda', 0, 'Wikidata Q1004693', 'https://www.wikidata.org/wiki/Q1004693', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-faro', 'wikidata', 0, 'Wikidata Q1004693', 'https://www.wikidata.org/wiki/Q1004693', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-faro', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-falun', 'coordinate', 0, 'Wikidata Q26509 · P625', 'https://www.wikidata.org/wiki/Q26509', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-falun', 'scheda', 0, 'Wikidata Q26509', 'https://www.wikidata.org/wiki/Q26509', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-falun', 'wikidata', 0, 'Wikidata Q26509', 'https://www.wikidata.org/wiki/Q26509', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-falun', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-falun', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.falun.se', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-miniera-falun', 'coordinate', 0, 'Wikidata Q636194 · P625', 'https://www.wikidata.org/wiki/Q636194', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-miniera-falun', 'scheda', 0, 'Wikidata Q636194', 'https://www.wikidata.org/wiki/Q636194', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-miniera-falun', 'wikidata', 0, 'Wikidata Q636194', 'https://www.wikidata.org/wiki/Q636194', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-miniera-falun', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-ostersund', 'coordinate', 0, 'Wikidata Q26515 · P625', 'https://www.wikidata.org/wiki/Q26515', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-ostersund', 'scheda', 0, 'Wikidata Q26515', 'https://www.wikidata.org/wiki/Q26515', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-ostersund', 'wikidata', 0, 'Wikidata Q26515', 'https://www.wikidata.org/wiki/Q26515', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-ostersund', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-ostersund', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.ostersund.se', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-kiruna', 'coordinate', 0, 'Wikidata Q83232 · P625', 'https://www.wikidata.org/wiki/Q83232', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-kiruna', 'scheda', 0, 'Wikidata Q83232', 'https://www.wikidata.org/wiki/Q83232', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-kiruna', 'wikidata', 0, 'Wikidata Q83232', 'https://www.wikidata.org/wiki/Q83232', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-kiruna', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-abisko', 'coordinate', 0, 'Wikidata Q953092 · P625', 'https://www.wikidata.org/wiki/Q953092', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-abisko', 'scheda', 0, 'Wikidata Q953092', 'https://www.wikidata.org/wiki/Q953092', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-abisko', 'wikidata', 0, 'Wikidata Q953092', 'https://www.wikidata.org/wiki/Q953092', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-abisko', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-abisko', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://sverigesnationalparker.se/en/choose-park---list/abisko-national-park/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-arn', 'coordinate', 0, 'Wikidata Q223499 · P625', 'https://www.wikidata.org/wiki/Q223499', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-arn', 'scheda', 0, 'Wikidata Q223499', 'https://www.wikidata.org/wiki/Q223499', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-arn', 'wikidata', 0, 'Wikidata Q223499', 'https://www.wikidata.org/wiki/Q223499', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-arn', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-arn', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.swedavia.com/arlanda/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-got', 'coordinate', 0, 'Wikidata Q1137115 · P625', 'https://www.wikidata.org/wiki/Q1137115', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-got', 'scheda', 0, 'Wikidata Q1137115', 'https://www.wikidata.org/wiki/Q1137115', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-got', 'wikidata', 0, 'Wikidata Q1137115', 'https://www.wikidata.org/wiki/Q1137115', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-got', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-got', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.swedavia.com/landvetter/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('SE-1', 'se-mmx', 'coordinate', 0, 'Wikidata Q898922 · P625', 'https://www.wikidata.org/wiki/Q898922', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('SE-1', 'se-mmx', 'scheda', 0, 'Wikidata Q898922', 'https://www.wikidata.org/wiki/Q898922', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-mmx', 'wikidata', 0, 'Wikidata Q898922', 'https://www.wikidata.org/wiki/Q898922', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('SE-1', 'se-mmx', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('SE-1', 'se-mmx', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.swedavia.com/malmo/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate');

-- operators: nessuna riga

-- voyages: nessuna riga

-- route_ports: nessuna riga

-- place_links: nessuna riga

insert into public.place_photos (release_id, place_key, position, commons_file, author, license, license_url, checked_at) values
  ('SE-1', 'se-stoccolma', 0, 'Stockholm gamlastan etc.jpg', 'JZ', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('SE-1', 'se-vasa', 0, 'Vasa model.jpg', 'Peter Isotalo', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('SE-1', 'se-vasa', 1, 'Vasa Museum building view from the sea (3).jpg', 'Hanay', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('SE-1', 'se-skansen', 0, 'Skansen Entré 2015a.jpg', 'Holger.Ellgaard', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('SE-1', 'se-junibacken', 0, 'Junibacken 2007.jpg', 'Holger Ellgaard', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('SE-1', 'se-tekniska', 0, 'Swedish national museum of science and technology 20061026 001.jpg', 'Jonas Bergsten', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('SE-1', 'se-drottningholm', 0, 'Drottningholm Palace (by Pudelek) 3.jpg', 'Pudelek', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('SE-1', 'se-uppsala', 0, 'Uppsala vanalinn suveõhtul.jpg', 'Sillerkiil', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('SE-1', 'se-sigtuna', 0, 'Stora gatan i Sigtuna nr 1.jpg', 'Brorsson', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('SE-1', 'se-goteborg', 0, 'Göteborg 2503 stitch (28573994096).jpg', 'Bengt Nyman from Vaxholm, Sweden', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0', '2026-11-19'),
  ('SE-1', 'se-universeum', 0, 'Universeum2.JPG', 'Erik031', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('SE-1', 'se-liseberg', 0, 'Liseberg, 20221223.jpg', 'AleWi', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('SE-1', 'se-marstrand', 0, 'Marstrand - KMB - 16000300022826 (cropped).jpg', 'Jan Norrman', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('SE-1', 'se-malmo', 0, 'Centrala Malmö.jpg', 'Johan Jönsson (Julle)', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('SE-1', 'se-lund', 0, 'Stortorget lund 080508.jpg', 'Anton Holmquist Soasta', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('SE-1', 'se-ystad', 0, 'Ystad stortorget.jpg', 'Mickaël Delcey (Silverkey)', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('SE-1', 'se-soderasen', 0, 'Kopparhatten.jpg', 'en:User:Abelson', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('SE-1', 'se-kalmar', 0, 'Kalmar collage.jpg', 'L.G.foto, Kiwijo2000, ginandtonique, Sniper Zeta and Shrek_38 Collage by Moralist.', 'CC BY 3.0', 'https://creativecommons.org/licenses/by/3.0', '2026-11-19'),
  ('SE-1', 'se-oland', 0, 'Resmo,Kvarnar vid Gynge hög 01.jpg', 'Bernt Fransson,Lindås', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('SE-1', 'se-vimmerby', 0, 'Torget i Vimmerby.JPG', 'Rotsee', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('SE-1', 'se-astrid-lindgren', 0, 'Astrid Lindgrens Värld - Entré.jpg', 'Kigsz', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('SE-1', 'se-visby', 0, 'Visby 13-.JPG', 'Żeglarz', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('SE-1', 'se-faro', 0, 'Rauks (3881539849).jpg', 'allen watkin from London, UK', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0', '2026-11-19'),
  ('SE-1', 'se-falun', 0, 'Falun från Radiohuset.jpg', 'Calle Eklund/V-wolf', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('SE-1', 'se-miniera-falun', 0, 'Falu koppargruva July 2017 01.jpg', 'Arild Vågen', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('SE-1', 'se-ostersund', 0, 'Östersund from Frösön.jpg', 'Lars Falkdalen Lindahl (User:Njaelkies Lea)', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('SE-1', 'se-kiruna', 0, 'Kiruna montage.png', 'Jonipoon', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('SE-1', 'se-kiruna', 1, '00 2803 Kiruna - Schweden.jpg', 'W. Bulach', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('SE-1', 'se-kiruna', 2, '00 2797 Kiruna (Schweden) - Erzbergwerk.jpg', 'W. Bulach', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('SE-1', 'se-abisko', 0, 'Abiskojåkka.jpg', 'q8', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0', '2026-11-19'),
  ('SE-1', 'se-arn', 0, 'Arlanda 1 Publish.jpg', 'Brorsson at English Wikipedia', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('SE-1', 'se-got', 0, 'GOT D-AEMD.jpg', 'Andrzej Otrębski', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('SE-1', 'se-got', 1, 'Landvetter Air View.jpg', 'Kontrastfoto', 'CC BY 3.0', 'https://creativecommons.org/licenses/by/3.0', '2026-11-19'),
  ('SE-1', 'se-mmx', 0, 'Sturup airport.jpg', 'jorchr', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19');

-- place_tips: nessuna riga

end $seed$;

update public.catalog_releases set status = 'pubblicata', published_at = now() where release_id = 'SE-1' and status = 'bozza';

-- Controllo finale: se fallisce, la transazione si annulla
do $check$
declare
  v_n bigint;
begin
  if not exists (select 1 from public.countries where code = 'SE' and currency = 'SEK' and timezone = 'Europe/Stockholm' and language = 'sv') then
    raise exception 'Nazione SE: valuta, fuso o lingua diversi da quelli del seed';
  end if;
  perform now() at time zone 'Europe/Stockholm';
  if not exists (select 1 from public.catalog_releases where release_id = 'SE-1' and status = 'pubblicata') then
    raise exception 'Versione SE-1 non pubblicata';
  end if;
  select count(*) into v_n from public.regions where release_id = 'SE-1';
  if v_n <> 6 then raise exception 'regions (release_id = ''SE-1''): attese 6 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'SE-1';
  if v_n <> 30 then raise exception 'places (release_id = ''SE-1''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_texts where release_id = 'SE-1';
  if v_n <> 30 then raise exception 'place_texts (release_id = ''SE-1''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_sources where release_id = 'SE-1';
  if v_n <> 146 then raise exception 'place_sources (release_id = ''SE-1''): attese 146 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.operators where release_id = 'SE-1';
  if v_n <> 0 then raise exception 'operators (release_id = ''SE-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.voyages where release_id = 'SE-1';
  if v_n <> 0 then raise exception 'voyages (release_id = ''SE-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.route_ports where release_id = 'SE-1';
  if v_n <> 0 then raise exception 'route_ports (release_id = ''SE-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_links where release_id = 'SE-1';
  if v_n <> 0 then raise exception 'place_links (release_id = ''SE-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'SE-1' and category = 'porti';
  if v_n <> 0 then raise exception 'places (release_id = ''SE-1'' and category = ''porti''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'SE-1' and coords_status = 'verificate';
  if v_n <> 30 then raise exception 'places (release_id = ''SE-1'' and coords_status = ''verificate''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'SE-1' and official_url is not null;
  if v_n <> 26 then raise exception 'places (release_id = ''SE-1'' and official_url is not null): attese 26 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'SE-1' and wikidata_qid is not null;
  if v_n <> 30 then raise exception 'places (release_id = ''SE-1'' and wikidata_qid is not null): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'SE-1' and base_place_key is not null;
  if v_n <> 0 then raise exception 'places (release_id = ''SE-1'' and base_place_key is not null): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_photos where release_id = 'SE-1';
  if v_n <> 34 then raise exception 'place_photos (release_id = ''SE-1''): attese 34 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_tips where release_id = 'SE-1';
  if v_n <> 0 then raise exception 'place_tips (release_id = ''SE-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places p join public.place_keys k on k.place_key = p.place_key where p.release_id = 'SE-1' and k.country_code <> 'SE';
  if v_n <> 0 then raise exception 'Chiavi di luogo registrate per un''altra nazione: %', v_n; end if;
  select count(*) into v_n from public.places p where p.release_id = 'SE-1' and not exists (select 1 from public.place_texts t where t.release_id = p.release_id and t.place_key = p.place_key and t.lang = 'it');
  if v_n <> 0 then raise exception 'Luoghi senza testo italiano: %', v_n; end if;
  raise notice 'Catalogo SE-1 pubblicato e controllato: 30 luoghi, 0 crociere, 0 porti in rotta';
end $check$;

commit;
