// Candidati editoriali. Nomi e coordinate sono risolti sulle fonti, nessun testo Wikipedia viene importato.
export const COUNTRIES = {
  IS: { name: 'Islanda', en: 'Iceland', language: 'is', currency: 'ISK', timezone: 'Atlantic/Reykjavik', qid: 'Q189', bounds: [63.2, 67.2, -24.7, -13.3], tourism: 'https://www.visiticeland.com/', regions: ['Reykjavík e Reykjanes', 'Circolo d’Oro e costa meridionale', 'Islanda occidentale e Snæfellsnes', 'Fiordi occidentali', 'Islanda settentrionale', 'Fiordi orientali e Vatnajökull'] },
  FI: { name: 'Finlandia', en: 'Finland', language: 'fi', currency: 'EUR', timezone: 'Europe/Helsinki', qid: 'Q33', bounds: [59.7, 70.2, 19.3, 31.7], tourism: 'https://www.visitfinland.com/en/', regions: ['Helsinki e Uusimaa', 'Turku, Åland e costa sud-occidentale', 'Tampere e regione dei laghi', 'Savo e Carelia', 'Ostrobotnia, Oulu e Kainuu', 'Lapponia finlandese'] },
  GB: { name: 'Regno Unito', en: 'United Kingdom', language: 'en', currency: 'GBP', timezone: 'Europe/London', qid: 'Q145', bounds: [49.8, 61, -8.7, 2], tourism: 'https://www.visitbritain.com/en', regions: ['Inghilterra — Londra e Sud-Est', 'Inghilterra — Sud-Ovest', 'Inghilterra — Midlands e Anglia orientale', 'Inghilterra — Nord', 'Galles', 'Irlanda del Nord', 'Scozia — Edimburgo, Fife e Scozia centrale', 'Scozia — Highlands e Skye', 'Scozia — Aberdeen, Moray e Cairngorms', 'Scozia — Orcadi, Shetland ed Ebridi', 'Scozia — Glasgow, Argyll e Loch Lomond'] },
  IE: { name: 'Irlanda', en: 'Ireland', language: 'en', currency: 'EUR', timezone: 'Europe/Dublin', qid: 'Q27', bounds: [51.3, 55.5, -10.8, -5.9], tourism: 'https://www.ireland.com/en-gb/', regions: ['Dublino e Wicklow', 'Cork e sud-est irlandese', 'Kerry e sud-ovest', 'Clare, Galway e Connemara', 'Mayo, Sligo e Donegal', 'Midlands e valle del Boyne'] },
  TH: { name: 'Thailandia', en: 'Thailand', language: 'th', currency: 'THB', timezone: 'Asia/Bangkok', qid: 'Q869', bounds: [5.4, 20.6, 97.2, 105.7], tourism: 'https://www.tourismthailand.org/', regions: ['Bangkok, Ayutthaya e pianura centrale', 'Chiang Mai, Chiang Rai e nord', 'Isan e Thailandia nord-orientale', 'Costa orientale e isole di Trat', 'Andamane, Phuket, Krabi e Phang Nga', 'Golfo di Thailandia e sud'] },
  KH: { name: 'Cambogia', en: 'Cambodia', language: 'km', currency: 'KHR', timezone: 'Asia/Phnom_Penh', qid: 'Q424', bounds: [10.3, 14.8, 102.2, 107.7], tourism: 'https://tourism.gov.kh/', regions: ['Phnom Penh e dintorni', 'Siem Reap, Angkor e Tonle Sap', 'Battambang e Cambogia occidentale', 'Kampot, Kep e costa', 'Mekong e Cambogia nord-orientale'] },
  VN: { name: 'Vietnam', en: 'Vietnam', language: 'vi', currency: 'VND', timezone: 'Asia/Ho_Chi_Minh', qid: 'Q881', bounds: [8.3, 23.5, 102, 109.6], tourism: 'https://vietnam.travel/', regions: ['Hanoi e delta del Fiume Rosso', 'Montagne del nord', 'Huế, Đà Nẵng e Hội An', 'Costa centro-meridionale e altopiani', 'Ho Chi Minh City e Vietnam sud-orientale', 'Delta del Mekong e Phú Quốc'] },
  IN: { name: 'India', en: 'India', language: 'hi', currency: 'INR', timezone: 'Asia/Kolkata', qid: 'Q668', bounds: [8, 36, 68, 89], tourism: 'https://www.incredibleindia.gov.in/', regions: ['India del Nord — Delhi e Uttar Pradesh', 'India del Nord — Rajasthan', 'India del Nord — Punjab, Haryana e Chandigarh', 'India del Nord — Uttarakhand', 'India del Nord — Himachal Pradesh', 'India del Nord — Ladakh', 'India del Sud — Karnataka', 'India del Sud — Kerala', 'India del Sud — Tamil Nadu e Puducherry', 'India del Sud — Telangana e Andhra Pradesh', 'India del Sud — Goa'] },
};

