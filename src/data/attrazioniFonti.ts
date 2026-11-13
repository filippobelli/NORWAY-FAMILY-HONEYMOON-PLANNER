// GENERATO da scripts/build-nord.mjs attrazioni a partire da docs/ricerca-luoghi-attrazioni.json: non modificare a mano.
// Dati di base del gruppo «attrazioni»: coordinate con la loro fonte (Wikidata P625 oppure OpenStreetMap/Nominatim),
// riferimenti a Wikidata e Wikipedia, sito ufficiale (Wikidata P856), foto di Wikimedia Commons con autore e licenza.
// Abbinamento: per nome E per distanza da un punto indicativo (mai salvato).

import type { NordFonte } from './nordFonti';
import type { PlacePhoto } from './placeExtras';

/** Data di lettura di coordinate, riferimenti, foto e licenze */
export const ATTR_CHECKED_AT = '2026-11-12';

export const ATTR_FONTI: Record<string, NordFonte> = {
  "vikingtidsmuseet": {
    "wd": {
      "qid": "Q961220",
      "label": "Vikingskipshuset",
      "lat": 59.90475,
      "lng": 10.68444,
      "it": "Museo delle navi vichinghe di Oslo",
      "en": "Viking Ship Museum (Oslo)",
      "official": "https://www.khm.uio.no/vikingskipshuset/"
    },
    "osm": {
      "id": "way/28475470",
      "name": "Vikingskipshuset",
      "kind": "tourism/museum",
      "lat": 59.90483,
      "lng": 10.68413
    },
    "photos": [
      {
        "file": "Vikingskipshuset november 2016.jpg",
        "author": "Peulle",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Oslo 133.jpg",
        "author": "FrDr",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Oslo 134.jpg",
        "author": "FrDr",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "nasjonalmuseet": {
    "wd": {
      "qid": "Q1132918",
      "label": "Nasjonalmuseet for kunst, arkitektur og design",
      "lat": 59.91167,
      "lng": 10.72917,
      "it": "Museo nazionale di arte, architettura e disegno",
      "en": "National Museum of Norway",
      "official": "https://www.nasjonalmuseet.no"
    },
    "osm": {
      "id": "relation/13920125",
      "name": "Nasjonalmuseet",
      "kind": "tourism/museum",
      "lat": 59.91163,
      "lng": 10.72842
    },
    "photos": [
      {
        "file": "Nasjonalgalleriet oslo.jpg",
        "author": "Bjørn Erik Pedersen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Nasjonalmuseet Oslo 2022-08-17 01.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      },
      {
        "file": "Nasjonalmuseet Oslo 2022-08-17 02.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      }
    ]
  },
  "naturhistorisk-museum": {
    "wd": {
      "qid": "Q1840963",
      "label": "Naturhistorisk museum",
      "lat": 59.91984,
      "lng": 10.77169,
      "en": "Natural History Museum at the University of Oslo",
      "official": "https://www.nhm.uio.no/"
    },
    "osm": {
      "id": "node/5412354900",
      "name": "Naturhistorisk museum",
      "kind": "tourism/museum",
      "lat": 59.91978,
      "lng": 10.77171
    },
    "photos": [
      {
        "file": "Naturhistorisk museum - Museumsinngang.jpg",
        "author": "Tommy Gildseth",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Naturhistorisk Museum Oslo 2019 07.jpg",
        "author": "Mateusz Giełczyński",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Naturhistorisk Museum Oslo 2019 09.jpg",
        "author": "Mateusz Giełczyński",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "akershus": {
    "wd": {
      "qid": "Q644464",
      "label": "Akershus slott og festning",
      "lat": 59.90661,
      "lng": 10.73625,
      "it": "Fortezza di Akershus",
      "en": "Akershus Fortress"
    },
    "osm": {
      "id": "relation/12391390",
      "name": "Akershus festning",
      "kind": "historic/fortress",
      "lat": 59.9076,
      "lng": 10.73721
    },
    "photos": [
      {
        "file": "OSLO-NO-02 05 ubt.jpeg",
        "author": "Tomasz Sienicki",
        "license": "CC BY 2.5",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.5"
      },
      {
        "file": "Akershus festning.jpg",
        "author": "Pudelek (Marcin Szala)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Akershus festning Oslo 2022-08-17 01.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      }
    ]
  },
  "operahuset": {
    "wd": {
      "qid": "Q43280",
      "label": "Operahuset i Oslo",
      "lat": 59.90694,
      "lng": 10.75361,
      "it": "Teatro dell'Opera di Oslo",
      "en": "Oslo Opera House",
      "official": "https://www.operaen.no/"
    },
    "osm": {
      "id": "way/810259696",
      "name": "Operahuset i Oslo",
      "kind": "amenity/theatre",
      "lat": 59.90752,
      "lng": 10.75268
    },
    "photos": [
      {
        "file": "Full Opera by night.jpg",
        "author": "Rafał Konieczny",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Oslo Opera House 2023 5.jpg",
        "author": "kallerna",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Oslo Opera House 2023 3.jpg",
        "author": "kallerna",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "maritimt-museum": {
    "wd": {
      "qid": "Q1334270",
      "label": "Norsk Maritimt Museum",
      "lat": 59.9025,
      "lng": 10.69861,
      "it": "Norsk Maritimt Museum",
      "en": "Norwegian Maritime Museum",
      "official": "https://marmuseum.no/"
    },
    "osm": {
      "id": "node/973793392",
      "name": "Norsk Maritimt Museum",
      "kind": "tourism/museum",
      "lat": 59.90283,
      "lng": 10.69866
    },
    "photos": [
      {
        "file": "Norwegian Maritime Museum oslo main-entrance.jpg",
        "author": "Hans-Petter Fjeld",
        "license": "CC BY-SA 2.5",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5"
      },
      {
        "file": "Norwegian Maritime Museum and Fram museum in Oslo, Norway - panoramio.jpg",
        "author": "logopop",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Bygdøy.jpg",
        "author": "Wilhelm Joys Andersen from Oslo, Norway",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "ekebergparken": {
    "wd": {
      "qid": "Q11966924",
      "label": "Ekebergparken",
      "lat": 59.89833,
      "lng": 10.76306,
      "en": "Ekebergparken Sculpture Park",
      "official": "https://ekebergparken.com/"
    },
    "osm": {
      "id": "node/11927672217",
      "name": "Ekebergparken",
      "kind": "information/board",
      "lat": 59.89978,
      "lng": 10.76226
    },
    "photos": [
      {
        "file": "Ekebergparken garden with Karlsborg.JPG",
        "author": "Helge Høifødt",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Ekebergparken - 2014-06-01 at 16-53-15.jpg",
        "author": "Kjetil Ree",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Ekebergparken, Oslo, stairs.jpg",
        "author": "MOs810",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "slottet": {
    "wd": {
      "qid": "Q863932",
      "label": "Det kongelige slott",
      "lat": 59.91722,
      "lng": 10.7275,
      "it": "Palazzo Reale (Oslo)",
      "en": "Royal Palace, Oslo"
    },
    "osm": {
      "id": "relation/12267199",
      "name": "Det kongelige slott",
      "kind": "building/palace",
      "lat": 59.9172,
      "lng": 10.72763
    },
    "photos": [
      {
        "file": "00 7737 Royal Palace, Oslo.jpg",
        "author": "W. Bulach",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Dronningdammen i Slottsparken (2023.06.02).jpg",
        "author": "Geir Hval (www.MacWhale.eu)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Floral tributes for Harald V of Norway at the Royal Palace (1).jpg",
        "author": "Premeditated",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "nobels-fredssenter": {
    "wd": {
      "qid": "Q941120",
      "label": "Nobels Fredssenter",
      "lat": 59.91161,
      "lng": 10.73023,
      "it": "Centro Nobel per la pace",
      "en": "Nobel Peace Center",
      "official": "https://www.nobelpeacecenter.org/"
    },
    "osm": {
      "id": "node/8046314379",
      "name": "Nobels Fredssenter",
      "kind": "tourism/museum",
      "lat": 59.91161,
      "lng": 10.7304
    },
    "photos": [
      {
        "file": "Centro Nobel Paz.jpg",
        "author": "Canaan",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "PXL 20260501 092523008.RAW-01.COVER.jpg",
        "author": "Samthecrazyman",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Am 11. Juli 2005 wurde in Oslo das Nobel Friedenszentrum eröffnet. 03.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "astrup-fearnley": {
    "wd": {
      "qid": "Q761048",
      "label": "Astrup Fearnley Museet for Moderne Kunst",
      "lat": 59.90667,
      "lng": 10.72139,
      "it": "Museo d'arte moderna Astrup Fearnley",
      "en": "Astrup Fearnley Museum of Modern Art",
      "official": "https://www.afmuseet.no/"
    },
    "osm": {
      "id": "node/13812182388",
      "name": "Astrup Fearnley Museet (Collection)",
      "kind": "emergency/defibrillator",
      "lat": 59.90681,
      "lng": 10.7209
    },
    "photos": [
      {
        "file": "Astrup Fearnley 009.JPG",
        "author": "Vidar Iversen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "\"Stararchitekt\" Renzo Piano entwarf die neuen Gebäude des Astrup Fearnley Museums. 07.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Oslo viewed from Akershus Fortress (29879230985).jpg",
        "author": "Jorge Láscar from Melbourne, Australia",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "radhuset-oslo": {
    "wd": {
      "qid": "Q373850",
      "label": "Oslo rådhus",
      "lat": 59.91167,
      "lng": 10.73361,
      "it": "Municipio di Oslo",
      "en": "Oslo City Hall",
      "official": "https://www.oslo.kommune.no/oslo-city-hall/"
    },
    "osm": {
      "id": "way/24900009",
      "name": "Oslo rådhus",
      "kind": "amenity/townhall",
      "lat": 59.91208,
      "lng": 10.73372
    },
    "photos": [
      {
        "file": "Ayunt Oslo.jpg",
        "author": "Canaan",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Municipio di oslo, portale sulla facciata lato città, 01.jpg",
        "author": "Francesco Bini",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Beautiful façade of the Oslo City Hall (Oslo rådhus) (29252400354).jpg",
        "author": "Jorge Láscar from Melbourne, Australia",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "botanisk-hage-oslo": {
    "wd": {
      "qid": "Q3116396",
      "label": "Botanisk hage i Oslo",
      "lat": 59.91746,
      "lng": 10.77002,
      "en": "University Botanical Garden (Oslo)"
    },
    "osm": {
      "id": "way/4045303",
      "name": "Botanisk hage",
      "kind": "leisure/garden",
      "lat": 59.91873,
      "lng": 10.7705
    },
    "photos": [
      {
        "file": "Botanisk hage Oldemors have.JPG",
        "author": "Helge Høifødt",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Botanisk hage Oslo 2022-08-17 01.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      },
      {
        "file": "Botanisk hage Oslo 2022-08-17 02.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      }
    ]
  },
  "oscarsborg": {
    "wd": {
      "qid": "Q2033069",
      "label": "Oscarsborg festning",
      "lat": 59.67361,
      "lng": 10.60667,
      "en": "Oscarsborg Fortress"
    },
    "osm": {
      "id": "node/582909475",
      "name": "Oscarsborg festning",
      "kind": "historic/castle",
      "lat": 59.67346,
      "lng": 10.60716
    },
    "photos": [
      {
        "file": "Oscarsborg, 2019 (03).jpg",
        "author": "Bahnfrend",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Oscarsborg, 2019 (01).jpg",
        "author": "Bahnfrend",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Oscarsborg, 2019 (02).jpg",
        "author": "Bahnfrend",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "blaafarvevaerket": {
    "wd": {
      "qid": "Q882820",
      "label": "Blaafarveværket",
      "lat": 59.91278,
      "lng": 9.8875,
      "en": "Blaafarveværket",
      "official": "https://www.blaa.no"
    },
    "osm": {
      "id": "node/1289144533",
      "name": "Blaafarveværket",
      "kind": "highway/bus_stop",
      "lat": 59.9101,
      "lng": 9.88852
    },
    "photos": [
      {
        "file": "BLAAFARVEVÆRKET (Cobalt Works Blue pigment factory koboltmalm 1773-1893) museum Kunstgalleri Modum NORWAY 2025-08-13 ANGELUS by STEPHAN SINDING 1913 (bronze sculpture to Værket 2001) Glasshytten glass smeltery 1779 bindingsverk.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Blaafarveværket Åmot Modum Norway Cobalt mining and processing open-air museum park July 12, 2017 Flickr photo by Hendrix R DSCF9408.jpg",
        "author": "Hendrix R",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Blaafarveværket Åmot Modum Norway Cobalt mining and processing open-air museum park July 12, 2017 Flickr photo by Hendrix R DSCF9420.jpg",
        "author": "Hendrix R",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "kistefos": {
    "wd": {
      "qid": "Q6417316",
      "label": "Kistefos Træsliberi",
      "lat": 60.22229,
      "lng": 10.36911,
      "en": "Kistefos Wood Pulp Mill",
      "official": "https://www.kistefos-tre.no/"
    },
    "osm": {
      "id": "node/6546018648",
      "name": "Kistefos-Museet",
      "kind": "information/map",
      "lat": 60.22307,
      "lng": 10.37105
    },
    "photos": [
      {
        "file": "Kistefoss Pulp Mill.jpg",
        "author": "Mahlum",
        "license": "Public domain"
      }
    ]
  },
  "bergverksmuseum": {
    "wd": {
      "qid": "Q4585424",
      "label": "Norsk Bergverksmuseum",
      "lat": 59.66604,
      "lng": 9.65079,
      "en": "Norwegian Mining Museum",
      "official": "https://www.norsk-bergverksmuseum.no/"
    },
    "osm": {
      "id": "relation/2109570",
      "name": "Norsk Bergverksmuseum",
      "kind": "tourism/museum",
      "lat": 59.66607,
      "lng": 9.65074
    },
    "photos": [
      {
        "file": "Norwegian Mining Museum.jpg",
        "author": "Mahlum",
        "license": "Public domain"
      },
      {
        "file": "Kongsberg vestsiden bergverksmuseet MG 2246.JPG",
        "author": "Bjoertvedt",
        "license": "CC BY-SA 3.0 no",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/no/deed.en"
      },
      {
        "file": "Kongsberg vestsiden bergverksmuseet MG 2247.JPG",
        "author": "Bjoertvedt",
        "license": "CC BY-SA 3.0 no",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/no/deed.en"
      }
    ]
  },
  "fredrikstad-gamleby": {
    "wd": {
      "qid": "Q5499573",
      "label": "Fredrikstad festning",
      "lat": 59.2034,
      "lng": 10.9542,
      "en": "Fredrikstad Fortress"
    },
    "osm": {
      "id": "way/69713457",
      "name": "Gamlebyen",
      "kind": "place/suburb",
      "lat": 59.20313,
      "lng": 10.9535
    },
    "photos": [
      {
        "file": "Fredriks bastion.jpg",
        "author": "Trond Svandal",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Fredrikstad festning2.jpg",
        "author": "Peppigue",
        "license": "CC BY-SA 3.0 no",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/no/deed.en"
      },
      {
        "file": "Fredrikstad festning7.jpg",
        "author": "Peppigue",
        "license": "CC BY-SA 3.0 no",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/no/deed.en"
      }
    ]
  },
  "fredriksten": {
    "wd": {
      "qid": "Q1408884",
      "label": "Fredriksten festning",
      "lat": 59.11981,
      "lng": 11.39722,
      "it": "Fredriksten",
      "en": "Fredriksten",
      "official": "https://fredrikstenfestning.com/"
    },
    "osm": {
      "id": "way/228874452",
      "name": "Fredriksten festning",
      "kind": "tourism/attraction",
      "lat": 59.1199,
      "lng": 11.39686
    },
    "photos": [
      {
        "file": "Halden Tista Fredriksten festning Østfold Viken Norway (2023.10.01).jpg",
        "author": "Geir Hval (www.MacWhale.eu)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Halden Fredriksten festning Tollbubrygga Kongens brygge Østfold Viken Norway (2023.10.01).jpg",
        "author": "Geir Hval (www.MacWhale.eu)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Fangeceller ved Fredriksten.JPG",
        "author": "Øyvind Holmstad",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "heddal-stavkirke": {
    "wd": {
      "qid": "Q852020",
      "label": "Heddal stavkirke",
      "lat": 59.57956,
      "lng": 9.17625,
      "it": "Stavkirke di Heddal",
      "en": "Heddal Stave Church",
      "official": "https://www.heddalstavkirke.no"
    },
    "osm": {
      "id": "way/436431376",
      "name": "Heddal stavkyrkje",
      "kind": "amenity/place_of_worship",
      "lat": 59.57956,
      "lng": 9.17629
    },
    "photos": [
      {
        "file": "Stavechurch-heddal.jpg",
        "author": "Micha L. Rieser",
        "license": "Attribution"
      },
      {
        "file": "Heddal Stave Church at night 1.jpg",
        "author": "Reodor",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Heddal stavkirke, 2026 (8).jpg",
        "author": "Ssu",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "vemork": {
    "wd": {
      "qid": "Q2296772",
      "label": "Vemork",
      "lat": 59.87167,
      "lng": 8.49444,
      "en": "Vemork",
      "official": "https://nia.no/vemork/"
    },
    "osm": {
      "id": "node/5640569657",
      "name": "Vemork",
      "kind": "place/farm",
      "lat": 59.87103,
      "lng": 8.49372
    },
    "photos": [
      {
        "file": "Vemork nye kraftstasjon.JPG",
        "author": "PeltonMan",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Vemork main building.jpg",
        "author": "Vidariv",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Vemork IMG 0133 RK 179963.JPG",
        "author": "Bjoertvedt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "gaustatoppen": {
    "wd": {
      "qid": "Q1496308",
      "label": "Gaustatoppen",
      "lat": 59.8542,
      "lng": 8.6492,
      "en": "Gaustatoppen"
    },
    "osm": {
      "id": "node/26862927",
      "name": "Gaustatoppen",
      "kind": "natural/peak",
      "lat": 59.85421,
      "lng": 8.64926
    },
    "photos": [
      {
        "file": "P1000821Gaustatoppen.JPG",
        "author": "G.Lanting",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
      },
      {
        "file": "Gaustatoppen, Telemark, 360grader.jpg",
        "author": "Calxibe",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Gausatatoppen fra Kammerherren - panoramio.jpg",
        "author": "lemenelgen",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
      }
    ]
  },
  "bo-sommarland": {
    "wd": {
      "qid": "Q5005209",
      "label": "Bø Sommarland",
      "lat": 59.44796,
      "lng": 9.07291,
      "en": "Bø Sommarland"
    },
    "osm": {
      "id": "way/307924173",
      "name": "Bø Sommarland",
      "kind": "tourism/theme_park",
      "lat": 59.44902,
      "lng": 9.07498
    },
    "photos": [
      {
        "file": "Bø Sommarland - Splash.JPG",
        "author": "Ssu",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Bø Sommarland - lekeplass.JPG",
        "author": "Ssu",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "telemarkskanalen": {
    "wd": {
      "qid": "Q2250",
      "label": "Telemarkskanalen",
      "lat": 59.28333,
      "lng": 9.26667,
      "en": "Telemark Canal"
    },
    "osm": {
      "id": "relation/1744625",
      "name": "Telemarkskanalen",
      "kind": "waterway/canal",
      "lat": 59.30031,
      "lng": 9.20605
    },
    "photos": [
      {
        "file": "Skien Hjellevannet Hjellebrygga Telemarkskanalen Skien kirke Grenland Telemark Norway (2025.10.18).jpg",
        "author": "Macwhale",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      },
      {
        "file": "Skien Hjellevannet Skien kirke Grenland Telemark Norway (2025.10.18).jpg",
        "author": "Macwhale",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      }
    ]
  },
  "hvalfangstmuseet": {
    "wd": {
      "qid": "Q1512515",
      "label": "Hvalfangstmuseet",
      "lat": 59.13107,
      "lng": 10.22713,
      "it": "Museo della caccia alla balena (Sandefjord)",
      "en": "Sandefjord Museum",
      "official": "https://www.hvalfangstmuseet.no/"
    },
    "osm": {
      "id": "way/220866452",
      "name": "Hvalfangstmuseet",
      "kind": "tourism/museum",
      "lat": 59.13114,
      "lng": 10.22738
    },
    "photos": [
      {
        "file": "Sandefjord Muzeum Wielorybnictwa 3.jpg",
        "author": "Andrzej Otrębski",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Hvalfangstmuseet.jpg",
        "author": "Peter Fiskerstrand",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Spes & Fides modell.jpg",
        "author": "Stig Tore Lunde",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "midgard": {
    "wd": {
      "qid": "Q2624400",
      "label": "Borrehaugene",
      "lat": 59.3823,
      "lng": 10.4711,
      "it": "Cimitero di Borre",
      "en": "Borre mound cemetery"
    },
    "osm": {
      "id": "relation/10405963",
      "name": "Midgard vikingsenter",
      "kind": "tourism/museum",
      "lat": 59.38505,
      "lng": 10.46674
    },
    "photos": [
      {
        "file": "Borreparken 20100327-1.JPG",
        "author": "Hans A. Rosbach",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Borreparken 20100327-3.JPG",
        "author": "Hans A. Rosbach",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Borreparken 20100327-4.JPG",
        "author": "Hans A. Rosbach",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "eidsvollsbygningen": {
    "wd": {
      "qid": "Q4584720",
      "label": "Eidsvollsbygningen",
      "lat": 60.30083,
      "lng": 11.17083,
      "en": "Eidsvollsbygningen",
      "official": "https://www.eidsvoll1814.no/"
    },
    "osm": {
      "id": "way/125813296",
      "name": "Eidsvollbygningen",
      "kind": "building/civic",
      "lat": 60.30078,
      "lng": 11.17099
    },
    "photos": [
      {
        "file": "Eidsvollsbygninen.jpg",
        "author": "Kjetil Bjørnsrud",
        "license": "CC BY 2.5",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.5"
      },
      {
        "file": "Eidsvollsbygningen 2014-02-18-04.jpg",
        "author": "Hans A. Rosbach",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Eidsvollsbygningen 2014-02-18-06.jpg",
        "author": "Hans A. Rosbach",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "verdens-ende": {
    "wd": {
      "qid": "Q1140297",
      "label": "Verdens ende",
      "lat": 59.0543,
      "lng": 10.4057,
      "en": "Verdens Ende"
    },
    "osm": {
      "id": "node/4450553842",
      "name": "Verdens Ende",
      "kind": "information/map",
      "lat": 59.06076,
      "lng": 10.40686
    },
    "photos": [
      {
        "file": "Vippefyret-verdensende-tjome.JPG",
        "author": "91",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Verdens ende, Tjøme, Norway. Færder National Park. View of Oslofjorden towards Skagerak. Breakwater (molo), port (gjestehavn), tipping lantern (vippefyr). Part of \"promenadebrygga\" etc. Light and shadows from sunset. 2018-09-12 G.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "faerder": {
    "wd": {
      "qid": "Q14915623",
      "label": "Færder nasjonalpark",
      "lat": 59.15,
      "lng": 10.51,
      "en": "Færder National Park"
    },
    "osm": {
      "id": "relation/6841965",
      "name": "Færder nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 59.14047,
      "lng": 10.54695
    },
    "photos": [
      {
        "file": "Færder.jpg",
        "author": "Opphopp!",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Færdernasjpark.jpg",
        "author": "Krg",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "maihaugen": {
    "wd": {
      "qid": "Q389845",
      "label": "Maihaugen",
      "lat": 61.11282,
      "lng": 10.47843,
      "it": "Maihaugen",
      "en": "Maihaugen",
      "official": "https://www.maihaugen.no"
    },
    "osm": {
      "id": "node/6113778414",
      "name": "Maihaugen",
      "kind": "information/office",
      "lat": 61.11172,
      "lng": 10.47744
    },
    "photos": [
      {
        "file": "Maihaugen entrance.jpg",
        "author": "Mahlum",
        "license": "Public domain"
      },
      {
        "file": "\"Maihaugen ist eines der größten Museen Norwegens\". (Auf dem Hof des Bauern Anders) 10.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "\"Maihaugen ist eines der größten Museen in Norwegen\" . 02.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "lysgardsbakkene": {
    "wd": {
      "qid": "Q632041",
      "label": "Lysgårdsbakkene",
      "lat": 61.125,
      "lng": 10.48722,
      "it": "Lysgårdsbakken",
      "en": "Lysgårdsbakken"
    },
    "osm": {
      "id": "way/1222959282",
      "name": "Lysgårdsbakkene hoppanlegg",
      "kind": "landuse/winter_sports",
      "lat": 61.1256,
      "lng": 10.48783
    },
    "photos": [
      {
        "file": "Lysgård.JPG",
        "author": "Tokle",
        "license": "Public domain"
      },
      {
        "file": "View Down Lysgårdsbakken, Lillehammer 20150616 1.jpg",
        "author": "DXR",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Lysgårdsbakken, Lillehammer, Southwest view 20150616 1.jpg",
        "author": "DXR",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "lilleputthammer": {
    "wd": {
      "qid": "Q3240893",
      "label": "Lilleputthammer",
      "lat": 61.2388,
      "lng": 10.4391,
      "official": "https://www.lilleputthammer.no"
    },
    "osm": {
      "id": "way/273798788",
      "name": "Lilleputthammer",
      "kind": "tourism/theme_park",
      "lat": 61.23792,
      "lng": 10.43917
    },
    "photos": [
      {
        "file": "2010-08-07 Lilleputthammer.jpg",
        "author": "Chell Hill",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Lilleputthammer.JPG",
        "author": "ChickenFalls",
        "license": "Public domain"
      }
    ]
  },
  "vegmuseum": {
    "wd": {
      "qid": "Q574923",
      "label": "Norsk vegmuseum",
      "lat": 61.22695,
      "lng": 10.43144,
      "official": "https://www.vegmuseum.no/"
    },
    "osm": {
      "id": "node/11659109604",
      "name": "Norsk vegmuseum",
      "kind": "highway/bus_stop",
      "lat": 61.22646,
      "lng": 10.42811
    },
    "photos": [
      {
        "file": "Norge 157.jpg",
        "author": "Lcl",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Norsk vegmuseum6642.JPG",
        "author": "יעקב",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Beltebil6694.JPG",
        "author": "יעקב",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "skogmuseum": {
    "wd": {
      "qid": "Q10603032",
      "label": "Norsk Skogmuseum",
      "lat": 60.87031,
      "lng": 11.55981,
      "official": "https://skogmus.no/"
    },
    "osm": {
      "id": "way/307000319",
      "name": "Norsk Skogmuseum",
      "kind": "tourism/museum",
      "lat": 60.87002,
      "lng": 11.55996
    },
    "photos": [
      {
        "file": "Norsk Skogmuseum.jpg",
        "author": "ToB",
        "license": "Public domain"
      },
      {
        "file": "Møte mellom barn og moskus.jpg",
        "author": "Øyvind Holmstad",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Norskskogmuseum.jpg",
        "author": "Gräsmark",
        "license": "Public domain"
      }
    ]
  },
  "jernbanemuseum": {
    "wd": {
      "qid": "Q1188798",
      "label": "Norsk jernbanemuseum",
      "lat": 60.7975,
      "lng": 11.035,
      "en": "Norwegian Railway Museum",
      "official": "https://www.norsk-jernbanemuseum.no/"
    },
    "osm": {
      "id": "node/13812190570",
      "name": "Norsk jernbanemuseum",
      "kind": "emergency/defibrillator",
      "lat": 60.80057,
      "lng": 11.0274
    },
    "photos": [
      {
        "file": "Norw Rail Museum Main.jpg",
        "author": "Mahlum",
        "license": "Public domain"
      },
      {
        "file": "Planovergang på Jernbanemuseet.jpg",
        "author": "Jan-Tore Egge",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Stellwerk Drammen — Eisenbahnmuseum Hamar.jpg",
        "author": "Reinhard Dietrich",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "domkirkeodden": {
    "wd": {
      "qid": "Q5697531",
      "label": "Domkirkeodden",
      "lat": 60.79253,
      "lng": 11.03991,
      "official": "https://domkirkeodden.no/"
    },
    "osm": {
      "id": "node/833428742",
      "name": "Domkirkeodden",
      "kind": "place/locality",
      "lat": 60.79226,
      "lng": 11.03712
    },
    "photos": [
      {
        "file": "2013-07-13 Hamar 47.jpg",
        "author": "Szilas",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      },
      {
        "file": "Bruvoldstabburet Hedmarksmuseet.jpg",
        "author": "Jensens",
        "license": "Public domain"
      },
      {
        "file": "Hamarstua spiseri.JPG",
        "author": "Thomas Andersen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      }
    ]
  },
  "lom-stavkirke": {
    "wd": {
      "qid": "Q2007206",
      "label": "Lom stavkirke",
      "lat": 61.8398,
      "lng": 8.56607,
      "en": "Lom Stave Church"
    },
    "photos": [
      {
        "file": "Iglesia vikinga en LOM,Noruega.jpg",
        "author": "Lolovan",
        "license": "CC BY-SA 3.0 es",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/es/deed.en"
      },
      {
        "file": "Lom stavkyrkje in Lom, Innlandet, Norway, 2025 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Lom stavkirke 2017.jpg",
        "author": "kallerna",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "ringebu-stavkirke": {
    "wd": {
      "qid": "Q2030772",
      "label": "Ringebu stavkirke",
      "lat": 61.50934,
      "lng": 10.17297,
      "en": "Ringebu Stave Church"
    },
    "photos": [
      {
        "file": "Ringebu Stave Church.jpg",
        "author": "Christian David",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "PermaLiv Ringebu stavkyrkje 18-04-22 2.jpg",
        "author": "Øyvind Holmstad",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Norwegen 1998 (777) Ringebu stavkirke (50582047838).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "rondane": {
    "wd": {
      "qid": "Q955861",
      "label": "Rondane nasjonalpark",
      "lat": 61.83333,
      "lng": 9.83333,
      "it": "Parco nazionale Rondane",
      "en": "Rondane National Park"
    },
    "osm": {
      "id": "relation/13361039",
      "name": "Rondane nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 61.88756,
      "lng": 9.7966
    },
    "photos": [
      {
        "file": "DigerMidtHøgrondenFromVeslesmeden.jpg",
        "author": "Håvard Berland",
        "license": "CC BY-SA 2.5",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5"
      },
      {
        "file": "PermaLiv Rondanes påskefjell 16-04-22.jpg",
        "author": "Øyvind Holmstad",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "The Rondane Mountains with Lake Furusjøen seen from Kvamsfjellet.jpg",
        "author": "Øyvind Holmstad",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "galdhopiggen": {
    "wd": {
      "qid": "Q203942",
      "label": "Galdhøpiggen",
      "lat": 61.63333,
      "lng": 8.3,
      "it": "Galdhøpiggen",
      "en": "Galdhøpiggen"
    },
    "osm": {
      "id": "node/26862903",
      "name": "Galdhøpiggen",
      "kind": "natural/peak",
      "lat": 61.63647,
      "lng": 8.31244
    },
    "photos": [
      {
        "file": "Galdhopiggen 2004.jpg",
        "author": "Jojo",
        "license": "Public domain"
      },
      {
        "file": "Knut Voles hytte1.JPG",
        "author": "Pudelek (Marcin Szala)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "View from Galdhøpiggen to east.jpg",
        "author": "Pudelek (Marcin Szala)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "besseggen": {
    "wd": {
      "qid": "Q830100",
      "label": "Besseggen",
      "lat": 61.50461,
      "lng": 8.72685,
      "en": "Besseggen"
    },
    "osm": {
      "id": "node/8831384026",
      "name": "Besseggen",
      "kind": "natural/peak",
      "lat": 61.50415,
      "lng": 8.73156
    },
    "photos": [
      {
        "file": "Gjende from Besseggen.jpg",
        "author": "\"color line\"",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Besseggen above Gjende.jpg",
        "author": "Silverkey (Mickaël Delcey)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Besseggen ridge.jpg",
        "author": "Silverkey (Mickaël Delcey)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "snohetta-viewpoint": {
    "wd": {
      "qid": "Q2253402",
      "label": "Viewpoint Snøhetta",
      "lat": 62.22398,
      "lng": 9.49006
    },
    "osm": {
      "id": "node/1316823480",
      "name": "Viewpoint Snøhetta",
      "kind": "tourism/viewpoint",
      "lat": 62.22386,
      "lng": 9.49016
    },
    "photos": [
      {
        "file": "Tverfjellhytta Norsk villreinsenter Snøhetta viewpoint 10.jpg",
        "author": "FrDr",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Viewpoint Snøhetta.jpg",
        "author": "Lars Rogstad",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Viewpoint Snøhetta, mot Snøhetta.jpg",
        "author": "Lars Rogstad",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "sognefjellsvegen": {
    "wd": {
      "qid": "Q7554538",
      "label": "Sognefjellet",
      "lat": 61.56,
      "lng": 7.99,
      "en": "Sognefjellet"
    },
    "osm": {
      "id": "way/1185195479",
      "name": "Sognefjellsvegen",
      "kind": "highway/primary",
      "lat": 61.54881,
      "lng": 7.87852
    },
    "photos": [
      {
        "file": "A view from Riksveg 55 at Sognefjellet.jpg",
        "author": "Ximonic, Simo Räsänen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "View to Jotunheimen highlands from Sognefjellet, 2013 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "View to Bergsdalen and Helgedalen from the north facing hillside, 2013 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "valdresflye": {
    "wd": {
      "qid": "Q1773457",
      "label": "Valdresflye",
      "lat": 61.38603,
      "lng": 8.81646,
      "it": "Valdresflya",
      "en": "Valdresflye"
    },
    "osm": {
      "id": "node/10605493287",
      "name": "Valdresflye",
      "kind": "highway/bus_stop",
      "lat": 61.38934,
      "lng": 8.81043
    },
    "photos": [
      {
        "file": "Valdresflya (Jotunheimen).jpg",
        "author": "Tommy Gildseth",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Juni 2025 Valdresflye 04.jpg",
        "author": "Øyvind Holmstad",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Juni 2025 Valdresflye 08.jpg",
        "author": "Øyvind Holmstad",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "femundsmarka": {
    "wd": {
      "qid": "Q1404574",
      "label": "Femundsmarka nasjonalpark",
      "lat": 62.21667,
      "lng": 12.11667,
      "it": "Parco nazionale Femundsmarka",
      "en": "Femundsmarka National Park"
    },
    "osm": {
      "id": "relation/13346761",
      "name": "Femundsmarka nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 62.32364,
      "lng": 12.12906
    },
    "photos": [
      {
        "file": "Femundsmarka01.jpg",
        "author": "Aslak Raanes",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Senteret på vinteren Ida Brennodden (2).jpg",
        "author": "Ida Brennodden",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      },
      {
        "file": "Domesticated reindeer bull - Ida Brennodden.jpg",
        "author": "Ida Brennodden",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      }
    ]
  },
  "bryggen": {
    "wd": {
      "qid": "Q153430",
      "label": "Bryggen i Bergen",
      "lat": 60.3975,
      "lng": 5.32333,
      "it": "Bryggen",
      "en": "Bryggen",
      "official": "https://www.stiftelsenbryggen.no"
    },
    "osm": {
      "id": "way/9649862",
      "name": "Bryggen",
      "kind": "highway/primary",
      "lat": 60.39712,
      "lng": 5.32267
    },
    "photos": [
      {
        "file": "Bergen Bryggen 2986.jpg",
        "author": "Anna Anichkova",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Bergen panorama 360 2009 1.jpg",
        "author": "Sveter",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Bergen panorama 2009 1.jpg",
        "author": "Sveter",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "floibanen": {
    "wd": {
      "qid": "Q117767",
      "label": "Fløibanen",
      "lat": 60.39636,
      "lng": 5.32842,
      "it": "Fløibanen",
      "en": "Fløibanen"
    },
    "osm": {
      "id": "way/165297871",
      "name": "Fløibanen, nedre stasjon;Fløibanen",
      "kind": "shop/ticket",
      "lat": 60.39641,
      "lng": 5.32856
    },
    "photos": [
      {
        "file": "\"Die einzige Standseilbahn Norwegens\". 01.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Trayecto desde la montaña Fløyen al centro, Bergen, Noruega, 2019-09-08, DD 49.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Fløibanen i Bergen.jpg",
        "author": "Espen Franck-Nielsen",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      }
    ]
  },
  "ulriken": {
    "wd": {
      "qid": "Q386192",
      "label": "Ulriken",
      "lat": 60.3775,
      "lng": 5.3869,
      "en": "Ulriken"
    },
    "osm": {
      "id": "node/12856335854",
      "name": "Ulriksbanen",
      "kind": "shop/ticket",
      "lat": 60.37399,
      "lng": 5.36381
    },
    "photos": [
      {
        "file": "Bergen 2013 06 15 2470.jpg",
        "author": "Harvey Barrison from Massapequa, NY, USA",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Ulriken - Bergen, Norway 2021-07-31 (02).jpg",
        "author": "Ryan Hodnett",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "vilvite": {
    "wd": {
      "qid": "Q11118693",
      "label": "VilVite",
      "lat": 60.38158,
      "lng": 5.32937,
      "official": "https://vilvite.no"
    },
    "osm": {
      "id": "way/194707083",
      "name": "VilVite",
      "kind": "tourism/museum",
      "lat": 60.38145,
      "lng": 5.32927
    },
    "photos": [
      {
        "file": "Vilvite bergen vitensenter bygg 2.jpg",
        "author": "SinWin",
        "license": "Public domain"
      },
      {
        "file": "Vilvite bergen vitensenter bygg.jpg",
        "author": "SinWin",
        "license": "Public domain"
      }
    ]
  },
  "troldhaugen": {
    "wd": {
      "qid": "Q1291307",
      "label": "Troldhaugen",
      "lat": 60.3196,
      "lng": 5.32948,
      "it": "Troldhaugen",
      "en": "Troldhaugen",
      "official": "https://griegmuseum.no/"
    },
    "osm": {
      "id": "node/260838508",
      "name": "Edvard Grieg Museum Troldhaugen",
      "kind": "tourism/museum",
      "lat": 60.31962,
      "lng": 5.32946
    },
    "photos": [
      {
        "file": "Troldhaugen in Bergen.jpg",
        "author": "Andreas Sandberg",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "1885 bis 1907 lebte hier der Komponist Edvard Grieg. 12.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "1885 bis 1907 lebte hier der Komponist Edvard Grieg. 10.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "fantoft-stavkirke": {
    "wd": {
      "qid": "Q257558",
      "label": "Fantoft stavkirke",
      "lat": 60.33917,
      "lng": 5.35333,
      "it": "Stavkirke di Fantoft",
      "en": "Fantoft Stave Church",
      "official": "https://www.fantoftstavkirke.no"
    },
    "osm": {
      "id": "way/381357658",
      "name": "Fantoft stavkirke",
      "kind": "amenity/place_of_worship",
      "lat": 60.3393,
      "lng": 5.35328
    },
    "photos": [
      {
        "file": "Stave church Fantoft.jpg",
        "author": "Micha L. Rieser",
        "license": "Attribution"
      },
      {
        "file": "Fantoft stavkirke, Bergen, Noruega, 2019-09-08, DD 91.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Fantoft stavkirke, Bergen, Noruega, 2019-09-08, DD 87-89 HDR.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "kode": {
    "wd": {
      "qid": "Q1770313",
      "label": "Bergen Kunstmuseum",
      "lat": 60.38944,
      "lng": 5.3275,
      "official": "https://www.kunstmuseene.no/"
    },
    "osm": {
      "id": "way/133607324",
      "name": "Rasmus Meyers samlinger",
      "kind": "tourism/gallery",
      "lat": 60.38948,
      "lng": 5.32744
    },
    "photos": [
      {
        "file": "Bergen-Kunstmuseum.jpg",
        "author": "Nol Aders",
        "license": "CC BY 2.5",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.5"
      },
      {
        "file": "Museo de Arte Decorativo de Noruega Occidental.jpg",
        "author": "Alberto-g-rovi",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      },
      {
        "file": "Das Kunstmuseum in Bergen in Norwegen Foto Wolfgang Pehlemann IMG 8922.jpg",
        "author": "Wolfgang Pehlemann",
        "license": "CC BY-SA 3.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/deed.en"
      }
    ]
  },
  "gamle-bergen": {
    "wd": {
      "qid": "Q4027116",
      "label": "Gamle Bergen Museum",
      "lat": 60.41806,
      "lng": 5.30917,
      "official": "https://bymuseet.no/museum/gamle-bergen-museum/?lang=en"
    },
    "osm": {
      "id": "node/13831058228",
      "name": "Gamle Bergen",
      "kind": "information/board",
      "lat": 60.41811,
      "lng": 5.31027
    },
    "photos": [
      {
        "file": "Gamlebergen.jpg",
        "author": "Smtunli, Svein-Magne Tunli - http://www.tunliweb.no/SM/English/sm_eng.htm",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Inngangen til Gamle Bergen.jpg",
        "author": "999Vic999",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Gamle Bergen 2009-HDR.jpg",
        "author": "Jan Frode Haugseth",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "bergenhus": {
    "wd": {
      "qid": "Q583428",
      "label": "Bergenhus festning",
      "lat": 60.39972,
      "lng": 5.3175,
      "en": "Bergenhus Fortress"
    },
    "osm": {
      "id": "way/487821106",
      "name": "Bergenhus festning",
      "kind": "leisure/park",
      "lat": 60.40011,
      "lng": 5.31785
    },
    "photos": [
      {
        "file": "Fortaleza de Bergenhus 05.jpg",
        "author": "Alberto-g-rovi",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      },
      {
        "file": "\"Streifzug\" mit der Kamera durch Bergen. 04.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Norwegen 1998 (099) Bergenhus Festning (34244837685).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "fiskerimuseum": {
    "wd": {
      "qid": "Q11992032",
      "label": "Norges Fiskerimuseum",
      "lat": 60.40798,
      "lng": 5.3218
    },
    "osm": {
      "id": "node/3930803587",
      "name": "Norges Fiskerimuseum",
      "kind": "tourism/museum",
      "lat": 60.40794,
      "lng": 5.32207
    },
    "photos": [
      {
        "file": "Norges Fiskerimuseum.jpg",
        "author": "Svein Harkestad",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Norges Fiskerimuseum 2025.jpg",
        "author": "Svend-Eirik H. Pedersen",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      },
      {
        "file": "Norges Fiskerimuseum 3.jpg",
        "author": "Djupevag",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "hanseatiske-museum": {
    "wd": {
      "qid": "Q5651003",
      "label": "Det Hanseatiske Museum og Schøtstuene",
      "lat": 60.3959,
      "lng": 5.326,
      "en": "Hanseatic Museum and Schøtstuene"
    },
    "photos": [
      {
        "file": "Hanseatic museum Murtasken Bergen.jpg",
        "author": "Nina Aldin Thune",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Norwegen 1998 (115) Bergen- Hanseatiske Museum (34785640992).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "\"Erinnerung an die Zeit der Hanse in Bergen\". 01.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "jugendstilsenteret": {
    "wd": {
      "qid": "Q4584312",
      "label": "Jugendstilsenteret",
      "lat": 62.47101,
      "lng": 6.15109,
      "en": "Jugendstilsenteret"
    },
    "osm": {
      "id": "node/5635176213",
      "name": "Jugendstilsenteret",
      "kind": "tourism/museum",
      "lat": 62.47111,
      "lng": 6.15087
    },
    "photos": [
      {
        "file": "Jugendstilsenteret-modf.jpg",
        "author": "Original by Tony Hall",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Puerto, Ålesund, Noruega, 2019-09-01, DD 57-62 PAN.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Svaneapoteket Alesund.jpg",
        "author": "Mikkoau",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "aksla": {
    "wd": {
      "qid": "Q11969102",
      "label": "Fjellstua",
      "lat": 62.47412,
      "lng": 6.16418
    },
    "osm": {
      "id": "node/33130603",
      "name": "Aksla",
      "kind": "natural/peak",
      "lat": 62.47516,
      "lng": 6.16782
    },
    "photos": [
      {
        "file": "Aussichtspunkt Fjellstua.jpg",
        "author": "Olaf Meister",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "sunnmore-museum": {
    "wd": {
      "qid": "Q2366575",
      "label": "Sunnmøre Museum",
      "lat": 62.46972,
      "lng": 6.23417
    },
    "osm": {
      "id": "node/821044768",
      "name": "Sunnmøre museum",
      "kind": "tourism/museum",
      "lat": 62.46891,
      "lng": 6.23624
    },
    "photos": [
      {
        "file": "Sunnmør museum.JPG",
        "author": "Andrva",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Ålesund.jpg",
        "author": "GuoJunjun",
        "license": "CC BY-SA 3.0 no",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/no/deed.en"
      },
      {
        "file": "Marmor Borgund.JPG",
        "author": "Jarle Sulebust",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "fjordsenter": {
    "wd": {
      "qid": "Q134509747",
      "label": "Norsk Fjordsenter",
      "lat": 62.09569,
      "lng": 7.21069,
      "official": "https://www.fjordsenter.com"
    },
    "osm": {
      "id": "way/437181594",
      "name": "Norsk Fjordsenter",
      "kind": "tourism/museum",
      "lat": 62.0956,
      "lng": 7.2098
    },
    "photos": [
      {
        "file": "Norsk fjordsenter 8141.jpg",
        "author": "Gerd Fahrenhorst",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      },
      {
        "file": "View to Greiranger and Fjord.jpg",
        "author": "Arbol01",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Norsk fjordsenter6269.JPG",
        "author": "יעקב",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "flydalsjuvet": {
    "wd": {
      "qid": "Q134077562",
      "label": "Flydalsjuvet",
      "lat": 62.08782,
      "lng": 7.22201
    },
    "osm": {
      "id": "node/13911111202",
      "name": "Flydalsjuvet",
      "kind": "highway/bus_stop",
      "lat": 62.08987,
      "lng": 7.22315
    },
    "photos": [
      {
        "file": "Flydalsjuvet Geiranger Geirangerfjorden.jpg",
        "author": "Svein-Magne Tunli - tunliweb.no",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "loen-skylift": {
    "wd": {
      "qid": "Q30088426",
      "label": "Loen Skylift",
      "lat": 61.8804,
      "lng": 6.8365,
      "en": "Loen Skylift"
    },
    "osm": {
      "id": "node/6548856722",
      "name": "Loen Skylift",
      "kind": "tourism/attraction",
      "lat": 61.87507,
      "lng": 6.83942
    },
    "photos": [
      {
        "file": "LoenSky117BG23.jpg",
        "author": "Bingar1234",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Loen skylift helipad.jpg",
        "author": "Cbliu",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Seilbahn Hoven Loen.jpg",
        "author": "Olaf Meister",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "lovatnet": {
    "wd": {
      "qid": "Q6516110",
      "label": "Lovatnet",
      "lat": 61.83861,
      "lng": 6.93361,
      "en": "Lovatnet"
    },
    "osm": {
      "id": "relation/5869274",
      "name": "Lovatnet",
      "kind": "water/lake",
      "lat": 61.81854,
      "lng": 6.9667
    },
    "photos": [
      {
        "file": "Loenvatnet 2.JPG",
        "author": "Hesse1309",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Lodalen from Hoven, Stryn, Vestland, Norway, 2025 May.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Cows at Lovatnet, Breng, Stryn, Vestland, Norway, 2025 May.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "urnes-stavkirke": {
    "wd": {
      "qid": "Q210678",
      "label": "Urnes stavkirke",
      "lat": 61.29806,
      "lng": 7.3225,
      "it": "Stavkirke di Urnes",
      "en": "Urnes Stave Church",
      "official": "https://www.fortidsminneforeningen.no/properties/56/98"
    },
    "osm": {
      "id": "way/441801479",
      "name": "Urnes stavkyrkje",
      "kind": "amenity/place_of_worship",
      "lat": 61.29811,
      "lng": 7.32261
    },
    "photos": [
      {
        "file": "2023-07-04-Stabkirche Urnes-6781.jpg",
        "author": "Superbass",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "borgund-stavkirke": {
    "wd": {
      "qid": "Q755010",
      "label": "Borgund stavkirke",
      "lat": 61.04724,
      "lng": 7.81224,
      "it": "Stavkirke di Borgund",
      "en": "Borgund Stave Church",
      "official": "https://www.stavechurch.com/en/borgund/"
    },
    "osm": {
      "id": "way/557505485",
      "name": "Borgund stavkyrkje",
      "kind": "amenity/place_of_worship",
      "lat": 61.0472,
      "lng": 7.81229
    },
    "photos": [
      {
        "file": "2018 Borgund Stave Church.jpg",
        "author": "mendhak",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Borgund stave church 20230926.jpg",
        "author": "Bjørn Erik Pedersen",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Borgund stave church exterior 20230926-5.jpg",
        "author": "Bjørn Erik Pedersen",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "hopperstad-stavkirke": {
    "wd": {
      "qid": "Q531841",
      "label": "Hopperstad stavkirke",
      "lat": 61.07747,
      "lng": 6.56902,
      "en": "Hopperstad Stave Church"
    },
    "photos": [
      {
        "file": "Hopperstad Stave Church.JPG",
        "author": "DeServian1431",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Hopperstad stave church 02.jpg",
        "author": "Bosc d'Anjou",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Hopperstad Stave church.jpg",
        "author": "Peter",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "jostedalsbreen": {
    "wd": {
      "qid": "Q185602",
      "label": "Jostedalsbreen nasjonalpark",
      "lat": 61.68333,
      "lng": 6.98333,
      "it": "Parco nazionale Jostedalsbreen",
      "en": "Jostedalsbreen National Park",
      "official": "https://www.norgesnasjonalparker.no/nasjonalparker/jostedalsbreen/"
    },
    "osm": {
      "id": "relation/269940",
      "name": "Jostedalsbreen nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 61.63519,
      "lng": 6.92714
    },
    "photos": [
      {
        "file": "Haugabreen falls looking down - panoramio.jpg",
        "author": "Arend Veenhuizen",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
      },
      {
        "file": "Norwegen 1998 (208) Jostedalsbreen (45002586204).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Norwegen 1998 (209) Jostedalsbreen (44813773415).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "folgefonna": {
    "wd": {
      "qid": "Q164798",
      "label": "Folgefonna nasjonalpark",
      "lat": 60,
      "lng": 6.33306,
      "it": "Parco nazionale Folgefonna",
      "en": "Folgefonna National Park",
      "official": "https://www.dirnat.no/content/1393/Folgefonna-nasjonalpark"
    },
    "osm": {
      "id": "relation/13357362",
      "name": "Folgefonna nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 60.05815,
      "lng": 6.29642
    },
    "photos": [
      {
        "file": "Hardanger Folgefonna-Gletscher 11.JPG",
        "author": "Zairon",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Norwegen 1998 (081) Folgefonna (33288627403).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "hardangervidda-natursenter": {
    "wd": {
      "qid": "Q1810969",
      "label": "Norsk Natursenter Hardanger",
      "lat": 60.42319,
      "lng": 7.13476,
      "en": "Hardangervidda Natursenter",
      "official": "https://www.hardangervidda.org/hne.htm"
    },
    "photos": [
      {
        "file": "P1000530Hardangervidda Natursenter.JPG",
        "author": "G.Lanting",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "\"Der größte Nationalpark Norwegens\" 01.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "hardangervidda": {
    "wd": {
      "qid": "Q1140044",
      "label": "Hardangervidda nasjonalpark",
      "lat": 60.13333,
      "lng": 7.5,
      "it": "Parco nazionale Hardangervidda",
      "en": "Hardangervidda National Park"
    },
    "osm": {
      "id": "relation/13357364",
      "name": "Hardangervidda nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 60.13305,
      "lng": 7.5311
    },
    "photos": [
      {
        "file": "Hardangerviddaflora.jpg",
        "author": "Smtunli, Svein-Magne Tunli - http://www.tunliweb.no/SM/English/sm_eng.htm",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "\"Der größte Nationalpark Norwegens\" 04.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "\"Der größte Nationalpark Norwegens\" 05.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "baroniet-rosendal": {
    "wd": {
      "qid": "Q808714",
      "label": "Baroniet Rosendal",
      "lat": 59.99,
      "lng": 6.02917,
      "en": "Barony Rosendal",
      "official": "https://baroniet.no"
    },
    "osm": {
      "id": "way/467622385",
      "name": "Baroniet Rosendal",
      "kind": "building/civic",
      "lat": 59.98969,
      "lng": 6.02918
    },
    "photos": [
      {
        "file": "Norge Hardanger. Rosendal Baroni..jpg",
        "author": "Nasjonalbiblioteket",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Baroniet Rosendal, blomsterdekt vegg.jpg",
        "author": "Bohuslen",
        "license": "CC BY-SA 3.0 no",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/no/deed.en"
      },
      {
        "file": "Baroniet Rosensdal, hus i parkanlegget.jpg",
        "author": "Bohuslen",
        "license": "CC BY-SA 3.0 no",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/no/deed.en"
      }
    ]
  },
  "tvindefossen": {
    "wd": {
      "qid": "Q2361962",
      "label": "Tvindefossen",
      "lat": 60.7264,
      "lng": 6.48639,
      "en": "Tvindefossen"
    },
    "osm": {
      "id": "node/949638767",
      "name": "Tvindefossen",
      "kind": "tourism/viewpoint",
      "lat": 60.72585,
      "lng": 6.48767
    },
    "photos": [
      {
        "file": "Tvindefossen.jpg",
        "author": "Alfred Diem",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Norwegen 1998 (124) Tvindefossen (34607115950).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Norwegen 1998 (123) Tvindefossen (34862917221).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "langfoss": {
    "wd": {
      "qid": "Q1805231",
      "label": "Langfossen",
      "lat": 59.84444,
      "lng": 6.33889,
      "en": "Langfossen"
    },
    "osm": {
      "id": "node/3572177076",
      "name": "Langfoss",
      "kind": "waterway/waterfall",
      "lat": 59.84409,
      "lng": 6.33989
    },
    "photos": [
      {
        "file": "Langfossen.JPG",
        "author": "Frokor",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Langfoss(js).jpg",
        "author": "Jerzystrzelecki",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
      },
      {
        "file": "Langfossen Waterfall (Vaulaelva River) Etne Municipality Vestland County, Norway 2020-06-11. Tourist taking selfie sunny summer day, etc 00759.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "bondhusvatnet": {
    "wd": {
      "qid": "Q572156",
      "label": "Bondhusbrea",
      "lat": 60.06111,
      "lng": 6.31056,
      "en": "Bondhusbrea"
    },
    "osm": {
      "id": "relation/5180208",
      "name": "Bondhusvatnet",
      "kind": "water/lake",
      "lat": 60.08689,
      "lng": 6.28667
    },
    "photos": [
      {
        "file": "Bondhusbreen13.jpg",
        "author": "kirq (Tomasz Halszka)",
        "license": "CC BY-SA 2.5",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5"
      },
      {
        "file": "Lake Bondhus Norway 2862.jpg",
        "author": "Alchemist-hp (talk) (www.pse-mendelejew.de)",
        "license": "FAL",
        "licenseUrl": "https://artlibre.org/licence/lal/en"
      },
      {
        "file": "Bondhus Lake and Bondhus glacier.jpg",
        "author": "Vladislav Bezrukov",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "romsdalsmuseet": {
    "wd": {
      "qid": "Q6516023",
      "label": "Romsdalsmuseet",
      "lat": 62.7395,
      "lng": 7.1506,
      "en": "Romsdal Museum",
      "official": "https://www.romsdalsmuseet.no/"
    },
    "osm": {
      "id": "node/6612575933",
      "name": "Romsdalsmuseet - Krona",
      "kind": "tourism/museum",
      "lat": 62.73968,
      "lng": 7.15081
    },
    "photos": [
      {
        "file": "Krona-Romsdalsmuseet-Molde-2017-HH.jpg",
        "author": "Halvard Hatlen",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "2020-07 Hesje fra Romsdalsmuseet.jpg",
        "author": "Chell Hill",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Romsdal.jpg",
        "author": "Quentin desfarges",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "trollveggen": {
    "wd": {
      "qid": "Q510772",
      "label": "Trollveggen",
      "lat": 62.48222,
      "lng": 7.72861,
      "en": "Troll Wall"
    },
    "osm": {
      "id": "way/172590435",
      "name": "Trollveggen",
      "kind": "natural/cliff",
      "lat": 62.483,
      "lng": 7.72169
    },
    "photos": [
      {
        "file": "Norway Romsdal Trollveggen by Marianne F Pettersen.jpg",
        "author": "Marianne F. Pettersen",
        "license": "Attribution"
      },
      {
        "file": "View from Litlefjellet at Romsdalen, 2013 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "View to Romsdalen from Litlefjellet, 2013 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "rampestreken": {
    "wd": {
      "qid": "Q107640540",
      "label": "Romsdalsgondolen",
      "lat": 62.5641,
      "lng": 7.7045
    },
    "osm": {
      "id": "node/4326925729",
      "name": "Rampestreken",
      "kind": "tourism/viewpoint",
      "lat": 62.56075,
      "lng": 7.71242
    },
    "photos": [
      {
        "file": "View of Romsdalsgondolen.jpg",
        "author": "Davide Mauro",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "ÅNDALSNES Norway 2026-09-05 Mount NESAKSLA at ROMSDALSGONDOLEN Top station (708 masl) Romsdalen Gondola SCENIC VIEW Romsdalseggen omsdalshornet Isterdalen Rauma Setnesfjellet Romsdalsfjorden Restaurant ramps trails mountains PANO DIST.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "ÅNDALSNES Norway 2026-09-05 Mount NESAKSLA (summit 715 masl) near ROMSDALSGONDOLEN top station Romsdalen Gondola SCENIC VIEW Romsdalshornet Isterdalen Setnesfjellet Romsdalsfjorden cairn sherpa trails ISFJORDEN mountains PANO DISTORTE.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "mardalsfossen": {
    "wd": {
      "qid": "Q1471951",
      "label": "Mardalsfossen",
      "lat": 62.4714,
      "lng": 8.1199,
      "en": "Mardalsfossen"
    },
    "osm": {
      "id": "node/9118706135",
      "name": "Mardalsfossen",
      "kind": "waterway/waterfall",
      "lat": 62.47149,
      "lng": 8.11992
    },
    "photos": [
      {
        "file": "Mardalsfossen.jpg",
        "author": "Ernst Vikne",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Mardalsfossen i Eikesdal.jpg",
        "author": "Ottis",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "gamle-strynefjellsvegen": {
    "wd": {
      "qid": "Q1422796",
      "label": "fylkesvei 258",
      "lat": 61.9722,
      "lng": 7.43912,
      "en": "Norwegian County Road 258"
    },
    "osm": {
      "id": "way/521802828",
      "name": "Gamle Strynefjellsvegen",
      "kind": "highway/primary",
      "lat": 61.95868,
      "lng": 7.38042
    },
    "photos": [
      {
        "file": "P1000162Gamle Strynefjellsvegen.JPG",
        "author": "G.Lanting",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
      },
      {
        "file": "Strynef 23 BG.jpg",
        "author": "Bingar1234",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Strynef 24 BG.jpg",
        "author": "Bingar1234",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "gaularfjellet": {
    "wd": {
      "qid": "Q4584524",
      "label": "Gaularfjellet",
      "lat": 61.33861,
      "lng": 6.40361,
      "en": "Gaularfjellet"
    },
    "osm": {
      "id": "node/4309485284",
      "name": "Gaularfjellet",
      "kind": "information/board",
      "lat": 61.35133,
      "lng": 6.5185
    },
    "photos": [
      {
        "file": "Vetlefjorddalen & Bårddalen.JPG",
        "author": "Ximonic, Simo Räsänen",
        "license": "CC BY 2.5",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.5"
      },
      {
        "file": "\"Eine fantastische Aussicht\". 02.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "\"Eine fantastische Aussicht\". 08.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "njardarheimr": {
    "wd": {
      "qid": "Q1553180",
      "label": "Gudvangen",
      "lat": 60.8797,
      "lng": 6.84303,
      "en": "Gudvangen"
    },
    "photos": [
      {
        "file": "Gudvangen kai.jpg",
        "author": "raisin bun",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Gudvangen summer.jpg",
        "author": "Edmundo Sáez",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "molde": {
    "wd": {
      "qid": "Q104095",
      "label": "Molde",
      "lat": 62.73333,
      "lng": 7.18333,
      "it": "Molde",
      "en": "Molde Municipality",
      "official": "https://www.molde.kommune.no/"
    },
    "osm": {
      "id": "node/31264116",
      "name": "Molde",
      "kind": "place/town",
      "lat": 62.73772,
      "lng": 7.159
    },
    "photos": [
      {
        "file": "Molde seilet cruise.JPG",
        "author": "Erik den yngre",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "MOLDE Norway 2026-09-03 Rådhuset (1966) Rådhusplassen Sparebanken (1954) Storgata Macé-kvartalet Torget sjøfronten (harbour) etc Romsdalspanoramaet (seen from Rådhustaket town hall rooftop) IMG 1014.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "MOLDE Norway 2026-09-03 Storgata Rådhusplassen Rådhuset (1966) Sparebanken (1954) Domkirke (church 1957) etc IMG 0976.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "kristiansund": {
    "wd": {
      "qid": "Q109483",
      "label": "Kristiansund",
      "lat": 63.11152,
      "lng": 7.73198,
      "it": "Kristiansund",
      "en": "Kristiansund Municipality",
      "official": "https://www.kristiansund.kommune.no/"
    },
    "osm": {
      "id": "node/31264101",
      "name": "Kristiansund",
      "kind": "place/town",
      "lat": 63.11185,
      "lng": 7.73239
    },
    "photos": [
      {
        "file": "Storkaia Kristiansund.JPG",
        "author": "Harald Oppedal",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
      },
      {
        "file": "Bremsnesfjorden - Kristiansund, Norway 2022-07-11 (04).jpg",
        "author": "Ryan Hodnett",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Dalabukta - Kristiansund, Norway 2022-07-11.jpg",
        "author": "Ryan Hodnett",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "voss": {
    "wd": {
      "qid": "Q2715598",
      "label": "Vossevangen",
      "lat": 60.62869,
      "lng": 6.41474,
      "it": "Vossevangen",
      "en": "Vossevangen"
    },
    "osm": {
      "id": "node/1809796091",
      "name": "Vitusapotek Vossevangen",
      "kind": "amenity/pharmacy",
      "lat": 60.62919,
      "lng": 6.41724
    },
    "photos": [
      {
        "file": "Vangskyrkja.jpg",
        "author": "BjarteSorensen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Vossevangen1.jpg",
        "author": "Фалкон",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      }
    ]
  },
  "kjerag": {
    "wd": {
      "qid": "Q6419456",
      "label": "Kjeragbolten",
      "lat": 59.03373,
      "lng": 6.59327,
      "it": "Kjeragbolten",
      "en": "Kjeragbolten"
    },
    "osm": {
      "id": "way/711995509",
      "name": "Kjeragbolten",
      "kind": "natural/stone",
      "lat": 59.03373,
      "lng": 6.59327
    },
    "photos": [
      {
        "file": "A man standing on Kjeragbolten.jpg",
        "author": "Scoundrelgeo",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Kjeragbolten232BG23.jpg",
        "author": "Bingar1234",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Kjeragbolten Ovenifra.JPG",
        "author": "Oiiisann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "oljemuseum": {
    "wd": {
      "qid": "Q1322300",
      "label": "Norsk Oljemuseum",
      "lat": 58.97361,
      "lng": 5.73472,
      "en": "Norwegian Petroleum Museum",
      "official": "https://www.norskolje.museum.no/"
    },
    "osm": {
      "id": "way/31722952",
      "name": "Norsk Oljemuseum",
      "kind": "tourism/museum",
      "lat": 58.9736,
      "lng": 5.73476
    },
    "photos": [
      {
        "file": "Norsk Oljemuseum.jpg",
        "author": "Carlos Delgado",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Stavanger Norwegisches Ölmuseum 2.JPG",
        "author": "Zairon",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Norwegian-oilmuseum-21 hg.jpg",
        "author": "Hannes Grobe",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "gamle-stavanger": {
    "wd": {
      "qid": "Q4566860",
      "label": "Gamle Stavanger",
      "lat": 58.97278,
      "lng": 5.72528,
      "en": "Gamle Stavanger"
    },
    "osm": {
      "id": "node/13799127575",
      "name": "Gamle Stavanger",
      "kind": "tourism/attraction",
      "lat": 58.97214,
      "lng": 5.72571
    },
    "photos": [
      {
        "file": "Gamle Stavanger 2017 nördlicher Teil.jpg",
        "author": "Olaf Meister",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Gamle Stavanger 3 (52606285851).jpg",
        "author": "Maarten Heerlien from Voorschoten, The Netherlands",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Gamle Stavanger 5 (52606705925).jpg",
        "author": "Maarten Heerlien from Voorschoten, The Netherlands",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "sverd-i-fjell": {
    "wd": {
      "qid": "Q2735094",
      "label": "Sverd i fjell",
      "lat": 58.9414,
      "lng": 5.67134,
      "it": "Sverd i fjell",
      "en": "Sverd i fjell"
    },
    "osm": {
      "id": "node/361685563",
      "name": "Sverd i fjell",
      "kind": "tourism/attraction",
      "lat": 58.94137,
      "lng": 5.6719
    },
    "photos": [
      {
        "file": "Hafrsfjord IMG 5997.jpg",
        "author": "Mathieu Marquer from Paris, FRANCE",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Schwerter im Felsen. 04.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Schwerter im Felsen. 03.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "stavanger-domkirke": {
    "wd": {
      "qid": "Q124504",
      "label": "Stavanger domkirke",
      "lat": 58.96979,
      "lng": 5.73316,
      "it": "Cattedrale di Stavanger",
      "en": "Stavanger Cathedral",
      "official": "https://stavangerdomkirke.no"
    },
    "osm": {
      "id": "node/14121106517",
      "name": "Stavanger Domkirke",
      "kind": "emergency/defibrillator",
      "lat": 58.96968,
      "lng": 5.73292
    },
    "photos": [
      {
        "file": "Stavanger domkirke IMG 5880.jpg",
        "author": "Mathieu Marquer from Paris, FRANCE",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Stavanger Cathedral west facade.jpg",
        "author": "kallerna",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "flor-og-fjaere": {
    "wd": {
      "qid": "Q23042358",
      "label": "Flor og Fjære",
      "lat": 59.05238,
      "lng": 5.82311,
      "en": "Flor og Fjære"
    },
    "photos": []
  },
  "jernaldergarden": {
    "wd": {
      "qid": "Q1257428",
      "label": "Jernaldergården",
      "lat": 58.94138,
      "lng": 5.69394
    },
    "osm": {
      "id": "way/499976954",
      "name": "Besøkssenter for jernaldergården",
      "kind": "building/civic",
      "lat": 58.94092,
      "lng": 5.6917
    },
    "photos": [
      {
        "file": "Vor 1500 Jahren, lebten hier die frühen Norweger. 08.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Vor 1500 Jahren, lebten hier die frühen Norweger. 06.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Vor 1500 Jahren, lebten hier die frühen Norweger. 03.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "hermetikkmuseum": {
    "osm": {
      "id": "node/373656245",
      "name": "Norsk Hermetikkmuseum",
      "kind": "tourism/museum",
      "lat": 58.9724,
      "lng": 5.72517
    },
    "photos": []
  },
  "vitenfabrikken": {
    "wd": {
      "qid": "Q7762560",
      "label": "Vitenfabrikken",
      "lat": 58.85121,
      "lng": 5.73111,
      "en": "The Science Factory",
      "official": "https://www.jaermuseet.no/anlegga-vare/vitenfabrikken"
    },
    "osm": {
      "id": "way/28062244",
      "name": "Vitenfabrikken",
      "kind": "tourism/museum",
      "lat": 58.85141,
      "lng": 5.73096
    },
    "photos": [
      {
        "file": "Vitenfabrikken, Sandnes.JPG",
        "author": "Hallvard Nygård, Vitenfabrikken",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Planetariet.jpg",
        "author": "LinnHD",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "solastranden": {
    "wd": {
      "qid": "Q12001793",
      "label": "Solastranden",
      "lat": 58.88861,
      "lng": 5.60111,
      "en": "Solastranda"
    },
    "osm": {
      "id": "node/5699608905",
      "name": "Solastranden",
      "kind": "highway/rest_area",
      "lat": 58.88133,
      "lng": 5.60302
    },
    "photos": []
  },
  "manafossen": {
    "wd": {
      "qid": "Q1512918",
      "label": "Månafossen",
      "lat": 58.8438,
      "lng": 6.3685,
      "en": "Månafossen"
    },
    "osm": {
      "id": "way/711260552",
      "name": "Månafossen",
      "kind": "highway/steps",
      "lat": 58.85916,
      "lng": 6.38081
    },
    "photos": [
      {
        "file": "Maanafossen4.JPG",
        "author": "Torkild at English Wikipedia",
        "license": "Public domain"
      },
      {
        "file": "Maanafossen5.JPG",
        "author": "Torkild at English Wikipedia",
        "license": "Public domain"
      }
    ]
  },
  "utstein-kloster": {
    "wd": {
      "qid": "Q747178",
      "label": "Utstein kloster",
      "lat": 59.10306,
      "lng": 5.59056,
      "en": "Utstein Abbey"
    },
    "osm": {
      "id": "node/6632754355",
      "name": "Utstein kloster",
      "kind": "tourism/museum",
      "lat": 59.10312,
      "lng": 5.59065
    },
    "photos": [
      {
        "file": "Utstein kloster.jpg",
        "author": "Even Harbo",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Kloster Utstein 2017b.jpg",
        "author": "Olaf Meister",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Utstein klosterkirke B51A3479.jpg",
        "author": "Iselinmegwi",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "skudeneshavn": {
    "wd": {
      "qid": "Q1900046",
      "label": "Skudeneshavn",
      "lat": 59.14856,
      "lng": 5.25687,
      "en": "Skudeneshavn"
    },
    "osm": {
      "id": "node/31264140",
      "name": "Skudeneshavn",
      "kind": "place/town",
      "lat": 59.14975,
      "lng": 5.25817
    },
    "photos": [
      {
        "file": "Skudeneshavn-2024 05.jpg",
        "author": "Alberto-g-rovi",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      },
      {
        "file": "Skudeneshavn-2024 06.jpg",
        "author": "Alberto-g-rovi",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      },
      {
        "file": "Skudeneshavn-2024 13.jpg",
        "author": "Alberto-g-rovi",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      }
    ]
  },
  "avaldsnes": {
    "wd": {
      "qid": "Q790084",
      "label": "Avaldsnes",
      "lat": 59.3558,
      "lng": 5.2779,
      "en": "Avaldsnes"
    },
    "osm": {
      "id": "node/715831317",
      "name": "Avaldsnes",
      "kind": "place/village",
      "lat": 59.35494,
      "lng": 5.27857
    },
    "photos": []
  },
  "lindesnes-fyr": {
    "wd": {
      "qid": "Q773320",
      "label": "Lindesnes fyr",
      "lat": 57.9825,
      "lng": 7.04667,
      "en": "Lindesnes Lighthouse"
    },
    "osm": {
      "id": "node/1455198237",
      "name": "Lindesnes Fyr",
      "kind": "information/office",
      "lat": 57.98324,
      "lng": 7.04776
    },
    "photos": [
      {
        "file": "Lighthouse Lindesnes.jpg",
        "author": "Andreas Rümpel",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Lindesnes Fyr Lighthouse Våge, Vest-Agder, Southernmost point of Norway 2023-06-25 Drone photo by Martin Schmitt Flickr Some rights reserved 54049482300 be516fe23f o.jpg",
        "author": "Martin Schmitt",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Lindesnes Fyr, Photo from 2021-08-27.jpg",
        "author": "AUTOR.4200",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "kristiansand": {
    "wd": {
      "qid": "Q2415",
      "label": "Kristiansand",
      "lat": 58.14672,
      "lng": 7.99561,
      "it": "Kristiansand",
      "en": "Kristiansand Municipality",
      "official": "https://www.kristiansand.kommune.no/"
    },
    "osm": {
      "id": "node/31264100",
      "name": "Kristiansand",
      "kind": "place/city",
      "lat": 58.14615,
      "lng": 7.99573
    },
    "photos": [
      {
        "file": "Kristiansand, Norway.jpg",
        "author": "(WT-shared) Carsten WT at wts wikivoyage",
        "license": "Public domain"
      },
      {
        "file": "1O3A7889.jpg",
        "author": "Jarle Hammen Knudsen (dubidubno)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Bragdøya.jpg",
        "author": "Krg",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "posebyen": {
    "wd": {
      "qid": "Q22257044",
      "label": "Posebyen",
      "lat": 58.14861,
      "lng": 7.99889,
      "en": "Posebyen"
    },
    "osm": {
      "id": "way/1416985560",
      "name": "Posebyen",
      "kind": "landuse/residential",
      "lat": 58.14913,
      "lng": 7.99824
    },
    "photos": [
      {
        "file": "Posebyen i Kristiansand.jpg",
        "author": "Knut Arne Gjertsen",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "kanonmuseum": {
    "wd": {
      "qid": "Q1769786",
      "label": "Møvik fort",
      "lat": 58.09194,
      "lng": 7.96833,
      "en": "Kristiansand Cannon Museum",
      "official": "https://www.vestagdermuseet.no/kanonmuseum/"
    },
    "osm": {
      "id": "way/1417417001",
      "name": "Kristiansand kanonmuseum",
      "kind": "building/museum",
      "lat": 58.09107,
      "lng": 7.96802
    },
    "photos": [
      {
        "file": "Batterie vara kanon.JPG",
        "author": "Ken",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Batterie Vara (27793420123).jpg",
        "author": "Richard from Leeds, Yorkshire, UK",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Kristiansand Batterie Vara SAM 0860 rk 106627.JPG",
        "author": "Bjoertvedt",
        "license": "CC BY-SA 3.0 no",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/no/deed.en"
      }
    ]
  },
  "setesdalsbanen": {
    "wd": {
      "qid": "Q1769317",
      "label": "Setesdalsbanen",
      "lat": 58.2936,
      "lng": 7.9808,
      "it": "Ferrovia della Setesdal",
      "en": "Setesdal Line",
      "official": "https://setesdalsbanen.no"
    },
    "osm": {
      "id": "way/25622705",
      "name": "Setesdalsbanen",
      "kind": "railway/narrow_gauge",
      "lat": 58.29527,
      "lng": 7.98014
    },
    "photos": [
      {
        "file": "Setesdalsbanen 2022.jpg",
        "author": "Even Harbo",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Flott, gamle trevogner på Setesdalsbanen (7459356946).jpg",
        "author": "Vest-Agder-museet",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Klar for avgang med Setesdalsbanen. Foto T Lunde (7459357356).jpg",
        "author": "Vest-Agder-museet",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "mineralparken": {
    "wd": {
      "qid": "Q107362556",
      "label": "Mineralparken",
      "lat": 58.5504,
      "lng": 7.7766,
      "official": "https://www.mineralparken.no/"
    },
    "osm": {
      "id": "way/301800215",
      "name": "Mineralparken",
      "kind": "tourism/camp_site",
      "lat": 58.55099,
      "lng": 7.77485
    },
    "photos": [
      {
        "file": "Resepsjonen med inngang til mineralutstillingen..jpg",
        "author": "Ronald Werner",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Mineralutstillingen under jorda 1.jpg",
        "author": "Ronald Werner",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Mineralutstilling under jorda 2.jpg",
        "author": "Ronald Werner",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "kunstsilo": {
    "wd": {
      "qid": "Q124728154",
      "label": "Kunstsilo",
      "lat": 58.13825,
      "lng": 7.99712,
      "official": "https://www.kunstsilo.no"
    },
    "osm": {
      "id": "node/13812184965",
      "name": "Kunstsilo",
      "kind": "emergency/defibrillator",
      "lat": 58.13828,
      "lng": 7.99718
    },
    "photos": [
      {
        "file": "Kunstsilo art museum Kristiansand 6.jpg",
        "author": "kallerna",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Stairway in Kunstsilo in 2026.jpg",
        "author": "Premeditated",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Kunstsilo in 2026.jpg",
        "author": "Premeditated",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "nidarosdomen": {
    "wd": {
      "qid": "Q215023",
      "label": "Nidarosdomen",
      "lat": 63.4269,
      "lng": 10.3969,
      "it": "Cattedrale di Trondheim",
      "en": "Nidaros Cathedral",
      "official": "https://www.nidarosdomen.no"
    },
    "osm": {
      "id": "way/417245741",
      "name": "Nidarosdomen",
      "kind": "amenity/place_of_worship",
      "lat": 63.42693,
      "lng": 10.39691
    },
    "photos": [
      {
        "file": "Die Nidaros Kathedrale in Trondheim. 05.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Nidarosdomen 85130 2024-5.jpg",
        "author": "Bjørn Erik Pedersen",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Nidarosdomen 85130 2024-2.jpg",
        "author": "Bjørn Erik Pedersen",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "erkebispegarden": {
    "wd": {
      "qid": "Q599602",
      "label": "Erkebispegården i Trondheim",
      "lat": 63.42597,
      "lng": 10.39677,
      "en": "Archbishop's Palace, Trondheim",
      "official": "https://www.nidarosdomen.no/nb-NO/erkebispegarden+riksregaliene"
    },
    "osm": {
      "id": "way/538808455",
      "name": "Erkebispegården",
      "kind": "historic/castle",
      "lat": 63.4261,
      "lng": 10.39599
    },
    "photos": [
      {
        "file": "Erkebispegården Trondheim 01.jpg",
        "author": "Cato Edvardsen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Palacio del Arzobispo, Trondheim, Noruega, 2019-09-06, DD 134-146 PAN.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Palacio del Arzobispo, Trondheim, Noruega, 2019-09-06, DD 148.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "ringve": {
    "wd": {
      "qid": "Q960829",
      "label": "Ringve Musikkmuseum",
      "lat": 63.448,
      "lng": 10.456,
      "en": "Ringve Museum",
      "official": "https://www.ringve.com"
    },
    "osm": {
      "id": "node/199409849",
      "name": "Ringve Musikkmuseum",
      "kind": "tourism/museum",
      "lat": 63.44743,
      "lng": 10.45405
    },
    "photos": [
      {
        "file": "En lumsk sommerdag.jpg",
        "author": "Ringve",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Ringve botaniske hage foto-åge hojem NTNU Vitenskapsmuseet DSC2823 (15100438270).jpg",
        "author": "NTNU Vitenskapsmuseet",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Ringve botaniske hage foto-åge hojem NTNU Vitenskapsmuseet DSC2803 (15287164375).jpg",
        "author": "NTNU Vitenskapsmuseet",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "sverresborg": {
    "wd": {
      "qid": "Q6516903",
      "label": "Sverresborg Trøndelag Folkemuseum",
      "lat": 63.4213,
      "lng": 10.3571,
      "official": "https://sverresborg.no/"
    },
    "osm": {
      "id": "way/170162091",
      "name": "Sverresborg Trøndelag Folkemuseum",
      "kind": "tourism/museum",
      "lat": 63.41976,
      "lng": 10.35891
    },
    "photos": [
      {
        "file": "Sverresborg Trøndelag Folkemuseum Trondheim, Norway 2019-04-26 Hovedinngang Main entrance Sverresborg alle 06229.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Die Altstadt von Trondheim. Gemischtwarenladen.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Das Trondelag Volkskundemuseum. 03.jpg",
        "author": "Holger Uwe Schmitt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "rockheim": {
    "wd": {
      "qid": "Q15689742",
      "label": "Rockheim",
      "lat": 63.4386,
      "lng": 10.4008,
      "en": "Rockheim",
      "official": "https://www.rockheim.no/"
    },
    "osm": {
      "id": "way/104018578",
      "name": "Rockheim",
      "kind": "tourism/museum",
      "lat": 63.43872,
      "lng": 10.40175
    },
    "photos": [
      {
        "file": "Rockheim fasade panorama.jpg",
        "author": "Thandruin",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Rockheim 01.jpg",
        "author": "Larry Lamsa",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Rockheim IMG 5982.JPG",
        "author": "Bjoertvedt",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "vitensenteret-trondheim": {
    "wd": {
      "qid": "Q3330279",
      "label": "Vitensenteret i Trondheim",
      "lat": 63.43,
      "lng": 10.4008,
      "en": "Trondheim Science Museum",
      "official": "https://www.vitensenteret.com/"
    },
    "photos": [
      {
        "file": "Norges Banks gamle bygg Trondheim.jpg",
        "author": "Jensens",
        "license": "Public domain"
      },
      {
        "file": "Vitensenteret.jpg",
        "author": "Arnfinnrokne",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Vitensenteret Planetarium .jpg",
        "author": "Arnfinnrokne",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "kristiansten": {
    "wd": {
      "qid": "Q2705932",
      "label": "Kristiansten festning",
      "lat": 63.42694,
      "lng": 10.41056,
      "it": "Fortezza di Kristiansen",
      "en": "Kristiansten Fortress"
    },
    "osm": {
      "id": "way/10243780",
      "name": "Kristiansten festning",
      "kind": "historic/fort",
      "lat": 63.42699,
      "lng": 10.41086
    },
    "photos": [
      {
        "file": "Fortaleza de Kristiansten, Trondheim, Noruega, 2019-09-06, DD 65-73 PAN.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Haubitzmagasinet Kristiansten festning Trondheim 2022-08-18 01.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      },
      {
        "file": "Kristiansten festning Trondheim 2022-08-18 01.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      }
    ]
  },
  "gamle-bybro": {
    "wd": {
      "qid": "Q2018531",
      "label": "Gamle Bybro",
      "lat": 63.42813,
      "lng": 10.40182,
      "en": "Old Town Bridge"
    },
    "osm": {
      "id": "node/9852479817",
      "name": "Gamle Bybro",
      "kind": "tourism/viewpoint",
      "lat": 63.42821,
      "lng": 10.40159
    },
    "photos": [
      {
        "file": "Trondheim Gamle Bybrua-1.jpg",
        "author": "Rufus46",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Lykkens Portal, Gamble Bybro, Trondheim, West view 20150605 1.jpg",
        "author": "DXR",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Gamle Bybro, Trondheim, Southwest view 20150605 1.jpg",
        "author": "DXR",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "munkholmen": {
    "wd": {
      "qid": "Q1229257",
      "label": "Munkholmen",
      "lat": 63.45103,
      "lng": 10.38349,
      "it": "Munkholmen",
      "en": "Munkholmen",
      "official": "https://www.munkholmen.no/"
    },
    "osm": {
      "id": "way/15954621",
      "name": "Munkholmen",
      "kind": "place/islet",
      "lat": 63.45231,
      "lng": 10.38378
    },
    "photos": [
      {
        "file": "Munkholmen Trondheim 2026-01-13 01.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      },
      {
        "file": "Munkholmen Trondheim 2026-01-13 02.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      },
      {
        "file": "Munkholmen Trondheim 2026-01-13 03.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      }
    ]
  },
  "pirbadet": {
    "wd": {
      "qid": "Q15635751",
      "label": "Pirbadet",
      "lat": 63.4405,
      "lng": 10.4004,
      "en": "Pirbadet"
    },
    "osm": {
      "id": "node/1291410914",
      "name": "Pirbadet",
      "kind": "leisure/sports_centre",
      "lat": 63.44077,
      "lng": 10.40084
    },
    "photos": [
      {
        "file": "Pirbadet IMG 6001.JPG",
        "author": "Bjoertvedt",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Pirbadet i Trondheim.JPG",
        "author": "Ezzex",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "2010-08-04 - Trondheim - Pirbadet am Hafen - Das größte Freizeitbad Norwegens - panoramio.jpg",
        "author": "giggel",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
      }
    ]
  },
  "stiklestad": {
    "wd": {
      "qid": "Q12003247",
      "label": "Stiklestad Nasjonale Kultursenter",
      "lat": 63.7958,
      "lng": 11.5627,
      "official": "https://stiklestad.no/"
    },
    "osm": {
      "id": "relation/7965392",
      "name": "Stiklestad",
      "kind": "amenity/place_of_worship",
      "lat": 63.79691,
      "lng": 11.56024
    },
    "photos": [
      {
        "file": "Stiklestad Nasjonale Kultursenter.jpg",
        "author": "Pbb",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "roros-kirke": {
    "wd": {
      "qid": "Q1616892",
      "label": "Røros kirke",
      "lat": 62.5774,
      "lng": 11.3877,
      "en": "Røros Church"
    },
    "osm": {
      "id": "way/165624467",
      "name": "Røros kirke",
      "kind": "amenity/place_of_worship",
      "lat": 62.57739,
      "lng": 11.38779
    },
    "photos": [
      {
        "file": "Roeros church.jpg",
        "author": "Mahlum",
        "license": "Public domain"
      },
      {
        "file": "Bergstaden Røros Røros kirke Bergstadens Ziir Hyttklokka Trøndelag Norway (2022.08.04).jpg",
        "author": "Geir Hval (www.MacWhale.eu)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Røros Hitterelva Bergstaden Ziir Raubrua Trøndelag Norway (2022.08.04).jpg",
        "author": "Geir Hval (www.MacWhale.eu)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "smelthytta": {
    "osm": {
      "id": "way/306413367",
      "name": "Smelthytta",
      "kind": "historic/industrial",
      "lat": 62.57706,
      "lng": 11.39125
    },
    "photos": []
  },
  "olavsgruva": {
    "wd": {
      "qid": "Q108729630",
      "label": "Olavsgruva",
      "lat": 62.63098,
      "lng": 11.56307
    },
    "osm": {
      "id": "node/5154198789",
      "name": "Olavsgruva",
      "kind": "aerialway/station",
      "lat": 62.63042,
      "lng": 11.56122
    },
    "photos": [
      {
        "file": "Heishuset ved Olavsgruva, Røros (1052).jpg",
        "author": "Lars Geithe",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Norwegen 1998 (736) Røros (50467193166).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Norwegen 1998 (737) Røros (50467352052).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "namsskogan-familiepark": {
    "wd": {
      "qid": "Q6962092",
      "label": "Park Nordica",
      "lat": 64.7431,
      "lng": 12.84778,
      "it": "Namsskogan Familiepark",
      "en": "Park Nordica",
      "official": "https://www.park-nordica.com/no"
    },
    "osm": {
      "id": "node/9778612436",
      "name": "Namsskogan Familiepark Hotell",
      "kind": "highway/bus_stop",
      "lat": 64.74261,
      "lng": 12.84448
    },
    "photos": [
      {
        "file": "Park Nordica.jpg",
        "author": "Christian Tustrup",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Ulv.JPG",
        "author": "Georg Enga",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Fjellreven Birk.jpg",
        "author": "Aaaandeeers",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "torghatten": {
    "wd": {
      "qid": "Q1476265",
      "label": "Torghatten",
      "lat": 65.39833,
      "lng": 12.08972,
      "en": "Torghatten"
    },
    "osm": {
      "id": "node/287130018",
      "name": "Torghatten",
      "kind": "natural/peak",
      "lat": 65.39834,
      "lng": 12.09115
    },
    "photos": [
      {
        "file": "Torghatten.jpg",
        "author": "Werner Hölzl",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Torghatten Mountain, Southwest view 20150606 1.jpg",
        "author": "DXR",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Norwegen 1998 (679) Torghatten (50281051631).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "vegaoyan": {
    "wd": {
      "qid": "Q488375",
      "label": "Vega",
      "lat": 65.67528,
      "lng": 11.95778,
      "it": "Vega (Norvegia)",
      "en": "Vega Municipality",
      "official": "https://www.vega.kommune.no/"
    },
    "photos": [
      {
        "file": "Neshrbr.jpg",
        "author": "Dana Morris",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Muddværet-Vega.JPG",
        "author": "ZorroIII",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "de-syv-sostre": {
    "wd": {
      "qid": "Q1293127",
      "label": "Sju søstre",
      "lat": 65.95,
      "lng": 12.57,
      "it": "De syv søstre",
      "en": "De syv søstre"
    },
    "photos": [
      {
        "file": "Sju systre.jpg",
        "author": "bobaffe",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Helgelandsbrua & Leirfjorden.jpg",
        "author": "Ximonic, Simo Räsänen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Sju søstre in Alsta, 06 2011.jpg",
        "author": "Ximonic, Simo Räsänen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "petter-dass-museet": {
    "wd": {
      "qid": "Q11995516",
      "label": "Petter Dass-museet",
      "lat": 65.8943,
      "lng": 12.3967,
      "en": "Petter Dass Museum"
    },
    "osm": {
      "id": "way/520581953",
      "name": "Petter Dass-museet",
      "kind": "tourism/museum",
      "lat": 65.89425,
      "lng": 12.39682
    },
    "photos": [
      {
        "file": "Petter Dass-senteret sjøsida.jpg",
        "author": "Mahlum",
        "license": "Public domain"
      },
      {
        "file": "Entree Petter Dass museum.jpg",
        "author": "Wiebenln",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Petter Dass-museet 23 BG.jpg",
        "author": "Bingar1234",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "svartisen": {
    "wd": {
      "qid": "Q1545368",
      "label": "Svartisen",
      "lat": 66.63333,
      "lng": 14,
      "it": "Svartisen",
      "en": "Svartisen"
    },
    "osm": {
      "id": "relation/3742613",
      "name": "Svartisen - Tjáhppisjiegŋa - Tjähppisjiegŋa",
      "kind": "natural/glacier",
      "lat": 66.65376,
      "lng": 13.89849
    },
    "photos": [
      {
        "file": "Norwegen 1998 (593 + 594) Austerdalsisen (49959513662).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Norwegen 1998 (578) Weg zum Svartisen (49881570706).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Norwegen 1998 (577) Svartisvatnet (49876801556).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "saltfjellet-svartisen": {
    "wd": {
      "qid": "Q1391076",
      "label": "Saltfjellet–Svartisen nasjonalpark",
      "lat": 66.6,
      "lng": 14.18333,
      "it": "Parco nazionale Saltfjellet-Svartisen",
      "en": "Saltfjellet–Svartisen National Park"
    },
    "osm": {
      "id": "relation/241701",
      "name": "Saltfjellet-Svartisen nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 66.69497,
      "lng": 14.90211
    },
    "photos": [
      {
        "file": "Bjellåvasstua.jpg",
        "author": "Lars Røed Hansen",
        "license": "CC BY-SA 2.5",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5"
      },
      {
        "file": "Steindalen and Lønstinden in Saltfjellet.jpg",
        "author": "Frankemann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Extraordinary tame reindeer at Saltfjellet.jpg",
        "author": "Frankemann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "polarsirkelsenteret": {
    "wd": {
      "qid": "Q11995904",
      "label": "Polarsirkelsenteret",
      "lat": 66.55258,
      "lng": 15.32363,
      "official": "https://www.polarsirkelsenteret.no/"
    },
    "osm": {
      "id": "way/199413284",
      "name": "Polarsirkelsenteret",
      "kind": "tourism/attraction",
      "lat": 66.5524,
      "lng": 15.32281
    },
    "photos": [
      {
        "file": "Polarsirkelsenteret F.JPG",
        "author": "Sandivas",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Norwegen 1998 (622) Polarsirkelsenteret (50099832277).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Norwegen 1998 (621) Polarsirkelsenteret (50099522471).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "gronligrotta": {
    "wd": {
      "qid": "Q1551739",
      "label": "Grønligrotta",
      "lat": 66.41311,
      "lng": 14.27433,
      "en": "Grønnligrotta"
    },
    "osm": {
      "id": "node/3685871909",
      "name": "Grønligrotta",
      "kind": "natural/cave_entrance",
      "lat": 66.41549,
      "lng": 14.26192
    },
    "photos": [
      {
        "file": "Grönligrotta Strudelloch.jpg",
        "author": "Kroelleboelle",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Norwegen 1998 (536) Grønligrotta (49570028597).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Norwegen 1998 (535) Grønligrotta (49569797696).jpg",
        "author": "Rüdiger Stehn from Kiel, Deutschland",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "rago": {
    "wd": {
      "qid": "Q528924",
      "label": "Rago nasjonalpark",
      "lat": 67.43333,
      "lng": 15.98333,
      "it": "Parco nazionale Rago",
      "en": "Rago National Park",
      "official": "https://ragonasjonalpark.no/"
    },
    "osm": {
      "id": "relation/241699",
      "name": "Rago nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 67.44497,
      "lng": 15.97739
    },
    "photos": [
      {
        "file": "Lost in the wilderness (Rago) - panoramio.jpg",
        "author": "Honza and Ivana Ebr",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
      },
      {
        "file": "Litlverivasforsen flows out of Litlverivatnet and down to Storskogdalen.jpg",
        "author": "Frankemann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Forest landscape on Johanandersoknubben south of Storskogvatnet.jpg",
        "author": "Frankemann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "hamsunsenteret": {
    "wd": {
      "qid": "Q1140025",
      "label": "Hamsunsenteret",
      "lat": 68.08472,
      "lng": 15.64556,
      "en": "Knut Hamsun Centre",
      "official": "https://hamsunsenteret.no/en/"
    },
    "osm": {
      "id": "node/3954429285",
      "name": "Hamsunsenteret",
      "kind": "tourism/museum",
      "lat": 68.08185,
      "lng": 15.64038
    },
    "photos": [
      {
        "file": "Hamsunsenteret.jpg",
        "author": "TorbjørnS",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "jektefartsmuseet": {
    "wd": {
      "qid": "Q117848803",
      "label": "Jektefartsmuseet",
      "lat": 67.26817,
      "lng": 14.42626,
      "official": "https://jektefart.no/Hjem"
    },
    "photos": []
  },
  "narvikfjellet": {
    "wd": {
      "qid": "Q19382563",
      "label": "Narvikfjellet skisenter",
      "lat": 68.43194,
      "lng": 17.44722
    },
    "osm": {
      "id": "way/929328412",
      "name": "Gondolen i Narvikfjellet",
      "kind": "aerialway/gondola",
      "lat": 68.42734,
      "lng": 17.45289
    },
    "photos": [
      {
        "file": "Narvikfjellet Ski Resort seen from Narvik 2026-01-10 01.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      },
      {
        "file": "2019-08-11 Narvik filjet 8.jpg",
        "author": "Nemo bis",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "2019-08-11 Narvik filjet 7.jpg",
        "author": "Nemo bis",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "henningsvaer-stadion": {
    "wd": {
      "qid": "Q118287991",
      "label": "Henningsvær Stadion",
      "lat": 68.148,
      "lng": 14.2007,
      "en": "Henningsvær Stadion"
    },
    "osm": {
      "id": "way/26407811",
      "name": "Hænningsvær stadion",
      "kind": "leisure/pitch",
      "lat": 68.14799,
      "lng": 14.20073
    },
    "photos": [
      {
        "file": "Stade d'Henningsvær.jpg",
        "author": "Patrice78500",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Campo da calcio di Henningsvaer.JPG",
        "author": "l'autore sono io, Cappo80",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "gjesvaerstappan": {
    "wd": {
      "qid": "Q1783891",
      "label": "Gjesværstappan",
      "lat": 71.13583,
      "lng": 25.35722,
      "en": "Gjesværstappan"
    },
    "osm": {
      "id": "way/230772765",
      "name": "Gjesværstappan naturreservat",
      "kind": "leisure/nature_reserve",
      "lat": 71.13765,
      "lng": 25.34523
    },
    "photos": [
      {
        "file": "Gjesværstappan natural reserve-4.jpg",
        "author": "Fanny Schertzer",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Gjesværstappan seen from E 69 on Magerøya 2022-09-10 01.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      },
      {
        "file": "Gjesværstappan seen from E 69 on Magerøya 2022-09-10 02.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      }
    ]
  },
  "honningsvag": {
    "wd": {
      "qid": "Q493472",
      "label": "Honningsvåg",
      "lat": 70.97583,
      "lng": 25.98306,
      "it": "Honningsvåg",
      "en": "Honningsvåg"
    },
    "osm": {
      "id": "node/31264096",
      "name": "Honningsvåg",
      "kind": "place/town",
      "lat": 70.98026,
      "lng": 25.97784
    },
    "photos": [
      {
        "file": "Honningsvåg 2013 06 09 3507 (10319264275).jpg",
        "author": "Harvey Barrison from Massapequa, NY, USA",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Paisaje en Honningsvåg, Noruega, 2019-09-03, DD 81-87 PAN.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Presa, Honningsvåg, Noruega, 2019-09-03, DD 79.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "alta": {
    "wd": {
      "qid": "Q3366952",
      "label": "Alta",
      "lat": 69.96861,
      "lng": 23.27139,
      "en": "Alta (town)"
    },
    "osm": {
      "id": "relation/406659",
      "name": "Alta",
      "kind": "boundary/administrative",
      "lat": 69.9666,
      "lng": 23.27333
    },
    "photos": [
      {
        "file": "Bilde-Alta boligomraade.jpg",
        "author": "Haavis",
        "license": "Public domain"
      },
      {
        "file": "アルタフィヨルドを見渡す.jpg",
        "author": "Professionalenglish",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Alta kultursal.jpg",
        "author": "Sondre Mikkola",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "alta-museum": {
    "wd": {
      "qid": "Q433634",
      "label": "Helleristningene i Alta",
      "lat": 69.94694,
      "lng": 23.18778,
      "it": "Graffiti rupestri di Alta",
      "en": "Rock carvings at Alta"
    },
    "osm": {
      "id": "node/1697898112",
      "name": "Alta Museum",
      "kind": "highway/bus_stop",
      "lat": 69.94676,
      "lng": 23.18919
    },
    "photos": [
      {
        "file": "Alta-Carvings-2012-07-17-12-15-018.jpg",
        "author": "Karl Brodowsky",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "20171102ingvild007.jpg",
        "author": "Karin Tansem",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "20180801ingvild20.jpg",
        "author": "Heidi Johansen",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "nordlyskatedralen": {
    "wd": {
      "qid": "Q3612501",
      "label": "Nordlyskatedralen",
      "lat": 69.965,
      "lng": 23.2664,
      "en": "Northern Lights Cathedral",
      "official": "https://nordlyskatedral.no"
    },
    "osm": {
      "id": "node/9415123964",
      "name": "Nordlyskatedralen",
      "kind": "highway/bus_stop",
      "lat": 69.96609,
      "lng": 23.26441
    },
    "photos": [
      {
        "file": "Nordlyskatedralen, Alta, Northeast view 20150611 1.jpg",
        "author": "DXR",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Alta, Nordlyskatedralen (cattedrale delle luci boreali), esterno 04.jpg",
        "author": "Francesco Bini",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Alta, Nordlyskatedralen (cattedrale delle luci boreali), esterno, accesso.jpg",
        "author": "Francesco Bini",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "tirpitz-museum": {
    "wd": {
      "qid": "Q7809271",
      "label": "Tirpitz Museum",
      "lat": 69.93061,
      "lng": 23.01634,
      "it": "Museo Tirpitz (Norvegia)",
      "en": "Tirpitz Museum (Norway)"
    },
    "osm": {
      "id": "way/245228580",
      "name": "Tirpitz Museum",
      "kind": "amenity/parking",
      "lat": 69.93153,
      "lng": 23.01751
    },
    "photos": [
      {
        "file": "Kåfjord, museo tirpitz, esterno 02.jpg",
        "author": "Francesco Bini",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Tirpitz Memorial Kåfjord.JPG",
        "author": "Tirpitz Museum",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Kåfjord, museo tirpitz, esterno 01.jpg",
        "author": "Francesco Bini",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "hammerfest": {
    "wd": {
      "qid": "Q721374",
      "label": "Hammerfest",
      "lat": 70.66336,
      "lng": 23.68209,
      "en": "Hammerfest",
      "official": "https://www.hammerfest.kommune.no"
    },
    "osm": {
      "id": "node/31264092",
      "name": "Hammerfest",
      "kind": "place/town",
      "lat": 70.66284,
      "lng": 23.68311
    },
    "photos": [
      {
        "file": "Hammerfest Juni 2005.jpg",
        "author": "Clemensfranz",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Hammerfest town in Hammerfest municipality, Troms og Finnmark, Norway, 2022 August.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "NO-Hammerfest-hafen-suedseite.jpg",
        "author": "Balou46",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "meridianstotten": {
    "wd": {
      "qid": "Q64520669",
      "label": "Meridianstøtten",
      "lat": 70.67,
      "lng": 23.66333
    },
    "osm": {
      "id": "node/433327779",
      "name": "Meridianstøtten",
      "kind": "historic/monument",
      "lat": 70.66999,
      "lng": 23.66343
    },
    "photos": [
      {
        "file": "Hammerfest, fuglenes, memoriale per l'arco geodetico di struve, misurato a partire da qui, colonna 02.jpg",
        "author": "Francesco Bini",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Struvemeridianen Hammerfest 100800 2024-2.jpg",
        "author": "Bjørn Erik Pedersen",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "isbjornklubben": {
    "wd": {
      "qid": "Q1673757",
      "label": "Royal and Ancient Polar Bear Society",
      "lat": 70.66441,
      "lng": 23.67781,
      "en": "Royal and Ancient Polar Bear Society"
    },
    "osm": {
      "id": "node/5009227821",
      "name": "Isbjørnklubben",
      "kind": "tourism/museum",
      "lat": 70.66376,
      "lng": 23.69001
    },
    "photos": [
      {
        "file": "Royal and Ancient Polar Bear Society in Hammerfest 2013.jpg",
        "author": "Manxruler",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "sapmi-park": {
    "osm": {
      "id": "way/726110608",
      "name": "Sápmi park",
      "kind": "tourism/theme_park",
      "lat": 69.4731,
      "lng": 25.50709
    },
    "photos": []
  },
  "samiske-samlinger": {
    "wd": {
      "qid": "Q3367239",
      "label": "De Samiske Samlinger",
      "lat": 69.47346,
      "lng": 25.52007
    },
    "osm": {
      "id": "way/318633158",
      "name": "Sámiid Vuorká-Dávvirat / De Samiske Samlinger",
      "kind": "tourism/museum",
      "lat": 69.47334,
      "lng": 25.52012
    },
    "photos": [
      {
        "file": "Grundstein Mamma Karasjok Zentrum.jpg",
        "author": "Gkowar",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Plagged hut.jpg",
        "author": "LHOON from Mechelen, Belgium",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "sametinget": {
    "wd": {
      "qid": "Q64203",
      "label": "Sametinget",
      "lat": 69.47087,
      "lng": 25.49642,
      "it": "Parlamento Sami della Norvegia",
      "en": "Sámi Parliament of Norway",
      "official": "https://www.sametinget.no/"
    },
    "osm": {
      "id": "way/726127398",
      "name": "Sámediggi",
      "kind": "amenity/parking",
      "lat": 69.4715,
      "lng": 25.49827
    },
    "photos": [
      {
        "file": "Sametinget fra luften II (11644531466).jpg",
        "author": "Sámediggi Sametinget",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "juhls": {
    "wd": {
      "qid": "Q18689635",
      "label": "Juhls' Silvergallery",
      "lat": 68.99412,
      "lng": 23.03087,
      "official": "https://www.juhls.no/"
    },
    "photos": [
      {
        "file": "JuhlsSølvsmie.jpg",
        "author": "Illustratedjc",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Fra Juhls sølvsmie (14396711845).jpg",
        "author": "Kommunikasjonsavdelingen NTFK",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Fra Juhls sølvsmie (14395349702).jpg",
        "author": "Kommunikasjonsavdelingen NTFK",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "kirkenes": {
    "wd": {
      "qid": "Q209423",
      "label": "Kirkenes",
      "lat": 69.72708,
      "lng": 30.04511,
      "it": "Kirkenes",
      "en": "Kirkenes",
      "official": "https://www.svk.no/"
    },
    "osm": {
      "id": "node/27129690",
      "name": "Kirkenes",
      "kind": "place/town",
      "lat": 69.72715,
      "lng": 30.0449
    },
    "photos": [
      {
        "file": "Kirkenes, with a foggy Varangerfjord.jpg",
        "author": "Bair175",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Kirkenes town, 2019.jpg",
        "author": "Norwegian Barents Secretariat",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Kirkenes town, 2019 (2).jpg",
        "author": "Norwegian Barents Secretariat",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "grenselandmuseet": {
    "wd": {
      "qid": "Q16799055",
      "label": "Sør-Varanger Museum",
      "lat": 69.7169,
      "lng": 30.0434
    },
    "photos": []
  },
  "grense-jakobselv": {
    "wd": {
      "qid": "Q944689",
      "label": "Grense Jakobselv",
      "lat": 69.77261,
      "lng": 30.83775,
      "it": "Grense Jakobselv",
      "en": "Grense Jakobselv"
    },
    "osm": {
      "id": "node/2074786266",
      "name": "Grense Jakobselv - Vuorjánjohka - Vuoremijoki",
      "kind": "place/hamlet",
      "lat": 69.79101,
      "lng": 30.79643
    },
    "photos": [
      {
        "file": "Misty Grense Jakobselv 2009-09-29.JPG",
        "author": "MattiPaavola",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Le hameau de Grense Jakobselv (Norvège).jpg",
        "author": "Jean-Pierre Bazard Jpbazard",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Grense1 (7780429272).jpg",
        "author": "Kartverket",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "vardohus": {
    "wd": {
      "qid": "Q1476429",
      "label": "Vardøhus",
      "lat": 70.37207,
      "lng": 31.0953,
      "en": "Vardøhus Fortress",
      "official": "https://www.nordnorge.com/en/?News=63"
    },
    "osm": {
      "id": "way/653561700",
      "name": "Vardøhus festning",
      "kind": "tourism/museum",
      "lat": 70.37211,
      "lng": 31.09531
    },
    "photos": [
      {
        "file": "Vardøhus fortress in Vardø seen from air.jpg",
        "author": "Timo Noko",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "VARDØ VARDØHUS Festning Fortress 1737 NORWAY Kanontransportvogn 1865 TN1 feltartilleri Vogn Hester Ladetøyhuset 1869 Vognskur museum Horse drawn field artillery Gun carriage Cannon cartwheels Coach house wagon shed IMG 9192.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "VARDØ VARDØHUS Festning Fortress 1737 NORWAY Kanontransportvogn 1865 TN1 feltartilleri Vogn Hester Ladetøyhuset 1869 Vognskur museum Horse drawn field artillery Gun carriage Cannon cartwheels Coach house wagon shed IMG 9191.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "steilneset": {
    "wd": {
      "qid": "Q1260955",
      "label": "Steilneset minnested",
      "lat": 70.36952,
      "lng": 31.09179,
      "en": "Steilneset Memorial"
    },
    "osm": {
      "id": "node/3235757560",
      "name": "Steilneset Minnested",
      "kind": "historic/monument",
      "lat": 70.36881,
      "lng": 31.09331
    },
    "photos": [
      {
        "file": "Steglneset.jpg",
        "author": "Stylegar",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "VARDØ Vardøya NORWAY Steilneset minnested Heksemonument hekseprosesser (Witches’ Memorial 91 victims 17c Finnmark) L Bourgeois Fire installation Flammehuset Zumthor Glass pavillion 135 m Hall corridor 2011 Fog Bussefjorden b.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "VARDØ Vardøya NORWAY Steilneset minnested Heksemonument hekseprosesser (Witches’ Memorial 91 executed victims 17c trials Finnmark) Peter Zumthor 135 m Minnehall Hall corridor with biographies (2011) Interior 2023-07-28 IMG 9357.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "hornoya": {
    "wd": {
      "qid": "Q3735119",
      "label": "Hornøya",
      "lat": 70.3879,
      "lng": 31.15402,
      "en": "Hornøya (Finnmark)"
    },
    "osm": {
      "id": "relation/14991437",
      "name": "Hornøya",
      "kind": "place/island",
      "lat": 70.38695,
      "lng": 31.15864
    },
    "photos": [
      {
        "file": "Hornøya.jpg",
        "author": "Olavfin",
        "license": "FAL",
        "licenseUrl": "https://artlibre.org/licence/lal/en"
      },
      {
        "file": "Vardø Finnmark Norway Harbour (Flickr album Hurtigruten March 2015) Paul.horsefield - 17369534012.jpg",
        "author": "paul.horsefield",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Vardø, Norway.jpg",
        "author": "Bair175",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "hamningberg": {
    "wd": {
      "qid": "Q1013560",
      "label": "Hamningberg",
      "lat": 70.54122,
      "lng": 30.60956,
      "en": "Hamningberg"
    },
    "osm": {
      "id": "node/1346547920",
      "name": "Hamningberg",
      "kind": "place/village",
      "lat": 70.5402,
      "lng": 30.61626
    },
    "photos": [
      {
        "file": "Hamningberg.jpg",
        "author": "Ricksulman at Dutch Wikipedia",
        "license": "Public domain"
      },
      {
        "file": "Herd of reindeer at Hamningberg, 2012 June.JPG",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Paysages sur la route Fv341 en direction d' Hamningberg (5).jpg",
        "author": "Jean Bazard",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "stabbursdalen": {
    "wd": {
      "qid": "Q1472424",
      "label": "Stabbursdalen nasjonalpark",
      "lat": 69.98333,
      "lng": 24.48333,
      "it": "Parco nazionale Stabbursdalen",
      "en": "Stabbursdalen National Park"
    },
    "osm": {
      "id": "relation/13336045",
      "name": "Stabbursdalen nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 70.02074,
      "lng": 24.45332
    },
    "photos": [
      {
        "file": "Stabbursdalen National Park - 2.jpg",
        "author": "Thor Thorsson from Stenungsund, Sweden",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Herd of reindeer beneath a waterfall.jpg",
        "author": "Lauri Rantala from Espoo, Finland",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Stabburselva.JPG",
        "author": "Arnstein Rønning",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "ovre-pasvik": {
    "wd": {
      "qid": "Q317253",
      "label": "Øvre Pasvik nasjonalpark",
      "lat": 69.09351,
      "lng": 28.95053,
      "it": "Parco nazionale Øvre Pasvik",
      "en": "Øvre Pasvik National Park"
    },
    "osm": {
      "id": "relation/226997",
      "name": "Øvre Pasvik nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 69.11668,
      "lng": 28.90103
    },
    "photos": [
      {
        "file": "Twisted trunk.jpg",
        "author": "Dan Nordal from Kirkenes, Norway",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "ovre-dividal": {
    "wd": {
      "qid": "Q317225",
      "label": "Øvre Dividal nasjonalpark",
      "lat": 68.63333,
      "lng": 19.86667,
      "it": "Parco nazionale Øvre Dividal",
      "en": "Øvre Dividal National Park",
      "official": "https://www.norgesnasjonalparker.no/nasjonalparker/ovre-dividal/"
    },
    "osm": {
      "id": "relation/13336031",
      "name": "Øvre Dividal nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 68.70851,
      "lng": 19.76925
    },
    "photos": [
      {
        "file": "Övre dividal anjajohka.jpg",
        "author": "Edgarski",
        "license": "CC BY-SA 2.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/de/deed.en"
      },
      {
        "file": "Dividalen.jpg",
        "author": "Kim Grønbæk Skytte",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "reisa": {
    "wd": {
      "qid": "Q2091798",
      "label": "Reisa nasjonalpark",
      "lat": 69.2,
      "lng": 21.96667,
      "it": "Parco nazionale Reisa",
      "en": "Reisa National Park",
      "official": "https://english.dirnat.no/content.ap?thisId=1008233"
    },
    "osm": {
      "id": "relation/241695",
      "name": "Reisa nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 69.23714,
      "lng": 22.03151
    },
    "photos": [
      {
        "file": "Mollisfossen.jpg",
        "author": "pululante",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Reisadalen 2.JPG",
        "author": "Judisa",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Reisadalen.JPG",
        "author": "Judisa",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "blaisvatnet": {
    "wd": {
      "qid": "Q101428347",
      "label": "Blåisvatnet",
      "lat": 69.72898,
      "lng": 20.03729
    },
    "osm": {
      "id": "way/355193092",
      "name": "Blåisvatnet - Jiehkkejávri",
      "kind": "water/lake",
      "lat": 69.72904,
      "lng": 20.034
    },
    "photos": []
  },
  "telegrafbukta": {
    "wd": {
      "qid": "Q12005398",
      "label": "Telegrafbukta",
      "lat": 69.63208,
      "lng": 18.90648
    },
    "osm": {
      "id": "node/1357951812",
      "name": "Telegrafbukta",
      "kind": "natural/bay",
      "lat": 69.63188,
      "lng": 18.90593
    },
    "photos": [
      {
        "file": "Panorama Telegrafbukta (17332697475).jpg",
        "author": "Harald Groven from Tromsø, Norway",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Plage de Telegrafbukta, Tromsø.jpg",
        "author": "Patrice78500",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Plage de Telegrafbukta, Tromsø, cabine électrique.jpg",
        "author": "Patrice78500",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  }
};

/** Foto in più per luoghi già presenti nel catalogo (stesso elemento Wikidata di src/data/wiki.ts) */
export const ATTR_FOTO_ESISTENTI: Record<string, PlacePhoto[]> = {
  "alesund": [
    {
      "file": "Vista de Ålesund desde Aksla, Noruega, 2019-09-01, DD 16.jpg",
      "author": "Diego Delso",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Doors of Alesund (44918327581).jpg",
      "author": "joiseyshowaa",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "Art Nouveau city from the Museum.jpg",
      "author": "joiseyshowaa",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    }
  ],
  "atlanterhavsparken": [
    {
      "file": "Atlantic Sea-Park inglés (Alesund) - P1080228.jpg",
      "author": "El Pantera",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Atlantikpark Gebäude Alesund.jpg",
      "author": "Olaf Meister",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Anarhichas-lupus-Atlanterhavsparken.jpg",
      "author": "Bjørn Christian Tørrissen",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "atlanterhavsveien": [
    {
      "file": "Route de l'Atlantique en norvège.jpg",
      "author": "Clementp.fr",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Averøy Atlanterhavsvegen lub 2025-07-26 img02.jpg",
      "author": "Lukas Beck",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
    },
    {
      "file": "Noorwegen 238 (9306533134).jpg",
      "author": "rob Stoeltje from loenen, netherlands",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    }
  ],
  "aurlandsfjellet": [
    {
      "file": "Norway Aurland Laerdal3.jpg",
      "author": "Aconcagua",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    }
  ],
  "aurlandsfjord": [
    {
      "file": "2023-07-05-Flåm-6842.jpg",
      "author": "Superbass",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Aurland Aurlandsfjorden flenjaegga 1446m lofti 1222m panorama.jpg",
      "author": "Bjoertvedt",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Aurland Aurlandsfjorden handklefjellet husanosi panorama.jpg",
      "author": "Bjoertvedt",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "balestrand": [
    {
      "file": "Balestrand (again).jpg",
      "author": "Andrew Bowden from London, United Kingdon",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "Sæle kyrkje, 2019-8.jpg",
      "author": "Bjørn Erik Pedersen",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Tjugum kyrkje, 2019-8.jpg",
      "author": "Bjørn Erik Pedersen",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "bergen": [
    {
      "file": "Vista de Bergen desde la montaña Fløyen, Noruega, 2019-09-08, DD 27-31 PAN.jpg",
      "author": "Diego Delso",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Markthalle in Bergen (Norwegen).jpg",
      "author": "Alice Wiegand",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Wohngebäude in Bergen.jpg",
      "author": "Alice Wiegand",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "bergen-aquarium": [
    {
      "file": "Akvariet Bergen.jpg",
      "author": "Nina Aldin Thune",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
    },
    {
      "file": "Bergen Aquarium5219.JPG",
      "author": "יעקב",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Bergen Aquarium4914.JPG",
      "author": "יעקב",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "bergensbanen": [
    {
      "file": "NSB El 18 2245 Tunga.jpg",
      "author": "Kabelleger / David Gubler",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Finse Rallarvegen 2018 (202121).jpg",
      "author": "Tore Sætre",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Finseå Jernbanebru Rallarvegen 2018 (102939).jpg",
      "author": "Tore Sætre",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "briksdalsbreen": [
    {
      "file": "Briksdalsbreen-close-18july2006.jpg",
      "author": "Jens Vinsrygg",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
    },
    {
      "file": "BriksdalsbreenPano1.jpg",
      "author": "Aqwis",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "Briksdalselva and Briksdalsbreen, Sogn og Fjordane, Norway, 2013 June.jpg",
      "author": "Ximonic (Simo Räsänen)",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    }
  ],
  "dalsnibba": [
    {
      "file": "Norwegen 1998 (308) Dalsnibba (32358714227).jpg",
      "author": "Rüdiger Stehn from Kiel, Deutschland",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "Norwegen 1998 (300) Dalsnibba (47257063541).jpg",
      "author": "Rüdiger Stehn from Kiel, Deutschland",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "\"Die höchste mit dem Auto erreichbare Fjordaussicht Europas\". 06.jpg",
      "author": "Holger Uwe Schmitt",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "dovrefjell": [
    {
      "file": "Snohetta.jpg",
      "author": "Kjetil Kjernsmo",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
    },
    {
      "file": "Drugshøi seen from Larseggen.jpg",
      "author": "Frankemann",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Kaldvella river with autumn's first ice.jpg",
      "author": "Frankemann",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "dyreparken": [
    {
      "file": "Kardemomme by.jpg",
      "author": "KEN",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "Abra Havn 1.JPG",
      "author": "CarstenR",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "Skomakergata.jpg",
      "author": "Kristska",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    }
  ],
  "fjellsenter": [
    {
      "file": "Norsk fjellsenter.jpg",
      "author": "Jan-Tore Egge",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Fossbergom fra fjellsenteret til stavkirken.jpg",
      "author": "Jan-Tore Egge",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "flam": [
    {
      "file": "Flam.jpg",
      "author": "Palmiped",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "AIDAprima in Flåm, Norway - June 2022.jpg",
      "author": "Martin Falbisoner",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Aurlandsfjorden from Flam.jpg",
      "author": "Davide Mauro",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "flamsbana": [
    {
      "file": ".00 1230 Flåmsbana und Bahnhof von Flåm, Norwegen.jpg",
      "author": "W. Bulach",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Flåmsbana - Crowned the most beautiful train journey in the world (31219397394).jpg",
      "author": "Jorge Láscar from Melbourne, Australia",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    },
    {
      "file": "Berekvam, Norway (29206081243).jpg",
      "author": "Juan Antonio F. Segal from Madrid, Spain",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    }
  ],
  "folkemuseum": [
    {
      "file": "Norway Folk Museum - Street scene.jpg",
      "author": "P. Hughes",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
    },
    {
      "file": "Flour mill, 1500-1600, Norsk Folkemuseum, Oslo (1) (36466789505).jpg",
      "author": "Richard Mortel from Riyadh, Saudi Arabia",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    },
    {
      "file": "Flour mill, 1500-1600, Norsk Folkemuseum, Oslo (2) (36069941710).jpg",
      "author": "Richard Mortel from Riyadh, Saudi Arabia",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    }
  ],
  "fram": [
    {
      "file": "Fram Museum in Oslo.JPG",
      "author": "Pudelek (Marcin Szala)",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "kontiki": [
    {
      "file": "The Kon-Tiki Museum, Oslo.jpg",
      "author": "Grzegorz Wysocki",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
    },
    {
      "file": "\"Ein Denkmal für Thor Heyerdahl\" - Das Kon-Tiki Museum in Oslo. 12.jpg",
      "author": "Holger Uwe Schmitt",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "\"Ein Denkmal für Thor Heyerdahl\" - Das Kon-Tiki Museum in Oslo. 04.jpg",
      "author": "Holger Uwe Schmitt",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "munch": [
    {
      "file": "Munchmuseet Oslo JUN2019.jpg",
      "author": "Annikdance",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Munchmuseet Oslo 2026-01-14 01.jpg",
      "author": "Leonhard Lenz",
      "license": "CC0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    },
    {
      "file": "Munchmuseet Oslo 2026-01-14 02.jpg",
      "author": "Leonhard Lenz",
      "license": "CC0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  ],
  "teknisk": [
    {
      "file": "Norsk Teknisk Museum TRS 070501 011.jpg",
      "author": "Trond Strandsberg",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
    },
    {
      "file": "Shellgården NTM F 005140.jpg",
      "author": "Norsk Teknisk Museum",
      "license": "Public domain"
    }
  ],
  "holmenkollen": [
    {
      "file": "Holmenkollen with visitors centre.jpg",
      "author": "m.prinke",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "Holmenkollen Ski Museum exhibition, 2019.jpg",
      "author": "Mateusz Giełczyński",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Skimuseet i Holmenkollen (2).jpg",
      "author": "Jean-Pierre Bazard Jpbazard",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    }
  ],
  "vigeland": [
    {
      "file": "Frognerpark water.jpg",
      "author": "Stan Shebs",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "Frogner Park - Oslo, Norway 2020-11-08 (02).jpg",
      "author": "Ryan Hodnett",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Frognerdammen den 13. juli 2014..JPG",
      "author": "Omar hoftun",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "geiranger": [
    {
      "file": ".00 1262 Geiranger - Norway.jpg",
      "author": "W. Bulach",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Geiranger, Noruega, 2019-09-07, DD 75.jpg",
      "author": "Diego Delso",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Carretera 63, Geiranger, Noruega, 2019-09-07, DD 11.jpg",
      "author": "Diego Delso",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "geirangerfjord": [
    {
      "file": "Fiordo de Geiranger desde Flydalsjuvet, Noruega, 2019-09-07, DD 61.jpg",
      "author": "Diego Delso",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Fiordo de Geiranger 05.jpg",
      "author": "Alberto-g-rovi",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
    },
    {
      "file": "Geiranger fjord - panoramio.jpg",
      "author": "patano",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    }
  ],
  "glacier-museum": [
    {
      "file": "Museo Glaciar Fjaerland.jpg",
      "author": "Canaan",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Norwegen 1998 (243) Norsk bremuseum (32327724798).jpg",
      "author": "Rüdiger Stehn from Kiel, Deutschland",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "\"Das Norwegische Gletschermuseum ist landesweit führend bei der Vermittlung von Wissen über Gletscher und Klima\". 02.jpg",
      "author": "Holger Uwe Schmitt",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "hardangerfjord": [
    {
      "file": "Hardangerfjorden from krokavatn 2.jpg",
      "author": "SinWin",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
    },
    {
      "file": "190 Kilometer lang und bis zu 893 tief ist der Hardangerfjord. 01.jpg",
      "author": "Holger Uwe Schmitt",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "AW Im Hardangerfjord 01.jpg",
      "author": "Alice Wiegand",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "hjorundfjord": [
    {
      "file": "Tvergrov-Hj rundfjordenfraa-Viddal.jpg",
      "author": "Tvergrov",
      "license": "CC BY 1.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/1.0"
    },
    {
      "file": "Landscape from Lekneset towards west, Ørsta, Møre og Romsdal, Norway, 2025 June.jpg",
      "author": "Ximonic (Simo Räsänen)",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "2015-04-27 212347 sunset in Norway.jpg",
      "author": "Ximeg",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
    }
  ],
  "hunderfossen": [
    {
      "file": "Hunderfossen - Trollet.JPG",
      "author": "Stig Sunde",
      "license": "Public domain"
    },
    {
      "file": "Eventyrslottet i Hunderfossen Familiepark.jpg",
      "author": "MikkelMagnus",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Lillehammer Hunderfossen familiepark IMG 1112.JPG",
      "author": "Bjoertvedt",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    }
  ],
  "jotunheimen": [
    {
      "file": "Jotunheimen - view from Galdhøpiggen1.JPG",
      "author": "Pudelek (Marcin Szala)",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Delicate ski trail down Storutladalen.jpg",
      "author": "Frankemann",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Crowded on the peaks around Bjørnbrean.jpg",
      "author": "Frankemann",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "kongeparken": [
    {
      "file": "Kongeparken2007.jpg",
      "author": "Jarvin",
      "license": "CC BY 2.5",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.5"
    },
    {
      "file": "Kongeparken in Norwegen 06.jpg",
      "author": "Olaf2",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Kongeparken in Norwegen 08.jpg",
      "author": "Olaf2",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "langedrag": [
    {
      "file": "Langedrag Naturpark 2024 a.jpg",
      "author": "Donmalta",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Eurasian lynx climbing a tree.jpg",
      "author": "Tom Bech",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    },
    {
      "file": "Eurasian Wolf (9358589025).jpg",
      "author": "Tom Bech from Oslo, Norway",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    }
  ],
  "latefossen": [
    {
      "file": "00 N223 Låtefossen - Norwegen.jpg",
      "author": "W. Bulach",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Låtefossen, Norway 20170524 134232.jpg",
      "author": "dconvertini",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "Låtefossen, Norway 20170524 134505.jpg",
      "author": "dconvertini",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    }
  ],
  "lillehammer": [
    {
      "file": "Lillehammer near stasjon 2022-08-17 01.jpg",
      "author": "Leonhard Lenz",
      "license": "CC0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    },
    {
      "file": "Lillehammer near stasjon 2022-08-17 02.jpg",
      "author": "Leonhard Lenz",
      "license": "CC0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    },
    {
      "file": "Lillehammer near stasjon 2022-08-17 03.jpg",
      "author": "Leonhard Lenz",
      "license": "CC0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  ],
  "lysefjord": [
    {
      "file": "Lysefjorden fjord.jpg",
      "author": "User Vikingstad on en.wikipedia",
      "license": "Public domain"
    },
    {
      "file": "Fjordn surface wave boat.jpg",
      "author": "Edmont",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "FIORDO DE LYSE.jpg",
      "author": "Marilu Cervantes",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "naeroyfjord": [
    {
      "file": "Nærøyfjorden mot Gudvangen.jpg",
      "author": "mcxurxo",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    },
    {
      "file": "Bakkavegen Fv 5623 at Bakka by Nærøyfjorden, Aurland, Vestland, Norway, 2025 June.jpg",
      "author": "Ximonic (Simo Räsänen)",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Aurland Bakkanosi 1398m panorama.jpg",
      "author": "Bjoertvedt",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "nigardsbreen": [
    {
      "file": "Nigardsbreen lodowiec.jpg",
      "author": "Szczepcia20",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "2023-07-07-Nigardsbreen-6898.jpg",
      "author": "Superbass",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Nigardsbreen view.JPG",
      "author": "Sissssou",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    }
  ],
  "nordkapp": [
    {
      "file": "Cabo Norte, Noruega, 2019-09-03, DD 16.jpg",
      "author": "Diego Delso",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Panorama view of the cliffs at North Cape.jpg",
      "author": "Stch2022",
      "license": "CC0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    },
    {
      "file": "20040623.Nordkap.Nordkapfelsen.-011.jpg",
      "author": "Bybbisch94, Christian Gebhardt",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "odda": [
    {
      "file": "ODDA.JPG",
      "author": "Svein Harkestad",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
    },
    {
      "file": "Odde Peak.jpg",
      "author": "S. Josuason",
      "license": "Public domain"
    }
  ],
  "ornesvingen": [
    {
      "file": "Stranda Geirangerfjord lub 2025-07-29 img08.jpg",
      "author": "Lukas Beck",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
    },
    {
      "file": "Norwegen 1998 (356) Adlerstraße (48966195608).jpg",
      "author": "Rüdiger Stehn from Kiel, Deutschland",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "Geiranger, Norway (Unsplash).jpg",
      "author": "Cosmic Timetraveler atw",
      "license": "CC0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  ],
  "oslo": [
    {
      "file": "View from siloen.jpg",
      "author": "Sean Hayford O'Leary",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    },
    {
      "file": "Oslo 2023 - ETRS Kodak Color Gold 200 - Flickr - penerik.jpg",
      "author": "Erik",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    }
  ],
  "preikestolen": [
    {
      "file": "Preikestolen Norge.jpg",
      "author": "Stefan Krause, Germany",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
    },
    {
      "file": "Panorama of Lysefjord.jpg",
      "author": "Carsten Steger",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Preikestolen 3 (52606536284).jpg",
      "author": "Maarten Heerlien from Voorschoten, The Netherlands",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    }
  ],
  "roros": [
    {
      "file": "RorosViewFromSlagHeaps.jpg",
      "author": "China_Crisis",
      "license": "CC BY-SA 2.5",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5"
    },
    {
      "file": "Bergstaden Røros Røros kirke Bergstadens Ziir Slegghaugan Smelthytta Trøndelag Norway (2022.08.04).jpg",
      "author": "Geir Hval (www.MacWhale.eu)",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Christmas in Røros.jpg",
      "author": "Simon Radchenko",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
    }
  ],
  "runde": [
    {
      "file": "Isle of Runde 20130705 190219.jpg",
      "author": "Julian-G. Albert",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    },
    {
      "file": "Runde - Herøy, Norway 2022-07-05 (02).jpg",
      "author": "Ryan Hodnett",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Runde - Herøy, Norway 2022-07-04 (04).jpg",
      "author": "Ryan Hodnett",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "sju-sostrene": [
    {
      "file": "Fiordo de Geiranger, Noruega, 2019-09-07, DD 35.jpg",
      "author": "Diego Delso",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Geirangerfjord, Norway (Unsplash).jpg",
      "author": "Cosmic Timetraveler atw",
      "license": "CC0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    },
    {
      "file": "Geirangerfjorden 37.jpg",
      "author": "Millars",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "sognefjord": [
    {
      "file": "Sognefjord, Norway.jpg",
      "author": "en:User:Worldtraveller,",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
    },
    {
      "file": "\"Fjorddorf mit einer langen künstlerischen Geschichte\". 17.jpg",
      "author": "Holger Uwe Schmitt",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "\"Fjorddorf mit einer langen künstlerischen Geschichte\". 14.jpg",
      "author": "Holger Uwe Schmitt",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "stavanger": [
    {
      "file": "Vaagen-modf.jpg",
      "author": "Original by Odd Inge Worsøe",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
    },
    {
      "file": "Norway 20220728 (52606706785).jpg",
      "author": "Maarten Heerlien from Voorschoten, The Netherlands",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    },
    {
      "file": "In Stavanger, Norwegen IMG 9159WI.jpg",
      "author": "Kora27",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "stegastein": [
    {
      "file": "Shrouded Flenjahornet (31985977288).jpg",
      "author": "mendhak",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "2023-07-05-Stegastein-6849.jpg",
      "author": "Superbass",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Gamle Aurlandsvegen, Photo from 2021-08-28.jpg",
      "author": "AUTOR.4200",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "steinsdalsfossen": [
    {
      "file": "Steinsdalsfossen.jpg",
      "author": "Andreas Sandberg",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
    },
    {
      "file": "Norwegen 1998 (086) Steinsdalsfossen (33312285073).jpg",
      "author": "Rüdiger Stehn from Kiel, Deutschland",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "\"Der Steinsdalsfossen gilt als einer der meistbesuchten Wasserfälle Norwegens\" 05.jpg",
      "author": "Holger Uwe Schmitt",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "trollstigen": [
    {
      "file": "Trollstigen HochPanno.jpg",
      "author": "Stefan Krause, Germany",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "Isterdalen from above Stigfossen, Rauma, Møre og Romsdal, Norway, 2025 May.jpg",
      "author": "Ximonic (Simo Räsänen)",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Autumn in Norway (51658369777).jpg",
      "author": "Ralf Hüsges",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    }
  ],
  "trolltunga": [
    {
      "file": "View of trolltunga.jpg",
      "author": "TerjeN",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
    },
    {
      "file": "The Troll's Tongue.jpg",
      "author": "Asgeir Helgestad/Artic Light AS/visitnorway.com",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
    },
    {
      "file": "Trolltunga 2.jpg",
      "author": "Steinar Talmoen",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    }
  ],
  "trondheim": [
    {
      "file": "Overview of Trondheim 2008 03.jpg",
      "author": "Åge Hojem/Trondheim Havn from Trondheim, Norway",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    }
  ],
  "tusenfryd": [
    {
      "file": "Spinspider.jpg",
      "author": "Mackcoast",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Middelalder.jpg",
      "author": "Mackcoast",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Tusenfryd (1).jpg",
      "author": "Eirik Yven from Oslo, Norge",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    }
  ],
  "undredal": [
    {
      "file": "Undredal.jpg",
      "author": "Micha L. Rieser",
      "license": "Attribution"
    },
    {
      "file": "Undredal by Aurlandsfjorden, Aurland, Vestland, Norway, 2025 June.jpg",
      "author": "Ximonic (Simo Räsänen)",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Undredal by Aurlandsfjorden in Aurland, Vestland, Norway, 2025 June - 3.jpg",
      "author": "Ximonic (Simo Räsänen)",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "voringsfossen": [
    {
      "file": "Vøringfossen.jpg",
      "author": "Kenny Louie",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    },
    {
      "file": "Måbødalen, 2011 August.jpg",
      "author": "Ximonic, Simo Räsänen",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "Norwegen 1998 (059) Vøringsfossen (33184015393).jpg",
      "author": "Rüdiger Stehn from Kiel, Deutschland",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    }
  ],
  "whale-andenes": [
    {
      "file": "Noorwegen 211 (9296591967).jpg",
      "author": "rob Stoeltje from loenen, netherlands",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    },
    {
      "file": "Noorwegen 206 (9296584099).jpg",
      "author": "rob Stoeltje from loenen, netherlands",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    }
  ]
};
