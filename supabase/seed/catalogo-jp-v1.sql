-- Catalogo Giappone, versione 1 (JP-1).
-- GENERATO da scripts/seed-catalog.ts: non modificare a mano, rigenerare con `npx tsx scripts/seed-catalog.ts`.
-- Prerequisito: migrazioni supabase/migrations/20261106000100 … 20261106000500.
-- Idempotente: con la versione già pubblicata non scrive nulla e controlla solo i conteggi.
-- Tocca solo le tabelle del catalogo e la versione delle nazioni dei viaggi a righe; nessun dato di auth.
-- Dopo il controllo cancella le versioni precedenti della nazione (migrazione 20261119000000_cataloghi_superati.sql).

begin;

-- Prerequisiti: versione non superata, versione precedente pubblicata, tabelle dei traghetti presenti
do $pre$
begin
  if exists (select 1 from public.catalog_releases where country_code = 'JP' and status = 'pubblicata' and version > 1) then
    raise exception 'Il catalogo JP ha già una versione più recente di JP-1: questo seed è superato';
  end if;
  if to_regclass('public.place_photos') is null or to_regclass('public.place_tips') is null then
    raise exception 'Mancano le tabelle di foto e consigli: applicare prima supabase/migrations/20261110000100_foto_consigli.sql';
  end if;
end $pre$;

insert into public.countries (code, name, names, currency, timezone, language) values
  ('JP', 'Giappone', '{"en":"Japan"}'::jsonb, 'JPY', 'Asia/Tokyo', 'ja')
on conflict (code) do nothing;

insert into public.catalog_releases (release_id, country_code, version, status, data_checked_until, notes, source_notes, road_factor, avg_kmh, road_calibrated, road_note, airport_radius_km) values
  ('JP-1', 'JP', 1, 'bozza', '2026-11-19', 'Prima selezione editoriale: città, musei, natura, parchi e aeroporti. Coordinate da Wikidata; foto Commons con licenza per file. Informazioni operative da verificare. Trasporti non ancora catalogati.', '[{"label":"Wikidata: dati strutturati CC0","url":"https://www.wikidata.org/wiki/Wikidata:Licensing","checkedAt":"2026-11-19","license":"CC0-1.0"},{"label":"Ente turistico · Giappone","url":"https://www.japan.travel/en/","checkedAt":"2026-11-19","note":"Consultato per il contesto e la copertura; testi e immagini non importati"}]'::jsonb, null, null, false, 'Parametri stradali non calibrati per questa nazione. I tempi del configuratore sono indicativi: calcolare i trasferimenti prima di attivare.', null)
on conflict (release_id) do nothing;

insert into public.place_keys (place_key, country_code) values
  ('jp-tokyo', 'JP'),
  ('jp-sensoji', 'JP'),
  ('jp-ueno', 'JP'),
  ('jp-museo-tokyo', 'JP'),
  ('jp-miraikan', 'JP'),
  ('jp-museo-ghibli', 'JP'),
  ('jp-nikko', 'JP'),
  ('jp-hakone', 'JP'),
  ('jp-kyoto', 'JP'),
  ('jp-fushimi-inari', 'JP'),
  ('jp-osaka', 'JP'),
  ('jp-kaiyukan', 'JP'),
  ('jp-nara', 'JP'),
  ('jp-parco-nara', 'JP'),
  ('jp-himeji', 'JP'),
  ('jp-kanazawa', 'JP'),
  ('jp-kenrokuen', 'JP'),
  ('jp-takayama', 'JP'),
  ('jp-matsumoto', 'JP'),
  ('jp-sapporo', 'JP'),
  ('jp-otaru', 'JP'),
  ('jp-sendai', 'JP'),
  ('jp-hiroshima', 'JP'),
  ('jp-miyajima', 'JP'),
  ('jp-fukuoka', 'JP'),
  ('jp-nagasaki', 'JP'),
  ('jp-churaumi', 'JP'),
  ('jp-hnd', 'JP'),
  ('jp-kix', 'JP'),
  ('jp-cts', 'JP')
on conflict (place_key) do nothing;

-- Contenuto della versione: si scrive solo se è ancora in bozza
do $seed$
begin
  if not exists (select 1 from public.catalog_releases where release_id = 'JP-1' and status = 'bozza') then
    raise notice 'Versione JP-1 già pubblicata: nessuna scrittura, solo controllo';
    return;
  end if;
