// Selezione editoriale. Nessun testo enciclopedico importato: i titoli risolvono soltanto entità Wikidata.
export const COUNTRIES = {
  SI: { name: 'Slovenia', en: 'Slovenia', language: 'sl', currency: 'EUR', timezone: 'Europe/Ljubljana', qid: 'Q215', bounds: [45.4, 46.9, 13.3, 16.7], tourism: 'https://www.slovenia.info/en', regions: ['Lubiana e Slovenia centrale', 'Alpi Giulie e Gorenjska', 'Carso e costa slovena', 'Maribor, Stiria e Savinja', 'Dolenjska e Posavje', 'Pomurje e Slovenia orientale'] },
  AT: { name: 'Austria', en: 'Austria', language: 'de', currency: 'EUR', timezone: 'Europe/Vienna', qid: 'Q40', bounds: [46.3, 49.1, 9.4, 17.3], tourism: 'https://www.austria.info/en/', regions: ['Vienna e Bassa Austria', 'Salisburgo e Salzkammergut', 'Tirolo e Tirolo orientale', 'Vorarlberg', 'Carinzia', 'Stiria', 'Alta Austria', 'Burgenland'] },
  ES: { name: 'Spagna', en: 'Spain', language: 'es', currency: 'EUR', timezone: 'Europe/Madrid', qid: 'Q29', bounds: [27.5, 44.0, -18.3, 4.5], tourism: 'https://www.spain.info/en/', regions: ['Madrid e Castiglia-La Mancia', 'Catalogna', 'Andalusia', 'Valencia e Murcia', 'Paesi Baschi, Navarra e La Rioja', 'Galizia, Asturie e Cantabria', 'Castiglia e León ed Estremadura', 'Aragona e Pirenei', 'Isole Baleari', 'Isole Canarie'] },
  PT: { name: 'Portogallo', en: 'Portugal', language: 'pt', currency: 'EUR', timezone: 'Europe/Lisbon', qid: 'Q45', bounds: [30, 42.2, -31.5, -6], tourism: 'https://www.visitportugal.com/en', regions: ['Lisbona, Sintra e Setúbal', 'Porto, Minho e Douro', 'Centro e Beiras', 'Alentejo', 'Algarve', 'Madeira', 'Azzorre'] },
  HR: { name: 'Croazia', en: 'Croatia', language: 'hr', currency: 'EUR', timezone: 'Europe/Zagreb', qid: 'Q224', bounds: [42.3, 46.6, 13.4, 19.5], tourism: 'https://croatia.hr/en-gb', regions: ['Zagabria e Croazia centrale', 'Istria', 'Quarnaro e isole settentrionali', 'Zara, Sebenico e Dalmazia settentrionale', 'Spalato e Dalmazia centrale', 'Dubrovnik e Dalmazia meridionale', 'Slavonia e Croazia orientale'] },
  GR: { name: 'Grecia', en: 'Greece', language: 'el', currency: 'EUR', timezone: 'Europe/Athens', qid: 'Q41', bounds: [34.5, 41.8, 19.3, 29.7], tourism: 'https://www.visitgreece.gr/', regions: ['Atene e Attica', 'Peloponneso', 'Grecia centrale e Tessaglia', 'Macedonia, Tracia ed Epiro', 'Isole Ionie', 'Cicladi e Sporadi', 'Creta', 'Dodecaneso e Egeo settentrionale'] },
  TR: { name: 'Turchia', en: 'Türkiye', language: 'tr', currency: 'TRY', timezone: 'Europe/Istanbul', qid: 'Q43', bounds: [35.7, 42.2, 25.6, 44.9], tourism: 'https://goturkiye.com/', regions: ['Istanbul, Tracia e Marmara', 'Egeo e Smirne', 'Costa mediterranea e Licia', 'Cappadocia e Anatolia centrale', 'Mar Nero', 'Anatolia orientale e sud-orientale'] },
};

