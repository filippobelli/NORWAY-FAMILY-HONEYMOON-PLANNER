-- Catalogo Francia, versione 1 (FR-1).
-- GENERATO da scripts/seed-catalog.ts: non modificare a mano, rigenerare con `npx tsx scripts/seed-catalog.ts`.
-- Prerequisito: migrazioni supabase/migrations/20261106000100 … 20261106000500.
-- Idempotente: con la versione già pubblicata non scrive nulla e controlla solo i conteggi.
-- Tocca solo le tabelle del catalogo e la versione delle nazioni dei viaggi a righe; nessun dato di auth.
-- Dopo il controllo cancella le versioni precedenti della nazione (migrazione 20261119000000_cataloghi_superati.sql).

begin;

-- Prerequisiti: versione non superata, versione precedente pubblicata, tabelle dei traghetti presenti
do $pre$
begin
  if exists (select 1 from public.catalog_releases where country_code = 'FR' and status = 'pubblicata' and version > 1) then
    raise exception 'Il catalogo FR ha già una versione più recente di FR-1: questo seed è superato';
  end if;
  if to_regclass('public.place_photos') is null or to_regclass('public.place_tips') is null then
    raise exception 'Mancano le tabelle di foto e consigli: applicare prima supabase/migrations/20261110000100_foto_consigli.sql';
  end if;
end $pre$;

insert into public.countries (code, name, names, currency, timezone, language) values
  ('FR', 'Francia', '{"en":"France"}'::jsonb, 'EUR', 'Europe/Paris', 'fr')
on conflict (code) do nothing;

insert into public.catalog_releases (release_id, country_code, version, status, data_checked_until, notes, source_notes, road_factor, avg_kmh, road_calibrated, road_note, airport_radius_km) values
  ('FR-1', 'FR', 1, 'bozza', '2026-11-19', 'Prima selezione editoriale: città, musei, natura, parchi e aeroporti. Coordinate da Wikidata; foto Commons con licenza per file. Informazioni operative da verificare. Trasporti non ancora catalogati.', '[{"label":"Wikidata: dati strutturati CC0","url":"https://www.wikidata.org/wiki/Wikidata:Licensing","checkedAt":"2026-11-19","license":"CC0-1.0"},{"label":"Ente turistico · Francia","url":"https://www.france.fr/en/","checkedAt":"2026-11-19","note":"Consultato per il contesto e la copertura; testi e immagini non importati"}]'::jsonb, null, null, false, 'Parametri stradali non calibrati per questa nazione. I tempi del configuratore sono indicativi: calcolare i trasferimenti prima di attivare.', null)
on conflict (release_id) do nothing;

insert into public.place_keys (place_key, country_code) values
  ('fr-parigi', 'FR'),
  ('fr-louvre', 'FR'),
  ('fr-torre-eiffel', 'FR'),
  ('fr-orsay', 'FR'),
  ('fr-jardin-plantes', 'FR'),
  ('fr-cite-sciences', 'FR'),
  ('fr-versailles', 'FR'),
  ('fr-disneyland', 'FR'),
  ('fr-rouen', 'FR'),
  ('fr-mont-saint-michel', 'FR'),
  ('fr-saint-malo', 'FR'),
  ('fr-nantes', 'FR'),
  ('fr-machines-ile', 'FR'),
  ('fr-tours', 'FR'),
  ('fr-chambord', 'FR'),
  ('fr-strasburgo', 'FR'),
  ('fr-colmar', 'FR'),
  ('fr-lione', 'FR'),
  ('fr-annecy', 'FR'),
  ('fr-chamonix', 'FR'),
  ('fr-avignone', 'FR'),
  ('fr-pont-gard', 'FR'),
  ('fr-nizza', 'FR'),
  ('fr-bordeaux', 'FR'),
  ('fr-tolosa', 'FR'),
  ('fr-cite-espace', 'FR'),
  ('fr-carcassonne', 'FR'),
  ('fr-cdg', 'FR'),
  ('fr-lys', 'FR'),
  ('fr-nce', 'FR')
on conflict (place_key) do nothing;

-- Contenuto della versione: si scrive solo se è ancora in bozza
do $seed$
begin
  if not exists (select 1 from public.catalog_releases where release_id = 'FR-1' and status = 'bozza') then
    raise notice 'Versione FR-1 già pubblicata: nessuna scrittura, solo controllo';
    return;
  end if;