insert into public.regions (release_id, region_key, position, name, areas, sources) values
  ('JP-1', 'jp-r1', 0, 'Tokyo e Kantō', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('JP-1', 'jp-r2', 1, 'Kyoto, Osaka e Kansai', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('JP-1', 'jp-r3', 2, 'Chūbu e Alpi giapponesi', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('JP-1', 'jp-r4', 3, 'Hokkaidō', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('JP-1', 'jp-r5', 4, 'Tōhoku', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('JP-1', 'jp-r6', 5, 'Chūgoku e Shikoku', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('JP-1', 'jp-r7', 6, 'Kyūshū e Okinawa', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb);

insert into public.places (release_id, place_key, category, region_key, lat, lng, coords_status, local_name, visit_hours_min, visit_hours_max, difficulty, kid_score, reliability, is_base, day_visit, iata, official_url, official_kind, official_via, wikidata_qid, wiki_it, wiki_en, commons_image, base_place_key, address, setting, booking_advice, booking_url, hours_published, details_wikidata_qid, details_checked_at) values
  ('JP-1', 'jp-tokyo', 'citta', 'jp-r1', 35.68944444444445, 139.69166666666666, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.english.metro.tokyo.lg.jp/', 'ente', 'Wikidata', 'Q1490', 'Tokyo', 'Tokyo', 'Skyscrapers of Shinjuku 2009 January (revised).jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-sensoji', 'musei', 'jp-r1', 35.714555555556, 139.79663888889, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.senso-ji.jp/', 'attrazione', 'Wikidata', 'Q615183', 'Sensō-ji', 'Sensō-ji', 'Sensoji 2023.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-ueno', 'natura', 'jp-r1', 35.712222, 139.771111, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.kensetsu.metro.tokyo.jp/toubuk/ueno/index_top.html', 'attrazione', 'Wikidata', 'Q746216', 'Parco di Ueno', 'Ueno Park', 'UenoPark Hanami.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-museo-tokyo', 'musei', 'jp-r1', 35.71888888888889, 139.7763888888889, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.tnm.jp/', 'attrazione', 'Wikidata', 'Q653433', 'Museo nazionale di Tokyo', 'Tokyo National Museum', 'Tokyo National Museum, Honkan 2010.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-miraikan', 'musei', 'jp-r1', 35.61916667, 139.77666667, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.miraikan.jst.go.jp/index.html', 'attrazione', 'Wikidata', 'Q656957', 'Miraikan', 'Miraikan', 'Miraikan.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-museo-ghibli', 'musei', 'jp-r1', 35.696233, 139.570431, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.ghibli-museum.jp/en/', 'attrazione', 'Wikidata', 'Q947907', 'Museo Ghibli', 'Ghibli Museum', null, null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-nikko', 'citta', 'jp-r1', 36.719833333333334, 139.69816666666668, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.city.nikko.lg.jp/', 'ente', 'Wikidata', 'Q235753', 'Nikkō', 'Nikkō', 'Kegon Taki.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-hakone', 'citta', 'jp-r1', 35.23236111111111, 139.10694444444445, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.town.hakone.kanagawa.jp/', 'ente', 'Wikidata', 'Q671040', 'Hakone', 'Hakone', '161223 Owakudani Hakone Japan08s3.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-kyoto', 'citta', 'jp-r2', 35.01161111111111, 135.76811111111112, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.city.kyoto.lg.jp/', 'ente', 'Wikidata', 'Q34600', 'Kyoto', 'Kyoto', 'Pedestrian road with pavements, paper umbrellas and people in yukata, Higashiyama-ku, Kyoto, Japan.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-fushimi-inari', 'musei', 'jp-r2', 34.967202, 135.773386, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://inari.jp/', 'attrazione', 'Wikidata', 'Q714828', 'Santuario di Fushimi Inari-taisha', 'Fushimi Inari-taisha', 'Fushimiinari-taisha, naihaiden-1.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-osaka', 'citta', 'jp-r2', 34.69375, 135.5021111111111, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.city.osaka.lg.jp/', 'ente', 'Wikidata', 'Q35765', 'Osaka', 'Osaka', 'Osaka Castle 02bs3200.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-kaiyukan', 'fauna', 'jp-r2', 34.654472222222, 135.42888888889, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.kaiyukan.com/', 'attrazione', 'Wikidata', 'Q1191885', 'Kaiyūkan', 'Osaka Aquarium Kaiyukan', 'Osaka Kaiyukan01s3872.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-nara', 'citta', 'jp-r2', 34.685, 135.8047777777778, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.city.nara.lg.jp/', 'ente', 'Wikidata', 'Q169134', 'Nara', 'Nara (city)', 'Sika deer in Nara 05.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-parco-nara', 'natura', 'jp-r2', 34.68545278, 135.84341111, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www3.pref.nara.jp/park/', 'attrazione', 'Wikidata', 'Q1186358', 'Parco di Nara', 'Nara Park', 'Nara Park, November 2016.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-himeji', 'musei', 'jp-r2', 34.839444444444446, 134.69361111111112, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.himejicastle.jp/en/', 'attrazione', 'Wikidata', 'Q188754', 'Castello di Himeji', 'Himeji Castle', 'Himeji castle in may 2015.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-kanazawa', 'citta', 'jp-r3', 36.561055555555555, 136.6565, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www4.city.kanazawa.lg.jp/', 'ente', 'Wikidata', 'Q191130', 'Kanazawa', 'Kanazawa', null, null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-kenrokuen', 'natura', 'jp-r3', 36.561944444444, 136.6625, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.pref.ishikawa.jp/siro-niwa/kenrokuen/', 'attrazione', 'Wikidata', 'Q998239', 'Kenroku-en', 'Kenroku-en', '131109 Kenrokuen Kanazawa Ishikawa pref Japan00s3.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-takayama', 'citta', 'jp-r3', 36.146027777777775, 137.25216666666665, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.city.takayama.lg.jp/', 'ente', 'Wikidata', 'Q622594', 'Takayama', 'Takayama, Gifu', 'Hotakadake Takayama01j3872.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-matsumoto', 'citta', 'jp-r3', 36.238, 137.97197222222223, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.city.matsumoto.nagano.jp/', 'ente', 'Wikidata', 'Q213324', 'Matsumoto', 'Matsumoto, Nagano', 'Matsumoto Castle05s5s4592.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-sapporo', 'citta', 'jp-r4', 43.06194444444444, 141.35444444444445, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.city.sapporo.jp/', 'ente', 'Wikidata', 'Q37951', 'Sapporo', 'Sapporo', '札幌タワー電波塔展望台から札幌駅方面 - panoramio.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-otaru', 'citta', 'jp-r4', 43.19072222222222, 140.99436111111112, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.city.otaru.lg.jp/', 'ente', 'Wikidata', 'Q242108', 'Otaru', 'Otaru', 'Otaru from Tenguyama.JPG', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-sendai', 'citta', 'jp-r5', 38.26822222222222, 140.86941666666667, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.city.sendai.jp/', 'ente', 'Wikidata', 'Q46747', 'Sendai', 'Sendai', 'SendaiCity Skylines from Mukaiyama2018.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-hiroshima', 'citta', 'jp-r6', 34.39138888888889, 132.45194444444445, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.city.hiroshima.lg.jp/', 'ente', 'Wikidata', 'Q34664', 'Hiroshima', 'Hiroshima', 'Atomic Bomb Dome and Motoyaso River, Hiroshima, Northwest view 20190417 1.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-miyajima', 'isole', 'jp-r6', 34.275555555556, 132.30777777778, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.miyajima.or.jp/', 'attrazione', 'Wikidata', 'Q875301', 'Itsukushima', 'Itsukushima', 'Miyajima Island.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-fukuoka', 'citta', 'jp-r7', 33.59013888888889, 130.40172222222222, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.city.fukuoka.lg.jp/', 'ente', 'Wikidata', 'Q26600', 'Fukuoka', 'Fukuoka', 'Hakata Port from Fukuoka Tower.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-nagasaki', 'citta', 'jp-r7', 32.74952777777778, 129.87963888888888, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.city.nagasaki.lg.jp/', 'ente', 'Wikidata', 'Q38234', 'Nagasaki', 'Nagasaki', 'Nagasaki City View from Glover Garden, Nagasaki 2014.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-churaumi', 'fauna', 'jp-r7', 26.69438889, 127.87794444, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://churaumi.okinawa/', 'attrazione', 'Wikidata', 'Q1445750', 'Acquario Churaumi', 'Okinawa Churaumi Aquarium', '沖縄美ら海水族館＿大.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-hnd', 'aeroporti', 'jp-r1', 35.553333333333, 139.78111111111, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'HND', 'https://tokyo-haneda.com/', 'attrazione', 'Wikidata', 'Q204853', 'Aeroporto Internazionale di Tokyo', 'Haneda Airport', 'Tokyo-International-Airport Satellite.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-kix', 'aeroporti', 'jp-r2', 34.43055555555556, 135.2302777777778, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'KIX', 'https://www.kansai-airport.or.jp/en/', 'attrazione', 'Wikidata', 'Q193682', 'Aeroporto Internazionale del Kansai', 'Kansai International Airport', '関西国際空港全体写真20220811.jpg', null, null, null, null, null, null, null, null),
  ('JP-1', 'jp-cts', 'aeroporti', 'jp-r4', 42.7752, 141.69228333333, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'CTS', 'https://www.hokkaido-airports.com/ja/new-chitose/', 'attrazione', 'Wikidata', 'Q908296', 'Aeroporto di Shin-Chitose', 'New Chitose Airport', 'Hokkaido New Chitose Airport13n4272.jpg', null, null, null, null, null, null, null, null);

insert into public.place_texts (release_id, place_key, lang, name, description, access, season, august_note, area, booking_note, seasonal_note, outside_note) values
  ('JP-1', 'jp-tokyo', 'it', 'Tokyo', 'Capitale giapponese con quartieri molto diversi, musei e giardini; conviene organizzare le visite per zona.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-sensoji', 'it', 'Sensō-ji', 'Tempio buddhista nel quartiere di Asakusa, a Tokyo.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-ueno', 'it', 'Parco di Ueno', 'Parco di Tokyo con viali, laghetto e istituzioni museali.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-museo-tokyo', 'it', 'Museo nazionale di Tokyo', 'Museo nel parco di Ueno dedicato all’arte e alle antichità del Giappone e dell’Asia.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-miraikan', 'it', 'Miraikan', 'Museo della scienza e dell’innovazione nell’area di Odaiba a Tokyo.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-museo-ghibli', 'it', 'Museo Ghibli', 'Museo dedicato all’animazione dello Studio Ghibli a Mitaka; modalità di prenotazione da controllare prima della visita.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-nikko', 'it', 'Nikkō', 'Località del Tochigi con santuari e paesaggi montani.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-hakone', 'it', 'Hakone', 'Area montana con lago e musei, a ovest di Tokyo; trasporti locali e condizioni da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-kyoto', 'it', 'Kyoto', 'Città con templi, santuari e quartieri storici; le visite richiedono attenzione alle distanze tra le zone.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-fushimi-inari', 'it', 'Fushimi Inari Taisha', 'Santuario di Kyoto con percorsi di torii lungo il monte Inari; lunghezza e dislivello dipendono dall’itinerario scelto.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-osaka', 'it', 'Osaka', 'Città del Kansai con quartieri commerciali, musei e passeggiate lungo i canali.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-kaiyukan', 'it', 'Acquario Kaiyukan', 'Acquario nell’area portuale di Osaka con ambienti dedicati alla vita marina.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-nara', 'it', 'Nara', 'Città del Kansai con templi e un parco frequentato da cervi liberi.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-parco-nara', 'it', 'Parco di Nara', 'Parco con templi e cervi; osservazione e comportamento con gli animali richiedono attenzione.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-himeji', 'it', 'Castello di Himeji', 'Complesso fortificato storico a Himeji; scale e percorso interno vanno valutati prima della visita.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-kanazawa', 'it', 'Kanazawa', 'Città dell’Ishikawa con giardini e quartieri storici.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-kenrokuen', 'it', 'Giardino Kenrokuen', 'Giardino paesaggistico a Kanazawa, vicino al castello.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-takayama', 'it', 'Takayama', 'Città montana della prefettura di Gifu con strade storiche e tradizioni artigianali.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-matsumoto', 'it', 'Matsumoto', 'Città del Nagano con castello e accessi alle aree montane circostanti.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-sapporo', 'it', 'Sapporo', 'Città dell’Hokkaidō con parchi, musei e viali urbani.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-otaru', 'it', 'Otaru', 'Città portuale dell’Hokkaidō con canale storico ed edifici di magazzino.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-sendai', 'it', 'Sendai', 'Città del Tōhoku utilizzabile come base per esplorare l’area di Miyagi.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-hiroshima', 'it', 'Hiroshima', 'Città del Giappone occidentale con luoghi della memoria e collegamenti da verificare verso le isole vicine.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-miyajima', 'it', 'Miyajima', 'Isola della baia di Hiroshima con santuario e percorsi; traghetto, maree e sentieri da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-fukuoka', 'it', 'Fukuoka', 'Città del Kyūshū con quartieri storici, parchi e affacci sulla baia.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-nagasaki', 'it', 'Nagasaki', 'Città portuale del Kyūshū con luoghi storici e testimonianze degli scambi internazionali.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-churaumi', 'it', 'Acquario Churaumi', 'Acquario nel nord dell’isola principale di Okinawa; il trasferimento dalla base scelta va pianificato.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-hnd', 'it', 'Aeroporto di Tokyo Haneda', 'Aeroporto dell’area di Tokyo; terminal e trasferimenti da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-kix', 'it', 'Aeroporto internazionale del Kansai', 'Aeroporto su isola artificiale nella baia di Osaka; trasferimenti verso Osaka e Kyoto da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('JP-1', 'jp-cts', 'it', 'Aeroporto di New Chitose', 'Aeroporto dell’area di Sapporo in Hokkaidō; trasferimenti da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null);

insert into public.place_sources (release_id, place_key, field, position, label, url, checked_at, license, method, note) values
  ('JP-1', 'jp-tokyo', 'coordinate', 0, 'Wikidata Q1490 · P625', 'https://www.wikidata.org/wiki/Q1490', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-tokyo', 'scheda', 0, 'Wikidata Q1490', 'https://www.wikidata.org/wiki/Q1490', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-tokyo', 'wikidata', 0, 'Wikidata Q1490', 'https://www.wikidata.org/wiki/Q1490', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-tokyo', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-tokyo', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.english.metro.tokyo.lg.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-sensoji', 'coordinate', 0, 'Wikidata Q615183 · P625', 'https://www.wikidata.org/wiki/Q615183', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-sensoji', 'scheda', 0, 'Wikidata Q615183', 'https://www.wikidata.org/wiki/Q615183', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-sensoji', 'wikidata', 0, 'Wikidata Q615183', 'https://www.wikidata.org/wiki/Q615183', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-sensoji', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-sensoji', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.senso-ji.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-ueno', 'coordinate', 0, 'Wikidata Q746216 · P625', 'https://www.wikidata.org/wiki/Q746216', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-ueno', 'scheda', 0, 'Wikidata Q746216', 'https://www.wikidata.org/wiki/Q746216', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-ueno', 'wikidata', 0, 'Wikidata Q746216', 'https://www.wikidata.org/wiki/Q746216', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-ueno', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-ueno', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.kensetsu.metro.tokyo.jp/toubuk/ueno/index_top.html', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-museo-tokyo', 'coordinate', 0, 'Wikidata Q653433 · P625', 'https://www.wikidata.org/wiki/Q653433', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-museo-tokyo', 'scheda', 0, 'Wikidata Q653433', 'https://www.wikidata.org/wiki/Q653433', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-museo-tokyo', 'wikidata', 0, 'Wikidata Q653433', 'https://www.wikidata.org/wiki/Q653433', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-museo-tokyo', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-museo-tokyo', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.tnm.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-miraikan', 'coordinate', 0, 'Wikidata Q656957 · P625', 'https://www.wikidata.org/wiki/Q656957', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-miraikan', 'scheda', 0, 'Wikidata Q656957', 'https://www.wikidata.org/wiki/Q656957', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-miraikan', 'wikidata', 0, 'Wikidata Q656957', 'https://www.wikidata.org/wiki/Q656957', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-miraikan', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-miraikan', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.miraikan.jst.go.jp/index.html', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-museo-ghibli', 'coordinate', 0, 'Wikidata Q947907 · P625', 'https://www.wikidata.org/wiki/Q947907', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-museo-ghibli', 'scheda', 0, 'Wikidata Q947907', 'https://www.wikidata.org/wiki/Q947907', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-museo-ghibli', 'wikidata', 0, 'Wikidata Q947907', 'https://www.wikidata.org/wiki/Q947907', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-museo-ghibli', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-museo-ghibli', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.ghibli-museum.jp/en/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-nikko', 'coordinate', 0, 'Wikidata Q235753 · P625', 'https://www.wikidata.org/wiki/Q235753', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-nikko', 'scheda', 0, 'Wikidata Q235753', 'https://www.wikidata.org/wiki/Q235753', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-nikko', 'wikidata', 0, 'Wikidata Q235753', 'https://www.wikidata.org/wiki/Q235753', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-nikko', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-nikko', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.city.nikko.lg.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-hakone', 'coordinate', 0, 'Wikidata Q671040 · P625', 'https://www.wikidata.org/wiki/Q671040', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-hakone', 'scheda', 0, 'Wikidata Q671040', 'https://www.wikidata.org/wiki/Q671040', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-hakone', 'wikidata', 0, 'Wikidata Q671040', 'https://www.wikidata.org/wiki/Q671040', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-hakone', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-hakone', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.town.hakone.kanagawa.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-kyoto', 'coordinate', 0, 'Wikidata Q34600 · P625', 'https://www.wikidata.org/wiki/Q34600', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-kyoto', 'scheda', 0, 'Wikidata Q34600', 'https://www.wikidata.org/wiki/Q34600', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-kyoto', 'wikidata', 0, 'Wikidata Q34600', 'https://www.wikidata.org/wiki/Q34600', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-kyoto', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-kyoto', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.city.kyoto.lg.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-fushimi-inari', 'coordinate', 0, 'Wikidata Q714828 · P625', 'https://www.wikidata.org/wiki/Q714828', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-fushimi-inari', 'scheda', 0, 'Wikidata Q714828', 'https://www.wikidata.org/wiki/Q714828', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-fushimi-inari', 'wikidata', 0, 'Wikidata Q714828', 'https://www.wikidata.org/wiki/Q714828', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-fushimi-inari', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-fushimi-inari', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://inari.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-osaka', 'coordinate', 0, 'Wikidata Q35765 · P625', 'https://www.wikidata.org/wiki/Q35765', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-osaka', 'scheda', 0, 'Wikidata Q35765', 'https://www.wikidata.org/wiki/Q35765', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-osaka', 'wikidata', 0, 'Wikidata Q35765', 'https://www.wikidata.org/wiki/Q35765', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-osaka', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-osaka', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.city.osaka.lg.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-kaiyukan', 'coordinate', 0, 'Wikidata Q1191885 · P625', 'https://www.wikidata.org/wiki/Q1191885', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-kaiyukan', 'scheda', 0, 'Wikidata Q1191885', 'https://www.wikidata.org/wiki/Q1191885', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-kaiyukan', 'wikidata', 0, 'Wikidata Q1191885', 'https://www.wikidata.org/wiki/Q1191885', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-kaiyukan', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-kaiyukan', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.kaiyukan.com/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-nara', 'coordinate', 0, 'Wikidata Q169134 · P625', 'https://www.wikidata.org/wiki/Q169134', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-nara', 'scheda', 0, 'Wikidata Q169134', 'https://www.wikidata.org/wiki/Q169134', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-nara', 'wikidata', 0, 'Wikidata Q169134', 'https://www.wikidata.org/wiki/Q169134', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-nara', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-nara', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.city.nara.lg.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-parco-nara', 'coordinate', 0, 'Wikidata Q1186358 · P625', 'https://www.wikidata.org/wiki/Q1186358', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-parco-nara', 'scheda', 0, 'Wikidata Q1186358', 'https://www.wikidata.org/wiki/Q1186358', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-parco-nara', 'wikidata', 0, 'Wikidata Q1186358', 'https://www.wikidata.org/wiki/Q1186358', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-parco-nara', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-parco-nara', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www3.pref.nara.jp/park/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-himeji', 'coordinate', 0, 'Wikidata Q188754 · P625', 'https://www.wikidata.org/wiki/Q188754', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-himeji', 'scheda', 0, 'Wikidata Q188754', 'https://www.wikidata.org/wiki/Q188754', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-himeji', 'wikidata', 0, 'Wikidata Q188754', 'https://www.wikidata.org/wiki/Q188754', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-himeji', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-himeji', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.himejicastle.jp/en/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-kanazawa', 'coordinate', 0, 'Wikidata Q191130 · P625', 'https://www.wikidata.org/wiki/Q191130', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-kanazawa', 'scheda', 0, 'Wikidata Q191130', 'https://www.wikidata.org/wiki/Q191130', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-kanazawa', 'wikidata', 0, 'Wikidata Q191130', 'https://www.wikidata.org/wiki/Q191130', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-kanazawa', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-kanazawa', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www4.city.kanazawa.lg.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-kenrokuen', 'coordinate', 0, 'Wikidata Q998239 · P625', 'https://www.wikidata.org/wiki/Q998239', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-kenrokuen', 'scheda', 0, 'Wikidata Q998239', 'https://www.wikidata.org/wiki/Q998239', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-kenrokuen', 'wikidata', 0, 'Wikidata Q998239', 'https://www.wikidata.org/wiki/Q998239', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-kenrokuen', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-kenrokuen', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.pref.ishikawa.jp/siro-niwa/kenrokuen/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-takayama', 'coordinate', 0, 'Wikidata Q622594 · P625', 'https://www.wikidata.org/wiki/Q622594', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-takayama', 'scheda', 0, 'Wikidata Q622594', 'https://www.wikidata.org/wiki/Q622594', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-takayama', 'wikidata', 0, 'Wikidata Q622594', 'https://www.wikidata.org/wiki/Q622594', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-takayama', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-takayama', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.city.takayama.lg.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-matsumoto', 'coordinate', 0, 'Wikidata Q213324 · P625', 'https://www.wikidata.org/wiki/Q213324', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-matsumoto', 'scheda', 0, 'Wikidata Q213324', 'https://www.wikidata.org/wiki/Q213324', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-matsumoto', 'wikidata', 0, 'Wikidata Q213324', 'https://www.wikidata.org/wiki/Q213324', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-matsumoto', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-matsumoto', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.city.matsumoto.nagano.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-sapporo', 'coordinate', 0, 'Wikidata Q37951 · P625', 'https://www.wikidata.org/wiki/Q37951', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-sapporo', 'scheda', 0, 'Wikidata Q37951', 'https://www.wikidata.org/wiki/Q37951', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-sapporo', 'wikidata', 0, 'Wikidata Q37951', 'https://www.wikidata.org/wiki/Q37951', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-sapporo', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-sapporo', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.city.sapporo.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-otaru', 'coordinate', 0, 'Wikidata Q242108 · P625', 'https://www.wikidata.org/wiki/Q242108', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-otaru', 'scheda', 0, 'Wikidata Q242108', 'https://www.wikidata.org/wiki/Q242108', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-otaru', 'wikidata', 0, 'Wikidata Q242108', 'https://www.wikidata.org/wiki/Q242108', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-otaru', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-otaru', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.city.otaru.lg.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-sendai', 'coordinate', 0, 'Wikidata Q46747 · P625', 'https://www.wikidata.org/wiki/Q46747', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-sendai', 'scheda', 0, 'Wikidata Q46747', 'https://www.wikidata.org/wiki/Q46747', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-sendai', 'wikidata', 0, 'Wikidata Q46747', 'https://www.wikidata.org/wiki/Q46747', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-sendai', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-sendai', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.city.sendai.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-hiroshima', 'coordinate', 0, 'Wikidata Q34664 · P625', 'https://www.wikidata.org/wiki/Q34664', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-hiroshima', 'scheda', 0, 'Wikidata Q34664', 'https://www.wikidata.org/wiki/Q34664', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-hiroshima', 'wikidata', 0, 'Wikidata Q34664', 'https://www.wikidata.org/wiki/Q34664', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-hiroshima', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-hiroshima', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.city.hiroshima.lg.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-miyajima', 'coordinate', 0, 'Wikidata Q875301 · P625', 'https://www.wikidata.org/wiki/Q875301', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-miyajima', 'scheda', 0, 'Wikidata Q875301', 'https://www.wikidata.org/wiki/Q875301', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-miyajima', 'wikidata', 0, 'Wikidata Q875301', 'https://www.wikidata.org/wiki/Q875301', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-miyajima', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-miyajima', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.miyajima.or.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-fukuoka', 'coordinate', 0, 'Wikidata Q26600 · P625', 'https://www.wikidata.org/wiki/Q26600', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-fukuoka', 'scheda', 0, 'Wikidata Q26600', 'https://www.wikidata.org/wiki/Q26600', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-fukuoka', 'wikidata', 0, 'Wikidata Q26600', 'https://www.wikidata.org/wiki/Q26600', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-fukuoka', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-fukuoka', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.city.fukuoka.lg.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-nagasaki', 'coordinate', 0, 'Wikidata Q38234 · P625', 'https://www.wikidata.org/wiki/Q38234', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-nagasaki', 'scheda', 0, 'Wikidata Q38234', 'https://www.wikidata.org/wiki/Q38234', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-nagasaki', 'wikidata', 0, 'Wikidata Q38234', 'https://www.wikidata.org/wiki/Q38234', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-nagasaki', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-nagasaki', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.city.nagasaki.lg.jp/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-churaumi', 'coordinate', 0, 'Wikidata Q1445750 · P625', 'https://www.wikidata.org/wiki/Q1445750', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-churaumi', 'scheda', 0, 'Wikidata Q1445750', 'https://www.wikidata.org/wiki/Q1445750', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-churaumi', 'wikidata', 0, 'Wikidata Q1445750', 'https://www.wikidata.org/wiki/Q1445750', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-churaumi', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-churaumi', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://churaumi.okinawa/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-hnd', 'coordinate', 0, 'Wikidata Q204853 · P625', 'https://www.wikidata.org/wiki/Q204853', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-hnd', 'scheda', 0, 'Wikidata Q204853', 'https://www.wikidata.org/wiki/Q204853', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-hnd', 'wikidata', 0, 'Wikidata Q204853', 'https://www.wikidata.org/wiki/Q204853', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-hnd', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-hnd', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://tokyo-haneda.com/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-kix', 'coordinate', 0, 'Wikidata Q193682 · P625', 'https://www.wikidata.org/wiki/Q193682', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-kix', 'scheda', 0, 'Wikidata Q193682', 'https://www.wikidata.org/wiki/Q193682', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-kix', 'wikidata', 0, 'Wikidata Q193682', 'https://www.wikidata.org/wiki/Q193682', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-kix', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-kix', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.kansai-airport.or.jp/en/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('JP-1', 'jp-cts', 'coordinate', 0, 'Wikidata Q908296 · P625', 'https://www.wikidata.org/wiki/Q908296', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('JP-1', 'jp-cts', 'scheda', 0, 'Wikidata Q908296', 'https://www.wikidata.org/wiki/Q908296', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-cts', 'wikidata', 0, 'Wikidata Q908296', 'https://www.wikidata.org/wiki/Q908296', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('JP-1', 'jp-cts', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('JP-1', 'jp-cts', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.hokkaido-airports.com/ja/new-chitose/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate');

-- operators: nessuna riga

-- voyages: nessuna riga

-- route_ports: nessuna riga

-- place_links: nessuna riga

insert into public.place_photos (release_id, place_key, position, commons_file, author, license, license_url, checked_at) values
  ('JP-1', 'jp-tokyo', 0, 'Skyscrapers of Shinjuku 2009 January (revised).jpg', 'Morio', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('JP-1', 'jp-tokyo', 1, 'Tokyo Japan taken by Hodoyoshi-3 Satellite.jpg', 'The University of Tokyo, Hodoyoshi-3&4 Project', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-sensoji', 0, 'Sensoji 2023.jpg', 'Akonnchiroll', 'CC0', 'http://creativecommons.org/publicdomain/zero/1.0/deed.en', '2026-11-19'),
  ('JP-1', 'jp-ueno', 0, 'UenoPark Hanami.jpg', 'The original uploader was Sdalu at English Wikipedia.', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('JP-1', 'jp-museo-tokyo', 0, 'Tokyo National Museum, Honkan 2010.jpg', 'Wiiii', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('JP-1', 'jp-miraikan', 0, 'Miraikan.jpg', 'Jason Ruck', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('JP-1', 'jp-nikko', 0, 'Kegon Taki.jpg', 'Jordy Meow', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('JP-1', 'jp-nikko', 1, '200801 Nikko Tosho-gu Nikko Japan03s3.jpg', '663highland', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-hakone', 0, '161223 Owakudani Hakone Japan08s3.jpg', '663highland', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('JP-1', 'jp-hakone', 1, 'Mount Fuji from Lake Ashi 20211202-2.jpg', 'Suicasmo', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-kyoto', 0, 'Pedestrian road with pavements, paper umbrellas and people in yukata, Higashiyama-ku, Kyoto, Japan.jpg', 'Basile Morin', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-fushimi-inari', 0, 'Fushimiinari-taisha, naihaiden-1.jpg', 'Saigen Jiro', 'CC0', 'http://creativecommons.org/publicdomain/zero/1.0/deed.en', '2026-11-19'),
  ('JP-1', 'jp-osaka', 0, 'Osaka Castle 02bs3200.jpg', '663highland', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('JP-1', 'jp-osaka', 1, 'Osaka montage.jpg', 'Kyoww', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('JP-1', 'jp-kaiyukan', 0, 'Osaka Kaiyukan01s3872.jpg', '663highland', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('JP-1', 'jp-nara', 0, 'Sika deer in Nara 05.jpg', 'Dariusz Jemielniak ("Pundit")', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-nara', 1, 'Kasuga-taisha, chumon-1.jpg', 'Saigen Jiro', 'CC0', 'http://creativecommons.org/publicdomain/zero/1.0/deed.en', '2026-11-19'),
  ('JP-1', 'jp-parco-nara', 0, 'Nara Park, November 2016.jpg', 'Martin Falbisoner', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-parco-nara', 1, 'Five-storied Pagoda, Kofuku-ji - Nara, Japan - DSC07497.jpg', 'Daderot', 'CC0', 'http://creativecommons.org/publicdomain/zero/1.0/deed.en', '2026-11-19'),
  ('JP-1', 'jp-himeji', 0, 'Himeji castle in may 2015.jpg', 'Nikos Kitsakis', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-himeji', 1, 'Himeji Castle, Hyōgo Prefecture; August 2018 (04).jpg', '_steffen', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0', '2026-11-19'),
  ('JP-1', 'jp-kenrokuen', 0, '131109 Kenrokuen Kanazawa Ishikawa pref Japan00s3.jpg', '663highland', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('JP-1', 'jp-kenrokuen', 1, '131109 Kenrokuen Kanazawa Ishikawa pref Japan01s3.jpg', '663highland', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('JP-1', 'jp-takayama', 0, 'Hotakadake Takayama01j3872.jpg', '663highland', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('JP-1', 'jp-takayama', 1, 'Takayama (15485428565).jpg', 'Felix Filnkoessl', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0', '2026-11-19'),
  ('JP-1', 'jp-matsumoto', 0, 'Matsumoto Castle05s5s4592.jpg', '663highland', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('JP-1', 'jp-sapporo', 0, '札幌タワー電波塔展望台から札幌駅方面 - panoramio.jpg', 'Hideki Uchida (セラ)', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('JP-1', 'jp-otaru', 0, 'Otaru from Tenguyama.JPG', 'Soica2001 (talk)', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('JP-1', 'jp-sendai', 0, 'SendaiCity Skylines from Mukaiyama2018.jpg', 'Nryate', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-hiroshima', 0, 'Atomic Bomb Dome and Motoyaso River, Hiroshima, Northwest view 20190417 1.jpg', 'DXR', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-miyajima', 0, 'Miyajima Island.jpg', 'Bernard Gagnon', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('JP-1', 'jp-fukuoka', 0, 'Hakata Port from Fukuoka Tower.jpg', 'そらみみ', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-nagasaki', 0, 'Nagasaki City View from Glover Garden, Nagasaki 2014.jpg', 'Tomio344456', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-churaumi', 0, '沖縄美ら海水族館＿大.jpg', 'sinnosuke uchida', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('JP-1', 'jp-hnd', 0, 'Tokyo-International-Airport Satellite.jpg', 'MaedaAkihiko', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-kix', 0, '関西国際空港全体写真20220811.jpg', 'Ankou1192', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('JP-1', 'jp-cts', 0, 'Hokkaido New Chitose Airport13n4272.jpg', '663highland', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19');

-- place_tips: nessuna riga

end $seed$;

update public.catalog_releases set status = 'pubblicata', published_at = now() where release_id = 'JP-1' and status = 'bozza';

-- Controllo finale: se fallisce, la transazione si annulla
do $check$
declare
  v_n bigint;
begin
  if not exists (select 1 from public.countries where code = 'JP' and currency = 'JPY' and timezone = 'Asia/Tokyo' and language = 'ja') then
    raise exception 'Nazione JP: valuta, fuso o lingua diversi da quelli del seed';
  end if;
  perform now() at time zone 'Asia/Tokyo';
  if not exists (select 1 from public.catalog_releases where release_id = 'JP-1' and status = 'pubblicata') then
    raise exception 'Versione JP-1 non pubblicata';
  end if;
  select count(*) into v_n from public.regions where release_id = 'JP-1';
  if v_n <> 7 then raise exception 'regions (release_id = ''JP-1''): attese 7 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'JP-1';
  if v_n <> 30 then raise exception 'places (release_id = ''JP-1''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_texts where release_id = 'JP-1';
  if v_n <> 30 then raise exception 'place_texts (release_id = ''JP-1''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_sources where release_id = 'JP-1';
  if v_n <> 150 then raise exception 'place_sources (release_id = ''JP-1''): attese 150 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.operators where release_id = 'JP-1';
  if v_n <> 0 then raise exception 'operators (release_id = ''JP-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.voyages where release_id = 'JP-1';
  if v_n <> 0 then raise exception 'voyages (release_id = ''JP-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.route_ports where release_id = 'JP-1';
  if v_n <> 0 then raise exception 'route_ports (release_id = ''JP-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_links where release_id = 'JP-1';
  if v_n <> 0 then raise exception 'place_links (release_id = ''JP-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'JP-1' and category = 'porti';
  if v_n <> 0 then raise exception 'places (release_id = ''JP-1'' and category = ''porti''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'JP-1' and coords_status = 'verificate';
  if v_n <> 30 then raise exception 'places (release_id = ''JP-1'' and coords_status = ''verificate''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'JP-1' and official_url is not null;
  if v_n <> 30 then raise exception 'places (release_id = ''JP-1'' and official_url is not null): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'JP-1' and wikidata_qid is not null;
  if v_n <> 30 then raise exception 'places (release_id = ''JP-1'' and wikidata_qid is not null): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'JP-1' and base_place_key is not null;
  if v_n <> 0 then raise exception 'places (release_id = ''JP-1'' and base_place_key is not null): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_photos where release_id = 'JP-1';
  if v_n <> 37 then raise exception 'place_photos (release_id = ''JP-1''): attese 37 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_tips where release_id = 'JP-1';
  if v_n <> 0 then raise exception 'place_tips (release_id = ''JP-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places p join public.place_keys k on k.place_key = p.place_key where p.release_id = 'JP-1' and k.country_code <> 'JP';
  if v_n <> 0 then raise exception 'Chiavi di luogo registrate per un''altra nazione: %', v_n; end if;
  select count(*) into v_n from public.places p where p.release_id = 'JP-1' and not exists (select 1 from public.place_texts t where t.release_id = p.release_id and t.place_key = p.place_key and t.lang = 'it');
  if v_n <> 0 then raise exception 'Luoghi senza testo italiano: %', v_n; end if;
  raise notice 'Catalogo JP-1 pubblicato e controllato: 30 luoghi, 0 crociere, 0 porti in rotta';
end $check$;

-- Versioni precedenti: cancellate (i viaggi passano a questa, che le contiene)
do $purge$
begin
  if to_regprocedure('private.purge_superseded_releases(text)') is not null then
    perform private.purge_superseded_releases('JP');
  end if;
end $purge$;

commit;
