// Collegamenti delle destinazioni a Wikidata, Wikipedia e Wikimedia Commons (27/10/2026).
// Abbinamento verificato: elemento Wikidata trovato per nome E con coordinate entro 20 km dalla scheda
// (80 km per fjordi, parchi, isole e ferrovie). Testi e foto NON sono copiati qui: l'app li legge al momento
// da Wikipedia/Commons e mostra autore, licenza e link alla fonte.
// Senza abbinamento affidabile: raumabanen, haukland, bodo-moskenes, aurora, midnight-sun (foto non mostrata).

export interface WikiRef {
  qid: string;
  /** Titolo della voce su it.wikipedia */
  it?: string;
  /** Titolo della voce su en.wikipedia */
  en?: string;
  /** Nome del file su Wikimedia Commons (immagine principale P18 di Wikidata) */
  image?: string;
}

export const WIKI: Record<string, WikiRef> = {
  'a-lofoten': { qid: 'Q258490', it: "Å (Moskenes)", en: "Å, Moskenes", image: "A view 2009.JPG" },
  'aes': { qid: 'Q175897', it: "Aeroporto di Ålesund-Vigra", en: "Ålesund Airport, Vigra", image: "Alesund-lufthavn.jpg" },
  'alesund': { qid: 'Q62266', it: "Ålesund", en: "Ålesund Municipality", image: "Vista de Ålesund desde Aksla, Noruega, 2019-09-01, DD 16.jpg" },
  'andenes': { qid: 'Q167305', it: "Andenes", en: "Andenes", image: "Andenes, Norway 2006.jpg" },
  'atlanterhavsparken': { qid: 'Q756544', en: "Atlantic Sea-Park", image: "Atlantic Sea-Park inglés (Alesund) - P1080228.jpg" },
  'atlanterhavsveien': { qid: 'Q756561', it: "Strada dell'Atlantico", en: "Atlantic Ocean Road", image: "Route de l'Atlantique en norvège.jpg" },
  'aurlandsfjellet': { qid: 'Q4822423', en: "Aurlandsfjellet", image: "Norway Aurland Laerdal3.jpg" },
  'aurlandsfjord': { qid: 'Q776482', en: "Aurlandsfjord", image: "View of the Aurlandsfjord, Aurlandsvangen and Flam from below the Prest Summit.jpg" },
  'balestrand': { qid: 'Q493292', it: "Balestrand", en: "Balestrand Municipality", image: "Balestrand (again).jpg" },
  'bergen': { qid: 'Q26793', it: "Bergen", en: "Bergen", image: "Vista de Bergen desde la montaña Fløyen, Noruega, 2019-09-08, DD 27-31 PAN.jpg" },
  'bergen-aquarium': { qid: 'Q29329', en: "Bergen Aquarium", image: "Akvariet Bergen.jpg" },
  'bergensbanen': { qid: 'Q777060', it: "Ferrovia Oslo-Bergen", en: "Bergen Line", image: "NSB El 18 2245 Tunga.jpg" },
  'bgo': { qid: 'Q619980', it: "Aeroporto di Bergen-Flesland", en: "Bergen Airport, Flesland", image: "New Bergen Airport Flesland with old terminal in the background.jpg" },
  'boo': { qid: 'Q39164', it: "Aeroporto di Bodø", en: "Bodø Airport", image: "Bodø lufthavn.jpg" },
  'briksdalsbreen': { qid: 'Q917018', it: "Briksdalsbreen", en: "Briksdalsbreen", image: "Briksdalsbreen-close-18july2006.jpg" },
  'dalsnibba': { qid: 'Q1158087', it: "Dalsnibba", en: "Dalsnibba", image: "Geiranger from Oernesvingen2.jpg" },
  'dovrefjell': { qid: 'Q2100974', it: "Dovrefjell", en: "Dovrefjell", image: "Snohetta.jpg" },
  'dyreparken': { qid: 'Q1789271', it: "Kristiansand Zoo and Amusement Park", en: "Kristiansand Zoo and Amusement Park", image: "Kardemomme by.jpg" },
  'eve': { qid: 'Q1431455', en: "Harstad/Narvik Airport", image: "Harstad, Troms fylke, Nord Norge (12267584645).jpg" },
  'fjellsenter': { qid: 'Q2199551', image: "Norsk fjellsenter.jpg" },
  'flam': { qid: 'Q995666', it: "Flåm", en: "Flåm", image: "Flam.jpg" },
  'flamsbana': { qid: 'Q402957', it: "Flåmsbana", en: "Flåm Line", image: ".00 1230 Flåmsbana und Bahnhof von Flåm, Norwegen.jpg" },
  'folkemuseum': { qid: 'Q937521', it: "Norsk Folkemuseum", en: "Norwegian Museum of Cultural History", image: "Norway Folk Museum - Street scene.jpg" },
  'fram': { qid: 'Q941250', it: "Museo Fram", en: "Fram Museum", image: "Fram Museum in Oslo.JPG" },
  'geiranger': { qid: 'Q1019493', it: "Geiranger", en: "Geiranger", image: ".00 1262 Geiranger - Norway.jpg" },
  'geirangerfjord': { qid: 'Q193989', it: "Geirangerfjord", en: "Geirangerfjord", image: "Fiordo de Geiranger desde Flydalsjuvet, Noruega, 2019-09-07, DD 61.jpg" },
  'glacier-museum': { qid: 'Q2530322', it: "Museo dei ghiacciai", en: "Norwegian Glacier Museum", image: "Museo Glaciar Fjaerland.jpg" },
  'hamnoy': { qid: 'Q1776894', it: "Hamnøy", en: "Hamnøya", image: "Hamnøy Harbor (15390311826).jpg" },
  'hardangerfjord': { qid: 'Q841491', it: "Hardangerfjord", en: "Hardangerfjord", image: "Hardangerfjorden from krokavatn 2.jpg" },
  'henningsvaer': { qid: 'Q1605649', it: "Henningsvaer", en: "Henningsvær", image: "Henningsvær (15226562389).jpg" },
  'hjorundfjord': { qid: 'Q5873359', en: "Hjørundfjord Municipality", image: "Tvergrov-Hj rundfjordenfraa-Viddal.jpg" },
  'hunderfossen': { qid: 'Q2000964', en: "Hunderfossen Familiepark", image: "Hunderfossen - Trollet.JPG" },
  'jotunheimen': { qid: 'Q1578584', it: "Parco nazionale Jotunheimen", en: "Jotunheimen National Park", image: "Jotunheimen - view from Galdhøpiggen1.JPG" },
  'kongeparken': { qid: 'Q4588838', en: "Kongeparken", image: "Kongeparken2007.jpg" },
  'langedrag': { qid: 'Q11983144', en: "Langedrag Nature Park" },
  'latefossen': { qid: 'Q37387', it: "Låtefossen", en: "Låtefossen", image: "00 N223 Låtefossen - Norwegen.jpg" },
  'lillehammer': { qid: 'Q101341', it: "Lillehammer", en: "Lillehammer", image: "LillehammerDSC01504.JPG" },
  'lofoten': { qid: 'Q186822', it: "Isole Lofoten", en: "Lofoten", image: "Moskenes Reinebringen lub 2025-07-21 img09 Aussicht.jpg" },
  'lofotr': { qid: 'Q893523', en: "Lofotr Viking Museum", image: "Borg-Wikingermuseum-04-2019-gje.jpg" },
  'lysefjord': { qid: 'Q549376', it: "Lysefjord", en: "Lysefjord", image: "Lysefjorden fjord.jpg" },
  'naeroyfjord': { qid: 'Q212205', it: "Nærøyfjord", en: "Nærøyfjord", image: "Nærøyfjorden mot Gudvangen.jpg" },
  'nigardsbreen': { qid: 'Q1781997', en: "Nigardsbreen", image: "Nigardsbreen lodowiec.jpg" },
  'nordkapp': { qid: 'Q4069', it: "Capo Nord", en: "North Cape (Norway)", image: "Cabo Norte, Noruega, 2019-09-03, DD 16.jpg" },
  'nusfjord': { qid: 'Q1783413', it: "Nusfjord", en: "Nusfjord", image: "The fishing village of Nusfjord.jpg" },
  'odda': { qid: 'Q109494', it: "Odda", en: "Odda Municipality", image: "ODDA.JPG" },
  'ornesvingen': { qid: 'Q18689760', image: "Stranda Geirangerfjord lub 2025-07-29 img08.jpg" },
  'osl': { qid: 'Q210559', it: "Aeroporto di Oslo-Gardermoen", en: "Oslo Airport, Gardermoen", image: "Oslo Airport3.jpg" },
  'oslo': { qid: 'Q585', it: "Oslo", en: "Oslo", image: "View from siloen.jpg" },
  'polar-park': { qid: 'Q1779978', it: "Polar Zoo", en: "Polar Park (animal park)", image: "Bear-Ursus arctos-male-Polar Park Norway.jpg" },
  'polaria': { qid: 'Q28888', en: "Polaria", image: "Polaria 01.JPG" },
  'preikestolen': { qid: 'Q746223', it: "Preikestolen", en: "Preikestolen", image: "Preikestolen Norge.jpg" },
  'reine': { qid: 'Q593597', it: "Reine", en: "Reine, Norway", image: "Reine i Lofoten LC0148.jpg" },
  'roros': { qid: 'Q108999', it: "Røros", en: "Røros Municipality", image: "RorosViewFromSlagHeaps.jpg" },
  'runde': { qid: 'Q980145', en: "Runde", image: "Isle of Runde 20130705 190219.jpg" },
  'saltstraumen': { qid: 'Q3470260', image: "Saltstraumen 20170722 133203 (cropped).jpg" },
  'senja': { qid: 'Q56249968', it: "Senja (comune)", en: "Senja Municipality", image: "Husøy, Senja.jpg" },
  'sju-sostrene': { qid: 'Q38339', it: "De syv søstrene", en: "Seven Sisters Waterfall", image: "De syv søstre - The Seven Sisters - panoramio (1).jpg" },
  'sognefjord': { qid: 'Q208495', it: "Sognefjord", en: "Sognefjord", image: "Sognefjord, Norway.jpg" },
  'stavanger': { qid: 'Q25416', it: "Stavanger", en: "Stavanger", image: "Vaagen-modf.jpg" },
  'stegastein': { qid: 'Q628686', en: "Stegastein", image: "Stegastein viewpoint - panoramio (1).jpg" },
  'steinsdalsfossen': { qid: 'Q1789467', en: "Steinsdalsfossen", image: "Steinsdalsfossen.jpg" },
  'svolvaer': { qid: 'Q145948', it: "Svolvær", en: "Svolvær", image: "Svolvaer, Lofoten, Norway.JPG" },
  'tos': { qid: 'Q2413018', it: "Aeroporto di Tromsø-Langnes", en: "Tromsø Airport", image: "Tromsø airport, Norway.jpg" },
  'trd': { qid: 'Q729886', it: "Aeroporto di Trondheim-Værnes", en: "Trondheim Airport", image: "Vaernes terminal.jpg" },
  'trollstigen': { qid: 'Q940332', it: "Trollstigen", en: "Trollstigen", image: "Trollstigen HochPanno.jpg" },
  'trolltunga': { qid: 'Q1512593', it: "Trolltunga", en: "Trolltunga", image: "View of trolltunga.jpg" },
  'tromso': { qid: 'Q26087', it: "Tromsø", en: "Tromsø Municipality", image: "Tromso Tromsø Norway tunliweb 02.jpg" },
  'trondheim': { qid: 'Q25804', it: "Trondheim", en: "Trondheim", image: "Overview of Trondheim 2008 03.jpg" },
  'tusenfryd': { qid: 'Q2581206', en: "Tusenfryd", image: "TusenfrydEntrance.jpg" },
  'undredal': { qid: 'Q1006480', en: "Undredal", image: "Undredal.jpg" },
  'voringsfossen': { qid: 'Q38588', en: "Vøringsfossen", image: "Vøringfossen.jpg" },
  'whale-andenes': { qid: 'Q167305', it: "Andenes", en: "Andenes", image: "Andenes, Norway 2006.jpg" },
};
