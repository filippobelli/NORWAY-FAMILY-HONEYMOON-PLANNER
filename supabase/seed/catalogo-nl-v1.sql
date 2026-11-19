-- Catalogo Paesi Bassi, versione 1 (NL-1).
-- GENERATO da scripts/seed-catalog.ts: non modificare a mano, rigenerare con `npx tsx scripts/seed-catalog.ts`.
-- Prerequisito: migrazioni supabase/migrations/20261106000100 … 20261106000500.
-- Idempotente: con la versione già pubblicata non scrive nulla e controlla solo i conteggi.
-- Tocca solo le tabelle del catalogo e la versione delle nazioni dei viaggi a righe; nessun dato di auth.
-- Dopo il controllo cancella le versioni precedenti della nazione (migrazione 20261119000000_cataloghi_superati.sql).

begin;

-- Prerequisiti: versione non superata, versione precedente pubblicata, tabelle dei traghetti presenti
do $pre$
begin
  if exists (select 1 from public.catalog_releases where country_code = 'NL' and status = 'pubblicata' and version > 1) then
    raise exception 'Il catalogo NL ha già una versione più recente di NL-1: questo seed è superato';
  end if;
  if to_regclass('public.place_photos') is null or to_regclass('public.place_tips') is null then
    raise exception 'Mancano le tabelle di foto e consigli: applicare prima supabase/migrations/20261110000100_foto_consigli.sql';
  end if;
end $pre$;

insert into public.countries (code, name, names, currency, timezone, language) values
  ('NL', 'Paesi Bassi', '{"en":"Netherlands"}'::jsonb, 'EUR', 'Europe/Amsterdam', 'nl')
on conflict (code) do nothing;

insert into public.catalog_releases (release_id, country_code, version, status, data_checked_until, notes, source_notes, road_factor, avg_kmh, road_calibrated, road_note, airport_radius_km) values
  ('NL-1', 'NL', 1, 'bozza', '2026-11-19', 'Prima selezione editoriale: città, musei, natura, parchi e aeroporti. Coordinate da Wikidata; foto Commons con licenza per file. Informazioni operative da verificare. Trasporti non ancora catalogati.', '[{"label":"Wikidata: dati strutturati CC0","url":"https://www.wikidata.org/wiki/Wikidata:Licensing","checkedAt":"2026-11-19","license":"CC0-1.0"},{"label":"Ente turistico · Paesi Bassi","url":"https://www.holland.com/global/tourism","checkedAt":"2026-11-19","note":"Consultato per il contesto e la copertura; testi e immagini non importati"}]'::jsonb, null, null, false, 'Parametri stradali non calibrati per questa nazione. I tempi del configuratore sono indicativi: calcolare i trasferimenti prima di attivare.', null)
on conflict (release_id) do nothing;

insert into public.place_keys (place_key, country_code) values
  ('nl-amsterdam', 'NL'),
  ('nl-rijksmuseum', 'NL'),
  ('nl-van-gogh', 'NL'),
  ('nl-nemo', 'NL'),
  ('nl-artis', 'NL'),
  ('nl-vondelpark', 'NL'),
  ('nl-haarlem', 'NL'),
  ('nl-zaanse-schans', 'NL'),
  ('nl-alkmaar', 'NL'),
  ('nl-texel', 'NL'),
  ('nl-aia', 'NL'),
  ('nl-mauritshuis', 'NL'),
  ('nl-madurodam', 'NL'),
  ('nl-rotterdam', 'NL'),
  ('nl-delft', 'NL'),
  ('nl-kinderdijk', 'NL'),
  ('nl-leida', 'NL'),
  ('nl-keukenhof', 'NL'),
  ('nl-utrecht', 'NL'),
  ('nl-spoorwegmuseum', 'NL'),
  ('nl-hoge-veluwe', 'NL'),
  ('nl-kroller-muller', 'NL'),
  ('nl-efteling', 'NL'),
  ('nl-maastricht', 'NL'),
  ('nl-eindhoven', 'NL'),
  ('nl-groninga', 'NL'),
  ('nl-leeuwarden', 'NL'),
  ('nl-ams', 'NL'),
  ('nl-ein', 'NL'),
  ('nl-rtm', 'NL')
on conflict (place_key) do nothing;

-- Contenuto della versione: si scrive solo se è ancora in bozza
do $seed$
begin
  if not exists (select 1 from public.catalog_releases where release_id = 'NL-1' and status = 'bozza') then
    raise notice 'Versione NL-1 già pubblicata: nessuna scrittura, solo controllo';
    return;
  end if;