insert into public.regions (release_id, region_key, position, name, areas, sources) values
  ('FR-1', 'fr-r1', 0, 'Parigi e Île-de-France', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('FR-1', 'fr-r2', 1, 'Normandia e Bretagna', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('FR-1', 'fr-r3', 2, 'Valle della Loira', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('FR-1', 'fr-r4', 3, 'Alsazia e Francia orientale', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('FR-1', 'fr-r5', 4, 'Lione e Alpi francesi', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('FR-1', 'fr-r6', 5, 'Provenza e Costa Azzurra', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb),
  ('FR-1', 'fr-r7', 6, 'Francia sud-occidentale', '[]'::jsonb, '[{"label":"Raggruppamento editoriale per esplorare il catalogo","checkedAt":"2026-11-19","note":"Zone di viaggio; confini cartografici non importati"}]'::jsonb);

insert into public.places (release_id, place_key, category, region_key, lat, lng, coords_status, local_name, visit_hours_min, visit_hours_max, difficulty, kid_score, reliability, is_base, day_visit, iata, official_url, official_kind, official_via, wikidata_qid, wiki_it, wiki_en, commons_image, base_place_key, address, setting, booking_advice, booking_url, hours_published, details_wikidata_qid, details_checked_at) values
  ('FR-1', 'fr-parigi', 'citta', 'fr-r1', 48.85666666666667, 2.352222222222222, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.paris.fr/', 'ente', 'Wikidata', 'Q90', 'Parigi', 'Paris', 'La Tour Eiffel vue de la Tour Saint-Jacques, Paris août 2014 (2).jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-louvre', 'musei', 'fr-r1', 48.861111111111114, 2.3358333333333334, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.louvre.fr/', 'attrazione', 'Wikidata', 'Q19675', 'Museo del Louvre', 'Louvre', 'Cour Napoléon at night - Louvre.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-torre-eiffel', 'musei', 'fr-r1', 48.858296, 2.294479, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.toureiffel.paris', 'attrazione', 'Wikidata', 'Q243', 'Torre Eiffel', 'Eiffel Tower', 'Tour Eiffel Wikimedia Commons.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-orsay', 'musei', 'fr-r1', 48.859972, 2.326527, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.musee-orsay.fr', 'attrazione', 'Wikidata', 'Q23402', 'Museo d''Orsay', 'Musée d''Orsay', 'MuseeDOrsay.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-jardin-plantes', 'natura', 'fr-r1', 48.843888888889, 2.3597222222222, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.jardindesplantesdeparis.fr/', 'attrazione', 'Wikidata', 'Q730948', 'Jardin des Plantes', 'Jardin des Plantes', 'Paris 75005 Grande Galerie de l''Evolution 20070804.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-cite-sciences', 'musei', 'fr-r1', 48.89555555555555, 2.388055555555556, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.cite-sciences.fr/', 'attrazione', 'Wikidata', 'Q1094338', 'Cité des sciences et de l''industrie', 'Cité des Sciences et de l''Industrie', 'Radio telescope de la Villette.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-versailles', 'musei', 'fr-r1', 48.804722222222225, 2.120277777777778, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://en.chateauversailles.fr/', 'attrazione', 'Wikidata', 'Q2946', 'Reggia di Versailles', 'Palace of Versailles', 'Vue aérienne du domaine de Versailles par ToucanWings - Creative Commons By Sa 3.0 - 083.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-disneyland', 'parchi', 'fr-r1', 48.868719444444, 2.7818, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.disneylandparis.com/', 'attrazione', 'Wikidata', 'Q206521', 'Disneyland Paris', 'Disneyland Paris', 'Disneyland Park 05, Paris 22 August 2013.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-rouen', 'citta', 'fr-r2', 49.443055555556, 1.1025, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://rouen.fr/', 'ente', 'Wikidata', 'Q30974', 'Rouen', 'Rouen', 'Rouen mosaique.png', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-mont-saint-michel', 'isole', 'fr-r2', 48.635833333333, -1.5102777777778, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://mairie-lemontsaintmichel.fr/', 'attrazione', 'Wikidata', 'Q20892', 'Le Mont-Saint-Michel', 'Mont-Saint-Michel', 'Mont St Michel 3, Brittany, France - July 2011.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-saint-malo', 'citta', 'fr-r2', 48.64944444444444, -2.026111111111111, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'http://www.ville-saint-malo.fr', 'ente', 'Wikidata', 'Q163108', 'Saint-Malo', 'Saint-Malo', 'Aerial image of Saint-Malo (view from the south).jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-nantes', 'citta', 'fr-r3', 47.217222222222, -1.5538888888889, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://metropole.nantes.fr/', 'ente', 'Wikidata', 'Q12191', 'Nantes', 'Nantes', 'Marité.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-machines-ile', 'parchi', 'fr-r3', 47.206, -1.5648194444444, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, null, null, null, 'Q1820547', 'Macchine dell''Isola di Nantes', 'Machines of the Isle of Nantes', 'Hangar des machines de l''île.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-tours', 'citta', 'fr-r3', 47.392777777778, 0.68833333333333, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.tours.fr/', 'ente', 'Wikidata', 'Q288', 'Tours', 'Tours', 'Morning in September in Tours 18.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-chambord', 'musei', 'fr-r3', 47.61611111111111, 1.5172222222222222, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.chambord.org', 'attrazione', 'Wikidata', 'Q205367', 'Castello di Chambord', 'Château de Chambord', null, null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-strasburgo', 'citta', 'fr-r4', 48.573333333333, 7.7522222222222, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.strasbourg.eu', 'ente', 'Wikidata', 'Q6602', 'Strasburgo', 'Strasbourg', 'Strasbourg seen from Esca Tower in 2014.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-colmar', 'citta', 'fr-r4', 48.081111111111, 7.355, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.colmar.fr/', 'ente', 'Wikidata', 'Q130994', 'Colmar', 'Colmar', 'View of Église Saint-Martin (43833049001).jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-lione', 'citta', 'fr-r5', 45.7675, 4.835, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.lyon.fr/', 'ente', 'Wikidata', 'Q456', 'Lione', 'Lyon', '01. Panorama de Lyon pris depuis le toit de la Basilique de Fourvière.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-annecy', 'citta', 'fr-r5', 45.899166666667, 6.1294444444444, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.annecy.fr/', 'ente', 'Wikidata', 'Q50189', 'Annecy', 'Annecy', 'Annecy-palais2.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-chamonix', 'citta', 'fr-r5', 45.922222222222, 6.8688888888889, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.chamonix.fr/', 'ente', 'Wikidata', 'Q83236', 'Chamonix-Mont-Blanc', 'Chamonix', 'Chamonix - Arve river.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-avignone', 'citta', 'fr-r6', 43.948611111111, 4.8083333333333, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'http://www.avignon.fr', 'ente', 'Wikidata', 'Q6397', 'Avignone', 'Avignon', 'Avignon, Palais des Papes depuis Tour Philippe le Bel by JM Rosier.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-pont-gard', 'musei', 'fr-r6', 43.9473, 4.5355, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'https://www.pontdugard.fr', 'attrazione', 'Wikidata', 'Q189764', 'Pont du Gard', 'Pont du Gard', 'Pont du Gard BLS.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-nizza', 'citta', 'fr-r6', 43.701944444444, 7.2683333333333, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://nice.fr', 'ente', 'Wikidata', 'Q33959', 'Nizza', 'Nice', 'Port Of Nice, Côte d''Azur.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-bordeaux', 'citta', 'fr-r7', 44.837777777778, -0.57944444444444, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://www.bordeaux.fr', 'ente', 'Wikidata', 'Q1479', 'Bordeaux', 'Bordeaux', '138 - Place de la Bourse et le miroir d''eau - Bordeaux.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-tolosa', 'citta', 'fr-r7', 43.60444444444445, 1.4433333333333334, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'https://metropole.toulouse.fr/', 'ente', 'Wikidata', 'Q7880', 'Tolosa', 'Toulouse', 'Toulouse - View on Saint Sernin.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-cite-espace', 'musei', 'fr-r7', 43.58691667, 1.49327778, 'verificate', null, null, null, null, null, 'da_verificare', false, true, null, 'http://www.cite-espace.com/', 'attrazione', 'Wikidata', 'Q1094325', 'Cité de l''espace', 'Cité de l''espace', 'CDE Mir.JPG', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-carcassonne', 'citta', 'fr-r7', 43.215833333333, 2.3513888888889, 'verificate', null, null, null, null, null, 'da_verificare', true, false, null, 'http://www.carcassonne.org', 'ente', 'Wikidata', 'Q6582', 'Carcassonne', 'Carcassonne', '1 carcassonne aerial 2016.jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-cdg', 'aeroporti', 'fr-r1', 49.009722222222, 2.5477777777778, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'CDG', 'https://www.parisaeroport.fr/fr/passagers/roissy-charles-de-gaulle', 'attrazione', 'Wikidata', 'Q46280', 'Aeroporto di Parigi Charles de Gaulle', 'Paris Charles de Gaulle Airport', 'Aeroport de Roissy.JPG', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-lys', 'aeroporti', 'fr-r5', 45.725555555556, 5.0811111111111, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'LYS', 'https://www.lyonaeroports.com/', 'attrazione', 'Wikidata', 'Q1547', 'Aeroporto di Lione Saint Exupéry', 'Lyon–Saint-Exupéry Airport', 'Vue aérienne d''une partie de l''aéroport de Lyon Saint-Exupéry et de la gare TGV (septembre 2022).jpg', null, null, null, null, null, null, null, null),
  ('FR-1', 'fr-nce', 'aeroporti', 'fr-r6', 43.665277777778, 7.215, 'verificate', null, null, null, null, null, 'da_verificare', false, false, 'NCE', 'https://www.nice.aeroport.fr/', 'attrazione', 'Wikidata', 'Q821557', 'Aeroporto di Nizza Costa Azzurra', 'Nice Côte d''Azur Airport', 'Aéroport Nice vue aérienne.jpg', null, null, null, null, null, null, null, null);

insert into public.place_texts (release_id, place_key, lang, name, description, access, season, august_note, area, booking_note, seasonal_note, outside_note) values
  ('FR-1', 'fr-parigi', 'it', 'Parigi', 'Capitale francese attraversata dalla Senna, con musei, giardini e quartieri storici.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-louvre', 'it', 'Museo del Louvre', 'Museo parigino con collezioni di arte e archeologia nel palazzo del Louvre.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-torre-eiffel', 'it', 'Torre Eiffel', 'Torre in ferro sul Champ-de-Mars; livelli accessibili, prenotazioni e aperture vanno controllati.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-orsay', 'it', 'Museo d’Orsay', 'Museo d’arte ospitato in una ex stazione sulla riva della Senna.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-jardin-plantes', 'it', 'Jardin des Plantes', 'Giardino botanico di Parigi collegato al complesso del Museo nazionale di storia naturale.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-cite-sciences', 'it', 'Città delle scienze e dell’industria', 'Centro scientifico alla Villette, con esposizioni e attività da scegliere secondo l’età.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-versailles', 'it', 'Reggia di Versailles', 'Residenza reale con giardini a Versailles; palazzo, parco e tenute possono avere accessi distinti.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-disneyland', 'it', 'Disneyland Paris', 'Complesso di parchi a Marne-la-Vallée, fuori dal centro di Parigi; biglietti e trasferimento da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-rouen', 'it', 'Rouen', 'Città normanna sulla Senna con centro storico e cattedrale.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-mont-saint-michel', 'it', 'Mont-Saint-Michel', 'Borgo e abbazia su un isolotto della baia normanna; maree e accessi richiedono controlli aggiornati.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-saint-malo', 'it', 'Saint-Malo', 'Città costiera bretone con centro storico cinto da mura.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-nantes', 'it', 'Nantes', 'Città della Loira con castello, musei e spazi sull’isola di Nantes.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-machines-ile', 'it', 'Les Machines de l’île', 'Installazioni meccaniche e attrazioni artistiche sull’isola di Nantes.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-tours', 'it', 'Tours', 'Città della Valle della Loira, utilizzabile come base per esplorare i dintorni.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-chambord', 'it', 'Castello di Chambord', 'Castello rinascimentale nella Valle della Loira, circondato da una vasta tenuta.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-strasburgo', 'it', 'Strasburgo', 'Città alsaziana con cattedrale e quartieri storici lungo i canali.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-colmar', 'it', 'Colmar', 'Città alsaziana con case a graticcio e vie del centro storico.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-lione', 'it', 'Lione', 'Città alla confluenza di Rodano e Saona, con quartieri storici e musei.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-annecy', 'it', 'Annecy', 'Città dell’Alta Savoia sul lago omonimo, con canali e centro storico.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-chamonix', 'it', 'Chamonix', 'Località alpina ai piedi del massiccio del Monte Bianco; impianti e percorsi dipendono dalle condizioni.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-avignone', 'it', 'Avignone', 'Città provenzale sul Rodano con mura e Palazzo dei Papi.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-pont-gard', 'it', 'Pont du Gard', 'Ponte-acquedotto romano presso il Gardon, con area di visita e percorsi.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-nizza', 'it', 'Nizza', 'Città della Costa Azzurra con centro storico e passeggiata sul mare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-bordeaux', 'it', 'Bordeaux', 'Città sulla Garonna con architettura storica e lungofiume.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-tolosa', 'it', 'Tolosa', 'Città sul fiume Garonna con architetture in mattoni e musei.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-cite-espace', 'it', 'Cité de l’espace', 'Centro di divulgazione dedicato all’esplorazione spaziale nei dintorni di Tolosa.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-carcassonne', 'it', 'Carcassonne', 'Città dell’Occitania con cittadella fortificata e mura.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-cdg', 'it', 'Aeroporto di Parigi Charles de Gaulle', 'Aeroporto dell’area parigina; terminal e collegamenti da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-lys', 'it', 'Aeroporto di Lione Saint-Exupéry', 'Aeroporto dell’area di Lione; collegamenti con la città da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null),
  ('FR-1', 'fr-nce', 'it', 'Aeroporto di Nizza Costa Azzurra', 'Aeroporto dell’area di Nizza; trasferimenti e terminal da verificare.', 'Accesso, trasferimenti e accessibilità da verificare sulla fonte del luogo.', 'Aperture, condizioni e necessità di prenotazione da verificare per le date del viaggio.', null, null, null, null, null);

insert into public.place_sources (release_id, place_key, field, position, label, url, checked_at, license, method, note) values
  ('FR-1', 'fr-parigi', 'coordinate', 0, 'Wikidata Q90 · P625', 'https://www.wikidata.org/wiki/Q90', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-parigi', 'scheda', 0, 'Wikidata Q90', 'https://www.wikidata.org/wiki/Q90', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-parigi', 'wikidata', 0, 'Wikidata Q90', 'https://www.wikidata.org/wiki/Q90', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-parigi', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-parigi', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.paris.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-louvre', 'coordinate', 0, 'Wikidata Q19675 · P625', 'https://www.wikidata.org/wiki/Q19675', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-louvre', 'scheda', 0, 'Wikidata Q19675', 'https://www.wikidata.org/wiki/Q19675', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-louvre', 'wikidata', 0, 'Wikidata Q19675', 'https://www.wikidata.org/wiki/Q19675', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-louvre', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-louvre', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.louvre.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-torre-eiffel', 'coordinate', 0, 'Wikidata Q243 · P625', 'https://www.wikidata.org/wiki/Q243', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-torre-eiffel', 'scheda', 0, 'Wikidata Q243', 'https://www.wikidata.org/wiki/Q243', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-torre-eiffel', 'wikidata', 0, 'Wikidata Q243', 'https://www.wikidata.org/wiki/Q243', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-torre-eiffel', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-torre-eiffel', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.toureiffel.paris', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-orsay', 'coordinate', 0, 'Wikidata Q23402 · P625', 'https://www.wikidata.org/wiki/Q23402', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-orsay', 'scheda', 0, 'Wikidata Q23402', 'https://www.wikidata.org/wiki/Q23402', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-orsay', 'wikidata', 0, 'Wikidata Q23402', 'https://www.wikidata.org/wiki/Q23402', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-orsay', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-orsay', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.musee-orsay.fr', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-jardin-plantes', 'coordinate', 0, 'Wikidata Q730948 · P625', 'https://www.wikidata.org/wiki/Q730948', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-jardin-plantes', 'scheda', 0, 'Wikidata Q730948', 'https://www.wikidata.org/wiki/Q730948', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-jardin-plantes', 'wikidata', 0, 'Wikidata Q730948', 'https://www.wikidata.org/wiki/Q730948', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-jardin-plantes', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-jardin-plantes', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.jardindesplantesdeparis.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-cite-sciences', 'coordinate', 0, 'Wikidata Q1094338 · P625', 'https://www.wikidata.org/wiki/Q1094338', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-cite-sciences', 'scheda', 0, 'Wikidata Q1094338', 'https://www.wikidata.org/wiki/Q1094338', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-cite-sciences', 'wikidata', 0, 'Wikidata Q1094338', 'https://www.wikidata.org/wiki/Q1094338', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-cite-sciences', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-cite-sciences', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.cite-sciences.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-versailles', 'coordinate', 0, 'Wikidata Q2946 · P625', 'https://www.wikidata.org/wiki/Q2946', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-versailles', 'scheda', 0, 'Wikidata Q2946', 'https://www.wikidata.org/wiki/Q2946', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-versailles', 'wikidata', 0, 'Wikidata Q2946', 'https://www.wikidata.org/wiki/Q2946', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-versailles', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-versailles', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://en.chateauversailles.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-disneyland', 'coordinate', 0, 'Wikidata Q206521 · P625', 'https://www.wikidata.org/wiki/Q206521', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-disneyland', 'scheda', 0, 'Wikidata Q206521', 'https://www.wikidata.org/wiki/Q206521', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-disneyland', 'wikidata', 0, 'Wikidata Q206521', 'https://www.wikidata.org/wiki/Q206521', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-disneyland', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-disneyland', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.disneylandparis.com/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-rouen', 'coordinate', 0, 'Wikidata Q30974 · P625', 'https://www.wikidata.org/wiki/Q30974', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-rouen', 'scheda', 0, 'Wikidata Q30974', 'https://www.wikidata.org/wiki/Q30974', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-rouen', 'wikidata', 0, 'Wikidata Q30974', 'https://www.wikidata.org/wiki/Q30974', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-rouen', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-rouen', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://rouen.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-mont-saint-michel', 'coordinate', 0, 'Wikidata Q20892 · P625', 'https://www.wikidata.org/wiki/Q20892', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-mont-saint-michel', 'scheda', 0, 'Wikidata Q20892', 'https://www.wikidata.org/wiki/Q20892', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-mont-saint-michel', 'wikidata', 0, 'Wikidata Q20892', 'https://www.wikidata.org/wiki/Q20892', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-mont-saint-michel', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-mont-saint-michel', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://mairie-lemontsaintmichel.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-saint-malo', 'coordinate', 0, 'Wikidata Q163108 · P625', 'https://www.wikidata.org/wiki/Q163108', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-saint-malo', 'scheda', 0, 'Wikidata Q163108', 'https://www.wikidata.org/wiki/Q163108', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-saint-malo', 'wikidata', 0, 'Wikidata Q163108', 'https://www.wikidata.org/wiki/Q163108', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-saint-malo', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-saint-malo', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.ville-saint-malo.fr', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-nantes', 'coordinate', 0, 'Wikidata Q12191 · P625', 'https://www.wikidata.org/wiki/Q12191', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-nantes', 'scheda', 0, 'Wikidata Q12191', 'https://www.wikidata.org/wiki/Q12191', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-nantes', 'wikidata', 0, 'Wikidata Q12191', 'https://www.wikidata.org/wiki/Q12191', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-nantes', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-nantes', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://metropole.nantes.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-machines-ile', 'coordinate', 0, 'Wikidata Q1820547 · P625', 'https://www.wikidata.org/wiki/Q1820547', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-machines-ile', 'scheda', 0, 'Wikidata Q1820547', 'https://www.wikidata.org/wiki/Q1820547', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-machines-ile', 'wikidata', 0, 'Wikidata Q1820547', 'https://www.wikidata.org/wiki/Q1820547', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-machines-ile', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-tours', 'coordinate', 0, 'Wikidata Q288 · P625', 'https://www.wikidata.org/wiki/Q288', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-tours', 'scheda', 0, 'Wikidata Q288', 'https://www.wikidata.org/wiki/Q288', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-tours', 'wikidata', 0, 'Wikidata Q288', 'https://www.wikidata.org/wiki/Q288', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-tours', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-tours', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.tours.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-chambord', 'coordinate', 0, 'Wikidata Q205367 · P625', 'https://www.wikidata.org/wiki/Q205367', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-chambord', 'scheda', 0, 'Wikidata Q205367', 'https://www.wikidata.org/wiki/Q205367', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-chambord', 'wikidata', 0, 'Wikidata Q205367', 'https://www.wikidata.org/wiki/Q205367', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-chambord', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-chambord', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.chambord.org', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-strasburgo', 'coordinate', 0, 'Wikidata Q6602 · P625', 'https://www.wikidata.org/wiki/Q6602', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-strasburgo', 'scheda', 0, 'Wikidata Q6602', 'https://www.wikidata.org/wiki/Q6602', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-strasburgo', 'wikidata', 0, 'Wikidata Q6602', 'https://www.wikidata.org/wiki/Q6602', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-strasburgo', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-strasburgo', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.strasbourg.eu', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-colmar', 'coordinate', 0, 'Wikidata Q130994 · P625', 'https://www.wikidata.org/wiki/Q130994', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-colmar', 'scheda', 0, 'Wikidata Q130994', 'https://www.wikidata.org/wiki/Q130994', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-colmar', 'wikidata', 0, 'Wikidata Q130994', 'https://www.wikidata.org/wiki/Q130994', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-colmar', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-colmar', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.colmar.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-lione', 'coordinate', 0, 'Wikidata Q456 · P625', 'https://www.wikidata.org/wiki/Q456', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-lione', 'scheda', 0, 'Wikidata Q456', 'https://www.wikidata.org/wiki/Q456', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-lione', 'wikidata', 0, 'Wikidata Q456', 'https://www.wikidata.org/wiki/Q456', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-lione', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-lione', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.lyon.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-annecy', 'coordinate', 0, 'Wikidata Q50189 · P625', 'https://www.wikidata.org/wiki/Q50189', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-annecy', 'scheda', 0, 'Wikidata Q50189', 'https://www.wikidata.org/wiki/Q50189', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-annecy', 'wikidata', 0, 'Wikidata Q50189', 'https://www.wikidata.org/wiki/Q50189', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-annecy', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-annecy', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.annecy.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-chamonix', 'coordinate', 0, 'Wikidata Q83236 · P625', 'https://www.wikidata.org/wiki/Q83236', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-chamonix', 'scheda', 0, 'Wikidata Q83236', 'https://www.wikidata.org/wiki/Q83236', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-chamonix', 'wikidata', 0, 'Wikidata Q83236', 'https://www.wikidata.org/wiki/Q83236', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-chamonix', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-chamonix', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.chamonix.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-avignone', 'coordinate', 0, 'Wikidata Q6397 · P625', 'https://www.wikidata.org/wiki/Q6397', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-avignone', 'scheda', 0, 'Wikidata Q6397', 'https://www.wikidata.org/wiki/Q6397', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-avignone', 'wikidata', 0, 'Wikidata Q6397', 'https://www.wikidata.org/wiki/Q6397', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-avignone', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-avignone', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.avignon.fr', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-pont-gard', 'coordinate', 0, 'Wikidata Q189764 · P625', 'https://www.wikidata.org/wiki/Q189764', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-pont-gard', 'scheda', 0, 'Wikidata Q189764', 'https://www.wikidata.org/wiki/Q189764', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-pont-gard', 'wikidata', 0, 'Wikidata Q189764', 'https://www.wikidata.org/wiki/Q189764', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-pont-gard', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-pont-gard', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.pontdugard.fr', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-nizza', 'coordinate', 0, 'Wikidata Q33959 · P625', 'https://www.wikidata.org/wiki/Q33959', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-nizza', 'scheda', 0, 'Wikidata Q33959', 'https://www.wikidata.org/wiki/Q33959', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-nizza', 'wikidata', 0, 'Wikidata Q33959', 'https://www.wikidata.org/wiki/Q33959', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-nizza', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-nizza', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://nice.fr', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-bordeaux', 'coordinate', 0, 'Wikidata Q1479 · P625', 'https://www.wikidata.org/wiki/Q1479', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-bordeaux', 'scheda', 0, 'Wikidata Q1479', 'https://www.wikidata.org/wiki/Q1479', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-bordeaux', 'wikidata', 0, 'Wikidata Q1479', 'https://www.wikidata.org/wiki/Q1479', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-bordeaux', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-bordeaux', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.bordeaux.fr', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-tolosa', 'coordinate', 0, 'Wikidata Q7880 · P625', 'https://www.wikidata.org/wiki/Q7880', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-tolosa', 'scheda', 0, 'Wikidata Q7880', 'https://www.wikidata.org/wiki/Q7880', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-tolosa', 'wikidata', 0, 'Wikidata Q7880', 'https://www.wikidata.org/wiki/Q7880', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-tolosa', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-tolosa', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://metropole.toulouse.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-cite-espace', 'coordinate', 0, 'Wikidata Q1094325 · P625', 'https://www.wikidata.org/wiki/Q1094325', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-cite-espace', 'scheda', 0, 'Wikidata Q1094325', 'https://www.wikidata.org/wiki/Q1094325', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-cite-espace', 'wikidata', 0, 'Wikidata Q1094325', 'https://www.wikidata.org/wiki/Q1094325', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-cite-espace', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-cite-espace', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.cite-espace.com/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-carcassonne', 'coordinate', 0, 'Wikidata Q6582 · P625', 'https://www.wikidata.org/wiki/Q6582', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-carcassonne', 'scheda', 0, 'Wikidata Q6582', 'https://www.wikidata.org/wiki/Q6582', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-carcassonne', 'wikidata', 0, 'Wikidata Q6582', 'https://www.wikidata.org/wiki/Q6582', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-carcassonne', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-carcassonne', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'http://www.carcassonne.org', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-cdg', 'coordinate', 0, 'Wikidata Q46280 · P625', 'https://www.wikidata.org/wiki/Q46280', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-cdg', 'scheda', 0, 'Wikidata Q46280', 'https://www.wikidata.org/wiki/Q46280', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-cdg', 'wikidata', 0, 'Wikidata Q46280', 'https://www.wikidata.org/wiki/Q46280', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-cdg', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-cdg', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.parisaeroport.fr/fr/passagers/roissy-charles-de-gaulle', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-lys', 'coordinate', 0, 'Wikidata Q1547 · P625', 'https://www.wikidata.org/wiki/Q1547', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-lys', 'scheda', 0, 'Wikidata Q1547', 'https://www.wikidata.org/wiki/Q1547', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-lys', 'wikidata', 0, 'Wikidata Q1547', 'https://www.wikidata.org/wiki/Q1547', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-lys', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-lys', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.lyonaeroports.com/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate'),
  ('FR-1', 'fr-nce', 'coordinate', 0, 'Wikidata Q821557 · P625', 'https://www.wikidata.org/wiki/Q821557', '2026-11-19', 'CC0-1.0', 'API Wikidata: coordinate terrestri e controllo geografico della nazione', null),
  ('FR-1', 'fr-nce', 'scheda', 0, 'Wikidata Q821557', 'https://www.wikidata.org/wiki/Q821557', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-nce', 'wikidata', 0, 'Wikidata Q821557', 'https://www.wikidata.org/wiki/Q821557', '2026-11-19', 'CC0-1.0', null, 'Dati strutturati; orari, tariffe e disponibilità non verificati'),
  ('FR-1', 'fr-nce', 'testi', 0, 'Redazione del catalogo', null, '2026-11-19', null, 'Descrizione originale in italiano, da verificare; nessun testo di Wikipedia riutilizzato', null),
  ('FR-1', 'fr-nce', 'sito_ufficiale', 0, 'Sito indicato in Wikidata (P856), da verificare', 'https://www.nice.aeroport.fr/', '2026-11-19', null, null, 'Riferimento letto in Wikidata; pagina e informazioni operative non controllate');

-- operators: nessuna riga

-- voyages: nessuna riga

-- route_ports: nessuna riga

-- place_links: nessuna riga

insert into public.place_photos (release_id, place_key, position, commons_file, author, license, license_url, checked_at) values
  ('FR-1', 'fr-parigi', 0, 'La Tour Eiffel vue de la Tour Saint-Jacques, Paris août 2014 (2).jpg', 'Yann Caradec from Paris, France', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0', '2026-11-19'),
  ('FR-1', 'fr-louvre', 0, 'Cour Napoléon at night - Louvre.jpg', 'Benh LIEU SONG', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('FR-1', 'fr-torre-eiffel', 0, 'Tour Eiffel Wikimedia Commons.jpg', 'Benh LIEU SONG', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('FR-1', 'fr-orsay', 0, 'MuseeDOrsay.jpg', 'Sanchezn', 'CC BY-SA 3.0', 'http://creativecommons.org/licenses/by-sa/3.0/', '2026-11-19'),
  ('FR-1', 'fr-orsay', 1, 'Musee d''Orsay and Pont Royal, North-West view 140402 1.jpg', 'DXR', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('FR-1', 'fr-orsay', 2, 'Gare d''Orsay (49570190081).jpg', 'Cheng-en Cheng from Taichung City, Taiwan', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0', '2026-11-19'),
  ('FR-1', 'fr-jardin-plantes', 0, 'Paris 75005 Grande Galerie de l''Evolution 20070804.jpg', 'Benh LIEU SONG', 'CC BY 3.0', 'https://creativecommons.org/licenses/by/3.0', '2026-11-19'),
  ('FR-1', 'fr-cite-sciences', 0, 'Radio telescope de la Villette.jpg', 'Aliva Sahoo', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('FR-1', 'fr-versailles', 0, 'Vue aérienne du domaine de Versailles par ToucanWings - Creative Commons By Sa 3.0 - 083.jpg', 'ToucanWings', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('FR-1', 'fr-disneyland', 0, 'Disneyland Park 05, Paris 22 August 2013.jpg', 'flightlog', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0', '2026-11-19'),
  ('FR-1', 'fr-rouen', 0, 'Rouen mosaique.png', 'Foulques1996', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('FR-1', 'fr-mont-saint-michel', 0, 'Mont St Michel 3, Brittany, France - July 2011.jpg', 'Diliff', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('FR-1', 'fr-saint-malo', 0, 'Aerial image of Saint-Malo (view from the south).jpg', 'Carsten Steger', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('FR-1', 'fr-nantes', 0, 'Marité.jpg', 'Jibi44', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('FR-1', 'fr-machines-ile', 0, 'Hangar des machines de l''île.jpg', 'User:Symac', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('FR-1', 'fr-tours', 0, 'Morning in September in Tours 18.jpg', 'Szilas', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0', '2026-11-19'),
  ('FR-1', 'fr-strasburgo', 0, 'Strasbourg seen from Esca Tower in 2014.jpg', 'Dominique Philbert', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('FR-1', 'fr-strasburgo', 1, 'Strasburg.jpg', 'Radek Kucharski', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0', '2026-11-19'),
  ('FR-1', 'fr-colmar', 0, 'View of Église Saint-Martin (43833049001).jpg', '--sinava-- from Berlin', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0', '2026-11-19'),
  ('FR-1', 'fr-lione', 0, '01. Panorama de Lyon pris depuis le toit de la Basilique de Fourvière.jpg', 'Otourly', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('FR-1', 'fr-annecy', 0, 'Annecy-palais2.jpg', 'Yves LC', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('FR-1', 'fr-chamonix', 0, 'Chamonix - Arve river.jpg', 'Tiia Monto', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('FR-1', 'fr-avignone', 0, 'Avignon, Palais des Papes depuis Tour Philippe le Bel by JM Rosier.jpg', 'Jean-Marc Rosier (de/from http://www.cjrosier.com + http://www.gordes-immobilier.com)', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('FR-1', 'fr-avignone', 1, '.00 3171 Stadtmauer von Avignon, Frankreich.jpg', 'W. Bulach', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('FR-1', 'fr-pont-gard', 0, 'Pont du Gard BLS.jpg', 'Benh LIEU SONG (Flickr)', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19'),
  ('FR-1', 'fr-nizza', 0, 'Port Of Nice, Côte d''Azur.jpg', 'Moody Dreiza (Moody751 at English Wikipedia)', 'CC BY 2.5', 'https://creativecommons.org/licenses/by/2.5', '2026-11-19'),
  ('FR-1', 'fr-bordeaux', 0, '138 - Place de la Bourse et le miroir d''eau - Bordeaux.jpg', 'Patrick Despoix', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('FR-1', 'fr-tolosa', 0, 'Toulouse - View on Saint Sernin.jpg', 'Tonio94 (talk · contribs)', 'CC BY-SA 2.5', 'https://creativecommons.org/licenses/by-sa/2.5', '2026-11-19'),
  ('FR-1', 'fr-cite-espace', 0, 'CDE Mir.JPG', 'Emeraude 22:10, 16 October 2006 (UTC)', 'Public domain', 'https://commons.wikimedia.org/wiki/Commons:Licensing', '2026-11-19'),
  ('FR-1', 'fr-cite-espace', 1, 'Radar à la Cité de l''Espace.jpg', 'Celeda', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('FR-1', 'fr-carcassonne', 0, '1 carcassonne aerial 2016.jpg', 'Chensiyuan', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', '2026-11-19'),
  ('FR-1', 'fr-cdg', 0, 'Aeroport de Roissy.JPG', 'Remi Jouan', 'CC BY 3.0', 'https://creativecommons.org/licenses/by/3.0', '2026-11-19'),
  ('FR-1', 'fr-lys', 0, 'Vue aérienne d''une partie de l''aéroport de Lyon Saint-Exupéry et de la gare TGV (septembre 2022).jpg', 'Benoît Prieur', 'CC0', 'http://creativecommons.org/publicdomain/zero/1.0/deed.en', '2026-11-19'),
  ('FR-1', 'fr-nce', 0, 'Aéroport Nice vue aérienne.jpg', 'Abxbay', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0', '2026-11-19');

-- place_tips: nessuna riga

end $seed$;

update public.catalog_releases set status = 'pubblicata', published_at = now() where release_id = 'FR-1' and status = 'bozza';

-- Controllo finale: se fallisce, la transazione si annulla
do $check$
declare
  v_n bigint;
begin
  if not exists (select 1 from public.countries where code = 'FR' and currency = 'EUR' and timezone = 'Europe/Paris' and language = 'fr') then
    raise exception 'Nazione FR: valuta, fuso o lingua diversi da quelli del seed';
  end if;
  perform now() at time zone 'Europe/Paris';
  if not exists (select 1 from public.catalog_releases where release_id = 'FR-1' and status = 'pubblicata') then
    raise exception 'Versione FR-1 non pubblicata';
  end if;
  select count(*) into v_n from public.regions where release_id = 'FR-1';
  if v_n <> 7 then raise exception 'regions (release_id = ''FR-1''): attese 7 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'FR-1';
  if v_n <> 30 then raise exception 'places (release_id = ''FR-1''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_texts where release_id = 'FR-1';
  if v_n <> 30 then raise exception 'place_texts (release_id = ''FR-1''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_sources where release_id = 'FR-1';
  if v_n <> 149 then raise exception 'place_sources (release_id = ''FR-1''): attese 149 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.operators where release_id = 'FR-1';
  if v_n <> 0 then raise exception 'operators (release_id = ''FR-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.voyages where release_id = 'FR-1';
  if v_n <> 0 then raise exception 'voyages (release_id = ''FR-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.route_ports where release_id = 'FR-1';
  if v_n <> 0 then raise exception 'route_ports (release_id = ''FR-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_links where release_id = 'FR-1';
  if v_n <> 0 then raise exception 'place_links (release_id = ''FR-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'FR-1' and category = 'porti';
  if v_n <> 0 then raise exception 'places (release_id = ''FR-1'' and category = ''porti''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'FR-1' and coords_status = 'verificate';
  if v_n <> 30 then raise exception 'places (release_id = ''FR-1'' and coords_status = ''verificate''): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'FR-1' and official_url is not null;
  if v_n <> 29 then raise exception 'places (release_id = ''FR-1'' and official_url is not null): attese 29 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'FR-1' and wikidata_qid is not null;
  if v_n <> 30 then raise exception 'places (release_id = ''FR-1'' and wikidata_qid is not null): attese 30 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places where release_id = 'FR-1' and base_place_key is not null;
  if v_n <> 0 then raise exception 'places (release_id = ''FR-1'' and base_place_key is not null): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_photos where release_id = 'FR-1';
  if v_n <> 34 then raise exception 'place_photos (release_id = ''FR-1''): attese 34 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.place_tips where release_id = 'FR-1';
  if v_n <> 0 then raise exception 'place_tips (release_id = ''FR-1''): attese 0 righe, trovate %', v_n; end if;
  select count(*) into v_n from public.places p join public.place_keys k on k.place_key = p.place_key where p.release_id = 'FR-1' and k.country_code <> 'FR';
  if v_n <> 0 then raise exception 'Chiavi di luogo registrate per un''altra nazione: %', v_n; end if;
  select count(*) into v_n from public.places p where p.release_id = 'FR-1' and not exists (select 1 from public.place_texts t where t.release_id = p.release_id and t.place_key = p.place_key and t.lang = 'it');
  if v_n <> 0 then raise exception 'Luoghi senza testo italiano: %', v_n; end if;
  raise notice 'Catalogo FR-1 pubblicato e controllato: 30 luoghi, 0 crociere, 0 porti in rotta';
end $check$;

-- Versioni precedenti: cancellate (i viaggi passano a questa, che le contiene)
do $purge$
begin
  if to_regprocedure('private.purge_superseded_releases(text)') is not null then
    perform private.purge_superseded_releases('FR');
  end if;
end $purge$;

commit;
