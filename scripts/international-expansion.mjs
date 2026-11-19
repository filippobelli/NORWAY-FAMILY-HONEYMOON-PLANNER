// Selezione editoriale per la seconda release. Titoli usati solo per risolvere le entità,
// non per importare testi Wikipedia. Coordinate, IATA e media vengono verificati dall'harvester.
import { COUNTRIES } from './cataloghi-internazionali.mjs';

export const COUNTRIES_V2 = Object.fromEntries(Object.entries(COUNTRIES).map(([code, c]) => [code, { ...c, regions: [...c.regions, ...({ FR: ['Hauts-de-France', 'Borgogna e Giura', 'Corsica'], NL: ['Gheldria e Overijssel', 'Zelanda e Flevoland'], SE: ['Lapponia e Norrbotten', 'Västerbotten e costa del Norrland'] }[code] ?? [])] }]));

// @nazione|categoria|indice regione. Dopo il titolo: nome italiano e fatto editoriale facoltativi.
const selection = `
@DE|citta|0
Brandenburg an der Havel
Cottbus
Frankfurt (Oder)|Francoforte sull'Oder
@DE|citta|1
Rostock
Schwerin
Wismar
Stralsund
Greifswald
Kiel
Flensburg
Lüneburg|Luneburgo
Hanover|Hannover
Goslar
Quedlinburg
Lübeck
@DE|citta|2
Düsseldorf
Bonn
Aachen|Aquisgrana
Trier|Treviri
Koblenz|Coblenza
Mainz|Magonza
Wiesbaden
Münster
Essen
Dortmund
Kassel
@DE|citta|3
Regensburg|Ratisbona
Bamberg|Bamberga
Würzburg
Rothenburg ob der Tauber
Augsburg|Augusta
Passau|Passavia
Garmisch-Partenkirchen
Berchtesgaden
Lindau
@DE|citta|4
Ulm
Konstanz|Costanza
Baden-Baden
Karlsruhe
Tübingen|Tubinga
@DE|citta|5
Weimar
Erfurt
Eisenach
Görlitz
Meissen|Meißen
@DE|musei|0
Neues Museum||Museo berlinese di archeologia e storia antica.
Alte Nationalgalerie||Museo d'arte sull'Isola dei Musei di Berlino.
German Museum of Technology|Museo tedesco della tecnica|Museo della tecnica a Berlino.
Jewish Museum Berlin|Museo ebraico di Berlino
DDR Museum|Museo della DDR
Charlottenburg Palace|Palazzo di Charlottenburg
Reichstag building|Palazzo del Reichstag
Berlin Cathedral|Duomo di Berlino
East Side Gallery
Topography of Terror|Topografia del terrore|Centro di documentazione storica a Berlino.
Cecilienhof|Palazzo Cecilienhof
@DE|musei|1
International Maritime Museum Hamburg|Museo marittimo internazionale di Amburgo
Kunsthalle Hamburg
German Emigration Center|Centro tedesco dell'emigrazione
Klimahaus Bremerhaven
Schwerin Castle|Castello di Schwerin
Holstentor
@DE|musei|2
Chocolate Museum, Cologne|Museo del cioccolato di Colonia
Museum Ludwig
German National Museum of Contemporary History|Casa della storia a Bonn
Zollverein Coal Mine Industrial Complex|Complesso industriale Zollverein
Städel Museum
Senckenberg Museum|Museo Senckenberg
Marksburg
Eltz Castle|Castello di Eltz
Porta Nigra
@DE|musei|3
BMW Museum
Pinakothek der Moderne
Alte Pinakothek
Munich Residenz|Residenza di Monaco
Nymphenburg Palace|Palazzo di Nymphenburg
Hohenschwangau Castle|Castello di Hohenschwangau
Linderhof Palace|Palazzo di Linderhof
Herrenchiemsee|Palazzo di Herrenchiemsee
Germanisches Nationalmuseum
Nuremberg Castle|Castello di Norimberga
@DE|musei|4
Porsche Museum
Hohenzollern Castle|Castello di Hohenzollern
Heidelberg Castle|Castello di Heidelberg
Technik Museum Sinsheim
Technik Museum Speyer
@DE|musei|5
Zwinger|Zwinger di Dresda
Green Vault|Volta Verde di Dresda
Frauenkirche, Dresden|Frauenkirche di Dresda
Wartburg
Bauhaus Museum, Weimar|Museo Bauhaus di Weimar
@DE|natura|1
Jasmund National Park|Parco nazionale Jasmund
Müritz National Park|Parco nazionale Müritz
Harz National Park|Parco nazionale Harz
Lüneburg Heath|Brughiera di Luneburgo
@DE|isole|1
Rügen
Usedom
Sylt
Heligoland|Helgoland
@DE|natura|3
Königssee
Eibsee
Zugspitze
Berchtesgaden National Park|Parco nazionale Berchtesgaden
Bavarian Forest National Park|Parco nazionale della Foresta Bavarese
@DE|natura|4
Black Forest National Park|Parco nazionale della Foresta Nera
Triberg Waterfalls|Cascate di Triberg
Lake Constance|Lago di Costanza
Mainau|Isola di Mainau
@DE|natura|5
Saxon Switzerland National Park|Parco nazionale della Svizzera Sassone
@DE|parchi|1
Heide Park
Hansa-Park
@DE|parchi|2
Phantasialand
Movie Park Germany
@DE|parchi|3
Legoland Deutschland Resort
Playmobil FunPark
@DE|parchi|4
Tripsdrill
@DE|fauna|1
Tierpark Hagenbeck
Ozeaneum
@DE|fauna|3
Hellabrunn Zoo|Zoo di Hellabrunn
Nuremberg Zoo|Zoo di Norimberga
@DE|fauna|5
Leipzig Zoological Garden|Zoo di Lipsia
@DE|aeroporti|1
Hamburg Airport
Hannover Airport
Bremen Airport
@DE|aeroporti|2
Düsseldorf Airport
Cologne Bonn Airport
Dortmund Airport
@DE|aeroporti|3
Nuremberg Airport
Memmingen Airport
@DE|aeroporti|4
Stuttgart Airport
Karlsruhe/Baden-Baden Airport
@DE|aeroporti|5
Leipzig/Halle Airport
Dresden Airport
@DE|treni|0
Berlin Hauptbahnhof|Stazione centrale di Berlino
Berlin Ostbahnhof
Potsdam Hauptbahnhof
@DE|treni|1
Hamburg Hauptbahnhof|Stazione centrale di Amburgo
Hannover Hauptbahnhof
Bremen Hauptbahnhof
Kiel Hauptbahnhof
Rostock Hauptbahnhof
@DE|treni|2
Köln Hauptbahnhof|Stazione centrale di Colonia
Frankfurt (Main) Hauptbahnhof|Stazione centrale di Francoforte
Frankfurt Airport long-distance station|Stazione aeroportuale Fernbahnhof di Francoforte
Düsseldorf Hauptbahnhof
Dortmund Hauptbahnhof
Koblenz Hauptbahnhof
@DE|treni|3
München Hauptbahnhof|Stazione centrale di Monaco
Nürnberg Hauptbahnhof
Würzburg Hauptbahnhof
Garmisch-Partenkirchen station
@DE|treni|4
Stuttgart Hauptbahnhof
Karlsruhe Hauptbahnhof
Freiburg Hauptbahnhof
Heidelberg Hauptbahnhof
@DE|treni|5
Leipzig Hauptbahnhof
Dresden Hauptbahnhof
Erfurt Hauptbahnhof
@DE|porti|1
Port of Hamburg|Porto di Amburgo
Port of Kiel|Porto di Kiel
Port of Rostock|Porto di Rostock
Port of Lübeck|Porto di Lubecca
Port of Puttgarden|Porto di Puttgarden
Port of Cuxhaven|Porto di Cuxhaven
Bremerhaven|Area portuale di Bremerhaven
@FR|citta|0
Fontainebleau
Provins
Chartres
@FR|citta|1
Caen
Bayeux
Honfleur
Étretat
Le Havre
Cherbourg-en-Cotentin
Rennes
Brest, France|Brest
Quimper
Vannes
Dinan
@FR|citta|2
Angers
Saumur
Amboise
Blois
Orléans
Le Mans
@FR|citta|3
Colmar
Nancy, France|Nancy
Metz
Reims
Troyes
@FR|citta|4
Annecy
Chamonix
Grenoble
Chambéry
@FR|citta|5
Avignon
Arles
Aix-en-Provence
Cannes
Antibes
Menton
Toulon
@FR|citta|6
Toulouse
Carcassonne
Albi
Rocamadour
Sarlat-la-Canéda
La Rochelle
Biarritz
Bayonne
Périgueux
@FR|citta|7
Lille
Arras
Amiens
Boulogne-sur-Mer
@FR|citta|8
Dijon
Beaune
Besançon
@FR|citta|9
Ajaccio
Bastia
Bonifacio
@FR|musei|0
Musée de l'Orangerie|Museo dell'Orangerie
Musée Rodin|Museo Rodin
Centre Pompidou|Centro Pompidou|Centro culturale parigino; sede e accessi alle collezioni da verificare durante i lavori.
Musée du quai Branly – Jacques Chirac
Musée de l'Armée|Museo dell'esercito
Musée de l'Air et de l'Espace|Museo dell'aria e dello spazio
Palace of Fontainebleau|Castello di Fontainebleau
Château de Vaux-le-Vicomte|Castello di Vaux-le-Vicomte
Sainte-Chapelle
Panthéon
Palais Garnier
@FR|musei|1
Mémorial de Caen
Bayeux Museum|Museo di Bayeux|Complesso museale; esposizione dell'arazzo e calendario da verificare.
Château des ducs de Bretagne|Castello dei duchi di Bretagna
@FR|musei|2
Château de Chenonceau|Castello di Chenonceau
Château d'Amboise|Castello di Amboise
Château de Cheverny|Castello di Cheverny
Château de Villandry|Castello di Villandry
Clos Lucé
Château d'Azay-le-Rideau|Castello di Azay-le-Rideau
Château d'Angers|Castello di Angers
@FR|musei|3
Cité de l'Automobile|Museo nazionale dell'automobile di Mulhouse
Cité du Train
Unterlinden Museum|Museo Unterlinden
Strasbourg Cathedral|Cattedrale di Strasburgo
@FR|musei|4
Musée des Confluences
Musée Miniature et Cinéma
Palais idéal|Palazzo ideale del postino Cheval
@FR|musei|5
MuCEM
Palais des Papes|Palazzo dei Papi di Avignone
Pont du Gard
Musée océanographique de Monaco|Museo oceanografico di Monaco|Candidato da escludere: fuori dalla Francia.
@FR|musei|6
Cité de l'espace|Città dello spazio
La Cité du Vin
Lascaux|Lascaux|Sito e riproduzioni visitabili: accessi da verificare, non accesso alla grotta originale.
Musée Toulouse-Lautrec|Museo Toulouse-Lautrec
@FR|musei|7
Louvre-Lens
La Piscine Museum|Museo La Piscine
@FR|musei|8
Hospices de Beaune
@FR|natura|1
Pointe du Raz
Crozon Peninsula|Penisola di Crozon
@FR|natura|3
Ballons des Vosges Regional Nature Park|Parco naturale dei Ballons des Vosges
@FR|natura|4
Vanoise National Park|Parco nazionale della Vanoise
Écrins National Park|Parco nazionale degli Écrins
Lake Annecy|Lago di Annecy
Mer de Glace
@FR|natura|5
Calanques National Park|Parco nazionale delle Calanques
Verdon Gorge|Gole del Verdon
Camargue
Mercantour National Park|Parco nazionale del Mercantour
@FR|natura|6
Dune of Pilat|Duna di Pilat
Cirque de Gavarnie
Pyrenees National Park|Parco nazionale dei Pirenei
Gouffre de Padirac
@FR|natura|9
Calanques de Piana
Scandola Nature Reserve|Riserva naturale di Scandola
@FR|isole|6
Île de Ré
Île d'Oléron
@FR|parchi|0
Parc Astérix
@FR|parchi|2
Puy du Fou
@FR|parchi|6
Futuroscope
@FR|fauna|1
Océanopolis
@FR|fauna|2
ZooParc de Beauval
@FR|fauna|6
La Palmyre Zoo|Zoo di La Palmyre
@FR|fauna|7
Nausicaá Centre National de la Mer
@FR|aeroporti|0
Beauvais–Tillé Airport
@FR|aeroporti|1
Nantes Atlantique Airport
Brest Bretagne Airport
@FR|aeroporti|3
EuroAirport Basel Mulhouse Freiburg
Strasbourg Airport
@FR|aeroporti|4
Lyon–Saint-Exupéry Airport
@FR|aeroporti|5
Marseille Provence Airport
@FR|aeroporti|6
Toulouse–Blagnac Airport
Bordeaux–Mérignac Airport
Montpellier–Méditerranée Airport
@FR|aeroporti|9
Ajaccio Napoleon Bonaparte Airport
Bastia–Poretta Airport
@FR|treni|0
Gare du Nord|Parigi Gare du Nord
Gare de Lyon|Parigi Gare de Lyon
Gare Montparnasse|Parigi Montparnasse
Gare de l'Est|Parigi Gare de l'Est
Gare Saint-Lazare|Parigi Saint-Lazare
Aéroport Charles de Gaulle 2 TGV station
Marne-la-Vallée–Chessy station
@FR|treni|1
Rennes station
Nantes station
@FR|treni|2
Saint-Pierre-des-Corps station
@FR|treni|3
Strasbourg station
@FR|treni|4
Lyon-Part-Dieu station
Lyon-Perrache station
Annecy station
Grenoble station
@FR|treni|5
Marseille-Saint-Charles station
Avignon TGV station
Nice-Ville station
Aix-en-Provence TGV station
@FR|treni|6
Bordeaux-Saint-Jean station
Toulouse-Matabiau station
Montpellier-Saint-Roch station
@FR|treni|7
Lille-Europe station
Lille-Flandres station
@FR|treni|8
Dijon-Ville station
@FR|porti|1
Port of Le Havre|Porto di Le Havre
Port of Cherbourg|Porto di Cherbourg
Port of Caen|Porto di Caen
Port of Saint-Malo|Porto di Saint-Malo
Port of Roscoff|Porto di Roscoff
@FR|porti|5
Marseille-Fos Port|Porto di Marsiglia-Fos
Port of Toulon|Porto di Tolone
@FR|porti|7
Port of Calais|Porto di Calais
Port of Dunkirk|Porto di Dunkerque
@JP|citta|0
Chiba (city)|Chiba
Saitama (city)|Saitama
Kawagoe
Kamakura
Kawasaki, Kanagawa|Kawasaki
Odawara
Fujisawa, Kanagawa|Fujisawa
Yokosuka
Chichibu, Saitama|Chichibu
@JP|citta|1
Uji
Ōtsu|Ōtsu
Wakayama (city)|Wakayama
Kōyasan|Kōyasan
Ise, Mie|Ise
Kinosaki, Hyōgo|Kinosaki Onsen
@JP|citta|2
Toyama (city)|Toyama
Fukui (city)|Fukui
Gifu
Shizuoka (city)|Shizuoka
Hamamatsu
Kōfu|Kōfu
Fujikawaguchiko
@JP|citta|3
Otaru
Asahikawa
Furano
Biei
Kushiro
Abashiri
@JP|citta|4
Aomori
Hirosaki
Akita (city)|Akita
Morioka
Yamagata (city)|Yamagata
Aizuwakamatsu
Hiraizumi
@JP|citta|5
Okayama
Kurashiki
Matsue
Tottori (city)|Tottori
Onomichi
Takamatsu
Matsuyama
Kōchi (city)|Kōchi
Tokushima (city)|Tokushima
@JP|citta|6
Nagasaki
Kumamoto
Kagoshima
Beppu
Yufuin
Miyazaki (city)|Miyazaki
Ishigaki, Okinawa|Ishigaki
Naha
@JP|musei|0
Tokyo National Museum|Museo nazionale di Tokyo
National Museum of Nature and Science|Museo nazionale della natura e delle scienze
Ghibli Museum|Museo Ghibli
Miraikan|Museo Miraikan
Edo-Tokyo Open Air Architectural Museum|Museo architettonico all'aperto di Edo-Tokyo
Tokyo Skytree
Tokyo Tower
Meiji Shrine|Santuario Meiji
Sensō-ji|Tempio Sensō-ji
Great Buddha (Kamakura)|Grande Buddha di Kamakura
Tōshō-gū|Santuario Tōshō-gū|Il nome identifica più santuari: verificare l'entità prima dell'inclusione.
Nikkō Tōshō-gū|Santuario Nikkō Tōshō-gū
@JP|musei|1
Kyoto Railway Museum|Museo ferroviario di Kyoto
Kyoto International Manga Museum|Museo internazionale del manga di Kyoto
Kiyomizu-dera
Kinkaku-ji
Ryōan-ji
Nijō Castle|Castello Nijō
Fushimi Inari-taisha
Sanjūsangen-dō
Byōdō-in
Tōdai-ji
Kasuga-taisha
Osaka Castle|Castello di Osaka
Osaka Museum of Housing and Living|Museo delle abitazioni e della vita di Osaka
Himeji Castle|Castello di Himeji
Kobe Maritime Museum|Museo marittimo di Kobe
@JP|musei|2
SCMaglev and Railway Park|Parco ferroviario SCMaglev
Toyota Commemorative Museum of Industry and Technology
Matsumoto Castle|Castello di Matsumoto
Kanazawa Castle|Castello di Kanazawa
21st Century Museum of Contemporary Art, Kanazawa
Takayama Jin'ya
Shirakawa-gō and Gokayama|Shirakawa-gō e Gokayama
@JP|musei|3
Sapporo Beer Museum|Museo della birra di Sapporo
Historic Village of Hokkaido|Villaggio storico di Hokkaidō
@JP|musei|4
Hirosaki Castle|Castello di Hirosaki
Aizu-Wakamatsu Castle|Castello di Aizu-Wakamatsu
Chūson-ji
@JP|musei|5
Hiroshima Peace Memorial Museum|Museo della pace di Hiroshima
Itsukushima Shrine|Santuario di Itsukushima
Adachi Museum of Art|Museo d'arte Adachi
Matsue Castle|Castello di Matsue
Matsuyama Castle (Iyo)|Castello di Matsuyama
@JP|musei|6
Nagasaki Atomic Bomb Museum|Museo della bomba atomica di Nagasaki
Kumamoto Castle|Castello di Kumamoto
Shuri Castle|Castello di Shuri|Sito storico a Okinawa; aree aperte e ricostruzione da verificare.
@JP|natura|0
Shinjuku Gyo-en
Hama-rikyū Gardens|Giardini Hama-rikyū
Rikugi-en
Nikkō National Park|Parco nazionale di Nikkō
Lake Ashi|Lago Ashi
@JP|natura|1
Nara Park|Parco di Nara
Arashiyama
Kumano Nachi Taisha
Nachi Falls|Cascata di Nachi
@JP|natura|2
Kenroku-en
Jigokudani Monkey Park|Parco delle scimmie di Jigokudani
Kamikōchi
Lake Kawaguchi|Lago Kawaguchi
@JP|natura|3
Daisetsuzan National Park|Parco nazionale Daisetsuzan
Shiretoko National Park|Parco nazionale Shiretoko
Lake Tōya|Lago Tōya
@JP|natura|4
Oirase River|Gola dell'Oirase
Lake Towada|Lago Towada
@JP|natura|5
Ritsurin Garden|Giardino Ritsurin
Tottori Sand Dunes|Dune di Tottori
@JP|natura|6
Yakushima
Takachiho Gorge|Gola di Takachiho
@JP|parchi|0
Tokyo Disneyland
Tokyo DisneySea
Sanrio Puroland
@JP|parchi|1
Universal Studios Japan
@JP|parchi|2
Legoland Japan
Ghibli Park|Parco Ghibli
@JP|parchi|6
Huis Ten Bosch (theme park)|Huis Ten Bosch
@JP|fauna|0
Ueno Zoo|Zoo di Ueno
@JP|fauna|1
Osaka Aquarium Kaiyukan|Acquario Kaiyukan
Kyoto Aquarium|Acquario di Kyoto
@JP|fauna|3
Asahiyama Zoo|Zoo di Asahiyama
@JP|fauna|6
Okinawa Churaumi Aquarium|Acquario Churaumi
@JP|aeroporti|1
Osaka International Airport
Kobe Airport
@JP|aeroporti|2
Chubu Centrair International Airport
Komatsu Airport
@JP|aeroporti|3
New Chitose Airport
Hakodate Airport
@JP|aeroporti|4
Sendai Airport
Aomori Airport
@JP|aeroporti|5
Hiroshima Airport
Takamatsu Airport
@JP|aeroporti|6
Fukuoka Airport
Nagasaki Airport
Kagoshima Airport
Naha Airport
New Ishigaki Airport
@JP|treni|0
Tokyo Station|Stazione di Tokyo
Shinjuku Station|Stazione di Shinjuku
Ueno Station|Stazione di Ueno
Shinagawa Station|Stazione di Shinagawa
Yokohama Station|Stazione di Yokohama
Shin-Yokohama Station|Stazione di Shin-Yokohama
Odawara Station|Stazione di Odawara
@JP|treni|1
Kyoto Station|Stazione di Kyoto
Osaka Station|Stazione di Osaka
Shin-Osaka Station|Stazione di Shin-Osaka
Nara Station|Stazione JR di Nara
Kintetsu Nara Station|Stazione Kintetsu di Nara
Shin-Kobe Station|Stazione di Shin-Kobe
Himeji Station|Stazione di Himeji
@JP|treni|2
Nagoya Station|Stazione di Nagoya
Kanazawa Station|Stazione di Kanazawa
Nagano Station|Stazione di Nagano
Matsumoto Station|Stazione di Matsumoto
Takayama Station|Stazione di Takayama
Shizuoka Station|Stazione di Shizuoka
@JP|treni|3
Sapporo Station|Stazione di Sapporo
Hakodate Station|Stazione di Hakodate
Shin-Hakodate-Hokuto Station|Stazione di Shin-Hakodate-Hokuto
@JP|treni|4
Sendai Station (Miyagi)|Stazione di Sendai
Shin-Aomori Station|Stazione di Shin-Aomori
@JP|treni|5
Hiroshima Station|Stazione di Hiroshima
Okayama Station|Stazione di Okayama
Takamatsu Station (Kagawa)|Stazione di Takamatsu
@JP|treni|6
Hakata Station|Stazione di Hakata
Kumamoto Station|Stazione di Kumamoto
Kagoshima-Chūō Station|Stazione di Kagoshima-Chūō
Nagasaki Station|Stazione di Nagasaki
@JP|porti|0
Port of Yokohama|Porto di Yokohama
Port of Tokyo|Porto di Tokyo
@JP|porti|1
Port of Kobe|Porto di Kobe
Port of Osaka|Porto di Osaka
@JP|porti|2
Port of Nagoya|Porto di Nagoya
@JP|porti|3
Port of Otaru|Porto di Otaru
Port of Tomakomai|Porto di Tomakomai
@JP|porti|5
Port of Takamatsu|Porto di Takamatsu
@JP|porti|6
Port of Hakata|Porto di Hakata
Port of Naha|Porto di Naha
@NL|citta|0
Alkmaar
Hoorn
Enkhuizen
Edam
Volendam
Zaandam
Den Helder
@NL|citta|1
Delft
Leiden
Gouda
Dordrecht
Schiedam
Kinderdijk
@NL|citta|2
Amersfoort
Hilversum
@NL|citta|3
Breda
Tilburg
's-Hertogenbosch|Den Bosch
Roermond
Valkenburg aan de Geul
Venlo
Bergen op Zoom
@NL|citta|4
Leeuwarden
Sneek
Harlingen, Netherlands|Harlingen
Assen
Groningen
@NL|citta|5
Arnhem
Nijmegen|Nimega
Deventer
Zutphen
Zwolle
Apeldoorn
Enschede
Giethoorn
Kampen, Overijssel|Kampen
@NL|citta|6
Middelburg
Vlissingen
Zierikzee
Domburg
Almere
Lelystad
@NL|musei|0
Anne Frank House|Casa di Anna Frank
Van Gogh Museum|Museo Van Gogh
Stedelijk Museum Amsterdam
National Maritime Museum, Amsterdam|Museo marittimo nazionale di Amsterdam
Rembrandt House Museum|Casa museo di Rembrandt
Hermitage Amsterdam|H'ART Museum|Museo di Amsterdam; denominazione e programma da verificare.
Teylers Museum
Frans Hals Museum
Zuiderzee Museum
Zaanse Schans
Muiderslot|Castello di Muiden
Dutch Resistance Museum|Museo della Resistenza olandese
Amsterdam Museum
Museum of the Canals|Museo dei canali
@NL|musei|1
Mauritshuis
Kunstmuseum Den Haag
Escher in Het Paleis
Louwman Museum
Naturalis Biodiversity Center
Rijksmuseum van Oudheden|Museo nazionale delle antichità
Museum De Lakenhal
Museum Prinsenhof Delft
Royal Delft|Royal Delft|Manifattura e museo della ceramica di Delft.
Maritime Museum Rotterdam|Museo marittimo di Rotterdam
Kunsthal
Museum Boijmans Van Beuningen|Museo Boijmans Van Beuningen|Sedi espositive e accessi al deposito da verificare.
Cube house|Case cubiche di Rotterdam
Grote Kerk, Dordrecht|Chiesa grande di Dordrecht
@NL|musei|2
Railway Museum (Netherlands)|Museo ferroviario di Utrecht
Museum Speelklok
Centraal Museum
Rietveld Schröder House|Casa Rietveld Schröder
National Military Museum (Netherlands)|Museo militare nazionale
@NL|musei|3
Van Abbemuseum
DAF Museum
Philips Museum
Noordbrabants Museum
Bonnefanten Museum
@NL|musei|4
Groninger Museum
Fries Museum
Drents Museum
Planetarium Eise Eisinga|Planetario Eise Eisinga
@NL|musei|5
Kröller-Müller Museum
Netherlands Open Air Museum|Museo all'aperto dei Paesi Bassi
Het Loo Palace|Palazzo Het Loo
Airborne Museum 'Hartenstein'
Museum de Fundatie
@NL|musei|6
Batavialand
Aviodrome
Zeeuws Museum
@NL|natura|0
Zuid-Kennemerland National Park|Parco nazionale Zuid-Kennemerland
Dunes of Texel National Park|Parco nazionale delle dune di Texel
@NL|natura|1
Biesbosch National Park|Parco nazionale De Biesbosch
Meijendel
@NL|natura|2
Utrechtse Heuvelrug National Park|Parco nazionale Utrechtse Heuvelrug
@NL|natura|3
De Loonse en Drunense Duinen National Park
De Groote Peel National Park
Maasduinen National Park
@NL|natura|4
Lauwersmeer National Park
Drents-Friese Wold National Park
Dwingelderveld National Park
@NL|natura|5
De Hoge Veluwe National Park
Veluwezoom National Park
Weerribben-Wieden National Park
Sallandse Heuvelrug National Park
@NL|natura|6
Oosterschelde National Park
Oostvaardersplassen
@NL|isole|4
Terschelling
Vlieland
Ameland
Schiermonnikoog
@NL|parchi|1
Madurodam
Duinrell
@NL|parchi|3
Toverland
@NL|parchi|4
Drouwenerzand
@NL|parchi|5
Julianatoren
Slagharen (amusement park)|Parco Slagharen
@NL|parchi|6
Walibi Holland
Deltapark Neeltje Jans
@NL|fauna|0
Artis|Zoo Artis
Ecomare
@NL|fauna|1
Diergaarde Blijdorp|Zoo di Rotterdam
@NL|fauna|3
Safaripark Beekse Bergen
ZooParc Overloon
@NL|fauna|4
Wildlands
AquaZoo Leeuwarden
@NL|fauna|5
Burgers' Zoo
Apenheul Primate Park
@NL|aeroporti|0
Amsterdam Airport Schiphol
@NL|aeroporti|3
Maastricht Aachen Airport
@NL|aeroporti|4
Groningen Airport Eelde
@NL|treni|0
Amsterdam Centraal station|Stazione Amsterdam Centraal
Amsterdam Zuid station
Schiphol Airport railway station
Haarlem railway station
Alkmaar railway station
Zaandam railway station
Hoorn railway station
@NL|treni|1
Rotterdam Centraal station
Den Haag Centraal railway station
Den Haag HS railway station
Delft railway station
Leiden Centraal railway station
Dordrecht railway station
Gouda railway station
@NL|treni|2
Utrecht Centraal railway station
Amersfoort Centraal railway station
Hilversum railway station
@NL|treni|3
Eindhoven Centraal railway station
Maastricht railway station
Breda railway station
Tilburg railway station
's-Hertogenbosch railway station
@NL|treni|4
Groningen railway station
Leeuwarden railway station
Assen railway station
@NL|treni|5
Arnhem Centraal railway station
Nijmegen railway station
Zwolle railway station
Deventer railway station
Enschede railway station
@NL|treni|6
Middelburg railway station
Vlissingen railway station
Lelystad Centrum railway station
Almere Centrum railway station
@NL|porti|0
Port of Amsterdam|Porto di Amsterdam
Port of Den Helder|Porto di Den Helder
IJmuiden|Area portuale di IJmuiden
@NL|porti|1
Port of Rotterdam|Porto di Rotterdam
Hook of Holland|Area portuale di Hoek van Holland
@NL|porti|4
Eemshaven|Porto di Eemshaven
Harlingen, Netherlands|Area portuale di Harlingen
@NL|porti|6
Port of Vlissingen|Porto di Vlissingen
@DK|citta|0
Helsingør
Hillerød
Roskilde
Køge
Frederikssund
Holbæk
Kalundborg
Slagelse
Næstved
Vordingborg
Sorø
Maribo
Nykøbing Falster
@DK|citta|1
Svendborg
Nyborg
Faaborg
Middelfart
Kerteminde
Assens, Denmark|Assens
Ærøskøbing
@DK|citta|2
Vejle
Kolding
Fredericia
Haderslev
Aabenraa
Sønderborg
Tønder
Horsens
Silkeborg
Viborg
Herning
Ringkøbing
Ebeltoft
Grenaa
@DK|citta|3
Hjørring
Frederikshavn
Hirtshals
Thisted
Hanstholm
Sæby
Løkken
@DK|citta|4
Rønne
Gudhjem
Svaneke
Nexø
Allinge-Sandvig
@DK|musei|0
National Museum of Denmark|Museo nazionale della Danimarca
Ny Carlsberg Glyptotek
SMK – National Gallery of Denmark|Galleria nazionale della Danimarca
Designmuseum Denmark
Thorvaldsens Museum
The David Collection|Collezione David
Rosenborg Castle|Castello di Rosenborg
Amalienborg
Christiansborg Palace|Palazzo di Christiansborg
Frederiksborg Castle|Castello di Frederiksborg
Kronborg
M/S Maritime Museum of Denmark|Museo marittimo della Danimarca
Roskilde Cathedral|Cattedrale di Roskilde
RAGNAROCK
ARKEN Museum of Contemporary Art
Open Air Museum (Lyngby)|Museo all'aperto di Lyngby
Stevns Klint Cold War Museum
@DK|musei|1
Hans Christian Andersen Museum|Museo Hans Christian Andersen
Egeskov Castle|Castello di Egeskov
The Funen Village|Villaggio della Fionia
Danish Railway Museum|Museo ferroviario danese
Johannes Larsen Museum
@DK|musei|2
ARoS Aarhus Kunstmuseum
Den Gamle By
Moesgaard Museum
Koldinghus
Trapholt
Kongernes Jelling
Ribe Viking Centre
Tirpitz (museum)|Museo Tirpitz
Jutland Railway Museum|Museo ferroviario dello Jutland
Fregatten Jylland|Fregata Jylland
@DK|musei|3
Kunsten Museum of Modern Art Aalborg
Lindholm Høje
Skagens Museum
Bunkermuseum Hanstholm
@DK|musei|4
Bornholms Kunstmuseum
Hammershus
NaturBornholm
@DK|natura|0
Møns Klint
Stevns Klint
Gribskov
Jægersborg Dyrehave
Kongernes Nordsjælland National Park
Skjoldungernes Land National Park
@DK|natura|1
Svanninge Bakker
@DK|natura|2
Wadden Sea National Park|Parco nazionale del Mare dei Wadden
Mols Bjerge National Park
Skjern River|Valle del fiume Skjern
Filsø
@DK|natura|3
Thy National Park
Råbjerg Mile
Grenen
Rubjerg Knude Lighthouse|Faro di Rubjerg Knude
Bulbjerg
Rebild Hills
Rold Skov
@DK|natura|4
Almindingen
Dueodde
Helligdomsklipperne
@DK|isole|0
Møn
Lolland
Falster
@DK|isole|1
Ærø
Langeland
@DK|isole|2
Fanø
Rømø
Samsø
@DK|isole|3
Læsø
@DK|isole|4
Christiansø
@DK|parchi|0
Bakken
BonBon-Land
Sommerland Sjælland
@DK|parchi|2
Djurs Sommerland
Tivoli Friheden
WOW Park|WOW Park|Luogo con più sedi: identità e coordinate da verificare.
@DK|parchi|3
Fårup Sommerland
Jesperhus
@DK|parchi|4
Brændegårdshaven
@DK|fauna|0
Copenhagen Zoo|Zoo di Copenaghen
National Aquarium Denmark|Acquario nazionale della Danimarca
@DK|fauna|1
Odense Zoo|Zoo di Odense
Fjord & Bælt
@DK|fauna|2
Givskud Zoo
Ree Park Safari
Randers Tropical Zoo
Kattegatcentret
Fiskeri- og Søfartsmuseet|Museo della pesca e della navigazione
@DK|fauna|3
Aalborg Zoo
Nordsøen Oceanarium
@DK|aeroporti|0
Roskilde Airport
@DK|aeroporti|1
Hans Christian Andersen Airport
@DK|aeroporti|2
Aarhus Airport
Esbjerg Airport
Sønderborg Airport
Midtjyllands Airport
@DK|aeroporti|4
Bornholm Airport
@DK|treni|0
Copenhagen Central Station|Stazione centrale di Copenaghen
Nørreport Station
Østerport Station
Copenhagen Airport railway station
Roskilde station
Helsingør station
Hillerød station
Køge station
Ringsted station
Næstved station
Nykøbing Falster railway station
@DK|treni|1
Odense station
Nyborg railway station
Svendborg railway station
@DK|treni|2
Aarhus Central Station|Stazione centrale di Aarhus
Fredericia station
Vejle station
Kolding station
Esbjerg station
Silkeborg railway station
Herning railway station
@DK|treni|3
Aalborg railway station
Frederikshavn station
Hirtshals station
Skagen station
Hjørring station
@DK|porti|0
Port of Copenhagen|Porto di Copenaghen
Rødbyhavn|Area portuale di Rødbyhavn
Gedser|Area portuale di Gedser
@DK|porti|1
Port of Odense|Porto di Odense
Port of Svendborg|Porto di Svendborg
@DK|porti|2
Port of Aarhus|Porto di Aarhus
Port of Esbjerg|Porto di Esbjerg
Port of Grenaa|Porto di Grenaa
@DK|porti|3
Port of Hirtshals|Porto di Hirtshals
Port of Frederikshavn|Porto di Frederikshavn
Port of Aalborg|Porto di Aalborg
@DK|porti|4
Port of Rønne|Porto di Rønne
@SE|citta|0
Uppsala
Sigtuna
Västerås
Örebro
Nyköping
Eskilstuna
Norrtälje
Trosa
@SE|citta|1
Kungälv
Lysekil
Fjällbacka
Strömstad
Uddevalla
Trollhättan
Vänersborg
@SE|citta|2
Helsingborg
Landskrona
Kristianstad
Simrishamn
Hässleholm
Karlskrona
Karlshamn
Halmstad
Varberg
@SE|citta|3
Jönköping
Växjö
Eksjö
Västervik
Gränna
Oskarshamn
Borgholm
@SE|citta|5
Mora, Sweden|Mora
Rättvik
Leksand
Sundsvall
Härnösand
Åre
Karlstad
Torsby
@SE|citta|6
Luleå
Gällivare
Jokkmokk
Pajala
Haparanda
@SE|citta|7
Umeå
Skellefteå
Örnsköldsvik
Piteå
@SE|musei|0
Vasa Museum|Museo Vasa
Nordic Museum|Museo nordico
Swedish History Museum|Museo storico svedese
Swedish Museum of Natural History|Museo svedese di storia naturale
Moderna Museet
Nationalmuseum
ABBA The Museum
Fotografiska
Swedish National Museum of Science and Technology|Museo della scienza e della tecnica
Nobel Prize Museum|Museo del premio Nobel
Royal Armoury (Sweden)|Armeria reale
Stockholm Palace|Palazzo reale di Stoccolma
Drottningholm Palace|Palazzo di Drottningholm
Gripsholm Castle|Castello di Gripsholm
Uppsala Cathedral|Cattedrale di Uppsala
Uppsala Castle|Castello di Uppsala
Gustavianum
Gamla Uppsala|Gamla Uppsala
Örebro Castle|Castello di Örebro
Tom Tits Experiment
@SE|musei|1
Museum of Gothenburg|Museo di Göteborg
Gothenburg Museum of Art|Museo d'arte di Göteborg
Volvo Museum|Museo Volvo|Sede e continuità dell'esposizione da verificare: non presumere che la vecchia sede sia aperta.
World of Volvo
Aeroseum
Bohus Fortress|Fortezza di Bohus
Nordic Watercolour Museum|Museo nordico dell'acquerello
Vitlycke Museum
@SE|musei|2
Kulturen
Malmö Castle|Castello di Malmö
Moderna Museet Malmö
Naval Museum (Sweden)|Museo navale di Karlskrona
@SE|musei|3
Kalmar Castle|Castello di Kalmar
Jönköping County Museum
Swedish Glass Museum|Museo del vetro svedese
Borgholm Castle|Castello di Borgholm
@SE|musei|4
Gotland Museum|Museo di Gotland
@SE|musei|5
Zorn Museum
Dalarnas Museum
Jamtli
Värmlands Museum
Mårbacka
@SE|musei|6
Ájtte|Museo Ájtte
Gammelstad Church Town|Città parrocchiale di Gammelstad
@SE|musei|7
Västerbottens museum
Bildmuseet
Guitars – the Museum
@SE|natura|0
Tyresta National Park|Parco nazionale Tyresta
Färnebofjärden National Park
Södermalm|Södermalm|Isola e quartiere di Stoccolma, non un parco naturale.
@SE|natura|1
Kosterhavet National Park
Tiveden National Park
Djurö National Park
@SE|natura|2
Stenshuvud National Park
Dalby Söderskog National Park
Kullaberg
Hallands Väderö
@SE|natura|3
Store Mosse National Park
Norra Kvill National Park
Åsnen National Park
Stora Alvaret
@SE|natura|4
Gotska Sandön National Park
@SE|natura|5
Fulufjället National Park
Njupeskär
Hamra National Park
Sånfjället National Park
@SE|natura|6
Sarek National Park
Stora Sjöfallet National Park
Padjelanta National Park
Muddus National Park
Kebnekaise
@SE|natura|7
Skuleskogen National Park
High Coast|Höga Kusten
Västerbotten|Västerbotten|Regione da non importare come singola attrazione.
Björnlandet National Park
@SE|isole|0
Vaxholm
Sandhamn
Grinda
Utö, Sweden|Utö
@SE|isole|1
Koster Islands|Isole Koster
Orust
Tjörn
Smögen
@SE|isole|4
Stora Karlsö
@SE|parchi|0
Gröna Lund
@SE|parchi|2
Tosselilla Summer Park
@SE|parchi|3
High Chaparral Theme Park
@SE|parchi|5
Leksand Sommarland
Furuvik Zoo|Furuvik
@SE|fauna|0
Skansen
Kolmården Wildlife Park
@SE|fauna|1
Nordens Ark
Borås Zoo
Havets Hus
@SE|fauna|2
Skånes Djurpark
@SE|fauna|3
Öland Zoo and Amusement Park
@SE|fauna|5
Orsa Predator Park|Parco dei predatori di Orsa|Candidato storico: stato operativo da verificare prima dell'inclusione.
@SE|aeroporti|0
Stockholm Bromma Airport
Stockholm Skavsta Airport
Stockholm Västerås Airport
@SE|aeroporti|2
Ängelholm–Helsingborg Airport
Ronneby Airport
@SE|aeroporti|3
Kalmar Airport
Växjö/Kronoberg Airport
@SE|aeroporti|4
Visby Airport
@SE|aeroporti|5
Åre Östersund Airport
Sundsvall–Timrå Airport
@SE|aeroporti|6
Kiruna Airport
Luleå Airport
@SE|aeroporti|7
Umeå Airport
Skellefteå Airport
@SE|treni|0
Stockholm Central Station|Stazione centrale di Stoccolma
Stockholm City Station
Uppsala Central Station
Västerås Central Station
Örebro Central Station
@SE|treni|1
Gothenburg Central Station|Stazione centrale di Göteborg
Trollhättan railway station
@SE|treni|2
Malmö Central Station|Stazione centrale di Malmö
Lund Central Station
Helsingborg Central Station
Hässleholm Central Station
@SE|treni|3
Jönköping Central Station
Kalmar Central Station
Alvesta railway station
@SE|treni|5
Falun Central Station
Mora railway station
Östersund Central Station
Åre railway station
Sundsvall Central Station
Karlstad Central Station
@SE|treni|6
Kiruna railway station
Abisko Östra railway station
Gällivare railway station
Luleå Central Station
@SE|treni|7
Umeå Central Station
Umeå East Station
Örnsköldsvik Central Station
@SE|porti|0
Stockholm Port|Porto di Stoccolma
Värtahamnen
Stadsgården
Port of Kapellskär|Porto di Kapellskär
Port of Nynäshamn|Porto di Nynäshamn
@SE|porti|1
Port of Gothenburg|Porto di Göteborg
@SE|porti|2
Port of Trelleborg|Porto di Trelleborg
Port of Ystad|Porto di Ystad
Port of Helsingborg|Porto di Helsingborg
@SE|porti|3
Port of Oskarshamn|Porto di Oskarshamn
@SE|porti|4
Port of Visby|Porto di Visby
@SE|porti|6
Port of Luleå|Porto di Luleå
@DE|musei|0
Berlin Wall Memorial|Memoriale del Muro di Berlino
Museum Barberini
@DE|musei|1
Herrenhausen Gardens|Giardini di Herrenhausen
@DE|musei|2
Beethoven House|Casa di Beethoven
Museum Folkwang
@DE|musei|3
Walhalla (memorial)|Walhalla
@DE|musei|4
Maulbronn Monastery|Monastero di Maulbronn
@DE|musei|5
Bach House (Eisenach)|Casa di Bach a Eisenach
@FR|citta|1
Deauville
Saint-Brieuc
Perros-Guirec
@FR|citta|3
Mulhouse
Sélestat
@FR|citta|4
Évian-les-Bains
Briançon
@FR|citta|5
Nîmes
Orange, Vaucluse|Orange
Saint-Rémy-de-Provence
@FR|citta|6
Pau, Pyrénées-Atlantiques|Pau
Saint-Émilion
Collioure
Perpignan
@FR|musei|0
Musée Grévin
Musée Marmottan Monet
Conciergerie
@FR|musei|5
Maison Carrée
Roman Theatre of Orange|Teatro romano di Orange
@FR|musei|6
Cité de Carcassonne|Cittadella di Carcassonne
@FR|natura|6
Pyrénées Ariégeoises Regional Natural Park
@FR|aeroporti|7
Lille Airport
@FR|aeroporti|6
Biarritz Pays Basque Airport
@FR|aeroporti|1
Rennes–Saint-Jacques Airport
@JP|musei|0
Nezu Museum|Museo Nezu
National Art Center, Tokyo|Centro nazionale d'arte di Tokyo
Tokyo Metropolitan Edo-Tokyo Museum|Museo Edo-Tokyo|Museo dedicato alla storia di Tokyo; apertura e sedi da verificare.
CupNoodles Museum Yokohama|Museo CupNoodles di Yokohama
The Railway Museum (Saitama)|Museo ferroviario di Saitama
@JP|musei|1
Kyoto National Museum|Museo nazionale di Kyoto
Nara National Museum|Museo nazionale di Nara
Osaka Museum of History|Museo di storia di Osaka
@JP|musei|5
Ōhara Museum of Art|Museo d'arte Ōhara
Benesse House|Benesse House
Chichu Art Museum|Museo d'arte Chichu
@JP|isole|5
Naoshima
Teshima
@JP|isole|6
Taketomi Island|Isola di Taketomi
@NL|citta|0
Bergen, North Holland|Bergen
Zandvoort
Naarden
Weesp
@NL|citta|1
Schoonhoven
Brielle
@NL|citta|3
Heusden
Oisterwijk
@NL|citta|4
Franeker
Dokkum
Appingedam
Bourtange
@NL|citta|5
Doesburg
Lochem
Ootmarsum
@NL|citta|6
Veere
Goes
Hulst
@NL|musei|0
Joods Museum|Museo ebraico di Amsterdam
Museum Van Loon
Museum Willet-Holthuysen
Eye Filmmuseum
@NL|musei|1
Museum Voorlinden
Huis ten Bosch|Palazzo Huis ten Bosch|Residenza reale: non presumere accesso del pubblico all'interno.
@NL|musei|2
De Haar Castle|Castello De Haar
@NL|natura|5
De Wieden
@NL|porti|6
Port of Terneuzen|Porto di Terneuzen
@NL|treni|3
Roermond railway station
Venlo railway station
@DK|musei|0
The Round Tower|Torre rotonda di Copenaghen
Rundetaarn
Copenhagen City Hall|Municipio di Copenaghen
Frederik's Church|Chiesa di Marmo
Church of Our Saviour, Copenhagen|Chiesa del Nostro Redentore
Christiansborg Palace Chapel|Cappella del palazzo di Christiansborg
Frederiksberg Palace|Palazzo di Frederiksberg
@DK|musei|2
Sønderborg Castle|Castello di Sønderborg
@DK|musei|0
Kronborg Castle|Castello di Kronborg
Odsherreds Kunstmuseum
@DK|musei|1
Nyborg Castle|Castello di Nyborg
Valdemar's Castle|Castello di Valdemar
@DK|musei|2
Rosenholm Castle|Castello di Rosenholm
Gammel Estrup Manor|Gammel Estrup
Jelling stones|Pietre di Jelling
Kalkmalerier|Affreschi medievali danesi|Candidato generico da escludere.
@DK|natura|0
Botanical Garden (Copenhagen)|Orto botanico di Copenaghen
Frederiksberg Gardens|Giardini di Frederiksberg
@DK|natura|2
Himmelbjerget
Rold Skov
@DK|natura|3
Rubjerg Knude
Råbjerg Church|Chiesa di Råbjerg
@DK|natura|4
Hammeren
@DK|citta|0
Dragør
Frederiksværk
Gilleleje
Nykøbing Sjælland
@DK|citta|1
Bogense
Rudkøbing
@DK|citta|2
Sønderho
@DK|citta|3
Blokhus
@DK|citta|4
Hasle, Bornholm|Hasle
`;

