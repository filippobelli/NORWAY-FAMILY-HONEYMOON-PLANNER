import type { Category, Destination, Region } from '../domain/types';
import { COORDS_CHECKED_AT, VERIFIED_COORDS } from './coordVerification';

// CATALOGO.
// Coordinate: verificate su OpenStreetMap il 27/10/2026 dove indicato (vedi coordVerification.ts),
// altrimenti "approssimative". Descrizioni, durate, idoneità per bambini e stagionalità restano
// "da_verificare" (conoscenza generale, non ancora confrontate con fonti ufficiali).
// Prezzi e orari volutamente assenti.

type Seed = [
  id: string,
  name: string,
  category: Category,
  region: Region,
  lat: number,
  lng: number,
  kidScore: 1 | 2 | 3,
  difficulty: Destination['difficulty'],
  visitHours: [number, number] | undefined,
  description: string,
  access: string,
  season?: string,
  augustNote?: string,
  localName?: string,
];

const SEEDS: Seed[] = [
  // Città e villaggi
  ['oslo', 'Oslo', 'citta', 'Oslo e Østlandet', 59.913, 10.752, 3, 'facile', [24, 48], 'Capitale: musei, fiordo di Oslo e parchi. Buona base di arrivo o partenza.', 'Aeroporto di Gardermoen, treno.'],
  ['bergen', 'Bergen', 'citta', 'Fiordi occidentali', 60.392, 5.324, 3, 'facile', [24, 48], 'Bryggen, funicolare Fløibanen e acquario. Porta dei fiordi e porto di partenza della rotta costiera.', 'Aeroporto di Flesland, treno da Oslo, nave costiera.'],
  ['alesund', 'Ålesund', 'citta', 'Fiordi occidentali', 62.472, 6.155, 3, 'facile', [6, 24], 'Città Art Nouveau su isole, belvedere di Aksla e acquario.', 'Aeroporto di Vigra, strada, nave costiera.'],
  ['trondheim', 'Trondheim', 'citta', 'Trøndelag', 63.43, 10.395, 2, 'facile', [6, 24], 'Cattedrale di Nidaros, case colorate sul fiume.', 'Aeroporto di Værnes, treno, nave costiera.'],
  ['tromso', 'Tromsø', 'citta', 'Troms e Finnmark', 69.649, 18.955, 3, 'facile', [24, 48], 'Città artica: Polaria, funivia Fjellheisen, cattedrale artica.', 'Aeroporto, nave costiera.'],
  ['stavanger', 'Stavanger', 'citta', 'Sørlandet e Rogaland', 58.97, 5.733, 2, 'facile', [6, 24], 'Centro storico in legno, base per Lysefjord e Preikestolen.', 'Aeroporto di Sola, strada.'],
  ['flam', 'Flåm', 'citta', 'Fiordi occidentali', 60.863, 7.113, 3, 'facile', [6, 24], "Villaggio sull'Aurlandsfjord, capolinea della Flåmsbana e porto delle crociere sul Nærøyfjord.", 'Strada E16, treno Flåmsbana, battello.', 'Molto affollato in alta stagione'],
  ['geiranger', 'Geiranger', 'citta', 'Fiordi occidentali', 62.101, 7.206, 3, 'facile', [24, 48], 'Villaggio in fondo al Geirangerfjord, base per Dalsnibba e la strada delle Aquile.', 'Strada (passi stagionali), traghetto Hellesylt–Geiranger, nave costiera stagionale.', 'Strade di montagna aperte d\'estate'],
  ['balestrand', 'Balestrand', 'citta', 'Fiordi occidentali', 61.208, 6.533, 2, 'facile', [4, 24], 'Villaggio tranquillo sul Sognefjord con ville in stile dragone.', 'Strada, battello veloce.'],
  ['undredal', 'Undredal', 'citta', 'Fiordi occidentali', 60.951, 7.104, 2, 'facile', [2, 4], 'Minuscolo villaggio del formaggio di capra e chiesetta in legno.', 'Strada laterale dalla E16.'],
  ['lillehammer', 'Lillehammer', 'citta', 'Oslo e Østlandet', 61.115, 10.466, 3, 'facile', [6, 24], 'Museo all\'aperto di Maihaugen e impianti olimpici.', 'Treno e strada da Oslo.'],
  ['roros', 'Røros', 'citta', 'Trøndelag', 62.574, 11.385, 2, 'facile', [4, 24], 'Città mineraria in legno, patrimonio UNESCO.', 'Treno, strada.'],
  ['odda', 'Odda', 'citta', 'Fiordi occidentali', 60.069, 6.546, 2, 'facile', [4, 24], 'Base sul Sørfjord per Trolltunga e cascate dell\'Hardanger.', 'Strada.'],

  // Fiordi e navigazione
  ['geirangerfjord', 'Geirangerfjord', 'fiordi', 'Fiordi occidentali', 62.11, 7.1, 3, 'facile', [2, 6], 'Fiordo UNESCO con le cascate Sette Sorelle. Navigazione Hellesylt–Geiranger o battelli turistici.', 'Battello da Geiranger o Hellesylt.', 'Stagione turistica estiva'],
  ['naeroyfjord', 'Nærøyfjord', 'fiordi', 'Fiordi occidentali', 60.93, 6.96, 3, 'facile', [2, 4], 'Ramo stretto del Sognefjord, UNESCO. Crociera Flåm–Gudvangen.', 'Battello da Flåm o Gudvangen.'],
  ['sognefjord', 'Sognefjord', 'fiordi', 'Fiordi occidentali', 61.1, 6.4, 2, 'facile', [2, 8], 'Il fiordo più lungo e profondo della Norvegia.', 'Strade lungo le sponde, traghetti, battelli veloci da Bergen.'],
  ['lysefjord', 'Lysefjord', 'fiordi', 'Sørlandet e Rogaland', 59.02, 6.25, 2, 'facile', [3, 6], 'Fiordo sotto Preikestolen e Kjerag, con minicrociere da Stavanger.', 'Battello da Stavanger.'],
  ['hardangerfjord', 'Hardangerfjord', 'fiordi', 'Fiordi occidentali', 60.25, 6.2, 3, 'facile', [4, 24], 'Frutteti, cascate e ponte dell\'Hardanger.', 'Strada, traghetti locali.', 'Frutteti in raccolta da fine estate'],
  ['hjorundfjord', 'Hjørundfjord', 'fiordi', 'Fiordi occidentali', 62.15, 6.35, 2, 'facile', [2, 6], 'Fiordo selvaggio tra le Alpi del Sunnmøre.', 'Strada e traghetti locali.'],
  ['aurlandsfjord', 'Aurlandsfjord', 'fiordi', 'Fiordi occidentali', 60.9, 7.15, 3, 'facile', [2, 4], 'Ramo del Sognefjord tra Flåm e Aurland, visibile da Stegastein.', 'Strada, battello.'],

  // Cascate, ghiacciai e parchi naturali
  ['briksdalsbreen', 'Briksdalsbreen', 'natura', 'Fiordi occidentali', 61.663, 6.814, 3, 'facile', [2, 4], 'Lingua del Jostedalsbreen raggiungibile con passeggiata (anche con i "troll cars").', 'Strada da Olden, sentiero di circa 3 km.'],
  ['nigardsbreen', 'Nigardsbreen', 'natura', 'Fiordi occidentali', 61.68, 7.2, 2, 'media', [2, 5], 'Ghiacciaio con laghetto, barca e sentiero; escursioni guidate sul ghiaccio con limiti di età.', 'Strada nella Jostedalen.'],
  ['voringsfossen', 'Vøringsfossen', 'natura', 'Fiordi occidentali', 60.427, 7.25, 3, 'facile', [1, 2], 'Cascata con passerella e ponte panoramico.', 'Strada 7 Hardangervidda.'],
  ['steinsdalsfossen', 'Steinsdalsfossen', 'natura', 'Fiordi occidentali', 60.376, 6.12, 3, 'facile', [1, 1], 'Cascata dietro cui si può camminare.', 'Strada vicino a Norheimsund.'],
  ['latefossen', 'Låtefossen', 'natura', 'Fiordi occidentali', 59.947, 6.584, 3, 'facile', [0.5, 1], 'Doppia cascata a bordo strada.', 'Strada 13 a sud di Odda.'],
  ['sju-sostrene', 'Le Sette Sorelle', 'natura', 'Fiordi occidentali', 62.106, 7.094, 3, 'facile', [1, 2], 'Cascate del Geirangerfjord, si vedono dal battello.', 'Battello sul Geirangerfjord.', undefined, undefined, 'Dei sju søstrene'],
  ['jotunheimen', 'Jotunheimen', 'natura', 'Oslo e Østlandet', 61.6, 8.3, 2, 'media', [24, 72], 'Parco nazionale delle vette più alte, con passeggiate brevi da Sognefjellet.', 'Strada Sognefjellsvegen (stagionale).'],
  ['preikestolen', 'Preikestolen', 'natura', 'Sørlandet e Rogaland', 58.986, 6.19, 1, 'impegnativa', [4, 6], 'Il "Pulpito": circa 8 km A/R con dislivello. Difficile per un bambino di 5 anni.', 'Parcheggio Preikestolen fjellstue.'],
  ['trolltunga', 'Trolltunga', 'natura', 'Fiordi occidentali', 60.124, 6.74, 1, 'impegnativa', [10, 12], 'Escursione lunga e impegnativa: non adatta a bambini piccoli. Inserita solo come riferimento.', 'Da Skjeggedal (Odda).'],

  // Strade panoramiche e punti di osservazione
  ['trollstigen', 'Trollstigen', 'strade', 'Fiordi occidentali', 62.457, 7.669, 3, 'facile', [1, 3], 'Strada a tornanti con piattaforme panoramiche.', 'Strada 63 tra Åndalsnes e Valldal.', 'Aperta in estate'],
  ['atlanterhavsveien', 'Strada Atlantica', 'strade', 'Fiordi occidentali', 63.017, 7.355, 3, 'facile', [1, 3], 'Ponti sull\'oceano tra le isole fra Molde e Kristiansund.', 'Strada 64.', undefined, undefined, 'Atlanterhavsveien'],
  ['dalsnibba', 'Dalsnibba', 'strade', 'Fiordi occidentali', 62.047, 7.27, 3, 'facile', [1, 2], 'Belvedere a circa 1.500 m sopra Geiranger (strada a pedaggio).', 'Nibbevegen da Geiranger.', 'Stagionale estivo'],
  ['stegastein', 'Stegastein', 'strade', 'Fiordi occidentali', 60.909, 7.209, 3, 'facile', [0.5, 1], 'Piattaforma sospesa sull\'Aurlandsfjord.', 'Strada Aurlandsfjellet da Aurland.'],
  ['ornesvingen', 'Strada delle Aquile', 'strade', 'Fiordi occidentali', 62.123, 7.164, 3, 'facile', [0.5, 1], 'Tornanti con belvedere sul Geirangerfjord.', 'Strada 63 sopra Geiranger.', undefined, undefined, 'Ørnesvingen'],
  ['aurlandsfjellet', 'Strada della neve', 'strade', 'Fiordi occidentali', 60.95, 7.35, 2, 'facile', [2, 3], 'Strada di montagna tra Aurland e Lærdal, neve anche d\'estate.', 'Strada Aurlandsfjellet.', 'Aperta in estate', undefined, 'Aurlandsfjellet'],

  // Isole e villaggi costieri
  ['reine', 'Reine (Lofoten)', 'isole', 'Nordland e Lofoten', 67.932, 13.089, 3, 'facile', [4, 24], 'Villaggio di pescatori con rorbuer rossi sotto montagne a picco.', 'Strada E10, traghetto Bodø–Moskenes.'],
  ['henningsvaer', 'Henningsvær (Lofoten)', 'isole', 'Nordland e Lofoten', 68.155, 14.205, 3, 'facile', [3, 6], 'Villaggio su isolotti con il celebre campo da calcio.', 'Strada da Svolvær.'],
  ['a-lofoten', 'Å i Lofoten', 'isole', 'Nordland e Lofoten', 67.879, 12.978, 3, 'facile', [2, 4], 'Fine della E10, museo del merluzzo e panetteria storica.', 'Strada E10.'],
  ['lofoten', 'Isole Lofoten', 'isole', 'Nordland e Lofoten', 68.15, 13.9, 3, 'facile', [48, 120], 'Arcipelago di montagne a picco sul mare, villaggi di pescatori e spiagge bianche. Base consigliata: più notti nella stessa hytte o rorbu.', 'Traghetto Bodø–Moskenes, nave costiera (Stamsund, Svolvær), strada E10 da Narvik/Evenes, voli per Svolvær e Leknes.', undefined, undefined, 'Lofoten'],
  ['svolvaer', 'Svolvær (Lofoten)', 'isole', 'Nordland e Lofoten', 68.234, 14.568, 3, 'facile', [4, 24], 'Capoluogo delle Lofoten, porto della nave costiera, uscite in barca verso il Trollfjord.', 'Strada E10, nave costiera, aeroporto.'],
  ['nusfjord', 'Nusfjord (Lofoten)', 'isole', 'Nordland e Lofoten', 68.035, 13.35, 3, 'facile', [2, 4], 'Villaggio di pescatori conservato, con ingresso a pagamento in estate.', 'Strada laterale dalla E10.'],
  ['hamnoy', 'Hamnøy e Sakrisøy (Lofoten)', 'isole', 'Nordland e Lofoten', 67.948, 13.135, 3, 'facile', [1, 2], 'Rorbuer rossi e gialli sul fiordo, tra i panorami più noti delle Lofoten.', 'Strada E10 vicino a Reine.'],
  ['haukland', 'Spiaggia di Haukland (Lofoten)', 'isole', 'Nordland e Lofoten', 68.2, 13.53, 3, 'facile', [2, 4], 'Spiaggia di sabbia bianca e acqua turchese, adatta ai bambini; sentiero facile verso Uttakleiv.', 'Strada da Leknes.'],
  ['andenes', 'Andenes (Vesterålen)', 'isole', 'Nordland e Lofoten', 69.314, 16.119, 2, 'facile', [6, 24], 'Base per safari delle balene.', 'Strada, traghetto stagionale per Senja.'],
  ['runde', 'Runde', 'isole', 'Fiordi occidentali', 62.4, 5.63, 2, 'media', [4, 6], 'Isola degli uccelli marini con pulcinelle di mare.', 'Strada e ponti da Ålesund.', 'Pulcinelle presenti indicativamente fino a metà agosto', 'Le pulcinelle iniziano a partire verso metà agosto: verificare'],
  ['senja', 'Senja', 'isole', 'Troms e Finnmark', 69.4, 17.3, 2, 'facile', [24, 48], 'Seconda isola della Norvegia, strada turistica nazionale e montagne sul mare.', 'Strada, traghetti stagionali.'],

  // Treni ed esperienze di trasporto
  ['flamsbana', 'Ferrovia di Flåm', 'treni', 'Fiordi occidentali', 60.863, 7.113, 3, 'facile', [2, 3], 'Treno panoramico Flåm–Myrdal con sosta alla cascata Kjosfossen.', 'Stazione di Flåm o Myrdal.', undefined, undefined, 'Flåmsbana'],
  ['bergensbanen', 'Ferrovia Oslo–Bergen', 'treni', 'Oslo e Østlandet', 60.735, 7.122, 2, 'facile', [7, 8], 'Linea attraverso l\'altopiano dell\'Hardangervidda (fermata Myrdal per Flåm).', 'Stazioni di Oslo S e Bergen.', undefined, undefined, 'Bergensbanen'],
  ['raumabanen', 'Ferrovia del Rauma', 'treni', 'Fiordi occidentali', 62.567, 7.687, 3, 'facile', [2, 3], 'Treno panoramico Dombås–Åndalsnes nella valle del Rauma.', 'Stazione di Åndalsnes.', undefined, undefined, 'Raumabanen'],
  ['bodo-moskenes', 'Traghetto Bodø–Moskenes', 'treni', 'Nordland e Lofoten', 67.283, 14.38, 2, 'facile', [3, 4], 'Traghetto per auto verso le Lofoten. Prenotazione e orari da verificare.', 'Porto di Bodø.'],

  // Fauna e attività naturalistiche
  ['whale-andenes', 'Safari delle balene (Andenes)', 'fauna', 'Nordland e Lofoten', 69.326, 16.13, 2, 'media', [3, 5], 'Uscita in mare per capodogli; limiti di età e mal di mare da valutare.', 'Porto di Andenes.'],
  ['dovrefjell', 'Buoi muschiati (Dovrefjell)', 'fauna', 'Oslo e Østlandet', 62.27, 9.6, 1, 'media', [4, 6], 'Safari a piedi per osservare i buoi muschiati: di solito più adatto a bambini grandi.', 'Strada E6, Hjerkinn/Dombås.'],
  ['polar-park', 'Polar Park', 'fauna', 'Troms e Finnmark', 68.75, 18.4, 3, 'facile', [3, 5], 'Parco faunistico artico con lupi, orsi e linci.', 'Strada E6, Bardu.'],
  ['langedrag', 'Langedrag Naturpark', 'fauna', 'Oslo e Østlandet', 60.47, 9.1, 3, 'facile', [3, 6], 'Parco naturalistico con animali nordici e cabine.', 'Strada, Nesbyen.'],
  ['saltstraumen', 'Saltstraumen', 'fauna', 'Nordland e Lofoten', 67.235, 14.62, 3, 'facile', [1, 2], 'La corrente di marea più forte del mondo, vortici visibili dal ponte.', 'Strada 17 vicino a Bodø.'],

  // Musei e attività per bambini
  ['folkemuseum', 'Museo del Popolo Norvegese', 'musei', 'Oslo e Østlandet', 59.907, 10.684, 3, 'facile', [3, 4], 'Museo all\'aperto con fattorie e chiesa in legno.', 'Bygdøy, Oslo.', undefined, undefined, 'Norsk Folkemuseum'],
  ['fram', 'Museo Fram', 'musei', 'Oslo e Østlandet', 59.903, 10.699, 3, 'facile', [2, 3], 'La nave polare Fram, si sale a bordo.', 'Bygdøy, Oslo.', undefined, undefined, 'Frammuseet'],
  ['bergen-aquarium', 'Acquario di Bergen', 'musei', 'Fiordi occidentali', 60.4, 5.304, 3, 'facile', [2, 3], 'Pinguini, foche e vasche dell\'Atlantico.', 'Nordnes, Bergen.', undefined, undefined, 'Akvariet i Bergen'],
  ['atlanterhavsparken', 'Atlanterhavsparken', 'musei', 'Fiordi occidentali', 62.469, 6.072, 3, 'facile', [2, 3], 'Acquario sul mare di Ålesund.', 'Ålesund.'],
  ['polaria', 'Polaria', 'musei', 'Troms e Finnmark', 69.643, 18.949, 3, 'facile', [1, 2], 'Centro artico con foche barbate.', 'Tromsø.'],
  ['glacier-museum', 'Museo dei ghiacciai', 'musei', 'Fiordi occidentali', 61.418, 6.762, 3, 'facile', [2, 3], 'Museo interattivo sui ghiacciai a Fjærland.', 'Strada 5.', undefined, undefined, 'Norsk Bremuseum'],
  ['lofotr', 'Museo vichingo Lofotr', 'musei', 'Nordland e Lofoten', 68.25, 13.76, 3, 'facile', [3, 4], 'Ricostruzione di una casa lunga vichinga con attività.', 'Borg, Vestvågøy.'],
  ['fjellsenter', 'Centro della montagna di Lom', 'musei', 'Oslo e Østlandet', 61.838, 8.567, 2, 'facile', [1, 2], 'Museo sulla montagna e Jotunheimen.', 'Lom.', undefined, undefined, 'Norsk Fjellsenter'],

  // Parchi divertimento e attrazioni familiari
  ['hunderfossen', 'Hunderfossen Familiepark', 'parchi', 'Oslo e Østlandet', 61.22, 10.43, 3, 'facile', [5, 7], 'Parco a tema troll e fiabe norvegesi, adatto ai piccoli.', 'Strada E6 a nord di Lillehammer.'],
  ['kongeparken', 'Kongeparken', 'parchi', 'Sørlandet e Rogaland', 58.85, 5.73, 3, 'facile', [5, 7], 'Parco divertimenti per famiglie vicino a Stavanger.', 'Ålgård.'],
  ['tusenfryd', 'TusenFryd', 'parchi', 'Oslo e Østlandet', 59.746, 10.778, 2, 'facile', [5, 8], 'Grande parco divertimenti a sud di Oslo.', 'Strada E6.'],
  ['dyreparken', 'Kristiansand Dyrepark', 'parchi', 'Sørlandet e Rogaland', 58.184, 8.137, 3, 'facile', [6, 8], 'Zoo e parco a tema (villaggio di Cardamomo).', 'Kristiansand.'],

  // Esperienze stagionali
  ['aurora', 'Aurora boreale', 'stagionali', 'Troms e Finnmark', 69.649, 18.955, 2, 'facile', undefined, 'Esperienza da settembre a marzo nel nord del paese.', 'Tromsø e nord.', 'Settembre–marzo', "Ad agosto le notti sono troppo luminose: non è realistico pianificarla per questo viaggio."],
  ['midnight-sun', 'Sole di mezzanotte', 'stagionali', 'Nordland e Lofoten', 68.2, 14.5, 3, 'facile', undefined, 'Sole sopra l\'orizzonte a mezzanotte a nord del Circolo Polare.', 'Nord della Norvegia.', 'Fine maggio–luglio (varia con la latitudine)', "Ad agosto il periodo è in genere concluso; restano notti molto chiare. Verificare le date per la latitudine scelta."],
  ['nordkapp', 'Capo Nord', 'stagionali', 'Troms e Finnmark', 71.169, 25.784, 2, 'facile', [3, 5], 'Altopiano sul punto settentrionale dell\'Europa continentale.', 'Strada E69, escursione da Honningsvåg (nave costiera).', undefined, undefined, 'Nordkapp'],

  // Aeroporti (punti di arrivo/partenza configurabili)
  ['osl', 'Aeroporto Oslo Gardermoen', 'aeroporti', 'Oslo e Østlandet', 60.194, 11.1, 3, 'facile', undefined, 'Principale aeroporto internazionale.', 'Treno per Oslo.'],
  ['bgo', 'Aeroporto Bergen Flesland', 'aeroporti', 'Fiordi occidentali', 60.293, 5.218, 3, 'facile', undefined, 'Aeroporto di Bergen.', 'Tram/bus per il centro.'],
  ['aes', 'Aeroporto Ålesund Vigra', 'aeroporti', 'Fiordi occidentali', 62.56, 6.11, 3, 'facile', undefined, 'Aeroporto di Ålesund.', 'Bus per il centro.'],
  ['trd', 'Aeroporto Trondheim Værnes', 'aeroporti', 'Trøndelag', 63.457, 10.924, 3, 'facile', undefined, 'Aeroporto di Trondheim.', 'Treno per il centro.'],
  ['tos', 'Aeroporto di Tromsø', 'aeroporti', 'Troms e Finnmark', 69.683, 18.919, 3, 'facile', undefined, 'Aeroporto di Tromsø.', 'Bus per il centro.'],
  ['boo', 'Aeroporto di Bodø', 'aeroporti', 'Nordland e Lofoten', 67.269, 14.365, 3, 'facile', undefined, 'Aeroporto di Bodø.', 'A piedi/bus per il centro.'],
  ['eve', 'Aeroporto Harstad/Narvik Evenes', 'aeroporti', 'Nordland e Lofoten', 68.491, 16.678, 3, 'facile', undefined, 'Aeroporto per Lofoten e Vesterålen.', 'Auto a noleggio.'],
];