const selection = `
@IS|citta|0
Reykjavík
Hafnarfjörður
Kópavogur
Garðabær
Keflavík
Grindavík|Grindavík|Località della penisola di Reykjanes: accessi e condizioni da verificare prima di partire.
@IS|citta|1
Selfoss (town)
Hveragerði
Hella, Iceland
Hvolsvöllur
Vík í Mýrdal
Kirkjubæjarklaustur
Flúðir
@IS|citta|2
Borgarnes
Akranes
Reykholt, Western Iceland
Stykkishólmur
Grundarfjörður
Ólafsvík
Búðardalur
@IS|citta|3
Ísafjörður
Bolungarvík
Patreksfjörður
Tálknafjörður
Hólmavík
Flateyri
@IS|citta|4
Akureyri
Húsavík
Siglufjörður
Dalvík
Sauðárkrókur
Blönduós
Hvammstangi
Reykjahlíð
@IS|citta|5
Egilsstaðir
Seyðisfjörður
Neskaupstaður
Djúpivogur
Höfn
Fáskrúðsfjörður
@IS|musei|0
National Museum of Iceland|Museo nazionale d'Islanda
National Gallery of Iceland
Reykjavík Art Museum
Árbær Open Air Museum
The Settlement Exhibition
Perlan
Hallgrímskirkja
Harpa (concert hall)|Harpa
Whales of Iceland
Icelandic Phallological Museum|Museo fallologico islandese|Museo con contenuti per adulti: valuta l'opportunità della visita per i bambini.
Reykjanes Art Museum
Viking World museum
@IS|musei|2
The Settlement Center
Norwegian House (Stykkishólmur)
Snorrastofa
@IS|musei|3
Westfjords Heritage Museum
Museum of Icelandic Sorcery and Witchcraft
@IS|musei|4
Herring Era Museum
Akureyri Museum
Glaumbær
Húsavík Whale Museum
Icelandic Aviation Museum
@IS|musei|5
East Iceland Heritage Museum
Petra's Stone Collection
@IS|natura|0
Reykjanes Geopark
Krýsuvík
Gunnuhver
Kleifarvatn
Bridge Between Continents
@IS|natura|1
Þingvellir
Gullfoss
Geysir
Strokkur
Kerið
Seljalandsfoss
Skógafoss
Dyrhólaey
Reynisfjara|Reynisfjara|Spiaggia con accessi e condizioni del mare da verificare sul posto.
Fjaðrárgljúfur
Landmannalaugar
Þórsmörk
Hjálparfoss
Háifoss
@IS|musei|1
Þjóðveldisbærinn Stöng
@IS|natura|2
Snæfellsjökull National Park
Kirkjufell
Arnarstapi
Lóndrangar
Djúpalónssandur
Hraunfossar
Barnafoss
Deildartunguhver
Grábrók
@IS|natura|3
Dynjandi
Látrabjarg
Rauðisandur
Hornstrandir
@IS|natura|4
Goðafoss
Dettifoss
Selfoss (waterfall)
Mývatn
Námafjall
Dimmuborgir
Hverfjall
Ásbyrgi
Hljóðaklettar
Hvítserkur
Aldeyjarfoss
@IS|natura|5
Vatnajökull National Park
Skaftafell
Svartifoss
Jökulsárlón
Fjallsárlón
Vestrahorn
Hengifoss
Stuðlagil
@IS|isole|1
Heimaey
Vestmannaeyjar
@IS|isole|3
Vigur
Flatey, Breiðafjörður
@IS|isole|4
Grímsey
Hrísey
@IS|fauna|0
Reykjavík Family Park and Zoo
@IS|aeroporti|0
Keflavík International Airport
Reykjavík Airport
@IS|aeroporti|4
Akureyri Airport
Húsavík Airport
@IS|aeroporti|5
Egilsstaðir Airport
Hornafjörður Airport
@IS|aeroporti|3
Ísafjörður Airport
Bíldudalur Airport
@IS|aeroporti|1
Vestmannaeyjar Airport
@IS|porti|0
Port of Reykjavík
Skarfabakki
@IS|porti|1
Landeyjahöfn
Þorlákshöfn
@IS|porti|2
Brjánslækur
@IS|porti|5
Port of Seyðisfjörður
@FI|citta|0
Helsinki
Espoo
Vantaa
Porvoo
Loviisa
Hanko
Raseborg
@FI|citta|1
Turku
Naantali
Rauma, Finland|Rauma
Pori
Uusikaupunki
Salo, Finland|Salo
Mariehamn
Parainen
@FI|citta|2
Tampere
Hämeenlinna
Lahti
Jyväskylä
Keuruu
Mänttä-Vilppula
@FI|citta|3
Kuopio
Savonlinna
Mikkeli
Lappeenranta
Imatra
Joensuu
Kouvola
Kotka
Hamina
@FI|citta|4
Oulu
Vaasa
Kokkola
Kalajoki
Jakobstad
Kajaani
Kuhmo
@FI|citta|5
Rovaniemi
Kemi
Tornio
Inari
Ivalo
Saariselkä
Kittilä
Sodankylä
Muonio
Enontekiö
@FI|musei|0
Suomenlinna
Helsinki Cathedral
Temppeliaukio Church
Uspenski Cathedral
Ateneum
Kiasma
Amos Rex
Design Museum, Helsinki
Finnish Museum of Natural History
Seurasaari
Helsinki City Museum
Heureka
Hvitträsk
@FI|musei|1
Turku Castle
Turku Cathedral
Aboa Vetus Ars Nova
Luostarinmäki
Forum Marinum
Åland Maritime Museum
Pommern (ship)
@FI|musei|2
Vapriikki
Moomin Museum
Spy Museum (Tampere)
The Finnish Labour Museum Werstas
Häme Castle
Sibelius Hall
Petäjävesi Old Church
@FI|musei|3
Olavinlinna
Kerimäki Church
Lusto – The Finnish Forest Museum
Verla
Maritime Centre Vellamo
@FI|musei|4
Oulu Museum of Art
Turkansaari
Kajaani Castle
@FI|musei|5
Arktikum
Science Centre Pilke
Siida (museum)
Sámi Museum Siida
Santa Claus Village|Villaggio di Babbo Natale|Attrazione a Rovaniemi; apertura e attività da verificare per le date scelte.
Sodankylä Old Church
@FI|natura|0
Nuuksio National Park
Sipoonkorpi National Park
Vallisaari
Kaivopuisto
@FI|natura|1
Archipelago National Park
Teijo National Park
Kurjenrahka National Park
@FI|natura|2
Pyynikki
Helvetinjärvi National Park
Seitseminen National Park
Päijänne National Park
Leivonmäki National Park
@FI|natura|3
Koli National Park
Linnansaari National Park
Kolovesi National Park
Repovesi National Park
Punkaharju
@FI|natura|4
Oulanka National Park
Hossa National Park
Rokua National Park
Hiidenportti National Park
Syöte National Park
@FI|natura|5
Pallas-Yllästunturi National Park
Urho Kekkonen National Park
Lemmenjoki National Park
Pyhä-Luosto National Park
Riisitunturi National Park
Korouoma
Saana
Lake Inari
@FI|isole|1
Åland
Utö (Finland)
Seili
@FI|isole|4
Hailuoto
@FI|parchi|0
Linnanmäki
Serena Waterpark
@FI|parchi|1
Moomin World
@FI|parchi|2
Särkänniemi
@FI|parchi|4
PowerPark
@FI|fauna|0
Helsinki Zoo
@FI|fauna|4
Ähtäri Zoo
@FI|fauna|5
Ranua Wildlife Park
@FI|aeroporti|0
Helsinki Airport
@FI|aeroporti|1
Turku Airport
Mariehamn Airport
@FI|aeroporti|2
Tampere–Pirkkala Airport
Jyväskylä Airport
@FI|aeroporti|3
Kuopio Airport
Joensuu Airport
Lappeenranta Airport
Savonlinna Airport
@FI|aeroporti|4
Oulu Airport
Vaasa Airport
Kajaani Airport
@FI|aeroporti|5
Rovaniemi Airport
Kittilä Airport
Ivalo Airport
Kemi-Tornio Airport
@FI|treni|0
Helsinki Central railway station
Pasila railway station
Tikkurila railway station
Helsinki Airport railway station
@FI|treni|1
Turku Central railway station
Kupittaa railway station
Pori railway station
@FI|treni|2
Tampere railway station
Hämeenlinna railway station
Lahti railway station
Jyväskylä railway station
@FI|treni|3
Kuopio railway station
Joensuu railway station
Savonlinna railway station
Mikkeli railway station
Lappeenranta railway station
Kouvola railway station
@FI|treni|4
Oulu railway station
Vaasa railway station
Seinäjoki railway station
Kajaani railway station
@FI|treni|5
Rovaniemi railway station
Kemi railway station
Kolari railway station
Kemijärvi railway station
@FI|porti|0
Port of Helsinki
South Harbour, Helsinki
West Harbour, Helsinki
@FI|porti|1
Port of Turku
Port of Naantali
Port of Mariehamn
@FI|porti|4
Port of Vaasa
Port of Oulu
@GB|citta|0
London|Londra
Canterbury
Oxford
@GB|citta|2
Cambridge
@GB|citta|0
Windsor, Berkshire
Brighton
Winchester
Portsmouth
@GB|citta|1
Bath, Somerset|Bath
Bristol
Exeter
Plymouth
St Ives, Cornwall
Penzance
Salisbury
@GB|citta|2
Birmingham
Stratford-upon-Avon
Warwick
Nottingham
Lincoln, England|Lincoln
Norwich
@GB|citta|3
York
Manchester
Liverpool
Chester
Durham, England|Durham
Newcastle upon Tyne
Keswick, Cumbria
Whitby
@GB|citta|4
Cardiff
Conwy
Caernarfon
Llandudno
St Davids
Tenby
Aberystwyth
@GB|citta|5
Belfast
Derry
Portrush
@GB|citta|6
Edinburgh|Edimburgo
St Andrews
Stirling
Perth, Scotland|Perth
Dunfermline
Melrose, Scottish Borders
North Berwick
@GB|citta|7
Inverness
Fort William, Highland
Portree
Ullapool
Dornoch
Fort Augustus
@GB|citta|8
Aberdeen
Elgin, Moray
Braemar
Ballater
Aviemore
Grantown-on-Spey
@GB|citta|9
Kirkwall
Stromness
Lerwick
Stornoway
Tobermory, Mull
@GB|citta|10
Oban
Glasgow
Inveraray
Luss
Dunoon
Rothesay
@GB|musei|0
British Museum
Natural History Museum, London
Science Museum, London
Victoria and Albert Museum
National Gallery
Tate Modern
Tower of London|Torre di Londra
Westminster Abbey
St Paul's Cathedral
Windsor Castle
Hampton Court Palace
Warner Bros. Studio Tour London – The Making of Harry Potter
Ashmolean Museum
Mary Rose Museum
@GB|musei|1
Roman Baths (Bath)
Stonehenge
SS Great Britain
Brunel's SS Great Britain
Royal Albert Memorial Museum
St Michael's Mount
Tintagel Castle
@GB|musei|2
Fitzwilliam Museum
Warwick Castle
Shakespeare's Birthplace
Black Country Living Museum
Ironbridge Gorge Museum Trust
@GB|musei|3
National Railway Museum
York Minster
Jorvik Viking Centre
World Museum
Museum of Liverpool
Science and Industry Museum
Durham Cathedral
Beamish Museum
Bamburgh Castle
Alnwick Castle
@GB|musei|4
St Fagans National Museum of History
National Museum Cardiff
Caernarfon Castle
Conwy Castle
Pembroke Castle
@GB|musei|5
Titanic Belfast
Ulster Museum
@GB|musei|6
Edinburgh Castle
National Museum of Scotland
Scottish National Gallery
Palace of Holyroodhouse
Royal Yacht Britannia
Rosslyn Chapel
Stirling Castle
National Wallace Monument
St Andrews Cathedral
The Kelpies
Falkirk Wheel
Melrose Abbey
@GB|musei|7
Urquhart Castle
Eilean Donan
Dunvegan Castle
Glenfinnan Viaduct
Culloden
Inverness Castle|Castello di Inverness|Sedi e modalità di accesso da verificare dopo gli interventi di riqualificazione.
@GB|musei|8
Balmoral Castle
Dunnottar Castle
Glamis Castle
Elgin Cathedral
Aberdeen Maritime Museum
Crathes Castle
Craigievar Castle
Fyvie Castle
@GB|musei|9
Skara Brae
Maeshowe
Ring of Brodgar
Standing Stones of Stenness
Jarlshof
Broch of Mousa
Callanish Stones
Iona Abbey
@GB|musei|10
Kelvingrove Art Gallery and Museum
Riverside Museum
The Burrell Collection
Glasgow Science Centre
Inveraray Castle
Paisley Abbey
@GB|natura|0
Royal Botanic Gardens, Kew
South Downs National Park
@GB|natura|1
Dartmoor
Exmoor
New Forest National Park
Jurassic Coast
@GB|natura|2
Peak District
@GB|natura|3
Lake District
Yorkshire Dales National Park
North York Moors National Park
Northumberland National Park
@GB|natura|4
Eryri National Park
Pembrokeshire Coast National Park
Bannau Brycheiniog National Park
@GB|natura|5
Giant's Causeway
Carrick-a-Rede Rope Bridge
Mourne Mountains
@GB|natura|6
Arthur's Seat
Royal Botanic Garden Edinburgh
@GB|natura|7
Loch Ness
Ben Nevis
Glen Coe
Glenfinnan
The Storr
Quiraing
Fairy Pools
Loch Maree
Torridon
@GB|natura|8
Cairngorms National Park
Loch Morlich
Loch an Eilein
@GB|natura|10
Loch Lomond and The Trossachs National Park
Loch Lomond
Benmore Botanic Garden
@GB|isole|7
Isle of Skye
@GB|isole|9
Isle of Mull
Iona
Islay
Isle of Arran
Lewis and Harris
Orkney Mainland
Mainland, Shetland
@GB|parchi|0
Legoland Windsor Resort
Chessington World of Adventures
@GB|parchi|2
Alton Towers
@GB|parchi|8
Landmark Forest Adventure Park
@GB|fauna|0
London Zoo
@GB|fauna|1
Longleat
@GB|fauna|3
Chester Zoo
@GB|fauna|6
Edinburgh Zoo
@GB|fauna|8
Highland Wildlife Park
@GB|aeroporti|0
Heathrow Airport
Gatwick Airport
London Stansted Airport
London Luton Airport
London City Airport
Southampton Airport
@GB|aeroporti|1
Bristol Airport
Exeter Airport
Cornwall Airport Newquay
@GB|aeroporti|2
Birmingham Airport
East Midlands Airport
@GB|aeroporti|3
Manchester Airport
Liverpool John Lennon Airport
Newcastle Airport
Leeds Bradford Airport
@GB|aeroporti|4
Cardiff Airport
@GB|aeroporti|5
Belfast International Airport
George Best Belfast City Airport
@GB|aeroporti|6
Edinburgh Airport
@GB|aeroporti|7
Inverness Airport
@GB|aeroporti|8
Aberdeen Airport
@GB|aeroporti|9
Kirkwall Airport
Sumburgh Airport
Stornoway Airport
@GB|aeroporti|10
Glasgow Airport
Glasgow Prestwick Airport
@GB|treni|0
London King's Cross railway station
St Pancras railway station
London Euston railway station
London Paddington station
London Waterloo station
London Victoria station
Oxford railway station
Cambridge railway station
@GB|treni|1
Bath Spa railway station
Bristol Temple Meads railway station
Exeter St Davids railway station
Penzance railway station
@GB|treni|2
Birmingham New Street railway station
Nottingham railway station
@GB|treni|3
Manchester Piccadilly station
Liverpool Lime Street railway station
York railway station
Newcastle railway station
@GB|treni|4
Cardiff Central railway station
@GB|treni|5
Belfast Grand Central station
@GB|treni|6
Edinburgh Waverley railway station
Haymarket railway station
Stirling railway station
Perth railway station (Scotland)
@GB|treni|7
Inverness railway station
Fort William railway station
Mallaig railway station
Kyle of Lochalsh railway station
@GB|treni|8
Aberdeen railway station
Aviemore railway station
@GB|treni|10
Glasgow Central station
Glasgow Queen Street railway station
@GB|porti|0
Port of Dover
Portsmouth International Port
Port of Southampton
@GB|porti|1
Port of Plymouth
Poole Harbour
@GB|porti|3
Port of Tyne
Port of Liverpool
@GB|porti|4
Holyhead Port
Fishguard Harbour
@GB|porti|5
Port of Belfast
Larne Harbour
@GB|porti|6
Port of Rosyth
Port of Leith
@GB|porti|7
Ullapool Harbour
Mallaig Harbour
@GB|porti|8
Port of Aberdeen
@GB|porti|9
Lerwick Harbour
Stornoway Harbour
@GB|porti|10
Port of Greenock
@IE|citta|0
Dublin|Dublino
Wicklow
Bray, County Wicklow
Dalkey
Dún Laoghaire
Enniskerry
@IE|citta|1
Cork (city)|Cork
Cobh
Kinsale
Clonakilty
Skibbereen
Waterford
Wexford
Kilkenny
Clonmel
@IE|citta|2
Killarney
Tralee
Dingle
Kenmare
Cahersiveen
@IE|citta|3
Limerick
Ennis
Galway
Clifden
Cong, County Mayo
Doolin
Kinvara
@IE|citta|4
Westport, County Mayo
Ballina, County Mayo
Sligo
Donegal (town)|Donegal
Letterkenny
Ardara, County Donegal
@IE|citta|5
Athlone
Birr
Tullamore
Mullingar
Trim, County Meath
Kells, County Meath
Drogheda
Dundalk
Cashel, County Tipperary
@IE|musei|0
Trinity College Dublin
National Museum of Ireland – Archaeology
National Gallery of Ireland
Chester Beatty Library
EPIC The Irish Emigration Museum
Guinness Storehouse|Guinness Storehouse|Museo della storia del birrificio; attività ed età richieste da verificare.
Kilmainham Gaol
Dublin Castle
Christ Church Cathedral, Dublin
St Patrick's Cathedral, Dublin
Irish Museum of Modern Art
Little Museum of Dublin
Malahide Castle
Powerscourt Estate
Glendalough
@IE|musei|1
Blarney Castle
Charles Fort (Ireland)
Cork City Gaol
Titanic Experience Cobh
Waterford Treasures
Irish National Heritage Park
Kilkenny Castle
Rock of Cashel
@IE|musei|2
Muckross House
Ross Castle
Gallarus Oratory
Skellig Michael
@IE|musei|3
Bunratty Castle
King John's Castle (Limerick)
Kylemore Abbey
Dunguaire Castle
Poulnabrone dolmen
@IE|musei|4
Ceide Fields
Glenveagh Castle
Parke's Castle
Sligo Abbey
@IE|musei|5
Newgrange
Knowth
Trim Castle
Clonmacnoise
Birr Castle
Loughcrew
Hill of Tara
@IE|natura|0
Wicklow Mountains National Park
Howth Head
Phoenix Park
National Botanic Gardens (Ireland)
@IE|natura|1
Fota Island
Copper Coast Geopark
@IE|natura|2
Killarney National Park
Gap of Dunloe
Torc Waterfall
Carrauntoohil
Ring of Kerry
Slea Head
@IE|natura|3
Cliffs of Moher
The Burren
Connemara National Park
Killary Harbour
@IE|natura|4
Ballycroy National Park
Glenveagh National Park
Slieve League
Benbulbin
Croagh Patrick
Downpatrick Head
@IE|isole|2
Valentia Island
@IE|isole|3
Inishmore
Inishmaan
Inisheer
@IE|isole|4
Achill Island
Clare Island
Tory Island
@IE|parchi|0
Emerald Park (Ireland)
@IE|fauna|0
Dublin Zoo
@IE|fauna|1
Fota Wildlife Park
@IE|aeroporti|0
Dublin Airport
@IE|aeroporti|1
Cork Airport
@IE|aeroporti|2
Kerry Airport
@IE|aeroporti|3
Shannon Airport
@IE|aeroporti|4
Ireland West Airport
Donegal Airport
@IE|treni|0
Dublin Heuston railway station
Dublin Connolly railway station
Dublin Pearse railway station
Dún Laoghaire railway station
Bray railway station
@IE|treni|1
Cork Kent railway station
Cobh railway station
Waterford railway station
Wexford railway station
Kilkenny railway station
@IE|treni|2
Killarney railway station
Tralee railway station
@IE|treni|3
Galway railway station
Limerick railway station
Ennis railway station
@IE|treni|4
Sligo railway station
Westport railway station
@IE|treni|5
Athlone railway station
Drogheda railway station
Dundalk railway station
@IE|porti|0
Dublin Port
Dún Laoghaire Harbour
@IE|porti|1
Port of Cork
Rosslare Europort
@IE|porti|3
Port of Galway
Doolin Pier
Rossaveal
@TH|citta|0
Bangkok
Phra Nakhon Si Ayutthaya (city)|Ayutthaya
Lopburi
Kanchanaburi
Nakhon Pathom
Samut Songkhram
Phetchaburi
Hua Hin
@TH|citta|1
Chiang Mai
Chiang Rai
Lampang
Lamphun
Nan, Thailand|Nan
Pai, Thailand|Pai
Mae Hong Son
Sukhothai (town)|Sukhothai
Phitsanulok
Mae Sot
@TH|citta|2
Nakhon Ratchasima
Khon Kaen
Udon Thani
Nong Khai
Ubon Ratchathani
Nakhon Phanom
@TH|citta|3
Pattaya
Chonburi
Rayong
Chanthaburi
Trat
@TH|citta|4
Phuket (city)|Phuket Town
Krabi
Takua Pa
Phang Nga
Trang
Satun
@TH|citta|5
Surat Thani
Nakhon Si Thammarat
Songkhla
Hat Yai
Chumphon
@TH|musei|0
Grand Palace
Wat Phra Kaew
Wat Pho
Wat Arun
Bangkok National Museum
Jim Thompson House
Museum Siam
Suan Pakkad Palace
Ancient Siam
Erawan Museum
Wat Mahathat, Ayutthaya
Wat Chaiwatthanaram
Ayutthaya Historical Park
Bang Pa-In Royal Palace
Thailand–Burma Railway Centre
JEATH War Museum
Phra Pathommachedi
@TH|musei|1
Wat Phra That Doi Suthep
Wat Chedi Luang
Wat Phra Singh
Wat Rong Khun
Wat Rong Suea Ten
Baan Dam Museum
Sukhothai Historical Park
Si Satchanalai Historical Park
Wat Phra That Lampang Luang
Wat Phumin
@TH|musei|2
Phimai Historical Park
Phanom Rung Historical Park
Ban Chiang
@TH|musei|3
Sanctuary of Truth
Nong Nooch Tropical Botanical Garden
@TH|musei|4
Wat Chalong
Phuket Thai Hua Museum
@TH|musei|5
Wat Phra Mahathat Woramahawihan
@TH|natura|0
Erawan National Park
Sai Yok National Park
Khao Yai National Park
Kaeng Krachan National Park
@TH|natura|1
Doi Inthanon National Park
Doi Suthep-Pui National Park
Khun Korn Waterfall
Tham Lot cave
@TH|natura|2
Phu Kradueng National Park
Pha Taem National Park
Sam Phan Bok
@TH|natura|3
Khao Chamao-Khao Wong National Park
@TH|natura|4
Khao Sok National Park
Ao Phang Nga National Park
Mu Ko Similan National Park
Mu Ko Surin National Park
Hat Noppharat Thara-Mu Ko Phi Phi National Park
Railay Beach
Emerald Pool (Thailand)
@TH|natura|5
Mu Ko Ang Thong National Park
Khao Sam Roi Yot National Park
@TH|isole|3
Ko Chang
Ko Mak
Ko Kut
Ko Samet
Ko Lan
@TH|isole|4
Phuket
Ko Phi Phi
Ko Lanta
Ko Yao Noi
Ko Yao Yai
Ko Lipe
Ko Muk
Ko Kradan
@TH|isole|5
Ko Samui
Ko Pha Ngan
Ko Tao
@TH|parchi|0
Dream World
Siam Amazing Park
@TH|parchi|4
Andamanda Phuket
@TH|fauna|0
SEA LIFE Bangkok Ocean World
@TH|aeroporti|0
Suvarnabhumi Airport
Don Mueang International Airport
Hua Hin Airport
@TH|aeroporti|1
Chiang Mai International Airport
Mae Fah Luang–Chiang Rai International Airport
Lampang Airport
Nan Nakhon Airport
Mae Hong Son Airport
Phitsanulok Airport
Sukhothai Airport
@TH|aeroporti|2
Khon Kaen Airport
Udon Thani International Airport
Ubon Ratchathani Airport
Nakhon Phanom Airport
@TH|aeroporti|3
U-Tapao International Airport
Trat Airport
@TH|aeroporti|4
Phuket International Airport
Krabi International Airport
Trang Airport
@TH|aeroporti|5
Samui Airport
Surat Thani International Airport
Hat Yai International Airport
Nakhon Si Thammarat Airport
Chumphon Airport
@TH|treni|0
Krung Thep Aphiwat Central Terminal
Bangkok railway station|Stazione di Hua Lamphong
Ayutthaya railway station
Kanchanaburi railway station
Nakhon Pathom railway station
Hua Hin railway station
Lopburi railway station
@TH|treni|1
Chiang Mai railway station
Lampang railway station
Phitsanulok railway station
@TH|treni|2
Nakhon Ratchasima railway station
Khon Kaen railway station
Udon Thani railway station
Nong Khai railway station
Ubon Ratchathani railway station
@TH|treni|3
Pattaya railway station
@TH|treni|5
Surat Thani railway station
Chumphon railway station
Hat Yai Junction railway station
@TH|porti|0
Khlong Toei Port
@TH|porti|3
Laem Chabang Port
Bang Bao|Area del molo di Bang Bao
@TH|porti|4
Rassada Pier
Ao Po Pier
@TH|porti|5
Donsak Pier
Nathon Pier
Thong Sala
Mae Haad Pier
@KH|citta|0
Phnom Penh
Ta Khmau
Oudong
Kampong Chhnang (city)
@KH|citta|1
Siem Reap
Kampong Thom (city)
Preah Vihear (city)
Sra Aem
@KH|citta|2
Battambang
Pursat (city)
Sisophon
Pailin
Poipet
Banteay Chhmar
@KH|citta|3
Kampot (city)
Kep (town)
Sihanoukville (city)
Koh Kong (city)
@KH|citta|4
Kratié (town)
Stung Treng (city)
Kampong Cham (city)
Banlung
Senmonorom
@KH|musei|0
Royal Palace of Cambodia
Silver Pagoda, Phnom Penh
National Museum of Cambodia
Wat Phnom
Tuol Sleng Genocide Museum|Museo Tuol Sleng|Luogo della memoria con contenuti traumatici: valuta l'opportunità della visita per i bambini.
Choeung Ek|Memoriale Choeung Ek|Luogo della memoria con contenuti traumatici: valuta l'opportunità della visita per i bambini.
Independence Monument, Phnom Penh
Central Market, Phnom Penh
Wat Ounalom
Wat Langka
Chaktomuk Conference Hall
@KH|musei|1
Angkor Wat
Angkor Thom
Bayon
Ta Prohm
Banteay Srei
Preah Khan
Neak Pean
Ta Som
Pre Rup
East Mebon
Banteay Kdei
Srah Srang
Ta Keo
Phimeanakas
Baphuon
Terrace of the Elephants
Terrace of the Leper King
Prasat Kravan
Bakong
Preah Ko
Lolei
Beng Mealea
Koh Ker
Sambor Prei Kuk
Preah Vihear Temple|Tempio di Preah Vihear|Accessi e condizioni locali da verificare prima di partire; nessun collegamento confermato.
Angkor National Museum
Landmine Museum
Cambodia Peace Gallery
Chau Say Tevoda
Thommanon
Baksei Chamkrong
Ta Nei
Ta Prohm Kel
Spean Thma
Prasat Suor Prat
@KH|musei|2
Wat Ek Phnom
Phnom Banan
Banteay Chhmar
Battambang Museum
Wat Damrei Sar
@KH|musei|3
Wat Samathi
Kampot Provincial Museum
@KH|musei|4
Wat Nokor
Phnom Han Chey
Phnom Srei
Phnom Pros
@KH|natura|1
Tonlé Sap
Phnom Kulen National Park
Kbal Spean
West Baray
East Baray
@KH|natura|2
Phnom Sampeau
@KH|natura|3
Preah Monivong Bokor National Park
Kep National Park
Ream National Park
Kirirom National Park
Botum Sakor National Park
Peam Krasop Wildlife Sanctuary
Tatai River
@KH|natura|4
Virachey National Park
Yeak Laom Lake
@KH|isole|3
Koh Rong
Koh Rong Sanloem
Koh Tonsay
Koh Ta Kiev
Koh Russey
Koh Sdach
@KH|aeroporti|0
Techo International Airport
@KH|aeroporti|1
Siem Reap–Angkor International Airport
@KH|aeroporti|3
Sihanouk International Airport
@KH|treni|0
Phnom Penh railway station
@KH|treni|2
Battambang railway station
Pursat railway station
Poipet railway station
Sisophon railway station
@KH|treni|3
Kampot railway station
Sihanoukville railway station
Takeo railway station
@KH|porti|0
Phnom Penh Autonomous Port
@KH|porti|3
Sihanoukville Autonomous Port
Kampot International Tourist Port
@VN|citta|0
Hanoi
Ninh Bình
Hải Phòng
Hạ Long
Nam Định
Thái Bình
@VN|citta|1
Sa Pa
Hà Giang
Lào Cai
Cao Bằng
Điện Biên Phủ
Sơn La
Mai Châu
Mộc Châu
Bắc Hà
@VN|citta|2
Huế
Da Nang|Đà Nẵng
Hội An
Đồng Hới
Đông Hà
@VN|citta|3
Nha Trang
Da Lat|Đà Lạt
Quy Nhon|Quy Nhơn
Tuy Hòa
Phan Thiết
Buôn Ma Thuột
Pleiku
Kon Tum
@VN|citta|4
Ho Chi Minh City
Vũng Tàu
Tây Ninh
Biên Hòa
@VN|citta|5
Cần Thơ
Mỹ Tho
Bến Tre
Vĩnh Long
Châu Đốc
Hà Tiên
Rạch Giá
Sóc Trăng
Cà Mau
@VN|musei|0
Ho Chi Minh Mausoleum
Temple of Literature, Hanoi
Imperial Citadel of Thăng Long
Vietnam Museum of Ethnology
Vietnam National Museum of History
Vietnam Military History Museum
Vietnamese Women's Museum
Hoa Lo Prison
One Pillar Pagoda
Tran Quoc Pagoda
@VN|musei|1
Dinh Vua Meo
@VN|musei|2
Imperial City of Huế
Thiên Mụ Temple
Tomb of Khải Định
Tomb of Minh Mạng
Museum of Cham Sculpture
Japanese Covered Bridge
Mỹ Sơn
Vinh Moc tunnels
@VN|musei|3
Po Nagar
Po Klong Garai
Linh Phước Temple
Crazy House
Đà Lạt Railway Station
Kon Tum Cathedral
@VN|musei|4
War Remnants Museum
Independence Palace
Ho Chi Minh City Museum
Saigon Central Post Office
Notre-Dame Cathedral Basilica of Saigon
Cu Chi tunnels
Cao Dai Holy See
@VN|musei|5
Vĩnh Tràng Temple
Cái Răng floating market
@VN|natura|0
Hạ Long Bay
Tràng An
Tam Cốc – Bích Động
Cúc Phương National Park
Ba Vì National Park
Hoàn Kiếm Lake
Ho Tay|Lago Tây
@VN|natura|1
Fansipan
Hồ Ba Bể
Ba Bể National Park
Bản Giốc–Detian Falls|Cascate Bản Giốc|Sito di confine: accessi, percorsi e lato visitabile da verificare.
Mù Cang Chải
Hoàng Liên National Park
@VN|natura|2
Phong Nha-Kẻ Bàng National Park
Phong Nha Cave
Paradise Cave (Vietnam)
Bạch Mã National Park
Marble Mountains (Vietnam)
Sơn Trà Mountain
Hải Vân Pass
@VN|natura|3
Bidoup Núi Bà National Park
Datanla Falls
Pongour Falls
Mũi Né
Núi Chúa National Park
Yok Đôn National Park
@VN|natura|4
Cát Tiên National Park
Can Gio Mangrove Biosphere Reserve
Black Virgin Mountain
@VN|natura|5
Tràm Chim National Park
U Minh Thượng National Park
Phú Quốc National Park
@VN|isole|0
Cát Bà Island
Cô Tô Island
@VN|isole|2
Chàm Islands
@VN|isole|4
Côn Đảo
@VN|isole|5
Phú Quốc
@VN|parchi|0
Sun World Hạ Long
@VN|parchi|2
Ba Na Hills
@VN|fauna|4
Saigon Zoo and Botanical Gardens
@VN|aeroporti|0
Noi Bai International Airport
Cat Bi International Airport
Van Don International Airport
@VN|aeroporti|1
Dien Bien Phu Airport
@VN|aeroporti|2
Da Nang International Airport
Phu Bai International Airport
Dong Hoi Airport
@VN|aeroporti|3
Cam Ranh International Airport
Lien Khuong Airport
Phu Cat Airport
Tuy Hoa Airport
Buon Ma Thuot Airport
Pleiku Airport
@VN|aeroporti|4
Tan Son Nhat International Airport
@VN|aeroporti|5
Can Tho International Airport
Phu Quoc International Airport
Rach Gia Airport
@VN|treni|0
Hanoi railway station
Gia Lâm railway station
Hải Phòng railway station
Ninh Bình railway station
Nam Định railway station
@VN|treni|1
Lào Cai railway station
@VN|treni|2
Đồng Hới railway station
Huế railway station
Đà Nẵng railway station
@VN|treni|3
Nha Trang railway station
Diêu Trì railway station
Tháp Chàm railway station
Đà Lạt railway station
@VN|treni|4
Saigon railway station
Biên Hòa railway station
@VN|porti|0
Port of Haiphong
Lach Huyen Port
Tuần Châu Marina
@VN|porti|2
Port of Da Nang
Chân Mây Port
@VN|porti|3
Port of Quy Nhon
Cam Ranh Port
@VN|porti|4
Port of Saigon
Cái Mép–Thị Vải Port
@VN|porti|5
Hà Tiên ferry port
@IN|citta|0
New Delhi
Delhi
Agra
Varanasi
Lucknow
Prayagraj
Mathura
Vrindavan
Fatehpur Sikri
Ayodhya
@IN|citta|1
Jaipur
Jodhpur
Udaipur
Jaisalmer
Bikaner
Pushkar
Ajmer
Bundi
Chittorgarh
Mandawa
Mount Abu
Ranakpur
@IN|citta|2
Amritsar
Chandigarh
Patiala
Anandpur Sahib
Kurukshetra
@IN|citta|3
Rishikesh
Haridwar
Dehradun
Mussoorie
Nainital
Almora
Ranikhet
@IN|citta|4
Shimla
Manali, Himachal Pradesh
Dharamshala
McLeod Ganj
Dalhousie, India
Kasauli
Kullu
@IN|citta|5
Leh
Diskit
@IN|musei|0
Taj Mahal
Agra Fort
Itmad-ud-Daulah
Akbar's tomb
Red Fort
Humayun's Tomb
Qutb Minar
Lotus Temple
India Gate
National Museum, New Delhi
National Rail Museum, New Delhi
Gandhi Smriti
Jama Masjid, Delhi
Akshardham (Delhi)
Sarnath
Ramnagar Fort
Bara Imambara
@IN|musei|1
Amber Fort
City Palace, Jaipur
Hawa Mahal
Jantar Mantar, Jaipur
Albert Hall Museum
Nahargarh Fort
Jaigarh Fort
Mehrangarh
Umaid Bhawan Palace
City Palace, Udaipur
Lake Palace
Jaisalmer Fort
Patwon Ki Haveli
Junagarh Fort
Chittor Fort
Kumbhalgarh
Ranakpur Jain temple
Dilwara Temples
Brahma Temple, Pushkar
@IN|musei|2
Golden Temple
Jallianwala Bagh
Partition Museum
Rock Garden of Chandigarh
Capitol Complex, Chandigarh
Pinjore Gardens
@IN|musei|3
Mansa Devi Temple, Haridwar
Forest Research Institute (India)
@IN|musei|4
Hidimba Devi Temple
Christ Church, Shimla
Kangra Fort
Tabo Monastery
Key Monastery
Dhankar Gompa
@IN|musei|5
Leh Palace
Thikse Monastery
Hemis Monastery
Diskit Monastery
Shanti Stupa
@IN|natura|1
Keoladeo National Park
Ranthambore National Park
Sariska Tiger Reserve
Desert National Park
Lake Pichola
Fateh Sagar Lake
@IN|natura|3
Jim Corbett National Park
Rajaji National Park
Valley of Flowers National Park
Nanda Devi National Park
Naini Lake
@IN|natura|4
Great Himalayan National Park
Khajjiar
@IN|natura|5
Pangong Tso|Pangong Tso|Lago di confine: accessi, permessi e aree visitabili da verificare.
Nubra Valley
@IN|aeroporti|0
Indira Gandhi International Airport
Chaudhary Charan Singh International Airport
Lal Bahadur Shastri International Airport
Agra Airport
@IN|aeroporti|1
Jaipur International Airport
Jodhpur Airport
Maharana Pratap Airport
Jaisalmer Airport
@IN|aeroporti|2
Sri Guru Ram Dass Jee International Airport
Chandigarh Airport
@IN|aeroporti|3
Jolly Grant Airport
Pantnagar Airport
@IN|aeroporti|4
Kangra Airport
Kullu–Manali Airport
Shimla Airport
@IN|aeroporti|5
Kushok Bakula Rimpochee Airport
@IN|treni|0
New Delhi railway station
Delhi Junction railway station
Hazrat Nizamuddin railway station
Agra Cantonment railway station
Varanasi Junction railway station
Lucknow Charbagh railway station
Prayagraj Junction railway station
Mathura Junction railway station
@IN|treni|1
Jaipur Junction railway station
Jodhpur Junction railway station
Udaipur City railway station
Jaisalmer railway station
Ajmer Junction railway station
@IN|treni|2
Amritsar Junction railway station
Chandigarh railway station
@IN|treni|3
Haridwar railway station
Rishikesh railway station
Dehradun railway station
Kathgodam railway station
@IN|treni|2
Kalka railway station
@IN|treni|4
Shimla railway station
@IN|citta|6
Bengaluru|Bangalore
Mysore|Mysuru
Hampi
Badami
Pattadakal
Aihole
Gokarna, Karnataka
Madikeri
Udupi
Mangalore|Mangaluru
Chikmagalur
Hassan, Karnataka
@IN|citta|7
Kochi
Alappuzha
Munnar
Thekkady
Kumarakom
Thiruvananthapuram
Varkala
Kovalam
Kozhikode
@IN|citta|8
Chennai
Madurai
Thanjavur
Tiruchirappalli
Mamallapuram
Kanchipuram
Puducherry
Kumbakonam
Ooty
Coonoor
Kodaikanal
Rameswaram
Kanyakumari
@IN|citta|9
Hyderabad
Warangal
Vijayawada
Visakhapatnam
Tirupati
Amaravati
@IN|citta|10
Panaji
Margao
Old Goa
Mapusa
@IN|musei|6
Mysore Palace
Bangalore Palace
Tipu Sultan's Summer Palace
Visvesvaraya Industrial and Technological Museum
Virupaksha Temple, Hampi
Vijaya Vitthala Temple
Badami cave temples
Group of Monuments at Pattadakal
Chennakeshava Temple, Belur
Hoysaleswara Temple
Shravanabelagola
@IN|musei|7
Mattancherry Palace
Paradesi Synagogue
St. Francis Church, Kochi
Hill Palace, Tripunithura
Padmanabhaswamy Temple|Tempio Padmanabhaswamy|Regole religiose, abbigliamento e accesso da verificare prima della visita.
Kerala Folklore Museum
@IN|musei|8
Meenakshi Temple
Brihadisvara Temple, Thanjavur
Airavatesvara Temple
Gangaikonda Cholapuram
Shore Temple
Pancha Rathas
Descent of the Ganges (Mahabalipuram)
Kapaleeshwarar Temple
Government Museum, Chennai
Ranganathaswamy Temple, Srirangam
Ramanathaswamy Temple
Auroville
Gingee Fort
@IN|musei|9
Charminar
Golconda
Salar Jung Museum
Chowmahalla Palace
Ramappa Temple
Thousand Pillar Temple
Borra Caves
@IN|musei|10
Basilica of Bom Jesus
Se Cathedral
Church of St. Francis of Assisi, Goa
Aguada Fort
@IN|natura|6
Bandipur National Park
Nagarhole National Park
Bannerghatta National Park
Jog Falls
Lalbagh
Cubbon Park
@IN|natura|7
Periyar National Park
Eravikulam National Park
Silent Valley National Park
Kerala backwaters
Vembanad
Athirappilly Falls
Wayanad Wildlife Sanctuary
@IN|natura|8
Mudumalai National Park
Mukurthi National Park
Pichavaram
Nilgiri Mountains
@IN|natura|9
Araku Valley
Sri Venkateswara National Park
@IN|natura|10
Mollem National Park
Dudhsagar Falls
@IN|fauna|6
Mysore Zoo
@IN|fauna|8
Madras Crocodile Bank Trust
Arignar Anna Zoological Park
@IN|aeroporti|6
Kempegowda International Airport
Mangalore International Airport
Mysore Airport
Hubli Airport
@IN|aeroporti|7
Cochin International Airport
Thiruvananthapuram International Airport
Calicut International Airport
Kannur International Airport
@IN|aeroporti|8
Chennai International Airport
Madurai Airport
Tiruchirappalli International Airport
Coimbatore International Airport
Puducherry Airport
@IN|aeroporti|9
Rajiv Gandhi International Airport
Visakhapatnam Airport
Tirupati Airport
Vijayawada Airport
@IN|aeroporti|10
Dabolim Airport
Manohar International Airport
@IN|treni|6
Krantivira Sangolli Rayanna railway station
Yesvantpur Junction railway station
Mysore Junction railway station
Hosapete Junction railway station
Mangaluru Central railway station
@IN|treni|7
Ernakulam Junction railway station
Alappuzha railway station
Thiruvananthapuram Central railway station
Kozhikode railway station
@IN|treni|8
Chennai Central railway station
Chennai Egmore railway station
Madurai Junction railway station
Thanjavur Junction railway station
Tiruchirappalli Junction railway station
Coimbatore Junction railway station
Udagamandalam railway station
Mettupalayam railway station
@IN|treni|9
Secunderabad Junction railway station
Hyderabad Deccan railway station
Vijayawada Junction railway station
Visakhapatnam railway station
Tirupati railway station
@IN|treni|10
Madgaon Junction railway station
Vasco da Gama railway station
@IN|porti|6
New Mangalore Port
@IN|porti|7
Cochin Port
Vizhinjam International Seaport
@IN|porti|8
Chennai Port
V. O. Chidambaranar Port Authority
@IN|porti|9
Visakhapatnam Port
@IN|porti|10
Mormugao Port
`;