// Entità ambigue, fuori nazione, chiuse o generiche: niente riempitivi nel catalogo.
const EXCLUDED = new Set(['Musée océanographique de Monaco', 'Tōshō-gū', 'WOW Park', 'Volvo Museum', 'Orsa Predator Park', 'Västerbotten', 'Södermalm', 'Huis ten Bosch', 'Kalkmalerier', 'The Round Tower', 'Kronborg Castle', 'Rold Skov']);
const TITLE_FIXES = {
  'Chocolate Museum, Cologne': 'Imhoff-Schokoladenmuseum',
  'German National Museum of Contemporary History': 'Haus der Geschichte',
  Zwinger: 'Zwinger (Dresden)',
  Bonifacio: 'Bonifacio, Corse-du-Sud',
  Kawagoe: 'Kawagoe, Saitama', Furano: 'Furano, Hokkaido', 'Yamagata (city)': 'Yamagata, Yamagata',
  'Great Buddha (Kamakura)': 'Kōtoku-in',
  Edam: 'Edam, Netherlands', Gouda: 'Gouda, South Holland', Middelburg: 'Middelburg, Zeeland',
  'National Maritime Museum, Amsterdam': 'Het Scheepvaartmuseum',
  'Museum of the Canals': 'Grachtenmuseum', 'National Military Museum (Netherlands)': 'Nationaal Militair Museum',
  'Planetarium Eise Eisinga': 'Eise Eisinga Planetarium', Wildlands: 'Wildlands (zoo)',
  Viborg: 'Viborg, Denmark', 'Løkken': 'Løkken, Denmark', 'SMK – National Gallery of Denmark': 'National Gallery of Denmark',
  RAGNAROCK: 'Ragnarock (museum)', 'Open Air Museum (Lyngby)': 'Frilandsmuseet', Bakken: 'Dyrehavsbakken',
  Fotografiska: 'Fotografiska (Stockholm)', 'Royal Armoury (Sweden)': 'Livrustkammaren', 'Naval Museum (Sweden)': 'Marinmuseum',
};
const slug = (title) => title.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const CANDIDATES_V2 = Object.fromEntries(Object.keys(COUNTRIES).map((c) => [c, []]));
let context;
for (const raw of selection.split('\n')) {
  const line = raw.trim();
  if (!line) continue;
  if (line.startsWith('@')) { const [code, category, index] = line.slice(1).split('|'); context = { code, category, regionIndex: Number(index) }; continue; }
  const [title, name, description] = line.split('|');
  if (EXCLUDED.has(title)) continue;
  CANDIDATES_V2[context.code].push({ ...context, key: `${context.code.toLowerCase()}-${slug(title)}`, title: TITLE_FIXES[title] ?? title, name: name || undefined, description: description || undefined });
}