// Correzioni di regione emerse dall'audit (27/10/2026): Myrdal è nel Vestland; Lillehammer, Lom, Jotunheimen,
// Dovrefjell e Hunderfossen sono nell'Innlandet / altopiani interni.
const REGION_FIX: Partial<Record<string, Region>> = {
  bergensbanen: 'Fiordi occidentali',
  lillehammer: 'Innlandet e montagne',
  jotunheimen: 'Innlandet e montagne',
  dovrefjell: 'Innlandet e montagne',
  fjellsenter: 'Innlandet e montagne',
  hunderfossen: 'Innlandet e montagne',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  citta: 'Città e villaggi',
  fiordi: 'Fiordi e navigazione',
  natura: 'Cascate, ghiacciai e parchi',
  strade: 'Strade panoramiche e belvedere',
  isole: 'Isole e villaggi costieri',
  treni: 'Treni e trasporti panoramici',
  fauna: 'Fauna e natura',
  musei: 'Musei e attività per bambini',
  parchi: 'Parchi divertimento',
  stagionali: 'Esperienze stagionali',
  aeroporti: 'Aeroporti',
};

export const DESTINATIONS: Destination[] = SEEDS.map(
  ([id, name, category, region, lat, lng, kidScore, difficulty, visitHours, description, access, season, augustNote, localName]) => {
    const v = VERIFIED_COORDS[id];
    return {
      id,
      name,
      localName,
      category,
      region: REGION_FIX[id] ?? region,
      lat: v ? v.lat : lat,
      lng: v ? v.lng : lng,
      coordsStatus: v ? 'verificate' : 'approssimative',
      kidScore,
      difficulty,
      visitHours,
      description,
      access,
      season: season ?? 'Visitabile in agosto (da verificare)',
      augustNote,
      sources: v
        ? [{ label: `Coordinate: OpenStreetMap (${v.match})`, url: `https://www.openstreetmap.org/${v.osm}`, checkedAt: COORDS_CHECKED_AT }]
        : [],
      reliability: 'da_verificare',
    };
  },
);

export function findDestination(id: string | undefined): Destination | undefined {
  return id ? DESTINATIONS.find((d) => d.id === id) : undefined;
}