// @codice|categoria|zona. Nome italiano e descrizione originale facoltativi dopo il titolo.
const selection = `
@SI|citta|0
Ljubljana|Lubiana
Kamnik
Škofja Loka
Grosuplje
Vrhnika
Domžale
Litija
Trbovlje
@SI|citta|1
Bled
Bohinjska Bistrica
Kranjska Gora
Kranj
Radovljica
Jesenice
Bovec
Kobarid
Tolmin
Železniki
Tržič
@SI|citta|2
Koper|Capodistria
Piran|Pirano
Izola|Isola
Portorož|Portorose
Postojna|Postumia
Sežana
Lipica, Sežana|Lipica
Nova Gorica
Vipava
Ajdovščina
Štanjel
Idrija
@SI|citta|3
Maribor
Celje
Ptuj
Velenje
Slovenj Gradec
Laško
Slovenske Konjice
Slovenska Bistrica
Rogaška Slatina
Mozirje
Solčava
@SI|citta|4
Novo Mesto
Brežice
Krško
Kostanjevica na Krki
Metlika
Črnomelj
Ribnica
Kočevje
@SI|citta|5
Murska Sobota
Lendava
Ljutomer
Gornja Radgona
Moravske Toplice
@SI|musei|0
Ljubljana Castle|Castello di Lubiana
National Museum of Slovenia|Museo nazionale della Slovenia
National Gallery of Slovenia|Galleria nazionale della Slovenia
Slovene Ethnographic Museum|Museo etnografico sloveno
Slovenian Museum of Natural History|Museo sloveno di storia naturale
City Museum of Ljubljana|Museo civico di Lubiana
Museum of Modern Art, Ljubljana|Museo d'arte moderna di Lubiana
Slovenian Railway Museum|Museo ferroviario sloveno
Tivoli Castle|Castello Tivoli
Ljubljana Cathedral|Cattedrale di Lubiana
Triple Bridge|Triplice Ponte
Dragon Bridge (Ljubljana)|Ponte dei Draghi
Technical Museum of Slovenia|Museo tecnico della Slovenia
@SI|musei|1
Bled Castle|Castello di Bled
Slovenian Alpine Museum|Museo alpino sloveno
Kobarid Museum|Museo di Caporetto
Liznjek House|Casa Liznjek
@SI|musei|2
Predjama Castle|Castello di Predjama
Praetorian Palace|Palazzo Pretorio di Capodistria
Tartini Square|Piazza Tartini
St. George's Parish Church, Piran|Chiesa di San Giorgio a Pirano
Kromberk Castle|Castello di Kromberk
Gewerkenegg Castle|Castello Gewerkenegg
Franja Partisan Hospital|Ospedale partigiano Franja|Sito storico; accessi e ricostruzioni dopo i danni da verificare.
@SI|musei|3
Celje Castle|Castello di Celje
Ptuj Castle|Castello di Ptuj
Maribor Castle|Castello di Maribor
Velenje Castle|Castello di Velenje
Žiče Charterhouse|Certosa di Žiče
Ptujska Gora
@SI|musei|4
Brežice Castle|Castello di Brežice
Otočec Castle|Castello di Otočec
Kostanjevica Monastery|Monastero di Kostanjevica
@SI|musei|5
Grad Castle|Castello di Grad
Lendava Castle|Castello di Lendava
@SI|natura|0
Tivoli City Park|Parco Tivoli di Lubiana
Ljubljana Botanical Garden|Orto botanico di Lubiana
Ljubljana Marshes|Paludi di Lubiana
Velika Planina|Altopiano di Velika Planina
@SI|natura|1
Lake Bled|Lago di Bled
Lake Bohinj|Lago di Bohinj
Triglav National Park|Parco nazionale del Triglav
Vintgar Gorge|Gola di Vintgar
Savica Falls|Cascata Savica
Peričnik Falls|Cascata Peričnik
Lake Jasna|Lago Jasna
Zelenci
Vršič Pass|Passo della Moistrocca
Mangart Saddle|Sella del Mangart
Soča|Fiume Isonzo
Tolmin Gorge|Gole di Tolmin
Kozjak Falls|Cascata Kozjak
Planica
Pokljuka
Lake Jezero|Lago Jezero|Candidato ambiguo da escludere.
@SI|natura|2
Postojna Cave|Grotte di Postumia
Škocjan Caves|Grotte di San Canziano
Škocjan Inlet|Riserva di Val Stagnon
Sečovlje Saltworks|Saline di Sicciole
Strunjan Nature Reserve|Riserva di Strugnano
Lake Cerknica|Lago di Cerknica
Rakov Škocjan
Križna Cave|Grotta Križna
@SI|natura|3
Logar Valley|Valle di Logar
Rinka Falls|Cascata Rinka
Pohorje
Lovrenc Lakes|Laghi di Lovrenc
@SI|natura|4
Krakovo Forest|Foresta di Krakovo
@SI|parchi|3
Terme Olimia|Terme Olimia|Complesso termale; accessi ai parchi acquatici da verificare.
@SI|parchi|4
Terme Čatež|Terme Čatež|Complesso termale e acquatico; apertura e servizi da verificare.
@SI|fauna|0
Ljubljana Zoo|Zoo di Lubiana
@SI|fauna|2
Lipica Stud Farm|Allevamento di Lipica
@SI|aeroporti|0
Ljubljana Jože Pučnik Airport
@SI|aeroporti|3
Maribor Edvard Rusjan Airport
@SI|aeroporti|2
Portorož Airport
@SI|treni|0
Ljubljana railway station|Stazione di Lubiana
Kamnik railway station
@SI|treni|1
Jesenice railway station
Lesce-Bled railway station
Bled Jezero railway station
Bohinjska Bistrica railway station
Kranj railway station
@SI|treni|2
Koper railway station
Postojna railway station
Sežana railway station
Nova Gorica railway station
Most na Soči railway station
@SI|treni|3
Maribor railway station
Celje railway station
Zidani Most railway station
Pragersko railway station
Ptuj railway station
@SI|treni|4
Novo Mesto railway station
Dobova railway station
Krško railway station
Sevnica railway station
@SI|treni|5
Murska Sobota railway station
@SI|porti|2
Port of Koper|Porto di Capodistria
Marina Portorož|Marina di Portorose
@AT|citta|0
Vienna|Vienna
Krems an der Donau
Dürnstein
Melk
St. Pölten
Wiener Neustadt
Baden bei Wien
Klosterneuburg
Tulln an der Donau
Retz
Langenlois
@AT|citta|1
Salzburg|Salisburgo
Hallstatt
Bad Ischl
St. Gilgen
St. Wolfgang im Salzkammergut
Zell am See
Saalfelden
Hallein
@AT|citta|2
Innsbruck
Hall in Tirol
Kufstein
Kitzbühel
Seefeld in Tirol
Lienz
Mayrhofen
Sölden
St. Anton am Arlberg
@AT|citta|3
Bregenz
Dornbirn
Feldkirch
Bludenz
Schruns
@AT|citta|4
Klagenfurt|Klagenfurt
Villach|Villaco
Velden am Wörther See
Spittal an der Drau
Gmünd in Kärnten
Friesach
Heiligenblut am Großglockner
@AT|citta|5
Graz
Leoben
Bad Aussee
Schladming
Mariazell
Judenburg
@AT|citta|6
Linz
Steyr
Gmunden
Wels
Enns
Freistadt
@AT|citta|7
Eisenstadt
Rust, Burgenland
Neusiedl am See
@AT|musei|0
Schönbrunn Palace|Palazzo di Schönbrunn
Hofburg|Hofburg
Belvedere, Vienna|Belvedere di Vienna
Kunsthistorisches Museum
Naturhistorisches Museum, Vienna|Museo di storia naturale di Vienna
Albertina
Leopold Museum
Kunst Haus Wien
Museum of Applied Arts, Vienna|Museo di arti applicate di Vienna
Technisches Museum Wien|Museo della tecnica di Vienna
Haus der Musik
Mozarthaus Vienna|Casa di Mozart a Vienna
Imperial Treasury, Vienna|Tesoro imperiale di Vienna
Austrian National Library|Biblioteca nazionale austriaca
St. Stephen's Cathedral, Vienna|Duomo di Santo Stefano
Vienna State Opera|Opera di Stato di Vienna
Spanish Riding School|Scuola spagnola di equitazione
Schloss Hof|Palazzo di Hof
Kreuzenstein Castle|Castello di Kreuzenstein
Laxenburg castles|Castelli di Laxenburg
Melk Abbey|Abbazia di Melk
Göttweig Abbey|Abbazia di Göttweig
Klosterneuburg Monastery|Abbazia di Klosterneuburg
Carnuntum|Parco archeologico di Carnuntum
@AT|musei|1
Hohensalzburg Fortress|Fortezza di Hohensalzburg
Mirabell Palace|Palazzo Mirabell
Hellbrunn Palace|Palazzo di Hellbrunn
Mozart's birthplace|Casa natale di Mozart
Salzburg Cathedral|Duomo di Salisburgo
Haus der Natur
Hangar-7
Hallein Salt Mine|Miniera di sale di Hallein
Hohenwerfen Castle|Castello di Hohenwerfen
@AT|musei|2
Ambras Castle|Castello di Ambras
Golden Roof|Tettuccio d'Oro
Hofburg, Innsbruck|Palazzo imperiale di Innsbruck
Hofkirche, Innsbruck
Tyrolean Folk Art Museum|Museo d'arte popolare tirolese
Swarovski Kristallwelten
Kufstein Fortress|Fortezza di Kufstein
Tratzberg Castle|Castello di Tratzberg
Schwaz Silver Mine|Miniera d'argento di Schwaz
Aguntum
@AT|musei|3
Kunsthaus Bregenz
inatura
Schattenburg
@AT|musei|4
Hochosterwitz Castle|Castello di Hochosterwitz
Porcia Castle|Castello Porcia
Gurk Cathedral|Duomo di Gurk
@AT|musei|5
Eggenberg Palace, Graz|Castello di Eggenberg
Kunsthaus Graz
Universalmuseum Joanneum
Graz Clock Tower|Torre dell'orologio di Graz
Riegersburg Castle|Castello di Riegersburg
Admont Abbey|Abbazia di Admont
Herberstein Castle|Castello di Herberstein
@AT|musei|6
Ars Electronica Center
Lentos Art Museum
St. Florian Monastery|Abbazia di San Floriano
Mauthausen concentration camp|Memoriale di Mauthausen|Luogo della memoria; valuta l'opportunità della visita per l'età dei bambini.
@AT|musei|7
Esterházy Palace|Palazzo Esterházy
Forchtenstein Castle|Castello di Forchtenstein
@AT|natura|0
Donau-Auen National Park|Parco nazionale Donau-Auen
Wachau
Vienna Woods|Bosco Viennese
Danube Island|Isola del Danubio
Lainzer Tiergarten
@AT|natura|1
Hohe Tauern National Park|Parco nazionale degli Alti Tauri
Krimml Waterfalls|Cascate di Krimml
Liechtensteinklamm
Eisriesenwelt
Lake Wolfgang|Lago Wolfgang
Lake Hallstatt|Lago di Hallstatt
Lake Zell|Lago di Zell
Gastein waterfall|Cascata di Bad Gastein
@AT|natura|2
Achensee
Hintertux Glacier|Ghiacciaio di Hintertux
Stubai Glacier|Ghiacciaio dello Stubai
Piburger See
Stuibenfall
Zammer Lochputz
Alpine Garden Patscherkofel
@AT|natura|3
Pfänder
Lünersee
Rappenlochschlucht
Silvretta Hochalpenstraße|Strada alpina della Silvretta
@AT|natura|4
Wörthersee
Millstätter See
Ossiacher See
Lake Faak|Lago Faaker
Weissensee (Carinthia)|Lago Weissensee
Nockberge Biosphere Park
@AT|natura|5
Gesäuse National Park|Parco nazionale Gesäuse
Green Lake (Styria)|Lago Verde
@AT|natura|6
Kalkalpen National Park|Parco nazionale Kalkalpen
Traunsee
Attersee
Gosauseen
Dachstein Ice Cave|Grotta di ghiaccio del Dachstein
@AT|natura|7
Neusiedler See-Seewinkel National Park
@AT|parchi|0
Prater
Wiener Riesenrad|Ruota panoramica di Vienna
Familypark Neusiedlersee
@AT|parchi|4
Minimundus
@AT|fauna|0
Schönbrunn Zoo|Zoo di Schönbrunn
Haus des Meeres
@AT|fauna|1
Salzburg Zoo|Zoo di Salisburgo
@AT|fauna|2
Alpenzoo
@AT|fauna|5
Herberstein Zoo
@AT|aeroporti|0
Vienna International Airport
@AT|aeroporti|1
Salzburg Airport
@AT|aeroporti|2
Innsbruck Airport
@AT|aeroporti|4
Klagenfurt Airport
@AT|aeroporti|5
Graz Airport
@AT|aeroporti|6
Linz Airport
@AT|treni|0
Wien Hauptbahnhof|Stazione centrale di Vienna
Wien Westbahnhof
Wien Meidling railway station
Vienna Airport railway station
St. Pölten Hauptbahnhof
Krems an der Donau railway station
Wiener Neustadt Hauptbahnhof
@AT|treni|1
Salzburg Hauptbahnhof
Zell am See railway station
Bad Ischl railway station
@AT|treni|2
Innsbruck Hauptbahnhof
Kufstein railway station
Wörgl Hauptbahnhof
Jenbach railway station
St. Anton am Arlberg railway station
Landeck-Zams railway station
Lienz railway station
@AT|treni|3
Bregenz railway station
Feldkirch railway station
Bludenz railway station
@AT|treni|4
Klagenfurt Hauptbahnhof
Villach Hauptbahnhof
@AT|treni|5
Graz Hauptbahnhof
Leoben Hauptbahnhof
Bruck an der Mur railway station
@AT|treni|6
Linz Hauptbahnhof
Wels Hauptbahnhof
Attnang-Puchheim railway station
@ES|citta|0
Madrid
Toledo, Spain|Toledo
Alcalá de Henares
Aranjuez
Cuenca, Spain|Cuenca
Guadalajara, Spain|Guadalajara
@ES|citta|1
Barcelona|Barcellona
Girona|Girona
Figueres
Tarragona
Reus
Sitges
Cadaqués
Besalú
Tossa de Mar
@ES|citta|2
Seville|Siviglia
Granada
Córdoba, Spain|Cordova
Málaga|Malaga
Cádiz|Cadice
Ronda
Jerez de la Frontera
Úbeda
Baeza
Almería
@ES|citta|3
Valencia|Valencia
Alicante
Murcia
Cartagena, Spain|Cartagena
Elche
Peñíscola
@ES|citta|4
Bilbao
San Sebastián
Vitoria-Gasteiz
Pamplona
Logroño
Hondarribia
@ES|citta|5
Santiago de Compostela
A Coruña
Vigo
Pontevedra
Oviedo
Gijón
Santander, Spain|Santander
Santillana del Mar
@ES|citta|6
Salamanca
Segovia
Ávila
Burgos
León, Spain|León
Valladolid
Zamora
Cáceres, Spain|Cáceres
Mérida, Spain|Mérida
Trujillo, Spain|Trujillo
@ES|citta|7
Zaragoza|Saragozza
Huesca
Teruel
Jaca
Albarracín
@ES|citta|8
Palma de Mallorca
Ciutadella de Menorca
Mahón|Maó
Ibiza (city)|Ibiza
Sóller
@ES|citta|9
Santa Cruz de Tenerife
San Cristóbal de La Laguna
Las Palmas
Puerto de la Cruz
@ES|musei|0
Museo del Prado|Museo del Prado
Museo Nacional Centro de Arte Reina Sofía
Thyssen-Bornemisza Museum|Museo Thyssen-Bornemisza
Royal Palace of Madrid|Palazzo reale di Madrid
National Archaeological Museum (Madrid)|Museo archeologico nazionale di Madrid
Museo Nacional de Ciencias Naturales
CaixaForum Madrid
Royal Palace of Aranjuez|Palazzo reale di Aranjuez
El Escorial
Alcázar of Toledo|Alcázar di Toledo
Toledo Cathedral|Cattedrale di Toledo
@ES|musei|1
Sagrada Família
Park Güell|Parco Güell
Casa Batlló
Casa Milà
Picasso Museum|Museo Picasso di Barcellona
Museu Nacional d'Art de Catalunya
CosmoCaixa Barcelona
Dalí Theatre and Museum|Teatro-museo Dalí
Palau de la Música Catalana
Hospital de Sant Pau
Montserrat Monastery|Monastero di Montserrat
@ES|musei|2
Alhambra
Generalife
Mosque–Cathedral of Córdoba|Moschea-cattedrale di Cordova
Alcázar of Seville|Alcázar di Siviglia
Seville Cathedral|Cattedrale di Siviglia
Plaza de España, Seville|Piazza di Spagna a Siviglia
Museo Picasso Málaga
Alcazaba of Málaga
Baelo Claudia
@ES|musei|3
City of Arts and Sciences|Città delle arti e delle scienze
Museu de les Ciències Príncipe Felipe
La Lonja de la Seda
Roman Theatre of Cartagena|Teatro romano di Cartagena
@ES|musei|4
Guggenheim Museum Bilbao|Museo Guggenheim di Bilbao
Bilbao Fine Arts Museum
Chillida Leku
@ES|musei|5
Santiago de Compostela Cathedral|Cattedrale di Santiago
Centro Botín
Museum of Altamira|Museo di Altamira
@ES|musei|6
Aqueduct of Segovia|Acquedotto di Segovia
Alcázar of Segovia
Burgos Cathedral|Cattedrale di Burgos
León Cathedral|Cattedrale di León
Roman Theatre of Mérida|Teatro romano di Mérida
@ES|musei|7
Aljafería
Loarre Castle|Castello di Loarre
Dinópolis
@ES|musei|8
Palma Cathedral|Cattedrale di Palma
Bellver Castle|Castello di Bellver
@ES|musei|9
Cueva de los Verdes
Jameos del Agua
@ES|natura|0
Sierra de Guadarrama National Park
@ES|natura|1
Aigüestortes i Estany de Sant Maurici National Park
Cap de Creus
@ES|natura|2
Doñana National Park
Sierra Nevada National Park
Caminito del Rey
El Torcal de Antequera
Cabo de Gata-Níjar Natural Park
@ES|natura|3
Albufera
@ES|natura|4
San Juan de Gaztelugatxe
@ES|natura|5
Picos de Europa National Park
Covadonga Lakes
Cíes Islands|Isole Cíes
@ES|natura|6
Monfragüe National Park
@ES|natura|7
Ordesa y Monte Perdido National Park
@ES|natura|8
Serra de Tramuntana
Mondragó Natural Park
@ES|natura|9
Teide National Park
Timanfaya National Park
Garajonay National Park
Caldera de Taburiente National Park
Roque Nublo
Maspalomas Dunes|Dune di Maspalomas
@ES|isole|8
Mallorca|Maiorca
Menorca|Minorca
Ibiza
Formentera
@ES|isole|9
Tenerife
Gran Canaria
Lanzarote
Fuerteventura
La Gomera
La Palma
El Hierro
@ES|parchi|0
Parque Warner Madrid
Parque de Atracciones de Madrid
@ES|parchi|1
PortAventura Park
Tibidabo Amusement Park
@ES|parchi|2
Isla Mágica
@ES|parchi|9
Siam Park (Tenerife)|Siam Park
@ES|fauna|0
Zoo Aquarium de Madrid
@ES|fauna|1
Barcelona Zoo
Aquarium Barcelona
@ES|fauna|3
L'Oceanogràfic
Bioparc Valencia
@ES|fauna|9
Loro Parque
@ES|aeroporti|0
Adolfo Suárez Madrid–Barajas Airport
@ES|aeroporti|1
Josep Tarradellas Barcelona–El Prat Airport
Girona–Costa Brava Airport
Reus Airport
@ES|aeroporti|2
Málaga Airport
Seville Airport
Jerez Airport
Federico García Lorca Granada–Jaén Airport
Almería Airport
@ES|aeroporti|3
Valencia Airport
Alicante–Elche Miguel Hernández Airport
Región de Murcia International Airport
@ES|aeroporti|4
Bilbao Airport
San Sebastián Airport
@ES|aeroporti|5
Santiago–Rosalía de Castro Airport
A Coruña Airport
Asturias Airport
Santander Airport
@ES|aeroporti|7
Zaragoza Airport
@ES|aeroporti|8
Palma de Mallorca Airport
Menorca Airport
Ibiza Airport
@ES|aeroporti|9
Tenerife South Airport
Tenerife North–Ciudad de La Laguna Airport
Gran Canaria Airport
Lanzarote Airport
Fuerteventura Airport
La Palma Airport
@ES|treni|0
Madrid Atocha railway station
Madrid Chamartín railway station
Toledo railway station
Alcalá de Henares railway station
@ES|treni|1
Barcelona Sants railway station
Estació de França
Girona railway station
Figueres–Vilafant railway station
Camp de Tarragona railway station
@ES|treni|2
Sevilla-Santa Justa railway station
Málaga María Zambrano railway station
Córdoba railway station
Granada railway station
Jerez de la Frontera railway station
@ES|treni|3
Valencia-Joaquín Sorolla railway station
València Nord railway station
Alicante railway station
Murcia del Carmen railway station
@ES|treni|4
Bilbao-Abando railway station
San Sebastián railway station
Pamplona railway station
@ES|treni|5
Santiago de Compostela railway station
A Coruña railway station
Oviedo railway station
@ES|treni|6
Salamanca railway station
Valladolid-Campo Grande railway station
León railway station
@ES|treni|7
Zaragoza-Delicias railway station
@ES|porti|1
Port of Barcelona|Porto di Barcellona
Port of Tarragona
@ES|porti|2
Port of Algeciras
Port of Málaga
Port of Cádiz
Port of Almería
@ES|porti|3
Port of Valencia
Port of Alicante
Port of Cartagena
Port of Dénia
@ES|porti|4
Port of Bilbao
@ES|porti|5
Port of Santander
Port of Vigo
Port of A Coruña
@ES|porti|8
Port of Palma
Port of Mahón
Port of Ibiza
@ES|porti|9
Port of Santa Cruz de Tenerife
Port of Las Palmas
@PT|citta|0
Lisbon|Lisbona
Sintra
Cascais
Estoril
Setúbal
Sesimbra
Ericeira
Mafra
Almada
@PT|citta|1
Porto|Porto
Vila Nova de Gaia
Braga
Guimarães
Viana do Castelo
Ponte de Lima
Barcelos
Amarante
Peso da Régua
Lamego
Vila Real
Chaves, Portugal|Chaves
Bragança, Portugal|Bragança
@PT|citta|2
Coimbra
Aveiro
Viseu
Guarda, Portugal|Guarda
Covilhã
Castelo Branco, Portugal|Castelo Branco
Tomar
Batalha
Alcobaça
Óbidos
Nazaré
Peniche
Fátima, Portugal|Fátima
Leiria
Figueira da Foz
@PT|citta|3
Évora
Elvas
Estremoz
Monsaraz
Marvão
Castelo de Vide
Beja
Mértola
Vila Nova de Milfontes
@PT|citta|4
Faro, Portugal|Faro
Lagos, Portugal|Lagos
Tavira
Silves, Portugal|Silves
Loulé
Albufeira
Portimão
Sagres (Vila do Bispo)|Sagres
Olhão
@PT|citta|5
Funchal
Santana, Madeira|Santana
Machico
Porto Moniz
São Vicente, Madeira|São Vicente
@PT|citta|6
Ponta Delgada
Angra do Heroísmo
Horta, Azores|Horta
Ribeira Grande
Vila Franca do Campo
@PT|musei|0
Jerónimos Monastery|Monastero dos Jerónimos
Belém Tower|Torre di Belém
São Jorge Castle|Castello di São Jorge
National Tile Museum|Museo nazionale delle azulejos
National Coach Museum|Museo nazionale delle carrozze
National Museum of Ancient Art|Museo nazionale di arte antica
MAAT|Museo MAAT
Calouste Gulbenkian Museum|Museo Calouste Gulbenkian
Maritime Museum (Portugal)|Museo della marina
Lisbon Cathedral|Cattedrale di Lisbona
Pena Palace|Palazzo da Pena
Quinta da Regaleira
Sintra National Palace|Palazzo nazionale di Sintra
Castle of the Moors|Castello dei Mori
Monserrate Palace|Palazzo di Monserrate
Palace of Mafra|Palazzo di Mafra
@PT|musei|1
Serralves
Casa da Música
São Bento railway station|Stazione di São Bento|Stazione storica e punto di trasporto: orari e servizi da verificare.
Clérigos Church|Chiesa dos Clérigos
Livraria Lello
Palácio da Bolsa
Bom Jesus do Monte
Guimarães Castle|Castello di Guimarães
Palace of the Dukes of Braganza
@PT|musei|2
Monastery of Batalha|Monastero di Batalha
Alcobaça Monastery|Monastero di Alcobaça
Convent of Christ (Tomar)|Convento di Cristo
University of Coimbra|Università di Coimbra
Conímbriga
Aveiro Museum
@PT|musei|3
Roman Temple of Évora|Tempio romano di Évora
Chapel of Bones|Cappella delle Ossa
Castelo de Marvão
Castle of Monsaraz
@PT|musei|4
Silves Castle|Castello di Silves
Fortress of Sagres|Fortezza di Sagres
@PT|musei|5
CR7 Museum
Madeira Story Centre
@PT|musei|6
Angra do Heroísmo Museum
Capelinhos
@PT|natura|0
Arrábida Natural Park
Cabo da Roca
Serra de Sintra
@PT|natura|1
Peneda-Gerês National Park
Douro International Natural Park
Alvão Natural Park
@PT|natura|2
Serra da Estrela Natural Park
Berlengas
Paiva Walkways
@PT|natura|3
Southwest Alentejo and Vicentine Coast Natural Park
Alqueva Dam|Lago di Alqueva
@PT|natura|4
Ria Formosa
Ponta da Piedade
Benagil
Cape St. Vincent|Capo di São Vicente
@PT|natura|5
Pico do Arieiro
Pico Ruivo
Cabo Girão
Laurisilva of Madeira
Porto Moniz Natural Swimming Pools
@PT|natura|6
Lagoa das Sete Cidades
Lagoa do Fogo
Furnas
Caldeira Velha
Mount Pico|Monte Pico
Algar do Carvão
@PT|isole|5
Porto Santo Island
@PT|isole|6
São Miguel Island
Terceira Island
Faial Island
Pico Island
Flores Island (Azores)
São Jorge Island
@PT|parchi|0
KidZania Lisbon
@PT|parchi|4
Zoomarine Algarve
Slide & Splash
Aquashow Park
@PT|fauna|0
Lisbon Oceanarium|Oceanario di Lisbona
Lisbon Zoo|Zoo di Lisbona
@PT|fauna|1
SEA LIFE Porto
@PT|aeroporti|0
Humberto Delgado Airport
@PT|aeroporti|1
Francisco Sá Carneiro Airport
@PT|aeroporti|4
Faro Airport
@PT|aeroporti|5
Madeira Airport
Porto Santo Airport
@PT|aeroporti|6
João Paulo II Airport
Lajes Airport
Horta Airport
Pico Airport
Flores Airport
@PT|treni|0
Lisboa Oriente Station
Santa Apolónia railway station
Rossio railway station
Cais do Sodré railway station
Entrecampos railway station
Sintra railway station
Cascais railway station
Setúbal railway station
@PT|treni|1
Campanhã railway station
São Bento railway station
Braga railway station
Guimarães railway station
Peso da Régua railway station
Pocinho railway station
@PT|treni|2
Coimbra-B railway station
Aveiro railway station
Tomar railway station
Guarda railway station
@PT|treni|3
Évora railway station
Beja railway station
@PT|treni|4
Faro railway station
Lagos railway station
Tunes railway station
Albufeira-Ferreiras railway station
@PT|porti|0
Port of Lisbon|Porto di Lisbona
Port of Setúbal
@PT|porti|1
Port of Leixões
@PT|porti|3
Port of Sines
@PT|porti|4
Port of Portimão
@PT|porti|5
Port of Funchal
Port of Caniçal
@PT|porti|6
Port of Ponta Delgada
Port of Horta
@HR|citta|0
Zagreb|Zagabria
Varaždin
Samobor
Krapina
Čakovec
Karlovac
Ogulin
Rastoke
Sisak
@HR|citta|1
Pula|Pola
Rovinj|Rovigno
Poreč|Parenzo
Motovun|Montona
Grožnjan|Grisignana
Buje|Buie
Umag|Umago
Novigrad, Istria|Cittanova
Pazin|Pisino
Labin|Albona
@HR|citta|2
Rijeka|Fiume
Opatija|Abbazia
Crikvenica
Novi Vinodolski
Senj|Segna
Krk (town)|Veglia
Cres (town)|Cherso
Mali Lošinj|Lussinpiccolo
Rab (town)|Arbe
@HR|citta|3
Zadar|Zara
Šibenik|Sebenico
Nin, Croatia|Nona
Biograd na Moru
Vodice, Croatia|Vodice
Skradin
Primošten
Gospić
@HR|citta|4
Split, Croatia|Spalato
Trogir|Traù
Omiš|Almissa
Makarska
Hvar (city)|Lesina
Stari Grad, Croatia|Cittavecchia
Supetar
Bol, Croatia|Bol
Vis (town)|Vis
Sinj
@HR|citta|5
Dubrovnik|Ragusa
Cavtat|Ragusavecchia
Ston
Orebić
Korčula (town)|Curzola
Vela Luka
Ploče
@HR|citta|6
Osijek
Vukovar
Đakovo
Ilok
Slavonski Brod
Požega, Croatia|Požega
@HR|musei|0
Museum of Broken Relationships|Museo delle relazioni interrotte
Archaeological Museum in Zagreb
Croatian Museum of Naïve Art
Mimara Museum
Technical Museum Nikola Tesla
Croatian Natural History Museum
Zagreb Cathedral|Cattedrale di Zagabria
St. Mark's Church, Zagreb|Chiesa di San Marco
Trakošćan Castle
Veliki Tabor Castle
Krapina Neanderthal Museum
Karlovac City Museum
@HR|musei|1
Pula Arena|Arena di Pola
Temple of Augustus, Pula|Tempio di Augusto a Pola
Euphrasian Basilica|Basilica Eufrasiana
Pazin Castle|Castello di Pisino
@HR|musei|2
Trsat Castle|Castello di Tersatto
Nehaj Fortress|Fortezza Nehaj
Apoxyomenos Museum
@HR|musei|3
St. Donatus Church|Chiesa di San Donato
Sea organ|Organo marino di Zara
Šibenik Cathedral|Cattedrale di Sebenico
St. Nicholas Fortress
@HR|musei|4
Diocletian's Palace|Palazzo di Diocleziano
Cathedral of Saint Domnius|Cattedrale di San Doimo
Cathedral of St. Lawrence, Trogir|Cattedrale di San Lorenzo a Traù
Klis Fortress
Salona
Ivan Meštrović Gallery
@HR|musei|5
Walls of Dubrovnik|Mura di Dubrovnik
Rector's Palace, Dubrovnik
Lovrijenac
Franciscan Church and Monastery (Dubrovnik)
Fortress of Ston
Marco Polo House|Casa di Marco Polo|Attribuzione storica e visita da verificare.
@HR|musei|6
Vučedol Culture Museum
Vukovar water tower
Đakovo Cathedral
@HR|natura|0
Plitvice Lakes National Park|Parco nazionale dei laghi di Plitvice
Medvednica
Mrežnica
@HR|natura|1
Brijuni National Park|Parco nazionale di Brioni
Cape Kamenjak
Lim (Croatia)|Canale di Leme
@HR|natura|2
Risnjak National Park
Northern Velebit National Park
Učka Nature Park
Velebit Nature Park
@HR|natura|3
Krka National Park
Paklenica National Park
Kornati National Park
Telašćica
Vransko Lake Nature Park
Zrmanja
@HR|natura|4
Biokovo Nature Park
Cetina
Zlatni Rat
Modra špilja|Grotta Azzurra di Biševo
@HR|natura|5
Mljet National Park
Trsteno Arboretum
@HR|natura|6
Kopački Rit
Papuk Nature Park
@HR|isole|1
Brijuni
@HR|isole|2
Krk|Veglia
Cres|Cherso
Lošinj|Lussino
Rab|Arbe
Pag (island)|Pago
@HR|isole|3
Dugi Otok
Ugljan
Pašman
Murter
@HR|isole|4
Brač|Brazza
Hvar|Lesina
Vis (island)|Lissa
Šolta
Biševo
@HR|isole|5
Korčula|Curzola
Mljet|Meleda
Lastovo|Lagosta
Lokrum
Lopud
Šipan
Koločep
@HR|parchi|1
Istralandia
Aquacolors
Dinopark Funtana
@HR|fauna|0
Zagreb Zoo|Zoo di Zagabria
@HR|fauna|1
Aquarium Pula
@HR|aeroporti|0
Zagreb Airport
@HR|aeroporti|1
Pula Airport
@HR|aeroporti|2
Rijeka Airport
Lošinj Airport
@HR|aeroporti|3
Zadar Airport
@HR|aeroporti|4
Split Airport
Brač Airport
@HR|aeroporti|5
Dubrovnik Airport
@HR|aeroporti|6
Osijek Airport
@HR|treni|0
Zagreb Glavni kolodvor|Stazione centrale di Zagabria
Karlovac railway station
Varaždin railway station
Koprivnica railway station
@HR|treni|1
Pula railway station
@HR|treni|2
Rijeka railway station
@HR|treni|3
Zadar railway station
Šibenik railway station
Knin railway station
@HR|treni|4
Split railway station
Perković railway station
@HR|treni|6
Osijek railway station
Vinkovci railway station
Slavonski Brod railway station
@HR|porti|1
Port of Pula
Port of Rovinj
@HR|porti|2
Port of Rijeka
Port of Mali Lošinj
@HR|porti|3
Port of Zadar
Port of Šibenik
Gaženica|Porto di Gaženica
@HR|porti|4
Port of Split
@HR|porti|5
Port of Dubrovnik
Port of Ploče
Gruž|Area portuale di Gruž
@GR|citta|0
Athens|Atene
Piraeus|Pireo
Lavrio
Aegina (town)|Egina
@GR|citta|1
Nafplio|Nauplia
Patras|Patrasso
Kalamata
Monemvasia
Sparta, Laconia|Sparta
Corinth|Corinto
Gytheio
Pylos
@GR|citta|2
Delphi (modern town)|Delfi
Kalabaka
Trikala
Volos
Larissa
Galaxidi
Nafpaktos
Karpenisi
Lamia (city)|Lamia
@GR|citta|3
Thessaloniki|Salonicco
Ioannina
Kastoria
Edessa, Greece|Edessa
Kavala
Xanthi
Alexandroupoli
Veria
Litochoro
@GR|citta|4
Corfu (city)|Corfù
Argostoli
Zakynthos (city)|Zante
Lefkada (city)|Leucade
@GR|citta|5
Ermoupoli
Fira
Oia, Greece|Oia
Naxos (city)|Nasso
Mykonos (town)|Mykonos
Parikia
Skiathos (town)|Skiathos
@GR|citta|6
Heraklion|Heraklion
Chania|La Canea
Rethymno
Agios Nikolaos, Crete
Sitia
@GR|citta|7
Rhodes (city)|Rodi
Kos (city)|Kos
Chios (town)|Chio
Mytilene|Mitilene
Pythagoreio
@GR|musei|0
Acropolis of Athens|Acropoli di Atene
Acropolis Museum|Museo dell'Acropoli
National Archaeological Museum, Athens
Ancient Agora of Athens|Agorà antica di Atene
Temple of Olympian Zeus, Athens
Temple of Poseidon at Sounion
Benaki Museum
Museum of Cycladic Art
Panathenaic Stadium
National Historical Museum, Athens
Archaeological Museum of Piraeus
@GR|musei|1
Ancient Theatre of Epidaurus|Teatro antico di Epidauro
Mycenae|Micene
Ancient Olympia|Olimpia antica
Mystras|Mistra
Ancient Corinth|Corinto antica
Acrocorinth
Palamidi
Messene|Messene antica
@GR|musei|2
Delphi|Sito archeologico di Delfi
Delphi Archaeological Museum
Meteora|Monasteri di Meteora
Hosios Loukas
Archaeological Museum of Thebes
@GR|musei|3
Archaeological Museum of Thessaloniki
Museum of Byzantine Culture
White Tower of Thessaloniki
Rotunda (Thessaloniki)
Archaeological Site of Aigai
Archaeological Museum of Pella
Archaeological Museum of Ioannina
Philippi
Dion, Pieria|Sito archeologico di Dion
@GR|musei|4
Achilleion (Corfu)
Old Fortress, Corfu
Museum of Asian Art of Corfu
@GR|musei|5
Akrotiri (prehistoric city)|Sito archeologico di Akrotiri
Delos|Delo
Archaeological Museum of Thera
@GR|musei|6
Knossos|Cnosso
Heraklion Archaeological Museum
Phaistos|Festo
Arkadi Monastery
Chania Archaeological Museum
@GR|musei|7
Palace of the Grand Master of the Knights of Rhodes
Acropolis of Lindos
Asklepion (Kos)
Monastery of Saint John the Theologian
Nea Moni of Chios
@GR|natura|0
National Garden, Athens
Mount Lycabettus
@GR|natura|1
Diros Caves|Grotte di Diros
Voidokilia beach
@GR|natura|2
Pelion
Mount Parnassus
Lake Plastiras
@GR|natura|3
Vikos Gorge|Gola di Vikos
Mount Olympus|Monte Olimpo
Vikos–Aoös National Park
Lake Prespa
Lake Kerkini
@GR|natura|4
Melissani Cave
Myrtos Beach
Navagio|Baia del Navagio|Accessi a spiaggia e belvedere da verificare; non presumere che siano aperti.
@GR|natura|5
Sarakiniko
Kolymbithres
@GR|natura|6
Samariá Gorge
Balos
Elafonisi
Vai (Crete)
Lake Kournas
@GR|natura|7
Valley of the Butterflies
Petrified forest of Lesbos
@GR|isole|0
Aegina
Hydra (island)|Idra
Poros
Spetses
@GR|isole|4
Corfu
Kefalonia
Zakynthos
Lefkada
Ithaca
Paxi
@GR|isole|5
Santorini
Naxos
Paros
Milos
Sifnos
Serifos
Syros
Tinos
Andros
Skiathos
Skopelos
Alonnisos
Folegandros
@GR|isole|6
Crete|Creta
Spinalonga
Gavdos
@GR|isole|7
Rhodes
Kos
Patmos
Symi
Karpathos
Chios
Samos
Lesbos
Lemnos
Ikaria
@GR|fauna|0
Attica Zoological Park
@GR|fauna|6
Cretaquarium
@GR|parchi|6
Acqua Plus
@GR|aeroporti|0
Athens International Airport
@GR|aeroporti|1
Kalamata International Airport
@GR|aeroporti|2
Nea Anchialos National Airport
@GR|aeroporti|3
Thessaloniki Airport
Kavala International Airport
Alexandroupoli Airport
Ioannina National Airport
@GR|aeroporti|4
Corfu International Airport
Zakynthos International Airport
Kefalonia Airport
Aktion National Airport
@GR|aeroporti|5
Santorini (Thira) International Airport
Mykonos Airport
Naxos Island National Airport
Paros National Airport
Skiathos International Airport
@GR|aeroporti|6
Heraklion International Airport
Chania International Airport
Sitia Public Airport
@GR|aeroporti|7
Rhodes International Airport
Kos International Airport
Samos International Airport
Mytilene International Airport
Chios Island National Airport
Karpathos Island National Airport
@GR|treni|0
Athens railway station
Piraeus railway station
Athens Airport station
Koropi station
@GR|treni|1
Corinth railway station
Kiato railway station
Diakopto railway station
Kalavryta railway station
@GR|treni|2
Larissa railway station
Volos railway station
Trikala railway station
Kalambaka railway station
@GR|treni|3
New Railway Station, Thessaloniki
Litochoro railway station
Edessa railway station
Alexandroupoli railway station
@GR|porti|0
Port of Piraeus
Port of Rafina
Port of Lavrio
@GR|porti|1
Port of Patras
@GR|porti|2
Port of Volos
@GR|porti|3
Port of Thessaloniki
Port of Igoumenitsa
Port of Kavala
Port of Alexandroupoli
@GR|porti|4
Port of Corfu
@GR|porti|5
Athinios|Porto di Athinios
Port of Mykonos
Port of Naxos
@GR|porti|6
Port of Heraklion
Port of Chania
Souda|Area portuale di Souda
@GR|porti|7
Port of Rhodes
Port of Kos
@TR|citta|0
Istanbul
Edirne
Bursa
Çanakkale
Tekirdağ
İznik
Yalova
Balıkesir
@TR|citta|1
İzmir|Smirne
Selçuk
Kuşadası
Çeşme
Alaçatı
Ayvalık
Bergama
Foça
Bodrum
Marmaris
Datça
Denizli
@TR|citta|2
Antalya
Alanya
Side, Turkey|Side
Kaş
Kalkan
Fethiye
Dalyan
Demre
Mersin
Adana
Hatay|Hatay|Provincia con accessi e servizi da verificare; non confondere con una città.
@TR|citta|3
Ankara
Eskişehir
Konya
Nevşehir
Göreme
Ürgüp
Avanos
Uçhisar
Kayseri
Niğde
Sivas
Kırşehir
Aksaray
@TR|citta|4
Safranbolu
Amasra
Sinop, Turkey|Sinop
Samsun
Ordu
Giresun
Trabzon
Rize
Amasya
Tokat
@TR|citta|5
Gaziantep
Şanlıurfa
Mardin
Diyarbakır
Erzurum
Kars
Van, Turkey|Van
Doğubayazıt
Adıyaman
Malatya
@TR|musei|0
Hagia Sophia|Santa Sofia
Topkapı Palace|Palazzo Topkapı
Sultan Ahmed Mosque|Moschea Blu
Basilica Cistern|Cisterna Basilica
Dolmabahçe Palace|Palazzo Dolmabahçe
Istanbul Archaeology Museums
Galata Tower|Torre di Galata
Istanbul Modern
Pera Museum
Rahmi M. Koç Museum
Süleymaniye Mosque
Chora Church|Chiesa di Chora
Grand Bazaar, Istanbul|Gran Bazar di Istanbul
Selimiye Mosque, Edirne
Green Mosque, Bursa
Göbekli Tepe|Göbekli Tepe|Candidato da assegnare all'Anatolia sud-orientale.
@TR|musei|1
Ephesus|Efeso
Ephesus Archaeological Museum
Pergamon|Pergamo
Library of Celsus|Biblioteca di Celso
House of the Virgin Mary
Temple of Artemis
Bodrum Castle|Castello di Bodrum
Mausoleum at Halicarnassus|Mausoleo di Alicarnasso
Aphrodisias
Hierapolis
Laodicea on the Lycus
@TR|musei|2
Antalya Museum
Aspendos
Perga|Perge
Termessos
Patara (Lycia)|Patara
Xanthos
Letoon
Myra
Phaselis
Anemurium
Alanya Castle|Castello di Alanya
@TR|musei|3
Museum of Anatolian Civilizations|Museo delle civiltà anatoliche
Anıtkabir
Mevlana Museum
Çatalhöyük
Hattusa|Hattuşa
Yazılıkaya
Derinkuyu underground city
Kaymakli underground city
Göreme Open Air Museum
Selimiye Mosque, Konya
@TR|musei|4
Sumela Monastery
Hagia Sophia, Trabzon
Sinop Fortress
@TR|musei|5
Göbekli Tepe
Zeugma Mosaic Museum
Şanlıurfa Archaeology Museum
Mount Nemrut
Ani|Sito archeologico di Ani
Ishak Pasha Palace
Akdamar Church
Deyrulzafaran Monastery
Hasankeyf|Hasankeyf|Paesaggio e siti trasferiti dopo la diga: accessi e visite da verificare.
@TR|natura|0
Belgrad Forest
Uludağ National Park
Lake İznik
@TR|natura|1
Pamukkale
Lake Bafa Nature Park
Dilek Peninsula-Büyük Menderes Delta National Park
Saklıkent National Park
@TR|natura|2
Düden Waterfalls
Köprülü Canyon
Kurşunlu Waterfall Nature Park
Olympos (Lycia)
Yanartaş
Ölüdeniz
Butterfly Valley, Fethiye
Kaputaş Beach
İztuzu Beach
@TR|natura|3
Ihlara Valley
Göreme National Park
Lake Tuz|Lago Tuz
@TR|natura|4
Uzungöl
Kaçkar Mountains National Park
Yedigöller National Park
Ilgaz Mountain National Park
@TR|natura|5
Lake Van|Lago di Van
Lake Çıldır
Munzur Valley National Park
@TR|isole|0
Büyükada
Heybeliada
Bozcaada
Gökçeada
@TR|parchi|0
Vialand
Miniatürk
@TR|parchi|2
The Land of Legends
@TR|fauna|0
Istanbul Aquarium
@TR|fauna|1
İzmir Wildlife Park
@TR|fauna|2
Antalya Aquarium
@TR|aeroporti|0
Istanbul Airport
Sabiha Gökçen International Airport
Yenişehir Airport
Çanakkale Airport
@TR|aeroporti|1
Adnan Menderes Airport
Milas–Bodrum Airport
Dalaman Airport
@TR|aeroporti|2
Antalya Airport
Gazipaşa–Alanya Airport
Çukurova International Airport
@TR|aeroporti|3
Esenboğa Airport
Kayseri Erkilet Airport
Nevşehir Kapadokya Airport
Konya Airport
Sivas Nuri Demirağ Airport
@TR|aeroporti|4
Trabzon Airport
Samsun-Çarşamba Airport
Ordu–Giresun Airport
Rize–Artvin Airport
@TR|aeroporti|5
Gaziantep Airport
Şanlıurfa GAP Airport
Diyarbakır Airport
Erzurum Airport
Van Ferit Melen Airport
Kars Harakani Airport
@TR|treni|0
Sirkeci railway station
Söğütlüçeşme railway station
Pendik railway station
Halkalı railway station
Edirne railway station
@TR|treni|1
Basmane railway station
Alsancak railway station
Denizli railway station
@TR|treni|2
Adana railway station
Mersin railway station
@TR|treni|3
Ankara railway station
Ankara high-speed railway station
Eskişehir railway station
Konya railway station
Kayseri railway station
Sivas railway station
Karaman railway station
@TR|treni|4
Samsun railway station
@TR|treni|5
Gaziantep railway station
Diyarbakır railway station
Erzurum railway station
Kars railway station
Tatvan railway station
@TR|porti|0
Port of Haydarpaşa
Port of Ambarlı
Yenikapı Ferry Terminal
Kabataş Ferry Terminal
Kadıköy Ferry Terminal
Eminönü Ferry Terminal
@TR|porti|1
Port of İzmir
Port of Kuşadası
Port of Bodrum
@TR|porti|2
Port of Antalya
Port of Mersin
Port of Taşucu
@TR|porti|4
Port of Trabzon
Port of Samsun
`;