const slug = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const CANDIDATES = Object.fromEntries(Object.keys(COUNTRIES).map((c) => [c, []]));
let group;
for (const raw of selection.split('\n')) {
  const line = raw.trim(); if (!line) continue;
  if (line.startsWith('@')) { const [code, category, index] = line.slice(1).split('|'); group = { code, category, regionIndex: Number(index) }; continue; }
  const [title, name, description] = line.split('|');
  CANDIDATES[group.code].push({ ...group, key: `${group.code.toLowerCase()}-${slug(title)}`, title, name: name || undefined, description: description || undefined });
}
for (const code of Object.keys(CANDIDATES)) CANDIDATES[code] = [...new Map(CANDIDATES[code].map((p) => [p.key, p])).values()];

// Disambiguazioni editoriali: la verifica geografica e della nazione resta obbligatoria.
const titles = {
  'Hanko': 'Hanko, Finland', 'Inari': 'Inari, Finland',
  "Brunel's SS Great Britain": 'SS Great Britain',
  'Newcastle Airport': 'Newcastle International Airport',
  'Stirling railway station': 'Stirling railway station (Scotland)',
  'Birr': 'Birr, County Offaly', 'Westport railway station': 'Westport railway station (Ireland)',
  'Emerald Park (Ireland)': 'Emerald Park (amusement park)',
  'Trang': 'Trang, Thailand', 'Ko Lanta': 'Ko Lanta Yai',
  'Dream World': 'Dream World (Thailand)',
  'Mae Fah Luang–Chiang Rai International Airport': 'Chiang Rai International Airport',
  'Preah Vihear (city)': 'Tbaeng Meanchey', 'Pursat (city)': 'Pursat',
  'Stung Treng (city)': 'Stung Treng', 'Landmine Museum': 'Cambodia Landmine Museum',
  'Preah Monivong Bokor National Park': 'Preah Monivong National Park',
  'Yeak Laom Lake': 'Yeak Laom',
  'Hà Giang': 'Hà Giang (city)', 'Lào Cai': 'Lào Cai (city)', 'Sơn La': 'Sơn La (city)',
  'Bắc Hà': 'Bắc Hà (town)', 'Hội An': 'Hoi An', 'Tây Ninh': 'Tây Ninh (city)',
  'Mỹ Tho': 'My Tho', 'Vĩnh Long': 'Vĩnh Long (city)',
  'Crazy House': 'Hằng Nga Guesthouse', 'Ho Tay': 'West Lake (Hanoi)',
  'Paradise Cave (Vietnam)': 'Thiên Đường Cave',
  'Hải Phòng railway station': 'Haiphong railway station',
  'Port of Haiphong': 'Port of Hai Phong', 'Port of Saigon': 'Saigon Port',
  'Shanti Stupa': 'Shanti Stupa, Ladakh', 'Puducherry': 'Pondicherry',
  'Lalbagh': 'Lal Bagh', 'Visakhapatnam Airport': 'Visakhapatnam International Airport',
};
for (const [code, places] of Object.entries(CANDIDATES)) for (const p of places) {
  if (p.title === 'Glamis Castle') p.regionIndex = 6;
  if (p.title === 'Isle of Arran') p.regionIndex = 10;
  if (code === 'IE' && p.title === 'Cong, County Mayo') p.regionIndex = 4;
  if (code === 'IE' && p.title === 'Cashel, County Tipperary') p.regionIndex = 1;
  p.title = titles[p.title] ?? p.title;
}
