// GENERATO da scripts/build-nord.mjs a partire da docs/ricerca-luoghi-nord.json: non modificare a mano.
// Dati di base dei luoghi della zona nord (catalogo NO-3): coordinate con la loro fonte (Wikidata P625 oppure
// OpenStreetMap/Nominatim), riferimenti a Wikidata e Wikipedia, sito ufficiale (Wikidata P856), foto di Wikimedia
// Commons con autore e licenza. Abbinamento: per nome E per distanza da un punto indicativo (mai salvato).

import type { PlacePhoto } from './placeExtras';

export interface NordFonte {
  wd?: { qid: string; label: string; lat: number; lng: number; it?: string; en?: string; official?: string };
  osm?: { id: string; name: string; kind: string; lat: number; lng: number };
  /** Foto prese da una categoria di Commons del luogo indicata a mano (luoghi senza elemento Wikidata adatto) */
  photosOwn?: true;
  photos: PlacePhoto[];
}

/** Data di lettura di coordinate, riferimenti, foto e licenze */
export const NORD_CHECKED_AT = '2026-11-10';

export const NORD_FONTI: Record<string, NordFonte> = {
  "bodo": {
    "wd": {
      "qid": "Q221119",
      "label": "Bodø",
      "lat": 67.28306,
      "lng": 14.38306,
      "it": "Bodø",
      "en": "Bodø Municipality",
      "official": "https://bodo.kommune.no/"
    },
    "osm": {
      "id": "relation/409037",
      "name": "Bodø",
      "kind": "boundary/administrative",
      "lat": 67.28443,
      "lng": 14.38175
    },
    "photos": [
      {
        "file": "Bodø 2006.jpg",
        "author": "Røed",
        "license": "CC BY-SA 2.5",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5"
      },
      {
        "file": "Bodø 20170722 133158.jpg",
        "author": "Sergei Gussev",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "kjerringoy": {
    "wd": {
      "qid": "Q15623695",
      "label": "Kjerringøy handelssted",
      "lat": 67.52063,
      "lng": 14.76163,
      "en": "Kjerringøy trading post",
      "official": "https://nordlandsmuseet.no/kjerringoy_handelssted/"
    },
    "osm": {
      "id": "node/5342118844",
      "name": "Kjerringøy",
      "kind": "highway/bus_stop",
      "lat": 67.51927,
      "lng": 14.75836
    },
    "photos": [
      {
        "file": "Kjerringøy Handelssted.jpg",
        "author": "Øyvind Nohr Søderbom",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "luftfartsmuseum": {
    "wd": {
      "qid": "Q6515356",
      "label": "Norsk Luftfartsmuseum",
      "lat": 67.27667,
      "lng": 14.41167,
      "en": "Norwegian Aviation Museum",
      "official": "https://luftfartsmuseum.no/en/"
    },
    "osm": {
      "id": "way/153340863",
      "name": "Norsk Luftfartsmuseum",
      "kind": "tourism/museum",
      "lat": 67.27608,
      "lng": 14.4137
    },
    "photos": [
      {
        "file": "Old Bodø control tower.jpg",
        "author": "Soldatnytt from Oslo, Norway",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Norsk luftfartsmuseum.jpg",
        "author": "Lars Røed Hansen",
        "license": "Public domain"
      }
    ]
  },
  "mjelle": {
    "wd": {
      "qid": "Q31211628",
      "label": "Mjelletinden",
      "lat": 67.41793,
      "lng": 14.65754
    },
    "osm": {
      "id": "node/267751021",
      "name": "Mjelde",
      "kind": "place/hamlet",
      "lat": 67.40928,
      "lng": 14.62709
    },
    "photos": []
  },
  "keiservarden": {
    "wd": {
      "qid": "Q11980475",
      "label": "Keiservarden",
      "lat": 67.31482,
      "lng": 14.4785,
      "en": "Keiservarden"
    },
    "osm": {
      "id": "node/3172289041",
      "name": "Keiservarden",
      "kind": "natural/peak",
      "lat": 67.31496,
      "lng": 14.47832
    },
    "photos": [
      {
        "file": "Bodø seen from Keiservarden.jpeg",
        "author": "kallerna",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Keiservarden.JPG",
        "author": "KaarloNorge",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "moskenes": {
    "wd": {
      "qid": "Q4583742",
      "label": "Moskenes kirke",
      "lat": 67.9004,
      "lng": 13.0463,
      "en": "Moskenes Church"
    },
    "osm": {
      "id": "relation/408478",
      "name": "Moskenes",
      "kind": "boundary/administrative",
      "lat": 67.90234,
      "lng": 13.04187
    },
    "photos": [
      {
        "file": "Moskenes Church 2009.JPG",
        "author": "Sveter",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Moskenes kirke 141.jpg",
        "author": "rob Stoeltje from loenen, netherlands",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Moskenes kirke.jpg",
        "author": "Henny stokseth",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "sorvagen": {
    "wd": {
      "qid": "Q2298359",
      "label": "Sørvågen",
      "lat": 67.89056,
      "lng": 13.02528,
      "it": "Sørvågen",
      "en": "Sørvågen, Moskenes"
    },
    "osm": {
      "id": "way/552912915",
      "name": "Sørvågen",
      "kind": "natural/bay",
      "lat": 67.88944,
      "lng": 13.02684
    },
    "photos": [
      {
        "file": "Moskenes view 2009.JPG",
        "author": "Sveter",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Sørvågen, Northeast view 20150608 2.jpg",
        "author": "DXR",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Sørvågen, Northeast view 20150608 1.jpg",
        "author": "DXR",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "reinebringen": {
    "wd": {
      "qid": "Q31652043",
      "label": "Reinebringen",
      "lat": 67.9261,
      "lng": 13.07532
    },
    "osm": {
      "id": "node/886650679",
      "name": "Reinebringen",
      "kind": "natural/peak",
      "lat": 67.92784,
      "lng": 13.0714
    },
    "photos": [
      {
        "file": "Fjellet Reinebringen i høstfarger.jpg",
        "author": "Lofotenfriluftsrad",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Reinebringen by Night, Lofoten, Norway.jpg",
        "author": "Christoph Strässler",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Hamnøya, Toppøya, Olenilsøya and other islands of Reinefjorden in Moskenes, Nordland, Norway, 2022 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "kvalvika": {
    "wd": {
      "qid": "Q11982594",
      "label": "Kvalvika",
      "lat": 68.079,
      "lng": 13.08
    },
    "osm": {
      "id": "node/12365548524",
      "name": "Kvalvika",
      "kind": "natural/bay",
      "lat": 68.07997,
      "lng": 13.08043
    },
    "photos": [
      {
        "file": "Nordnorwegen 2019 0215 (48651841428).jpg",
        "author": "Markus Trienke",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Nordnorwegen 2019 0198 (48652089081).jpg",
        "author": "Markus Trienke",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Kvalvika - view.jpg",
        "author": "Raf24~commonswiki",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      }
    ]
  },
  "ryten": {
    "wd": {
      "qid": "Q31657540",
      "label": "Ryten",
      "lat": 68.08908,
      "lng": 13.09298
    },
    "osm": {
      "id": "node/1814108322",
      "name": "Ryten",
      "kind": "natural/peak",
      "lat": 68.08933,
      "lng": 13.0929
    },
    "photos": [
      {
        "file": "Ryten and Torsfjordtinden in Flakstad, Nordland, Norway, 2022 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Hiking Trail to Ryten, Lofoten, Norway.jpg",
        "author": "Christoph Strässler",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "View towards Ryten and Middagstinden over Kåkersundet in Flakstad, Nordland, Norway, 2022 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "fredvang": {
    "wd": {
      "qid": "Q1777230",
      "label": "Fredvangbruene",
      "lat": 68.08111,
      "lng": 13.19056,
      "en": "Fredvang Bridges"
    },
    "osm": {
      "id": "node/1599256706",
      "name": "Fredvang",
      "kind": "place/village",
      "lat": 68.08406,
      "lng": 13.16669
    },
    "photos": [
      {
        "file": "Fredvang Bridges 2006.jpg",
        "author": "bittidjz",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Wide view over Hovdanvika, Selfjorden and Torsfjorden at Fredvang in Flakstad, Nordland, Norway, 2022 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Strandveien road via the Fredvang Bridges, Nordland, Norway, 2022 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "ramberg": {
    "wd": {
      "qid": "Q1771286",
      "label": "Ramberg",
      "lat": 68.09083,
      "lng": 13.23167,
      "en": "Ramberg, Flakstad"
    },
    "osm": {
      "id": "node/1384274312",
      "name": "Ramberg",
      "kind": "place/village",
      "lat": 68.08991,
      "lng": 13.22989
    },
    "photos": [
      {
        "file": "Ramberg (Lofoten).jpg",
        "author": "Æøå",
        "license": "Public domain"
      },
      {
        "file": "Nordnorwegen 2019 0112 (48616856787).jpg",
        "author": "Markus Trienke",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Nordnorwegen 2019 0301 (49222468382).jpg",
        "author": "Markus Trienke",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "flakstad-kirke": {
    "wd": {
      "qid": "Q4582019",
      "label": "Flakstad kirke",
      "lat": 68.1048,
      "lng": 13.3063,
      "en": "Flakstad Church"
    },
    "osm": {
      "id": "way/169718277",
      "name": "Flakstad kirke",
      "kind": "amenity/place_of_worship",
      "lat": 68.10482,
      "lng": 13.30625
    },
    "photos": [
      {
        "file": "Flakstad kyrkje.jpg",
        "author": "Jon Olav Eikenes from Oslo, Norway",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Flakstad kirkested.jpg",
        "author": "Mikkoau",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "skagsanden": {
    "osm": {
      "id": "node/8402345777",
      "name": "Skagsanden",
      "kind": "tourism/viewpoint",
      "lat": 68.10343,
      "lng": 13.28533
    },
    "photos": []
  },
  "vikten": {
    "wd": {
      "qid": "Q3558284",
      "label": "Vikten",
      "lat": 68.14013,
      "lng": 13.31629
    },
    "osm": {
      "id": "node/9161763458",
      "name": "Vikten",
      "kind": "highway/bus_stop",
      "lat": 68.14294,
      "lng": 13.31497
    },
    "photos": [
      {
        "file": "Vikten-02-Strand-2019-gje.jpg",
        "author": "Gerd Eichmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Costa de Napp, Lofoten, Noruega, 2019-09-05, DD 21.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Costa de Napp, Lofoten, Noruega, 2019-09-05, DD 26-29 PAN.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "ballstad": {
    "wd": {
      "qid": "Q2148025",
      "label": "Ballstad",
      "lat": 68.07431,
      "lng": 13.54515,
      "en": "Ballstad"
    },
    "osm": {
      "id": "node/9840554355",
      "name": "Ballstad",
      "kind": "place/farm",
      "lat": 68.06885,
      "lng": 13.53276
    },
    "photos": [
      {
        "file": "Ballstad-winter.jpg",
        "author": "Algkalv",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
      }
    ]
  },
  "leknes": {
    "wd": {
      "qid": "Q1993766",
      "label": "Leknes",
      "lat": 68.1475,
      "lng": 13.6115,
      "it": "Leknes",
      "en": "Leknes"
    },
    "osm": {
      "id": "node/31264104",
      "name": "Leknes",
      "kind": "place/town",
      "lat": 68.14746,
      "lng": 13.61153
    },
    "photos": [
      {
        "file": "Leknes-winter.jpg",
        "author": "Algkalv",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
      },
      {
        "file": "Vista de Leknes, Lofoten, Noruega, 2019-09-05, DD 10-18 PAN.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Vista de Leknes, Lofoten, Noruega, 2019-09-05, DD 09.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "uttakleiv": {
    "osm": {
      "id": "way/283663152",
      "name": "Uttakleiv",
      "kind": "amenity/parking",
      "lat": 68.20934,
      "lng": 13.50499
    },
    "photosOwn": true,
    "photos": [
      {
        "file": "Nordnorwegen 2019 0251 (49222307202).jpg",
        "author": "Markus Trienke",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "The Eye of Uttakleiv (48712703187).jpg",
        "author": "Markus Trienke",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Uttakleiv, Lofoten.JPG",
        "author": "Paal Svendsen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "unstad": {
    "wd": {
      "qid": "Q19393966",
      "label": "Unstad",
      "lat": 68.267,
      "lng": 13.588
    },
    "osm": {
      "id": "node/3644081451",
      "name": "Unstad",
      "kind": "place/hamlet",
      "lat": 68.26735,
      "lng": 13.58749
    },
    "photos": [
      {
        "file": "Unstad-10-Strand-2019-gje.jpg",
        "author": "Gerd Eichmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Mountain view at Unstadsjøveien road in Vestvågøy, Nordland, Norway, 2022 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Unstad in Vestvågøy, Nordland, Norway, 2022 June - 2.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "eggum": {
    "wd": {
      "qid": "Q3049167",
      "label": "Eggum",
      "lat": 68.308,
      "lng": 13.685
    },
    "osm": {
      "id": "way/683265967",
      "name": "Eggum naturreservat",
      "kind": "leisure/nature_reserve",
      "lat": 68.30018,
      "lng": 13.63293
    },
    "photos": [
      {
        "file": "Eggum Vestvågøy.jpg",
        "author": "Sberla_",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "borg-lofoten": {
    "wd": {
      "qid": "Q2930166",
      "label": "Bøstad",
      "lat": 68.25167,
      "lng": 13.76861,
      "en": "Bøstad"
    },
    "osm": {
      "id": "node/249162255",
      "name": "Bøstad",
      "kind": "place/quarter",
      "lat": 68.23976,
      "lng": 13.75033
    },
    "photos": []
  },
  "stamsund": {
    "wd": {
      "qid": "Q786301",
      "label": "Stamsund",
      "lat": 68.13,
      "lng": 13.84917,
      "it": "Stamsund",
      "en": "Stamsund"
    },
    "osm": {
      "id": "node/171244415",
      "name": "Stamsund",
      "kind": "amenity/ferry_terminal",
      "lat": 68.12107,
      "lng": 13.84071
    },
    "photos": [
      {
        "file": "Stamsund Hafen.jpg",
        "author": "Clemensfranz",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Stamsund - Vestvågøy Municipality, Nordland, Norway - August 1989.jpg",
        "author": "Giorgio Galeotti",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "gimsoy": {
    "wd": {
      "qid": "Q1524834",
      "label": "Gimsøya",
      "lat": 68.30056,
      "lng": 14.2075,
      "it": "Gimsøya",
      "en": "Gimsøya"
    },
    "osm": {
      "id": "relation/4148162",
      "name": "Gimsøya",
      "kind": "place/island",
      "lat": 68.30133,
      "lng": 14.2083
    },
    "photos": [
      {
        "file": "View at Gimsøystraumen in Vågan, Lofoten, Norway, 2015 April.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Gimsøy-02-2019-gje.jpg",
        "author": "Gerd Eichmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "kabelvag": {
    "wd": {
      "qid": "Q1719658",
      "label": "Kabelvåg",
      "lat": 68.21667,
      "lng": 14.48333,
      "en": "Kabelvåg"
    },
    "osm": {
      "id": "node/220018283",
      "name": "Kabelvåg",
      "kind": "place/village",
      "lat": 68.21012,
      "lng": 14.47738
    },
    "photos": [
      {
        "file": "Kabelvåg fra sjøsiden.jpg",
        "author": "Henrik Dvergsdal",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Kabelvåg, Lofoten, Noruega, 2019-09-05, DD 36-40 PAN.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "lofotakvariet": {
    "wd": {
      "qid": "Q1867915",
      "label": "Lofotakvariet",
      "lat": 68.2074,
      "lng": 14.4495
    },
    "osm": {
      "id": "node/5870439785",
      "name": "Lofotakvariet",
      "kind": "tourism/museum",
      "lat": 68.2075,
      "lng": 14.44894
    },
    "photos": [
      {
        "file": "Lofotakvariet 2004.jpg",
        "author": "Stahlkocher",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Lofoten Aquarium in Vågan, Nordland, Norway, 2022 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Lofoten Aquarium in Vågan, Nordland, Norway, 2022 June - 2.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "lofotmuseet": {
    "wd": {
      "qid": "Q15051545",
      "label": "Lofotmuseet",
      "lat": 68.20697,
      "lng": 14.45292
    },
    "osm": {
      "id": "relation/7450282",
      "name": "Lofotmuseet",
      "kind": "tourism/museum",
      "lat": 68.2068,
      "lng": 14.45331
    },
    "photos": [
      {
        "file": "Lofoten Museum, Kabelvåg, Lofoten (15226703298).jpg",
        "author": "Christoph Strässler from Oberdorf BL, Schweiz",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Lofotmuseet in Vågan, Nordland, Norway, 2022 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Lofotmuseet 21 BG.jpg",
        "author": "Bingar1234",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "lofotkatedralen": {
    "wd": {
      "qid": "Q1474775",
      "label": "Vågan kirke",
      "lat": 68.2157,
      "lng": 14.4832,
      "en": "Vågan Church"
    },
    "osm": {
      "id": "way/71865264",
      "name": "Vågan kirke",
      "kind": "amenity/place_of_worship",
      "lat": 68.21565,
      "lng": 14.48373
    },
    "photos": [
      {
        "file": "Kabelvåg-Kirche-14-2019-gje.jpg",
        "author": "Gerd Eichmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "svolvaergeita": {
    "wd": {
      "qid": "Q7652784",
      "label": "Svolværgeita",
      "lat": 68.24611,
      "lng": 14.58833,
      "en": "Svolværgeita"
    },
    "osm": {
      "id": "node/1649780256",
      "name": "Svolværgeita",
      "kind": "natural/peak",
      "lat": 68.24623,
      "lng": 14.58847
    },
    "photos": [
      {
        "file": "Svolværgeita 01.jpg",
        "author": "David Torras from Igualada, Catalunya",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Svolværgeita.jpg",
        "author": "Sonia Marotta",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Svolvær Svolværgeita.jpg",
        "author": "Cyril Doussin from Brisbane, Australia",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "krigsminnemuseum": {
    "wd": {
      "qid": "Q11986678",
      "label": "Lofoten Krigsminnemuseum",
      "lat": 68.23111,
      "lng": 14.56472,
      "en": "Lofoten War Memorial Museum"
    },
    "osm": {
      "id": "node/6301902085",
      "name": "Lofoten Krigsminnemuseum",
      "kind": "tourism/museum",
      "lat": 68.23116,
      "lng": 14.56482
    },
    "photos": [
      {
        "file": "Lofoten Krigsminnemuseum (World War 2 Memorial Museum 1940-1945), Fiskergata 3, Svolvær, Norway 2019-05-08 DSC09819.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Handicraft fish made of wood by a Russian POW in a German camp in Norway. Lofoten World War II Memorial Museum (Lofoten Krigsminnemuseum) Svolvær, Norway 2008.jpg",
        "author": "Juanjo Marin",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "trollfjord": {
    "wd": {
      "qid": "Q1029073",
      "label": "Trollfjorden",
      "lat": 68.36417,
      "lng": 14.9775,
      "it": "Trollfjord",
      "en": "Trollfjord"
    },
    "osm": {
      "id": "node/6447858085",
      "name": "trollfjorden",
      "kind": "tourism/viewpoint",
      "lat": 68.36394,
      "lng": 14.97604
    },
    "photos": [
      {
        "file": "Fiordo de Troll, Lofoten, Noruega, 2019-09-05, DD 67.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Trollfjorden - Hadsel, Norway 2023-07-15 (12).jpg",
        "author": "Ryan Hodnett",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Trollfjorden - Hadsel, Norway 2023-07-15 (01).jpg",
        "author": "Ryan Hodnett",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "skrova": {
    "wd": {
      "qid": "Q7536657",
      "label": "Skrova fyr",
      "lat": 68.15306,
      "lng": 14.64889,
      "en": "Skrova Lighthouse"
    },
    "osm": {
      "id": "node/274648683",
      "name": "Skrova",
      "kind": "place/village",
      "lat": 68.167,
      "lng": 14.66106
    },
    "photos": [
      {
        "file": "Lofoten - 20120601 051.JPG",
        "author": "Johan Leide",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "laukvik": {
    "wd": {
      "qid": "Q3218626",
      "label": "Laukvik",
      "lat": 68.3881,
      "lng": 14.4177,
      "en": "Laukvik, Nordland"
    },
    "osm": {
      "id": "node/9502139818",
      "name": "Laukvik",
      "kind": "highway/bus_stop",
      "lat": 68.38809,
      "lng": 14.41787
    },
    "photos": []
  },
  "vaeroy": {
    "wd": {
      "qid": "Q48629",
      "label": "Værøy",
      "lat": 67.67306,
      "lng": 12.66917,
      "it": "Værøy",
      "en": "Værøy Municipality",
      "official": "https://varoy.kommune.no/"
    },
    "osm": {
      "id": "node/1833539992",
      "name": "Sørland",
      "kind": "place/village",
      "lat": 67.66556,
      "lng": 12.69766
    },
    "photos": [
      {
        "file": "Værøy DSCF1963 Norway.jpg",
        "author": "Ian Cochrane from Melbourne, Australia",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Værøy lub 2025-07-24 img07.jpg",
        "author": "Lukas Beck",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      },
      {
        "file": "Værøy lub 2025-07-24 img14.jpg",
        "author": "Lukas Beck",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      }
    ]
  },
  "rost": {
    "wd": {
      "qid": "Q130048",
      "label": "Røst",
      "lat": 67.52,
      "lng": 12.09889,
      "it": "Røst",
      "en": "Røst Municipality",
      "official": "https://rost.kommune.no/"
    },
    "osm": {
      "id": "node/8291494238",
      "name": "Røst",
      "kind": "place/village",
      "lat": 67.5172,
      "lng": 12.1169
    },
    "photos": [
      {
        "file": "Røst Islands, Hernyken, Trenyken, Storfjellet.jpg",
        "author": "Adamlebaigue",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "fiskevaersmuseum": {
    "wd": {
      "qid": "Q7061110",
      "label": "Norsk Fiskeværsmuseum",
      "lat": 67.8814,
      "lng": 12.982,
      "en": "Norwegian Fishing Village Museum"
    },
    "osm": {
      "id": "way/75281923",
      "name": "Norsk Fiskeværsmuseum",
      "kind": "tourism/museum",
      "lat": 67.88137,
      "lng": 12.98206
    },
    "photos": [
      {
        "file": "Norsk Fiskevaersmuseum in Aa (1).jpg",
        "author": "Tournasol7",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Norsk Fiskeværsmuseum - cod liver oil facility.JPG",
        "author": "Toxophilus",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Norsk Fiskeværsmuseum - housing.JPG",
        "author": "Toxophilus",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "torrfiskmuseum": {
    "wd": {
      "qid": "Q3868164",
      "label": "Lofoten Tørrfiskmuseum",
      "lat": 67.8823,
      "lng": 12.9841,
      "it": "Museo dello stoccafisso delle Lofoten",
      "en": "Lofoten Stockfish Museum",
      "official": "https://www.datadesign.ws/stockfish.htm"
    },
    "osm": {
      "id": "node/889028492",
      "name": "Lofoten tørrfiskmuseum",
      "kind": "tourism/museum",
      "lat": 67.88227,
      "lng": 12.98415
    },
    "photos": [
      {
        "file": "Sztokfisz muzeum A.jpg",
        "author": "Jojo, Original uploader was Jojo at pl.wikipedia",
        "license": "Public domain"
      },
      {
        "file": "Tran Damperi, Lofoten Tørrfiskmuseum, Å, Moskenes, West view 20150608 1.jpg",
        "author": "DXR",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Lofoten Tørrfiskmuseum, Å, Moskenes, Southwest view 20150608 1.jpg",
        "author": "DXR",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "galleri-espolin": {
    "wd": {
      "qid": "Q47477608",
      "label": "Galleri Espolin",
      "lat": 68.20806,
      "lng": 14.45139,
      "en": "Espolin Gallery"
    },
    "osm": {
      "id": "node/849064538",
      "name": "Galleri Espolin",
      "kind": "amenity/arts_centre",
      "lat": 68.20814,
      "lng": 14.45147
    },
    "photos": []
  },
  "sortland": {
    "wd": {
      "qid": "Q48844",
      "label": "Sortland",
      "lat": 68.69583,
      "lng": 15.41306,
      "it": "Sortland",
      "en": "Sortland Municipality",
      "official": "https://www.sortland.kommune.no/"
    },
    "osm": {
      "id": "node/31264141",
      "name": "Sortland",
      "kind": "place/town",
      "lat": 68.69513,
      "lng": 15.41483
    },
    "photos": []
  },
  "stokmarknes": {
    "wd": {
      "qid": "Q288577",
      "label": "Stokmarknes",
      "lat": 68.56556,
      "lng": 14.90583,
      "it": "Stokmarknes",
      "en": "Stokmarknes"
    },
    "osm": {
      "id": "node/31264146",
      "name": "Stokmarknes",
      "kind": "place/town",
      "lat": 68.567,
      "lng": 14.91335
    },
    "photos": [
      {
        "file": "Stokmarknes winter.jpg",
        "author": "Janter",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Vesteralen (5) (13508018114).jpg",
        "author": "Martin de Lusenet from Heemskerk, Netherlands",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Vesteralen (2), Norway (13364812755).jpg",
        "author": "Martin de Lusenet from Heemskerk, Netherlands",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "hurtigrutemuseet": {
    "wd": {
      "qid": "Q1638752",
      "label": "Hurtigrutemuseet",
      "lat": 68.56969,
      "lng": 14.91253,
      "en": "Norwegian Coastal Express Museum",
      "official": "https://www.hurtigrutemuseet.no/"
    },
    "osm": {
      "id": "way/979358194",
      "name": "Hurtigrutemuseet",
      "kind": "tourism/museum",
      "lat": 68.56931,
      "lng": 14.91255
    },
    "photos": [
      {
        "file": "Hurtigrutemuseet 23 BG.jpg",
        "author": "Bingar1234",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "The Former MS Finnmarken.jpg",
        "author": "Larry Lamsa",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Hurtigrutemuseet 1.jpg",
        "author": "Sandwort",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "melbu": {
    "wd": {
      "qid": "Q577137",
      "label": "Melbu",
      "lat": 68.5025,
      "lng": 14.7996,
      "it": "Melbu",
      "en": "Melbu"
    },
    "osm": {
      "id": "node/885289555",
      "name": "Melbu",
      "kind": "place/village",
      "lat": 68.50126,
      "lng": 14.80094
    },
    "photos": [
      {
        "file": "Melbu.jpg",
        "author": "Blue Elf",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Melbu Butikksenter.jpg",
        "author": "Patrice78500",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Melbu̠ - Bassin de plaisance.jpg",
        "author": "Patrice78500",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "nyksund": {
    "wd": {
      "qid": "Q1011569",
      "label": "Nyksund",
      "lat": 68.99556,
      "lng": 15.01333,
      "it": "Nyksund",
      "en": "Nyksund"
    },
    "osm": {
      "id": "node/6372387457",
      "name": "Nyksund",
      "kind": "highway/bus_stop",
      "lat": 68.9952,
      "lng": 15.00978
    },
    "photos": [
      {
        "file": "Nyksund Norway.jpg",
        "author": "Arnejohs at English Wikipedia",
        "license": "Public domain"
      }
    ]
  },
  "sto": {
    "wd": {
      "qid": "Q991431",
      "label": "Stø",
      "lat": 69.01731,
      "lng": 15.11925,
      "en": "Stø"
    },
    "osm": {
      "id": "node/4756068889",
      "name": "Stø",
      "kind": "place/village",
      "lat": 69.01883,
      "lng": 15.12397
    },
    "photos": [
      {
        "file": "Stø.jpg",
        "author": "Guilhem Boyer",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Stø DSCF1018 Norway.jpg",
        "author": "Ian Cochrane from Melbourne, Australia",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Stø 01.jpg",
        "author": "Blue Elf",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "bleik": {
    "wd": {
      "qid": "Q2378793",
      "label": "Bleik",
      "lat": 69.27262,
      "lng": 15.95544,
      "en": "Bleik"
    },
    "osm": {
      "id": "way/38286999",
      "name": "Bleik",
      "kind": "landuse/residential",
      "lat": 69.27188,
      "lng": 15.95846
    },
    "photos": []
  },
  "bleiksoya": {
    "wd": {
      "qid": "Q11219242",
      "label": "Bleiksøya",
      "lat": 69.27392,
      "lng": 15.87831,
      "en": "Bleiksøya"
    },
    "osm": {
      "id": "node/1259999388",
      "name": "Bleiksøya",
      "kind": "natural/peak",
      "lat": 69.27399,
      "lng": 15.87661
    },
    "photos": [
      {
        "file": "Bleiksøya.jpg",
        "author": "Sondrekv",
        "license": "Public domain"
      }
    ]
  },
  "andenes-fyr": {
    "wd": {
      "qid": "Q4753689",
      "label": "Andenes fyr",
      "lat": 69.324,
      "lng": 16.1159,
      "en": "Andenes Lighthouse"
    },
    "osm": {
      "id": "way/37865155",
      "name": "Andenes fyr",
      "kind": "man_made/lighthouse",
      "lat": 69.32401,
      "lng": 16.11591
    },
    "photos": [
      {
        "file": "Andenes fyr.jpg",
        "author": "Røed",
        "license": "CC BY-SA 2.5",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5"
      }
    ]
  },
  "spaceship-aurora": {
    "wd": {
      "qid": "Q528446",
      "label": "Andøya Space",
      "lat": 69.29417,
      "lng": 16.02083,
      "it": "Centro spaziale di Andøya",
      "en": "Andøya Space",
      "official": "https://andoyaspace.no"
    },
    "osm": {
      "id": "way/569433118",
      "name": "Andøya Space",
      "kind": "aeroway/spaceport",
      "lat": 69.29454,
      "lng": 16.0233
    },
    "photos": [
      {
        "file": "Rocketrangesummer.JPG",
        "author": "MM2sp",
        "license": "Public domain"
      },
      {
        "file": "VS-40M-SHEFEX-II-prepared.jpg",
        "author": "DLR",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      }
    ]
  },
  "moysalen": {
    "wd": {
      "qid": "Q1276455",
      "label": "Møysalen nasjonalpark",
      "lat": 68.51667,
      "lng": 15.5,
      "it": "Parco nazionale Møysalen",
      "en": "Møysalen National Park",
      "official": "https://www.norgesnasjonalparker.no/nasjonalparker/moysalen/"
    },
    "osm": {
      "id": "relation/241698",
      "name": "Møysalen nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 68.51123,
      "lng": 15.54495
    },
    "photos": [
      {
        "file": "Moysalen 2.jpg",
        "author": "Nomen nescio",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Sebortinden-2016.jpg",
        "author": "Bjørn Christian Tørrissen",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Moysalen 3.jpg",
        "author": "Wolfgang Hägele",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "harstad": {
    "wd": {
      "qid": "Q62140",
      "label": "Harstad",
      "lat": 68.79878,
      "lng": 16.53927,
      "it": "Harstad",
      "en": "Harstad Municipality",
      "official": "https://www.harstad.kommune.no/"
    },
    "osm": {
      "id": "relation/407767",
      "name": "Harstad",
      "kind": "boundary/administrative",
      "lat": 68.79994,
      "lng": 16.54403
    },
    "photos": [
      {
        "file": "Harstad Wikipedia CreativeCommons v2 SteveNilsen 01.jpg",
        "author": "Stevenilsen",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "trondenes-kirke": {
    "wd": {
      "qid": "Q574695",
      "label": "Trondenes kirke",
      "lat": 68.822,
      "lng": 16.5622,
      "en": "Trondenes Church"
    },
    "osm": {
      "id": "node/7099802138",
      "name": "Trondenes kirke",
      "kind": "highway/bus_stop",
      "lat": 68.82134,
      "lng": 16.55922
    },
    "photos": [
      {
        "file": "Trondenes kirke 85673 2024-5.jpg",
        "author": "Bjørn Erik Pedersen",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "trondenes-senter": {
    "wd": {
      "qid": "Q7845463",
      "label": "Trondenes Historiske Senter",
      "lat": 68.8203,
      "lng": 16.5575,
      "en": "Trondenes Historical Center"
    },
    "osm": {
      "id": "way/109974356",
      "name": "Trondenes historiske senter",
      "kind": "tourism/museum",
      "lat": 68.82019,
      "lng": 16.55871
    },
    "photos": [
      {
        "file": "Trondenes Historical Center.jpg",
        "author": "Manxruler",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Trondenes historiske senter Harstad Troms Norway 2019-05-19 evening Vågfjorden etc DSC01268.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Trondenes historiske senter Harstad Troms Norway 2019-05-19 evening Vågfjorden etc DSC01266.jpg",
        "author": "Wolfmann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "narvik": {
    "wd": {
      "qid": "Q59101",
      "label": "Narvik",
      "lat": 68.43828,
      "lng": 17.42777,
      "it": "Narvik",
      "en": "Narvik (town)"
    },
    "osm": {
      "id": "node/20981180",
      "name": "Narvik",
      "kind": "place/town",
      "lat": 68.43838,
      "lng": 17.4272
    },
    "photos": [
      {
        "file": "Norway Narvik 3.jpg",
        "author": "Tom Corser",
        "license": "CC BY-SA 2.0 uk",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/uk/deed.en"
      },
      {
        "file": "Narvik town 2022-09-05 01.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      },
      {
        "file": "Narvik town 2022-09-05 02.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      }
    ]
  },
  "narvik-krigsmuseum": {
    "wd": {
      "qid": "Q17305301",
      "label": "Nordland Røde Kors krigsminnemuseum",
      "lat": 68.4378,
      "lng": 17.42546,
      "official": "https://narviksenteret.no"
    },
    "osm": {
      "id": "node/1891043046",
      "name": "Narvik krigsmuseum",
      "kind": "tourism/museum",
      "lat": 68.43778,
      "lng": 17.42537
    },
    "photos": [
      {
        "file": "Anchor of Norge in Narvik.jpg",
        "author": "Manxruler",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "ofotbanen": {
    "wd": {
      "qid": "Q1082916",
      "label": "Ofotbanen",
      "lat": 68.4,
      "lng": 17.5,
      "it": "Ferrovia Narvik-Bjørnfjell",
      "en": "Ofoten Line"
    },
    "osm": {
      "id": "node/4308614634",
      "name": "Ofotbanen 1903-1928",
      "kind": "tourism/artwork",
      "lat": 68.4339,
      "lng": 18.05305
    },
    "photos": [
      {
        "file": "Bjørnfjell mountain and cottages.jpg",
        "author": "Harald Groven",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "gryllefjord": {
    "wd": {
      "qid": "Q1817061",
      "label": "Gryllefjord",
      "lat": 69.36278,
      "lng": 17.05278,
      "it": "Gryllefjord",
      "en": "Gryllefjord"
    },
    "osm": {
      "id": "node/10204238085",
      "name": "Gryllefjorden - Grullefierda",
      "kind": "place/farm",
      "lat": 69.36221,
      "lng": 17.0498
    },
    "photos": [
      {
        "file": "Gryllefjord-From-Ballesvikskaret.jpg",
        "author": "Bjørn Christian Tørrissen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "torsken": {
    "wd": {
      "qid": "Q322825",
      "label": "Torsken kirke",
      "lat": 69.3373,
      "lng": 17.0975,
      "en": "Torsken Church"
    },
    "osm": {
      "id": "node/10204238331",
      "name": "Torsken - Doasku",
      "kind": "place/locality",
      "lat": 69.33943,
      "lng": 17.10274
    },
    "photos": [
      {
        "file": "Torsken-Old-Church.jpg",
        "author": "Bjørn Christian Tørrissen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "hamn-i-senja": {
    "wd": {
      "qid": "Q3126550",
      "label": "Hamn",
      "lat": 69.41722,
      "lng": 17.16222
    },
    "osm": {
      "id": "node/5416347423",
      "name": "Hamn",
      "kind": "place/hamlet",
      "lat": 69.41736,
      "lng": 17.16489
    },
    "photos": [
      {
        "file": "View of Hamn i Senja, Norge 02.jpg",
        "author": "dspett",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
      },
      {
        "file": "Senja(2).jpg",
        "author": "Chmee2",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      },
      {
        "file": "Senja(1).jpg",
        "author": "Chmee2",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      }
    ]
  },
  "skaland": {
    "wd": {
      "qid": "Q2665990",
      "label": "Skaland",
      "lat": 69.44472,
      "lng": 17.29833,
      "it": "Skaland",
      "en": "Skaland"
    },
    "osm": {
      "id": "node/297815218",
      "name": "Skaland",
      "kind": "place/village",
      "lat": 69.4447,
      "lng": 17.29838
    },
    "photos": [
      {
        "file": "Berg kirke Skaland.jpg",
        "author": "Helge Høifødt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "tungeneset": {
    "osm": {
      "id": "node/7099804806",
      "name": "Tungeneset",
      "kind": "highway/bus_stop",
      "lat": 69.48886,
      "lng": 17.33411
    },
    "photosOwn": true,
    "photos": [
      {
        "file": "Coast of Tungeneset and Steinfjorden in Senja, Troms, Norway, 2017 April - 2.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Coast of Tungeneset in Senja, Troms og Finnmark, Norway, 2022 August.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Tungeneset (Senja, Norway).jpg",
        "author": "Thomas Heins",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      }
    ]
  },
  "okshornan": {
    "wd": {
      "qid": "Q31732989",
      "label": "Okshornan",
      "lat": 69.53131,
      "lng": 17.32183
    },
    "photos": [
      {
        "file": "Okshornan from Tungeneset, 2015 September.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Senja Norway.JPG",
        "author": "(WT-shared) Tensaibuta at wts wikivoyage",
        "license": "Public domain"
      },
      {
        "file": "Okshornan Senja.JPG",
        "author": "Per-Ivar Knutsen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      }
    ]
  },
  "ersfjord-senja": {
    "wd": {
      "qid": "Q3057496",
      "label": "Ersfjord",
      "lat": 69.48444,
      "lng": 17.40722
    },
    "osm": {
      "id": "node/5764465580",
      "name": "Ersfjorden",
      "kind": "place/hamlet",
      "lat": 69.48334,
      "lng": 17.4058
    },
    "photos": [
      {
        "file": "Tungeneset utsiktspunkt.jpg",
        "author": "Helge Høifødt",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "The beach at Titterbakken in the Ersfjord.jpg",
        "author": "Frankemann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "The beach in Ersfjorden and the mountain range on the north side with Okshornan at the edge.jpg",
        "author": "Frankemann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "bergsbotn": {
    "wd": {
      "qid": "Q2897137",
      "label": "Bergsbotn",
      "lat": 69.4338,
      "lng": 17.4564
    },
    "osm": {
      "id": "node/7099800757",
      "name": "Bergsbotn",
      "kind": "highway/bus_stop",
      "lat": 69.44172,
      "lng": 17.42364
    },
    "photosOwn": true,
    "photos": [
      {
        "file": "Bergsbotn seen from lookout point at Moltebærhagen by Norwegian County Road 862.jpg",
        "author": "Frankemann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Wide view to Bergsbotn, Senja, Troms, Norway, 2015 September.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Fuglan and Luttinden mountains behind Bergsbotn and Innergården, Senja, Troms og Finnmark, Norway, 2015 September.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "mefjordvaer": {
    "wd": {
      "qid": "Q406509",
      "label": "Mefjordvær",
      "lat": 69.51861,
      "lng": 17.43833,
      "en": "Mefjordvær"
    },
    "osm": {
      "id": "node/5764461203",
      "name": "Mefjordvær",
      "kind": "place/village",
      "lat": 69.51864,
      "lng": 17.43821
    },
    "photos": [
      {
        "file": "Lights of Mefjordvær in evening, Senja, Troms, Norway, 2015 September.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "senjahopen": {
    "wd": {
      "qid": "Q2666735",
      "label": "Senjahopen",
      "lat": 69.49611,
      "lng": 17.48333,
      "en": "Senjahopen"
    },
    "osm": {
      "id": "node/7099799627",
      "name": "Senjahopen",
      "kind": "highway/bus_stop",
      "lat": 69.49695,
      "lng": 17.48997
    },
    "photos": [
      {
        "file": "House by Mefjorden in Senja, Troms, Norway, 2014 August.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Senjahopen in Berg municipality in Troms seen from Middagsskaret.jpg",
        "author": "Frankemann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Burstinden and Roalden mountains behind Fv 7868 road, Senja, Troms og Finnmark, Norway, 2017 April.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "segla": {
    "wd": {
      "qid": "Q31503316",
      "label": "Segla",
      "lat": 69.5075,
      "lng": 17.59472
    },
    "osm": {
      "id": "node/5023951233",
      "name": "Segla",
      "kind": "natural/peak",
      "lat": 69.50737,
      "lng": 17.59572
    },
    "photos": [
      {
        "file": "Segla in Senja, Troms og Finnmark, Norway, 2022 August.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Fjordgård 5.jpg",
        "author": "kallerna",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Fjordgård 6.jpg",
        "author": "kallerna",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "fjordgard": {
    "wd": {
      "qid": "Q658362",
      "label": "Fjordgard kapell",
      "lat": 69.51058,
      "lng": 17.62457,
      "en": "Fjordgård Chapel"
    },
    "osm": {
      "id": "node/950878609",
      "name": "Fjordgård",
      "kind": "place/village",
      "lat": 69.50915,
      "lng": 17.62833
    },
    "photos": [
      {
        "file": "Fjordgard 047.jpg",
        "author": "André Ingar Sørensen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "husoy": {
    "wd": {
      "qid": "Q3122764",
      "label": "Husøy",
      "lat": 69.54222,
      "lng": 17.6625,
      "en": "Husøy, Senja"
    },
    "osm": {
      "id": "node/297814448",
      "name": "Husøy",
      "kind": "place/village",
      "lat": 69.5442,
      "lng": 17.6637
    },
    "photos": [
      {
        "file": "Residential by Petreabakken in Husøy, Senja, Troms og Finnmark, Norway, 2022 August.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Norvegia-2024-N-1000000-C-1000000-C-1201018 25.jpg",
        "author": "Buiobuione",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      },
      {
        "file": "Norvegia-2024-N-1000000-C-1000000-C-1201018 33.jpg",
        "author": "Buiobuione",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
      }
    ]
  },
  "botnhamn": {
    "wd": {
      "qid": "Q2911809",
      "label": "Botnhamn",
      "lat": 69.50722,
      "lng": 17.90278,
      "en": "Botnhamn"
    },
    "osm": {
      "id": "node/7099800480",
      "name": "Botnhamn",
      "kind": "highway/bus_stop",
      "lat": 69.50824,
      "lng": 17.90271
    },
    "photos": [
      {
        "file": "Botnhamn.jpg",
        "author": "Morten Meyer",
        "license": "Public domain"
      }
    ]
  },
  "finnsnes": {
    "wd": {
      "qid": "Q1015949",
      "label": "Finnsnes",
      "lat": 69.22944,
      "lng": 17.98111,
      "it": "Finnsnes",
      "en": "Finnsnes"
    },
    "osm": {
      "id": "node/31264085",
      "name": "Finnsnes",
      "kind": "place/town",
      "lat": 69.2296,
      "lng": 17.9813
    },
    "photos": [
      {
        "file": "Finnsnes anno 2006.JPG",
        "author": "Per-Ivar Knutsen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
      }
    ]
  },
  "anderdalen": {
    "wd": {
      "qid": "Q271087",
      "label": "Ånderdalen nasjonalpark",
      "lat": 69.2,
      "lng": 17.26667,
      "it": "Parco nazionale Ånderdalen",
      "en": "Ånderdalen National Park"
    },
    "osm": {
      "id": "way/40820335",
      "name": "Ånderdalen nasjonalpark",
      "kind": "boundary/national_park",
      "lat": 69.21487,
      "lng": 17.25529
    },
    "photos": [
      {
        "file": "Ånderdalen nasjonalpark 3.jpg",
        "author": "Bjarkan",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Swamp with prepared path in Ånderdalen National.jpg",
        "author": "Frankemann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "View over the Åndervatnet in Åderderdalen National Park.jpg",
        "author": "Frankemann",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "brensholmen": {
    "wd": {
      "qid": "Q2924457",
      "label": "Brensholmen",
      "lat": 69.59917,
      "lng": 18.04
    },
    "osm": {
      "id": "node/841796764",
      "name": "Brensholmen",
      "kind": "highway/bus_stop",
      "lat": 69.59917,
      "lng": 18.0403
    },
    "photos": [
      {
        "file": "Hillesøy kirke - Side P2.jpg",
        "author": "Snurre86",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "sommaroy": {
    "wd": {
      "qid": "Q2413274",
      "label": "Sommarøy",
      "lat": 69.6347,
      "lng": 18.0128,
      "en": "Sommarøy"
    },
    "osm": {
      "id": "way/60112983",
      "name": "Sommarøyvegen",
      "kind": "highway/residential",
      "lat": 69.63268,
      "lng": 18.01549
    },
    "photos": [
      {
        "file": "Sommarøy1.jpg",
        "author": "Kjetil Ree",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Steingarden fra Sommarøy.JPG",
        "author": "Peulle",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Sommarøy kirke og Sommarøyveien.jpg",
        "author": "Harald Groven",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "kvaloya": {
    "wd": {
      "qid": "Q74652",
      "label": "Kvaløya",
      "lat": 69.61667,
      "lng": 18.55,
      "it": "Kvaløya",
      "en": "Kvaløya (Tromsø)"
    },
    "osm": {
      "id": "relation/3987911",
      "name": "Kvaløya",
      "kind": "place/island",
      "lat": 69.70215,
      "lng": 18.80143
    },
    "photos": [
      {
        "file": "Kvaloysletta kvaloya tromso.JPG",
        "author": "MiraculixHB",
        "license": "Public domain"
      },
      {
        "file": "Panorama middagstinden valugi.jpg",
        "author": "Valugi",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Lyfjord, Kvaløya.jpg",
        "author": "Harald Groven",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "ersfjordbotn": {
    "wd": {
      "qid": "Q2649679",
      "label": "Ersfjordbotn",
      "lat": 69.69428,
      "lng": 18.62055,
      "en": "Ersfjordbotn"
    },
    "osm": {
      "id": "relation/21909968",
      "name": "Ersfjordbotn",
      "kind": "landuse/residential",
      "lat": 69.69286,
      "lng": 18.61988
    },
    "photos": [
      {
        "file": "Ersfjordbotn 2012.JPG",
        "author": "Geanixx",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Ersfjordbotn from Nattmålsfjell.jpg",
        "author": "Harald Groven from Tromsø, Norway",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Ersfjordbotn devant les Storsteinnestinden.jpg",
        "author": "Patrice78500",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "ishavskatedralen": {
    "wd": {
      "qid": "Q1319441",
      "label": "Ishavskatedralen",
      "lat": 69.64807,
      "lng": 18.9874,
      "it": "Cattedrale dell'Artico",
      "en": "Arctic Cathedral",
      "official": "https://ishavskatedralen.no"
    },
    "osm": {
      "id": "relation/21003810",
      "name": "Tromsdalen kirke",
      "kind": "amenity/place_of_worship",
      "lat": 69.64803,
      "lng": 18.98742
    },
    "photos": [
      {
        "file": "Arctic Cathedral.JPG",
        "author": "Jma",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "09512 Tromsdalen church and bridge - Tromso, Norway - V-P.jpg",
        "author": "Virtual-Pano",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "09516 Tromsdalen church and eastern half of Tromso bridge - Tromso, Norway - V-P.jpg",
        "author": "Virtual-Pano",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "fjellheisen": {
    "wd": {
      "qid": "Q1422197",
      "label": "Fjellheisen",
      "lat": 69.64096,
      "lng": 18.98724,
      "en": "Fjellheisen"
    },
    "osm": {
      "id": "way/82443298",
      "name": "Fjellheisen",
      "kind": "aerialway/cable_car",
      "lat": 69.63852,
      "lng": 18.99084
    },
    "photos": [
      {
        "file": "Teleférico, Tromsø, Noruega, 2019-09-04, DD 29.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Tromsø 2013 06 05 2412 (10118231254).jpg",
        "author": "Harvey Barrison from Massapequa, NY, USA",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Fjellheisen, Tromsø 2019.jpg",
        "author": "Olivier Bruchez",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      }
    ]
  },
  "polarmuseet": {
    "wd": {
      "qid": "Q1727268",
      "label": "Polarmuseet",
      "lat": 69.65221,
      "lng": 18.96343
    },
    "osm": {
      "id": "node/3798726950",
      "name": "Polarmuseet",
      "kind": "tourism/museum",
      "lat": 69.65221,
      "lng": 18.96332
    },
    "photos": [
      {
        "file": "Polarmuseet.jpg",
        "author": "Lars Tiede",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
      },
      {
        "file": "Polar Museum.jpg",
        "author": "Illustratedjc",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Polar Museum in Tromsø (Jul 2019) 1.jpg",
        "author": "Visem",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "tromso-museum": {
    "wd": {
      "qid": "Q1686510",
      "label": "Tromsø Museum",
      "lat": 69.63486,
      "lng": 18.91257,
      "en": "Tromsø University Museum",
      "official": "https://uit.no/tmu"
    },
    "photos": [
      {
        "file": "Tromsø Museum11.jpg",
        "author": "Manxruler",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Tromsø museum 2022-09-08 01.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      },
      {
        "file": "Tromsø museum 2022-09-08 02.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      }
    ]
  },
  "botanisk-hage": {
    "wd": {
      "qid": "Q1779489",
      "label": "Tromsø arktisk-alpine botaniske hage",
      "lat": 69.6768,
      "lng": 18.9763,
      "en": "Arctic–Alpine Botanic Garden"
    },
    "osm": {
      "id": "relation/21132666",
      "name": "Arktisk-alpin botanisk hage",
      "kind": "leisure/garden",
      "lat": 69.6769,
      "lng": 18.97547
    },
    "photos": [
      {
        "file": "Botanicgardentromso.jpg",
        "author": "Kongharald",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Saxifraga x gaudinii, jardín botánico alpino-ártico, Tromsø, Noruega, 2019-09-04, DD 77.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Saxifraga x gaudinii, jardín botánico alpino-ártico, Tromsø, Noruega, 2019-09-04, DD 78.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  },
  "tromso-domkirke": {
    "wd": {
      "qid": "Q2296475",
      "label": "Tromsø domkirke",
      "lat": 69.64877,
      "lng": 18.95682,
      "it": "Cattedrale di Tromsø",
      "en": "Tromsø Cathedral"
    },
    "osm": {
      "id": "way/22804196",
      "name": "Tromsø domkirke",
      "kind": "amenity/place_of_worship",
      "lat": 69.64875,
      "lng": 18.95682
    },
    "photos": [
      {
        "file": "Catedral, Tromsø, Noruega, 2019-09-04, DD 45.jpg",
        "author": "Diego Delso",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Tromsø domkirke 2022-09-06 01.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      },
      {
        "file": "Tromsø domkirke 2022-09-06 02.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      }
    ]
  },
  "vitensenter": {
    "wd": {
      "qid": "Q11991903",
      "label": "Nordnorsk vitensenter",
      "lat": 69.67907,
      "lng": 18.97168
    },
    "osm": {
      "id": "node/9094130832",
      "name": "Nordnorsk vitensenter",
      "kind": "information/office",
      "lat": 69.67896,
      "lng": 18.97147
    },
    "photos": [
      {
        "file": "Nordnorsk vitensenter.jpg",
        "author": "AnneBru",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      },
      {
        "file": "Nordlysplanetariet Universitetet i Tromsø 2022-09-06 01.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      },
      {
        "file": "Nordlysplanetariet Universitetet i Tromsø 2022-09-06 02.jpg",
        "author": "Leonhard Lenz",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      }
    ]
  },
  "lyngsalpene": {
    "wd": {
      "qid": "Q2080571",
      "label": "Lyngsalpan",
      "lat": 69.51189,
      "lng": 19.89262,
      "it": "Alpi di Lyngen",
      "en": "Lyngen Alps"
    },
    "photos": [
      {
        "file": "Lyngen.jpg",
        "author": "Arnejohs at English Wikipedia",
        "license": "Public domain"
      },
      {
        "file": "Wide view over Sørfjorden from the coast of Sveingard, 2012 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "View towards north at Lyngen fjord, Spåkenes in 2012 June.jpg",
        "author": "Ximonic (Simo Räsänen)",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      }
    ]
  },
  "lyngseidet": {
    "wd": {
      "qid": "Q787028",
      "label": "Lyngseidet",
      "lat": 69.57611,
      "lng": 20.21861,
      "it": "Lyngseidet",
      "en": "Lyngseidet"
    },
    "osm": {
      "id": "node/9873608686",
      "name": "Muotki",
      "kind": "place/farm",
      "lat": 69.57769,
      "lng": 20.21456
    },
    "photos": [
      {
        "file": "Lyngseidet-kjosen-lyngen-alps.jpg",
        "author": "Algkalv",
        "license": "Public domain"
      }
    ]
  },
  "malselvfossen": {
    "wd": {
      "qid": "Q3869219",
      "label": "Målselvfossen",
      "lat": 69.0355,
      "lng": 18.65394,
      "it": "Målselvfossen"
    },
    "osm": {
      "id": "node/9965481854",
      "name": "Målselvfossen",
      "kind": "highway/bus_stop",
      "lat": 69.0347,
      "lng": 18.64758
    },
    "photos": [
      {
        "file": "Maalselvfossen-2011.jpg",
        "author": "Bjørn Christian Tørrissen",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
      },
      {
        "file": "Målselvfossen - panoramio.jpg",
        "author": "Roger Husvik",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
      },
      {
        "file": "Målselvfossen, 2020.jpg",
        "author": "Obivan Kenobi",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
      }
    ]
  }
};

/** Foto in più per luoghi già presenti nel catalogo (stesso elemento Wikidata di src/data/wiki.ts) */
export const NORD_FOTO_ESISTENTI: Record<string, PlacePhoto[]> = {
  "tromso": [
    {
      "file": "Tromso Tromsø Norway tunliweb 02.jpg",
      "author": "Svein-Magne Tunli - tunliweb.no",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Feeding reindeer, Tromsø (1).jpg",
      "author": "Lorie Shaull",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    },
    {
      "file": "Feeding reindeer, Tromsø (4).jpg",
      "author": "Lorie Shaull",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    }
  ],
  "reine": [
    {
      "file": "Reine i Lofoten LC0148.jpg",
      "author": "Jörg Hempel",
      "license": "CC BY-SA 2.0 de",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/de/deed.en"
    },
    {
      "file": "Hammarskaftet at Reine, Lofoten, Norway, 2015 September.jpg",
      "author": "Ximonic (Simo Räsänen)",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "Loaded Drying Racks for Stockfish at Reine, Lofoten, Norway.jpg",
      "author": "Christoph Strässler",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    }
  ],
  "henningsvaer": [
    {
      "file": "Henningsvær (15226562389).jpg",
      "author": "Christoph Strässler from Oberdorf BL, Schweiz",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "View from Hornstinden toward Henningsvær, Lofoten, Norway.jpg",
      "author": "Christoph Strässler",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "Lofoten Islands; Day Four of the Hurtigruten Coastal Voyage North (65).jpg",
      "author": "Richard Mortel from Riyadh, Saudi Arabia",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    }
  ],
  "a-lofoten": [
    {
      "file": "A view 2009.JPG",
      "author": "Sveter",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "Residential in Å i Lofoten, Moskenesøya, Lofoten, Norway, 2015 September.jpg",
      "author": "Ximonic (Simo Räsänen)",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "Residential in Å i Lofoten, Moskenesøya, Lofoten, Norway, 2015 September - 2.jpg",
      "author": "Ximonic (Simo Räsänen)",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    }
  ],
  "svolvaer": [
    {
      "file": "Svolvaer, Lofoten, Norway.JPG",
      "author": "Vincent van Zeijst",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0"
    },
    {
      "file": "Faro, Svolvær, Lofoten, Noruega, 2019-09-05, DD 51.jpg",
      "author": "Diego Delso",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Pesquero, Svolvær, Lofoten, Noruega, 2019-09-05, DD 50.jpg",
      "author": "Diego Delso",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    }
  ],
  "nusfjord": [
    {
      "file": "The fishing village of Nusfjord.jpg",
      "author": "Giladtop",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Boats in Nusfjord, Lofoten, Norway, 2015 September.jpg",
      "author": "Ximonic (Simo Räsänen)",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "Nordnorwegen 2019 0143 (48651740236).jpg",
      "author": "Markus Trienke",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    }
  ],
  "hamnoy": [
    {
      "file": "Hamnøy Harbor (15390311826).jpg",
      "author": "Christoph Strässler from Oberdorf BL, Schweiz",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    },
    {
      "file": "Hamnøy LC0164.jpg",
      "author": "Jörg Hempel",
      "license": "CC BY-SA 2.0 de",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/de/deed.en"
    },
    {
      "file": "Lofoten -1 Hamnøy, Lofoten, Norway 2024-08-22 Henrique Pinto (Flickr public domain).jpg",
      "author": "Henrique Pinto",
      "license": "CC0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
    }
  ],
  "andenes": [
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
  ],
  "senja": [
    {
      "file": "Husøy, Senja.jpg",
      "author": "Nelson Minar from San Francisco, USA",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0"
    }
  ],
  "saltstraumen": [
    {
      "file": "Saltstraumen 20170722 133203 (cropped).jpg",
      "author": "Sergei Gussev",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0"
    }
  ],
  "polaria": [
    {
      "file": "Polaria 01.JPG",
      "author": "Bjoertvedt",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    }
  ],
  "lofotr": [
    {
      "file": "Borg-Wikingermuseum-04-2019-gje.jpg",
      "author": "Gerd Eichmann",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0"
    },
    {
      "file": "Entrance to Lofotr Vikingmuseum.JPG",
      "author": "Toxophilus",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    },
    {
      "file": "Outlined area of the original viking house at Lofotr Vikingmuseum.JPG",
      "author": "Toxophilus",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0"
    }
  ],
  "polar-park": [
    {
      "file": "Bear-Ursus arctos-male-Polar Park Norway.jpg",
      "author": "Hans-Petter Fjeld",
      "license": "CC BY-SA 2.5",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5"
    }
  ],
  "lofoten": [
    {
      "file": "Moskenes Reinebringen lub 2025-07-21 img09 Aussicht.jpg",
      "author": "Lukas Beck",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0"
    }
  ]
};