const excluded = new Set(['Lake Jezero', 'Hatay']);
const titles = {
  Vipava: 'Vipava, Vipava', Ribnica: 'Ribnica, Ribnica',
  Feldkirch: 'Feldkirch, Vorarlberg', Enns: 'Enns (town)', 'Esterházy Palace': 'Schloss Esterházy', Attersee: 'Attersee (lake)',
  'Donau-Auen National Park': 'Danube-Auen National Park', 'Green Lake (Styria)': 'Grüner See (Styria)',
  Zamora: 'Zamora, Spain', 'Picasso Museum': 'Museu Picasso', 'Montserrat Monastery': 'Santa Maria de Montserrat Abbey',
  'Sierra Nevada National Park': 'Sierra Nevada National Park (Spain)',
  Mafra: 'Mafra, Portugal', Barcelos: 'Barcelos, Portugal', Amarante: 'Amarante, Portugal', Aveiro: 'Aveiro, Portugal',
  Batalha: 'Batalha, Portugal', 'Alcobaça': 'Alcobaça, Portugal', 'Óbidos': 'Óbidos, Portugal', 'Nazaré': 'Nazaré, Portugal',
  Peniche: 'Peniche, Portugal', Beja: 'Beja, Portugal', 'Ribeira Grande': 'Ribeira Grande, Azores',
  'Maritime Museum (Portugal)': 'Navy Museum (Portugal)', 'Lisboa Oriente Station': 'Gare do Oriente', 'Coimbra-B railway station': 'Coimbra-B station',
  Rab: 'Rab (island)', 'Modra špilja': 'Blue Grotto (Biševo)',
  'Sparta, Laconia': 'Sparta (modern)', Corinth: 'Corinth (city)', Ithaca: 'Ithaca (island)', Andros: 'Andros, Greece',
};
const slug = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const CANDIDATES = Object.fromEntries(Object.keys(COUNTRIES).map((c) => [c, []]));
let group;
for (const raw of selection.split('\n')) {
  const line = raw.trim(); if (!line) continue;
  if (line.startsWith('@')) { const [code, category, index] = line.slice(1).split('|'); group = { code, category, regionIndex: Number(index) }; continue; }
  const [title, name, description] = line.split('|'); if (excluded.has(title)) continue;
  CANDIDATES[group.code].push({ ...group, key: `${group.code.toLowerCase()}-${slug(title)}`, title: titles[title] ?? title, name: name || undefined, description: description || undefined });
}
for (const code of Object.keys(CANDIDATES)) CANDIDATES[code] = [...new Map(CANDIDATES[code].map((c) => [c.key, c])).values()];