insert into public.regions (release_id, region_key, position, name, areas, sources) values
  ('NL-1', 'nl-r1', 0, 'Amsterdam e Olanda settentrionale', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('NL-1', 'nl-r2', 1, 'L’Aia, Rotterdam e Olanda meridionale', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('NL-1', 'nl-r3', 2, 'Utrecht e Paesi Bassi centrali', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('NL-1', 'nl-r4', 3, 'Brabante e Limburgo', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('NL-1', 'nl-r5', 4, 'Frisia e Paesi Bassi settentrionali', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb);

insert into public.places (release_id, place_key, category, region_key, lat, lng, coords_status, local_name, visit_hours_min, visit_hours_max, difficulty, kid_score, reliability, is_base, day_visit, iata, official_url, official_kind, official_via, wikidata_qid, wiki_it, wiki_en, commons_image, base_place_key, address, setting, booking_advice, booking_url, hours_published, details_wikidata_qid, details_checked_at) values
  ('NL-1', 'nl-amsterdam', 'citta', 'nl-r1', 52.36666666666667, 4.883333333333333, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://amsterdam.nl', 'ente', 'Wikidata', 'Q727', 'Amsterdam', 'Amsterdam', 'Imagen de los canales concéntricos en Ámsterdam.png', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-rijksmuseum', 'musei', 'nl-r1', 52.36, 4.885277777777778, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.rijksmuseum.nl/', 'attrazione', 'Wikidata', 'Q190804', 'Rijksmuseum (Amsterdam)', 'Rijksmuseum', 'Rijksmuseum in Amsterdam.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-van-gogh', 'musei', 'nl-r1', 52.358333333333, 4.8811111111111, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.vangoghmuseum.nl/', 'attrazione', 'Wikidata', 'Q224124', 'Van Gogh Museum', 'Van Gogh Museum', 'Van Gogh Museum.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-nemo', 'musei', 'nl-r1', 52.374106, 4.912392, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.nemosciencemuseum.nl/', 'attrazione', 'Wikidata', 'Q1422000', 'NEMO (Amsterdam)', 'NEMO (museum)', 'NEMO (Amsterdam).jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-artis', 'fauna', 'nl-r1', 52.366111111111, 4.9166666666667, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.artis.nl', 'attrazione', 'Wikidata', 'Q713124', 'Artis (Amsterdam)', 'Artis (zoo)', 'NL-Artis-ingang.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-vondelpark', 'natura', 'nl-r1', 52.356944444444, 4.8663888888889, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.hetvondelpark.net/', 'attrazione', 'Wikidata', 'Q1419691', 'Vondelpark', 'Vondelpark', 'Amsterdam, Vondelpark, at the pond-2.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-haarlem', 'citta', 'nl-r1', 52.381388888888885, 4.635555555555555, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://haarlem.nl/', 'ente', 'Wikidata', 'Q9920', 'Haarlem', 'Haarlem', 'Haarlem Spaarne.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-zaanse-schans', 'musei', 'nl-r1', 52.473889, 4.816389, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.dezaanseschans.nl/', 'attrazione', 'Wikidata', 'Q136661', 'Zaanse Schans', 'Zaanse Schans', 'Z.Schans.JPG', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-alkmaar', 'citta', 'nl-r1', 52.6289, 4.74403, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.alkmaar.nl/', 'ente', 'Wikidata', 'Q972', 'Alkmaar', 'Alkmaar', 'Alkmaar Waag door het geboomte.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-texel', 'isole', 'nl-r1', 53.066666666667, 4.8, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.texel.nl/', 'attrazione', 'Wikidata', 'Q9966', 'Texel (comune)', 'Texel', 'Aerial image of Texel (view from the southwest).jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-aia', 'citta', 'nl-r2', 52.08, 4.31, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.denhaag.nl/', 'ente', 'Wikidata', 'Q36600', 'L''Aia', 'The Hague', 'The Hague Montage 2021.png', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-mauritshuis', 'musei', 'nl-r2', 52.08038888888889, 4.314305555555555, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.mauritshuis.nl', 'attrazione', 'Wikidata', 'Q221092', 'Mauritshuis', 'Mauritshuis', 'Mauritshuis Museum (14346890947).jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-madurodam', 'parchi', 'nl-r2', 52.099403, 4.297558, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.madurodam.nl/en/', 'attrazione', 'Wikidata', 'Q747322', 'Madurodam', 'Madurodam', 'Madurodam pays bas.JPG', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-rotterdam', 'citta', 'nl-r2', 51.92, 4.48, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.rotterdam.nl/', 'ente', 'Wikidata', 'Q34370', 'Rotterdam', 'Rotterdam', 'Erasmusbrug seen from Euromast.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-delft', 'citta', 'nl-r2', 52.01166666666666, 4.359166666666667, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.delft.nl/', 'ente', 'Wikidata', 'Q690', 'Delft', 'Delft', '00 0781 Canal in Delft (NL).jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-kinderdijk', 'musei', 'nl-r2', 51.883333333333, 4.6333333333333, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, null, null, null, 'Q740066', 'Kinderdijk', 'Kinderdijk', 'KinderdijkMolens02.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-leida', 'citta', 'nl-r2', 52.16, 4.49, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://gemeente.leiden.nl/', 'ente', 'Wikidata', 'Q43631', 'Leida', 'Leiden', '00 1865 Leiden - Netherlands.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-keukenhof', 'natura', 'nl-r2', 52.268889, 4.547222, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.keukenhof.nl/', 'attrazione', 'Wikidata', 'Q18769666', 'Keukenhof', 'Keukenhof', 'NL-keukenhof-10.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-utrecht', 'citta', 'nl-r3', 52.090833333333336, 5.121666666666667, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.utrecht.nl/', 'ente', 'Wikidata', 'Q803', 'Utrecht', 'Utrecht', 'Neude met Domtoren.JPG', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-spoorwegmuseum', 'musei', 'nl-r3', 52.08777777777778, 5.131666666666667, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.spoorwegmuseum.nl', 'attrazione', 'Wikidata', 'Q847166', null, 'Railway Museum (Netherlands)', 'Spoorwegmuseum Utrecht 003.JPG', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-hoge-veluwe', 'natura', 'nl-r3', 52.0833, 5.79855, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.hogeveluwe.nl/', 'attrazione', 'Wikidata', 'Q1623374', 'Parco nazionale De Hoge Veluwe', 'De Hoge Veluwe National Park', 'De Hoge Veluwe landscape.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-kroller-muller', 'musei', 'nl-r3', 52.095833333333, 5.8169444444444, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.kmm.nl', 'attrazione', 'Wikidata', 'Q1051928', 'Museo Kröller-Müller', 'Kröller-Müller Museum', 'Entrance Kröller-Müller Museum.JPG', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-efteling', 'parchi', 'nl-r4', 51.650277777778, 5.0480555555556, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.efteling.com/', 'attrazione', 'Wikidata', 'Q733234', 'Efteling', 'Efteling', 'Efteling The House of the Five Senses.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-maastricht', 'citta', 'nl-r4', 50.866666666667, 5.6833333333333, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'http://www.maastrichtportal.nl/', 'ente', 'Wikidata', 'Q1309', 'Maastricht', 'Maastricht', 'MaastrichtAltstadt.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-eindhoven', 'citta', 'nl-r4', 51.434444444444, 5.4841666666667, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.eindhoven.nl/', 'ente', 'Wikidata', 'Q9832', 'Eindhoven', 'Eindhoven', 'Centrum Eindhoven.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-groninga', 'citta', 'nl-r5', 53.21888888888889, 6.5675, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://groningen.nl/', 'ente', 'Wikidata', 'Q749', 'Groninga', 'Groningen', 'Plattegrond van de stad Groningen in 1575.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-leeuwarden', 'citta', 'nl-r5', 53.2, 5.7833333333333, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.leeuwarden.nl/', 'ente', 'Wikidata', 'Q25390', 'Leeuwarden', 'Leeuwarden', 'Waag, Leeuwarden 1614.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-ams', 'aeroporti', 'nl-r1', 52.3081, 4.7641694444444, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'AMS', 'https://www.schiphol.nl/', 'attrazione', 'Wikidata', 'Q9694', 'Aeroporto di Amsterdam-Schiphol', 'Amsterdam Airport Schiphol', 'Ams-above-2007.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-ein', 'aeroporti', 'nl-r4', 51.450556, 5.374167, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'EIN', 'https://www.eindhovenairport.nl/en', 'attrazione', 'Wikidata', 'Q1348234', 'Aeroporto di Eindhoven', 'Eindhoven Airport', 'Vertekhal Eindhoven airport.jpg', null, null, null, null, null, null, null, null),
  ('NL-1', 'nl-rtm', 'aeroporti', 'nl-r2', 51.95, 4.4333333333333, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'RTM', 'http://www.rotterdamthehagueairport.nl', 'attrazione', 'Wikidata', 'Q656807', 'Aeroporto di Rotterdam', 'Rotterdam The Hague Airport', 'Rotterdam airport luchtfoto.jpg', null, null, null, null, null, null, null, null);

insert into public.place_texts (release_id, place_key, lang, name, description, access, season, august_note, area, booking_note, seasonal_note, outside_note) values
  ('NL-1', 'nl-amsterdam', 'it', 'Amsterdam', 'Capitale dei Paesi Bassi con canali, musei e quartieri storici.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-rijksmuseum', 'it', 'Rijksmuseum', 'Museo di Amsterdam dedicato all’arte e alla storia dei Paesi Bassi.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-van-gogh', 'it', 'Museo Van Gogh', 'Museo di Amsterdam dedicato alle opere e alla vita di Vincent van Gogh.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-nemo', 'it', 'NEMO Science Museum', 'Museo della scienza di Amsterdam con esposizioni interattive.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-artis', 'it', 'ARTIS', 'Giardino zoologico nel tessuto urbano di Amsterdam; attività e percorsi da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-vondelpark', 'it', 'Vondelpark', 'Parco urbano di Amsterdam con prati, laghetti e percorsi.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-haarlem', 'it', 'Haarlem', 'Città dell’Olanda settentrionale con centro storico e musei.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-zaanse-schans', 'it', 'Zaanse Schans', 'Area di edifici storici e mulini presso Zaandam; accessi ai singoli luoghi da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-alkmaar', 'it', 'Alkmaar', 'Città dell’Olanda settentrionale con canali e centro storico.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-texel', 'it', 'Texel', 'Isola del Mare dei Wadden con dune e villaggi; traghetti e accessi alle riserve da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-aia', 'it', 'L’Aia', 'Città sede del governo dei Paesi Bassi, con musei e accesso alla costa.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-mauritshuis', 'it', 'Mauritshuis', 'Museo d’arte nel centro dell’Aia, dedicato in particolare alla pittura olandese.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-madurodam', 'it', 'Madurodam', 'Parco dell’Aia con riproduzioni in miniatura di luoghi dei Paesi Bassi.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-rotterdam', 'it', 'Rotterdam', 'Città portuale sul delta del Reno e della Mosa, con architettura contemporanea.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-delft', 'it', 'Delft', 'Città con canali e centro storico, legata alla tradizione della ceramica.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-kinderdijk', 'it', 'Kinderdijk', 'Paesaggio di mulini e canali per la gestione delle acque; percorsi e accessi da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-leida', 'it', 'Leida', 'Città universitaria con canali, musei e giardino botanico.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-keukenhof', 'it', 'Keukenhof', 'Giardino floreale a Lisse con apertura stagionale; controllare il calendario prima di inserirlo nel viaggio.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-utrecht', 'it', 'Utrecht', 'Città con canali a banchine ribassate e centro storico.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-spoorwegmuseum', 'it', 'Museo ferroviario di Utrecht', 'Museo ferroviario ospitato nell’ex stazione Maliebaan di Utrecht.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-hoge-veluwe', 'it', 'Parco nazionale De Hoge Veluwe', 'Parco di brughiere, boschi e terreni sabbiosi nel Gelderland; itinerari e accessi da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-kroller-muller', 'it', 'Museo Kröller-Müller', 'Museo d’arte con giardino di sculture nell’area del parco De Hoge Veluwe.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-efteling', 'it', 'Efteling', 'Parco divertimenti a Kaatsheuvel con ambientazioni fiabesche; limiti di età e altezza da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-maastricht', 'it', 'Maastricht', 'Città del Limburgo sulla Mosa, con piazze e centro storico.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-eindhoven', 'it', 'Eindhoven', 'Città del Brabante settentrionale legata a design e industria.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-groninga', 'it', 'Groninga', 'Città universitaria dei Paesi Bassi settentrionali.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-leeuwarden', 'it', 'Leeuwarden', 'Capoluogo della Frisia con canali e musei.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-ams', 'it', 'Aeroporto di Amsterdam Schiphol', 'Aeroporto dell’area di Amsterdam; trasferimenti e terminal da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-ein', 'it', 'Aeroporto di Eindhoven', 'Aeroporto dell’area di Eindhoven; trasferimenti da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('NL-1', 'nl-rtm', 'it', 'Aeroporto di Rotterdam L’Aia', 'Aeroporto che serve l’area di Rotterdam e L’Aia; trasferimenti da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null);

insert into public.place_sources (release_id, place_key, field, position, label, url, checked_at, license, method, note) values
  ('NL-1', 'nl-amsterdam', 'coordinate', 0, 'Wikidata Q727 · P625', 'https://www.wikidata.org/wiki/Q727', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-amsterdam', 'scheda', 0, 'Wikidata Q727', 'https://www.wikidata.org/wiki/Q727', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-amsterdam', 'wikidata', 0, 'Wikidata Q727', 'https://www.wikidata.org/wiki/Q727', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-amsterdam', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-amsterdam', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://amsterdam.nl', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-rijksmuseum', 'coordinate', 0, 'Wikidata Q190804 · P625', 'https://www.wikidata.org/wiki/Q190804', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-rijksmuseum', 'scheda', 0, 'Wikidata Q190804', 'https://www.wikidata.org/wiki/Q190804', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-rijksmuseum', 'wikidata', 0, 'Wikidata Q190804', 'https://www.wikidata.org/wiki/Q190804', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-rijksmuseum', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-rijksmuseum', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.rijksmuseum.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-van-gogh', 'coordinate', 0, 'Wikidata Q224124 · P625', 'https://www.wikidata.org/wiki/Q224124', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-van-gogh', 'scheda', 0, 'Wikidata Q224124', 'https://www.wikidata.org/wiki/Q224124', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-van-gogh', 'wikidata', 0, 'Wikidata Q224124', 'https://www.wikidata.org/wiki/Q224124', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-van-gogh', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-van-gogh', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.vangoghmuseum.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-nemo', 'coordinate', 0, 'Wikidata Q1422000 · P625', 'https://www.wikidata.org/wiki/Q1422000', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-nemo', 'scheda', 0, 'Wikidata Q1422000', 'https://www.wikidata.org/wiki/Q1422000', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-nemo', 'wikidata', 0, 'Wikidata Q1422000', 'https://www.wikidata.org/wiki/Q1422000', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-nemo', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-nemo', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.nemosciencemuseum.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-artis', 'coordinate', 0, 'Wikidata Q713124 · P625', 'https://www.wikidata.org/wiki/Q713124', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-artis', 'scheda', 0, 'Wikidata Q713124', 'https://www.wikidata.org/wiki/Q713124', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-artis', 'wikidata', 0, 'Wikidata Q713124', 'https://www.wikidata.org/wiki/Q713124', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-artis', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-artis', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.artis.nl', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-vondelpark', 'coordinate', 0, 'Wikidata Q1419691 · P625', 'https://www.wikidata.org/wiki/Q1419691', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-vondelpark', 'scheda', 0, 'Wikidata Q1419691', 'https://www.wikidata.org/wiki/Q1419691', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-vondelpark', 'wikidata', 0, 'Wikidata Q1419691', 'https://www.wikidata.org/wiki/Q1419691', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-vondelpark', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-vondelpark', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.hetvondelpark.net/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-haarlem', 'coordinate', 0, 'Wikidata Q9920 · P625', 'https://www.wikidata.org/wiki/Q9920', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-haarlem', 'scheda', 0, 'Wikidata Q9920', 'https://www.wikidata.org/wiki/Q9920', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-haarlem', 'wikidata', 0, 'Wikidata Q9920', 'https://www.wikidata.org/wiki/Q9920', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-haarlem', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-haarlem', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://haarlem.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-zaanse-schans', 'coordinate', 0, 'Wikidata Q136661 · P625', 'https://www.wikidata.org/wiki/Q136661', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-zaanse-schans', 'scheda', 0, 'Wikidata Q136661', 'https://www.wikidata.org/wiki/Q136661', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-zaanse-schans', 'wikidata', 0, 'Wikidata Q136661', 'https://www.wikidata.org/wiki/Q136661', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-zaanse-schans', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-zaanse-schans', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.dezaanseschans.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-alkmaar', 'coordinate', 0, 'Wikidata Q972 · P625', 'https://www.wikidata.org/wiki/Q972', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-alkmaar', 'scheda', 0, 'Wikidata Q972', 'https://www.wikidata.org/wiki/Q972', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-alkmaar', 'wikidata', 0, 'Wikidata Q972', 'https://www.wikidata.org/wiki/Q972', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-alkmaar', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-alkmaar', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.alkmaar.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-texel', 'coordinate', 0, 'Wikidata Q9966 · P625', 'https://www.wikidata.org/wiki/Q9966', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-texel', 'scheda', 0, 'Wikidata Q9966', 'https://www.wikidata.org/wiki/Q9966', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-texel', 'wikidata', 0, 'Wikidata Q9966', 'https://www.wikidata.org/wiki/Q9966', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-texel', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-texel', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.texel.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-aia', 'coordinate', 0, 'Wikidata Q36600 · P625', 'https://www.wikidata.org/wiki/Q36600', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-aia', 'scheda', 0, 'Wikidata Q36600', 'https://www.wikidata.org/wiki/Q36600', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-aia', 'wikidata', 0, 'Wikidata Q36600', 'https://www.wikidata.org/wiki/Q36600', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-aia', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-aia', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.denhaag.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-mauritshuis', 'coordinate', 0, 'Wikidata Q221092 · P625', 'https://www.wikidata.org/wiki/Q221092', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-mauritshuis', 'scheda', 0, 'Wikidata Q221092', 'https://www.wikidata.org/wiki/Q221092', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-mauritshuis', 'wikidata', 0, 'Wikidata Q221092', 'https://www.wikidata.org/wiki/Q221092', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-mauritshuis', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-mauritshuis', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.mauritshuis.nl', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-madurodam', 'coordinate', 0, 'Wikidata Q747322 · P625', 'https://www.wikidata.org/wiki/Q747322', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-madurodam', 'scheda', 0, 'Wikidata Q747322', 'https://www.wikidata.org/wiki/Q747322', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-madurodam', 'wikidata', 0, 'Wikidata Q747322', 'https://www.wikidata.org/wiki/Q747322', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-madurodam', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-madurodam', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.madurodam.nl/en/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-rotterdam', 'coordinate', 0, 'Wikidata Q34370 · P625', 'https://www.wikidata.org/wiki/Q34370', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-rotterdam', 'scheda', 0, 'Wikidata Q34370', 'https://www.wikidata.org/wiki/Q34370', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-rotterdam', 'wikidata', 0, 'Wikidata Q34370', 'https://www.wikidata.org/wiki/Q34370', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-rotterdam', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-rotterdam', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.rotterdam.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-delft', 'coordinate', 0, 'Wikidata Q690 · P625', 'https://www.wikidata.org/wiki/Q690', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-delft', 'scheda', 0, 'Wikidata Q690', 'https://www.wikidata.org/wiki/Q690', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-delft', 'wikidata', 0, 'Wikidata Q690', 'https://www.wikidata.org/wiki/Q690', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-delft', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-delft', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.delft.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-kinderdijk', 'coordinate', 0, 'Wikidata Q740066 · P625', 'https://www.wikidata.org/wiki/Q740066', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-kinderdijk', 'scheda', 0, 'Wikidata Q740066', 'https://www.wikidata.org/wiki/Q740066', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-kinderdijk', 'wikidata', 0, 'Wikidata Q740066', 'https://www.wikidata.org/wiki/Q740066', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-kinderdijk', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-leida', 'coordinate', 0, 'Wikidata Q43631 · P625', 'https://www.wikidata.org/wiki/Q43631', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-leida', 'scheda', 0, 'Wikidata Q43631', 'https://www.wikidata.org/wiki/Q43631', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-leida', 'wikidata', 0, 'Wikidata Q43631', 'https://www.wikidata.org/wiki/Q43631', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-leida', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-leida', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://gemeente.leiden.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-keukenhof', 'coordinate', 0, 'Wikidata Q18769666 · P625', 'https://www.wikidata.org/wiki/Q18769666', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-keukenhof', 'scheda', 0, 'Wikidata Q18769666', 'https://www.wikidata.org/wiki/Q18769666', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-keukenhof', 'wikidata', 0, 'Wikidata Q18769666', 'https://www.wikidata.org/wiki/Q18769666', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-keukenhof', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-keukenhof', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.keukenhof.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-utrecht', 'coordinate', 0, 'Wikidata Q803 · P625', 'https://www.wikidata.org/wiki/Q803', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-utrecht', 'scheda', 0, 'Wikidata Q803', 'https://www.wikidata.org/wiki/Q803', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-utrecht', 'wikidata', 0, 'Wikidata Q803', 'https://www.wikidata.org/wiki/Q803', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-utrecht', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-utrecht', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.utrecht.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-spoorwegmuseum', 'coordinate', 0, 'Wikidata Q847166 · P625', 'https://www.wikidata.org/wiki/Q847166', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-spoorwegmuseum', 'scheda', 0, 'Wikidata Q847166', 'https://www.wikidata.org/wiki/Q847166', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-spoorwegmuseum', 'wikidata', 0, 'Wikidata Q847166', 'https://www.wikidata.org/wiki/Q847166', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-spoorwegmuseum', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-spoorwegmuseum', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.spoorwegmuseum.nl', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-hoge-veluwe', 'coordinate', 0, 'Wikidata Q1623374 · P625', 'https://www.wikidata.org/wiki/Q1623374', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-hoge-veluwe', 'scheda', 0, 'Wikidata Q1623374', 'https://www.wikidata.org/wiki/Q1623374', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-hoge-veluwe', 'wikidata', 0, 'Wikidata Q1623374', 'https://www.wikidata.org/wiki/Q1623374', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-hoge-veluwe', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-hoge-veluwe', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.hogeveluwe.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-kroller-muller', 'coordinate', 0, 'Wikidata Q1051928 · P625', 'https://www.wikidata.org/wiki/Q1051928', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-kroller-muller', 'scheda', 0, 'Wikidata Q1051928', 'https://www.wikidata.org/wiki/Q1051928', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-kroller-muller', 'wikidata', 0, 'Wikidata Q1051928', 'https://www.wikidata.org/wiki/Q1051928', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-kroller-muller', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-kroller-muller', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.kmm.nl', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-efteling', 'coordinate', 0, 'Wikidata Q733234 · P625', 'https://www.wikidata.org/wiki/Q733234', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-efteling', 'scheda', 0, 'Wikidata Q733234', 'https://www.wikidata.org/wiki/Q733234', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-efteling', 'wikidata', 0, 'Wikidata Q733234', 'https://www.wikidata.org/wiki/Q733234', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-efteling', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-efteling', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.efteling.com/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-maastricht', 'coordinate', 0, 'Wikidata Q1309 · P625', 'https://www.wikidata.org/wiki/Q1309', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-maastricht', 'scheda', 0, 'Wikidata Q1309', 'https://www.wikidata.org/wiki/Q1309', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-maastricht', 'wikidata', 0, 'Wikidata Q1309', 'https://www.wikidata.org/wiki/Q1309', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-maastricht', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-maastricht', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.maastrichtportal.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-eindhoven', 'coordinate', 0, 'Wikidata Q9832 · P625', 'https://www.wikidata.org/wiki/Q9832', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-eindhoven', 'scheda', 0, 'Wikidata Q9832', 'https://www.wikidata.org/wiki/Q9832', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-eindhoven', 'wikidata', 0, 'Wikidata Q9832', 'https://www.wikidata.org/wiki/Q9832', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-eindhoven', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-eindhoven', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.eindhoven.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-groninga', 'coordinate', 0, 'Wikidata Q749 · P625', 'https://www.wikidata.org/wiki/Q749', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-groninga', 'scheda', 0, 'Wikidata Q749', 'https://www.wikidata.org/wiki/Q749', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-groninga', 'wikidata', 0, 'Wikidata Q749', 'https://www.wikidata.org/wiki/Q749', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-groninga', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-groninga', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://groningen.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-leeuwarden', 'coordinate', 0, 'Wikidata Q25390 · P625', 'https://www.wikidata.org/wiki/Q25390', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-leeuwarden', 'scheda', 0, 'Wikidata Q25390', 'https://www.wikidata.org/wiki/Q25390', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-leeuwarden', 'wikidata', 0, 'Wikidata Q25390', 'https://www.wikidata.org/wiki/Q25390', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-leeuwarden', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-leeuwarden', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.leeuwarden.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-ams', 'coordinate', 0, 'Wikidata Q9694 · P625', 'https://www.wikidata.org/wiki/Q9694', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-ams', 'scheda', 0, 'Wikidata Q9694', 'https://www.wikidata.org/wiki/Q9694', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-ams', 'wikidata', 0, 'Wikidata Q9694', 'https://www.wikidata.org/wiki/Q9694', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-ams', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-ams', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.schiphol.nl/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-ein', 'coordinate', 0, 'Wikidata Q1348234 · P625', 'https://www.wikidata.org/wiki/Q1348234', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-ein', 'scheda', 0, 'Wikidata Q1348234', 'https://www.wikidata.org/wiki/Q1348234', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-ein', 'wikidata', 0, 'Wikidata Q1348234', 'https://www.wikidata.org/wiki/Q1348234', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-ein', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-ein', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.eindhovenairport.nl/en', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('NL-1', 'nl-rtm', 'coordinate', 0, 'Wikidata Q656807 · P625', 'https://www.wikidata.org/wiki/Q656807', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('NL-1', 'nl-rtm', 'scheda', 0, 'Wikidata Q656807', 'https://www.wikidata.org/wiki/Q656807', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-rtm', 'wikidata', 0, 'Wikidata Q656807', 'https://www.wikidata.org/wiki/Q656807', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('NL-1', 'nl-rtm', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('NL-1', 'nl-rtm', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.rotterdamthehagueairport.nl', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate');

-- operators: nessuna riga

-- voyages: nessuna riga

-- route_ports: nessuna riga

-- place_links: nessuna riga

insert into public.place_photos (release_id, place_key, position, commons_file, author, license, license_url, checked_at) values
  ('NL-1', 'nl-amsterdam', 0, 'Imagen de los canales concéntricos en Ámsterdam.png', 'Andrés Barrios', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-rijksmuseum', 0, 'Rijksmuseum in Amsterdam.jpg', 'Marco Almbauer', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('NL-1', 'nl-van-gogh', 0, 'Van Gogh Museum.jpg', 'Warrox', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('NL-1', 'nl-nemo', 0, 'NEMO (Amsterdam).jpg', 'Gamekeeper at Dutch Wikipedia', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('NL-1', 'nl-nemo', 1, 'Nemo Science Museum.jpg', 'Elekes Andor', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-nemo', 2, 'Nemo Science Museum (53).jpg', 'Elekes Andor', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-artis', 0, 'NL-Artis-ingang.jpg', 'Dejonkheer', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('NL-1', 'nl-vondelpark', 0, 'Amsterdam, Vondelpark, at the pond-2.jpg', 'Dguendel', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0', '2026-11-19'),
  ('NL-1', 'nl-haarlem', 0, 'Haarlem Spaarne.jpg', 'M.Minderhoud', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('NL-1', 'nl-haarlem', 1, 'HaarlemGroteMarkt1.JPG', 'Fryslan0109 at English Wikipedia', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('NL-1', 'nl-zaanse-schans', 0, 'Z.Schans.JPG', 'Frila', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('NL-1', 'nl-zaanse-schans', 1, 'The Windmills of Zaanse Schans, Netherlands.jpg', 'Mustang Joe', 'CC0', 'http://creativecommons.org/publicdomain/zero/1.0/deed.en', '2026-11-19'),
  ('NL-1', 'nl-alkmaar', 0, 'Alkmaar Waag door het geboomte.jpg', 'Plaats', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('NL-1', 'nl-texel', 0, 'Aerial image of Texel (view from the southwest).jpg', 'Carsten Steger', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-aia', 0, 'The Hague Montage 2021.png', 'Montage by Ætoms', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-mauritshuis', 0, 'Mauritshuis Museum (14346890947).jpg', 'Roman Boed from The Netherlands', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0', '2026-11-19'),
  ('NL-1', 'nl-madurodam', 0, 'Madurodam pays bas.JPG', 'Cqui', 'CC BY-SA 2.5', 'https://creativecommons.org/licenses/by-sa/2.5', '2026-11-19'),
  ('NL-1', 'nl-rotterdam', 0, 'Erasmusbrug seen from Euromast.jpg', 'Mlefter', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('NL-1', 'nl-rotterdam', 1, '0 8605 Rotterdam - Het Witte Huis.jpg', 'W. Bulach', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-delft', 0, '00 0781 Canal in Delft (NL).jpg', 'W. Bulach', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-kinderdijk', 0, 'KinderdijkMolens02.jpg', 'Lucas Hirschegger', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('NL-1', 'nl-leida', 0, '00 1865 Leiden - Netherlands.jpg', 'W. Bulach', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-keukenhof', 0, 'NL-keukenhof-10.jpg', 'Balou46', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('NL-1', 'nl-keukenhof', 1, 'NL-keukenhof-12.jpg', 'Balou46', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('NL-1', 'nl-keukenhof', 2, 'Keukenhof 2018 DSC 0508.jpg', 'Atamari', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-utrecht', 0, 'Neude met Domtoren.JPG', 'Pepijntje', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('NL-1', 'nl-spoorwegmuseum', 0, 'Spoorwegmuseum Utrecht 003.JPG', 'Marion Golsteijn', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('NL-1', 'nl-hoge-veluwe', 0, 'De Hoge Veluwe landscape.jpg', 'Deb Collins', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0', '2026-11-19'),
  ('NL-1', 'nl-kroller-muller', 0, 'Entrance Kröller-Müller Museum.JPG', 'Gerardus', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('NL-1', 'nl-efteling', 0, 'Efteling The House of the Five Senses.jpg', 'Rémih', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-maastricht', 0, 'MaastrichtAltstadt.jpg', 'de:Benutzer:Mussklprozz', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('NL-1', 'nl-maastricht', 1, '00 6191 Maastricht - Niederlande.jpg', 'W. Bulach', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-eindhoven', 0, 'Centrum Eindhoven.jpg', 'Arno van den Tillaart from Eindhoven, Netherlands', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0', '2026-11-19'),
  ('NL-1', 'nl-groninga', 0, 'Plattegrond van de stad Groningen in 1575.jpg', 'Braun & Hogenberg', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('NL-1', 'nl-leeuwarden', 0, 'Waag, Leeuwarden 1614.jpg', 'C messier', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-ams', 0, 'Ams-above-2007.jpg', 'Fyodor Borisov', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('NL-1', 'nl-ams', 1, 'Schiphol Tower.jpg', 'Ikreis', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('NL-1', 'nl-ein', 0, 'Vertekhal Eindhoven airport.jpg', 'CoolmenNL', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('NL-1', 'nl-rtm', 0, 'Rotterdam airport luchtfoto.jpg', 'User:Quistnix', 'CC BY 1.0', 'https://creativecommons.org/licenses/by/1.0', '2026-11-19'),
  ('NL-1', 'nl-rtm', 1, 'Vliegveld Zestienhoven.JPG', 'Bryan Tong Minh', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19');

-- place_tips: nessuna riga

end $seed$;

update public.catalog_releases set status = 'pubblicata', published_at = now() where release_id = 'NL-1' and status = 'bozza';

-- Controllo finale: se fallisce, la transazione si annulla
do $check$
declare
  v_n bigint;
begin
  if not exists (select 1 from public.countries where code = 'NL' and currency = 'EUR' and timezone = 'Europe/Amsterdam' and language = 'nl') then
    raise exception 'Nazione NL: valuta, fuso o lingua diversi da quelli del seed';
  end if;
  perform now() at time zone 'Europe/Amsterdam';
  if not exists (select 1 from public.catalog_releases where release_id = 'NL-1' and status = 'pubblicata') then
    raise exception 'Versione NL-1 non pubblicata';
  end if;
  select count(*) into v_n from public.regions where release_id = 'NL-1';
  if v_n <> 5 then raise exception 'regions (release_id = ''NL-1''): attese 5 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'NL-1';
  if v_n <> 30 then raise exception 'places (release_id = ''NL-1''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_texts where release_id = 'NL-1';
  if v_n <> 30 then raise exception 'place_texts (release_id = ''NL-1''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_sources where release_id = 'NL-1';
  if v_n <> 149 then raise exception 'place_sources (release_id = ''NL-1''): attese 149 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.operators where release_id = 'NL-1';
  if v_n <> 0 then raise exception 'operators (release_id = ''NL-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.voyages where release_id = 'NL-1';
  if v_n <> 0 then raise exception 'voyages (release_id = ''NL-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.route_ports where release_id = 'NL-1';
  if v_n <> 0 then raise exception 'route_ports (release_id = ''NL-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_links where release_id = 'NL-1';
  if v_n <> 0 then raise exception 'place_links (release_id = ''NL-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'NL-1' and category = 'porti';
  if v_n <> 0 then raise exception 'places (release_id = ''NL-1'' and category = ''porti''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'NL-1' and coords_status = 'verificate';
  if v_n <> 30 then raise exception 'places (release_id = ''NL-1'' and coords_status = ''verificate''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'NL-1' and official_url is not null;
  if v_n <> 29 then raise exception 'places (release_id = ''NL-1'' and official_url is not null): attese 29 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'NL-1' and wikidata_qid is not null;
  if v_n <> 30 then raise exception 'places (release_id = ''NL-1'' and wikidata_qid is not null): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'NL-1' and base_place_key is not null;
  if v_n <> 0 then raise exception 'places (release_id = ''NL-1'' and base_place_key is not null): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_photos where release_id = 'NL-1';
  if v_n <> 40 then raise exception 'place_photos (release_id = ''NL-1''): attese 40 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_tips where release_id = 'NL-1';
  if v_n <> 0 then raise exception 'place_tips (release_id = ''NL-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places p join public.place_keys k on k.place_key = p.place_key where p.release_id = 'NL-1' and k.country_code <> 'NL';
  if v_n <> 0 then raise exception 'Chiavi di luogo registrate per un''altra nazione: %', v_n; end if;
  select count(*) into v_n from public.places p where p.release_id = 'NL-1' and not exists (select 1 from public.place_texts t where t.release_id = p.release_id and t.place_key = p.place_key and t.lang = 'it');
  if v_n <> 0 then raise exception 'Luoghi senza testo italiano: %', v_n; end if;
  raise notice 'Catalogo NL-1 pubblicato e controllato: 30 luoghi, 0 crociere, 0 porti in rotta';
end $check$;

-- Versioni precedenti: cancellate (i viaggi passano a questa, che le contiene)
do $purge$
begin
  if to_regprocedure('private.purge_superseded_releases(text)') is not null then
    perform private.purge_superseded_releases('NL');
  end if;
end $purge$;

commit;
