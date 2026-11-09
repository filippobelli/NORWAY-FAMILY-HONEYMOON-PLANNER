// GENERATO da scripts/build-ferry-routes.ts a partire da docs/ricerca-traghetti.json: non modificare a mano.
// Rigenerare con `npx tsx scripts/build-ferry-routes.ts`. Tipi in ./ferryTypes.ts.
// Tratte traghetto interne alla Norvegia (catalogo NO-2). Tariffe 2026 = «tariffa di oggi, da verificare per il 2027»
// (solo Bergen–Flåm ha prezzi 2027). Coordinate solo dal registro NSR (Entur). Nessun dato stimato.

import type { FerryRoute, FerrySource } from './ferryTypes';

export const FERRY_CHECKED_AT = "2026-11-09";

/** Fonti per chiave: titolo, URL, data di lettura */
export const FERRY_SOURCES: Record<string, FerrySource> = {
  "entur": {
    "key": "entur",
    "title": "Entur Journey Planner API v3 (orari pubblicati, NeTEx nazionale; dati validi nov 2026 – mar/apr 2027)",
    "url": "https://api.entur.io/journey-planner/v3/graphql",
    "checkedAt": "2026-11-09"
  },
  "f1-exp": {
    "key": "f1-exp",
    "title": "Fjord1 – Express boats (subentra a Norled dal 1/12/2026)",
    "url": "https://www.fjord1.no/eng/about-fjord1/our-operating-segments/express-boats",
    "checkedAt": "2026-11-09"
  },
  "f1-flam-prices": {
    "key": "f1-flam-prices",
    "title": "Fjord1 – Bergen–Flåm, prezzi 2027",
    "url": "https://www.fjord1.no/eng/routes/Vestland/bergen-balestrand-sogndal?from=NSR%3AQuay%3A51969&to=NSR%3AQuay%3A59727",
    "checkedAt": "2026-11-09"
  },
  "f1-flam-tt": {
    "key": "f1-flam-tt",
    "title": "Fjord1 – Orario estivo Bergen–Sogn–Flåm–Bergen, 1/4–31/10/2027 (PDF)",
    "url": "https://res.cloudinary.com/fjord1-asa/image/upload/v1791530064/Timetable_Bergen_Sogn_Fl%C3%A5m_Bergen_ihw4g6w3jt.pdf",
    "checkedAt": "2026-11-09"
  },
  "f1-gh": {
    "key": "f1-gh",
    "title": "Fjord1 – Geiranger–Hellesylt",
    "url": "https://www.fjord1.no/eng/routes/moere-og-romsdal/geiranger-hellesylt",
    "checkedAt": "2026-11-09"
  },
  "f1-gh-pdf": {
    "key": "f1-gh-pdf",
    "title": "Fjord1 – Ticket Prices + Timetable Geiranger–Hellesylt 2026 (PDF)",
    "url": "https://res.cloudinary.com/fjord1-asa/image/upload/v1780050779/Prices_and_timetable_Geiranger_Hellesylt_idmirtr7nk.pdf",
    "checkedAt": "2026-11-09"
  },
  "f1-nordfjord": {
    "key": "f1-nordfjord",
    "title": "Fjord1 – Bergen–Florø–Måløy–Selje",
    "url": "https://www.fjord1.no/eng/routes/Vestland/bergen-floroe-maaloey-selje",
    "checkedAt": "2026-11-09"
  },
  "f1-sogn": {
    "key": "f1-sogn",
    "title": "Fjord1 – Bergen–Balestrand–Sogndal",
    "url": "https://www.fjord1.no/eng/routes/Vestland/bergen-balestrand-sogndal",
    "checkedAt": "2026-11-09"
  },
  "fergeruter": {
    "key": "fergeruter",
    "title": "fergeruter.info – prezzi 2026 per tratta (aggregatore, fonte secondaria)",
    "url": "https://www.fergeruter.info/",
    "checkedAt": "2026-11-09"
  },
  "fjord1-pagina-tratta": {
    "key": "fjord1-pagina-tratta",
    "title": "Fjord1 – pagina della singola tratta (URL in fonteFjord1)",
    "url": "https://www.fjord1.no/eng/routes",
    "checkedAt": "2026-11-09"
  },
  "florli": {
    "key": "florli",
    "title": "Florli.no – Ferry on the Lysefjord 2026",
    "url": "https://www.florli.no/ferry-lysefjord/",
    "checkedAt": "2026-11-09"
  },
  "gfs-pdf": {
    "key": "gfs-pdf",
    "title": "Visit Geiranger / Geiranger Fjordservice – Ålesund–Geiranger 2026/2027 (PDF)",
    "url": "https://www.geirangerfjord.no/upload/pdf/2026/2025%202026%20Alesund%20TIMETABLE.pdf",
    "checkedAt": "2026-11-09"
  },
  "kolumbus-lyse": {
    "key": "kolumbus-lyse",
    "title": "Kolumbus – Lysefjorden (rotte 561 passeggeri e 563 auto)",
    "url": "https://www.kolumbus.no/en/travel/timetables/boats-and-ferries/lysefjorden",
    "checkedAt": "2026-11-09"
  },
  "norled-flam": {
    "key": "norled-flam",
    "title": "Norled – Fjord cruise Bergen–Flåm (pagina senza anno, gestore fino al 30/11/2026)",
    "url": "https://www.norled.no/en/?p=3594",
    "checkedAt": "2026-11-09"
  },
  "nsr": {
    "key": "nsr",
    "title": "Entur / Nasjonalt stoppestedsregister (coordinate dei moli, StopPlace)",
    "url": "https://api.entur.io/geocoder/v1/autocomplete",
    "checkedAt": "2026-11-09"
  },
  "reis-ferge": {
    "key": "reis-ferge",
    "title": "Reis Nordland – Ferge (passeggeri gratis; 20 linee gratis per i veicoli fuori dall'estate)",
    "url": "https://reisnordland.no/ferge",
    "checkedAt": "2026-11-09"
  },
  "reis-hb": {
    "key": "reis-hb",
    "title": "Reis Nordland – Rutetabeller hurtigbåt",
    "url": "https://reisnordland.no/rutetabeller-hurtigbt",
    "checkedAt": "2026-11-09"
  },
  "reis-priser": {
    "key": "reis-priser",
    "title": "Reis Nordland – Priser og billettyper (bambini 6–15, gratis sotto 6)",
    "url": "https://reisnordland.no/priser-og-billettyper",
    "checkedAt": "2026-11-09"
  },
  "rodne-hfe": {
    "key": "rodne-hfe",
    "title": "Rødne – Hardangerfjord Express Bergen–Rosendal, prezzi dal 1/2/2026 (PDF)",
    "url": "https://rodne.no/wp-content/uploads/2026/01/HFE-Prices-2026.pdf",
    "checkedAt": "2026-11-09"
  },
  "rodne-lyse": {
    "key": "rodne-lyse",
    "title": "Rødne – Lysefjord Scenic Car Ferry (stagione 2026, fermate, durata)",
    "url": "https://rodne.no/?p=9946",
    "checkedAt": "2026-11-09"
  },
  "rodne-lyse-pdf": {
    "key": "rodne-lyse-pdf",
    "title": "Rødne – Lysefjord Tourist Ferry, Prices 2026 (PDF)",
    "url": "https://rodne.no/wp-content/uploads/2026/03/Lysefjord-Tourist-Ferry-%E2%80%93-Price-List-2026.pdf",
    "checkedAt": "2026-11-09"
  },
  "skyss-fares": {
    "key": "skyss-fares",
    "title": "Skyss – Fares and discounts for passengers in Vestland (dal 1/7/2026)",
    "url": "https://www.skyss.no/en/tickets-and-prices/fares-and-discounts-for-passengers-in-vestland/",
    "checkedAt": "2026-11-09"
  },
  "skyss-ferje": {
    "key": "skyss-ferje",
    "title": "Skyss – Ferry prices (Vestland): passeggeri gratis, si paga veicolo + conducente",
    "url": "https://www.skyss.no/en/tickets-and-prices/prices/ferry/",
    "checkedAt": "2026-11-09"
  },
  "snelandia-ferge": {
    "key": "snelandia-ferge",
    "title": "Snelandia – Billetter: «Ferge i Finnmark er gratis»",
    "url": "https://snelandia.no/billetter/",
    "checkedAt": "2026-11-09"
  },
  "snelandia-hb": {
    "key": "snelandia-hb",
    "title": "Snelandia – Hurtigbåtpriser dal 1/2/2026 (bambino 4–19)",
    "url": "https://snelandia.no/billetter/hurtigbat/priser/",
    "checkedAt": "2026-11-09"
  },
  "svipper-180": {
    "key": "svipper-180",
    "title": "Svipper – Prezzi 180 Andenes–Gryllefjord (dal 1/1/2026)",
    "url": "https://svipper.no/~/_f/p3/ie1faf2ce-1f10-4c09-8f00-3c1652bd136f/180-andenes-gryllefjord-2026.pdf",
    "checkedAt": "2026-11-09"
  },
  "svipper-180-news": {
    "key": "svipper-180-news",
    "title": "Svipper – New summer prices on the ferries (12/6/2026)",
    "url": "https://svipper.no/news/new-summer-prices-on-the-ferries.6755.aspx",
    "checkedAt": "2026-11-09"
  },
  "svipper-181": {
    "key": "svipper-181",
    "title": "Svipper – Prezzi 181 Botnhamn–Brensholmen (20/6–31/8/2026)",
    "url": "https://svipper.no/_f/p3/if0227ff1-104d-42b4-80d4-e88e00887195/181-botnhamn-brensholmen-010126_pristabell.pdf",
    "checkedAt": "2026-11-09"
  },
  "svipper-bus": {
    "key": "svipper-bus",
    "title": "Svipper – categorie di età (bambino 6–17, gratis sotto 6, adulto 30–66, giovane 18–29)",
    "url": "https://svipper.no/menu/tickets/bus-fares/",
    "checkedAt": "2026-11-09"
  },
  "svipper-hb": {
    "key": "svipper-hb",
    "title": "Svipper – Express boat fares (dal 1/2/2026, posto garantito)",
    "url": "https://svipper.no/menu/tickets/express-boat-fares/",
    "checkedAt": "2026-11-09"
  },
  "svipper-l2": {
    "key": "svipper-l2",
    "title": "Svipper – Tabella prezzi linea 2 Tromsø–Finnsnes–Harstad (dal 1/2/2026)",
    "url": "https://svipper.no/~/_f/p3/i616bd0d2-c599-4ee7-abdd-472c05fb12c1/linje-2-tromso-finnsnes-harstad.pdf",
    "checkedAt": "2026-11-09"
  },
  "svipper-l3": {
    "key": "svipper-l3",
    "title": "Svipper – Tabella prezzi linea 3 Tromsø–Skjervøy (dal 1/2/2026)",
    "url": "https://svipper.no/~/_f/p3/i4383581f-af28-4a2c-8c96-294ecfc0d8ca/linje-3-tromso-skjervoy.pdf",
    "checkedAt": "2026-11-09"
  },
  "torg-1018": {
    "key": "torg-1018",
    "title": "Torghatten – rotta 1018 Halhjem–Sandvikvåg",
    "url": "https://www.torghatten.no/our-routes/1018",
    "checkedAt": "2026-11-09"
  },
  "torg-703": {
    "key": "torg-703",
    "title": "Torghatten – rotta 18-703 Bognes–Lødingen",
    "url": "https://www.torghatten.no/our-routes/18-703",
    "checkedAt": "2026-11-09"
  },
  "torg-782": {
    "key": "torg-782",
    "title": "Torghatten – rotta 18-782 Bodø–Værøy–Røst–Moskenes (prezzi, plassgaranti)",
    "url": "https://www.torghatten.no/our-routes/18-782",
    "checkedAt": "2026-11-09"
  },
  "visitbergen-flam": {
    "key": "visitbergen-flam",
    "title": "Visit Bergen – Fjord cruise between Flåm and Gudvangen (Lustrabåtane, 2026)",
    "url": "https://en.visitbergen.com/things-to-do/fjord-cruise-between-flam-and-gudvangen-p8399913",
    "checkedAt": "2026-11-09"
  }
};

/** 58 tratte, nell'ordine della ricerca (per zona) */
export const FERRY_ROUTES: FerryRoute[] = [
  {
    "key": "bergen-flam-express",
    "name": "Bergen – Sognefjord – Flåm (battello veloce estivo)",
    "operator": "Fjord1 (dal 1/12/2026; fino al 30/11/2026 Norled)",
    "mode": "hurtigbat",
    "zone": "Vestland – Sognefjord",
    "region": "Fiordi occidentali",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Bergen (Strandkaiterminalen)",
    "toName": "Flåm kai",
    "stops": [
      {
        "seq": 1,
        "name": "Strandkaiterminalen båtkai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:30219",
        "lat": 60.395259,
        "lng": 5.321964
      },
      {
        "seq": 2,
        "name": "Lygra (a richiesta)",
        "minutesMin": 50,
        "minutesMax": 50,
        "call": "a_richiesta"
      },
      {
        "seq": 3,
        "name": "Vardetangen kai",
        "minutesMin": 68,
        "minutesMax": 68,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:70401",
        "lat": 60.802891,
        "lng": 4.951181
      },
      {
        "seq": 4,
        "name": "Skjerjehamn (a richiesta)",
        "call": "a_richiesta"
      },
      {
        "seq": 5,
        "name": "Sollibotn kai",
        "minutesMin": 93,
        "minutesMax": 93,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:37394",
        "lat": 60.98635,
        "lng": 5.035641
      },
      {
        "seq": 6,
        "name": "Rysjedalsvika kai",
        "minutesMin": 117,
        "minutesMax": 117,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:36713",
        "lat": 61.114199,
        "lng": 5.283348
      },
      {
        "seq": 7,
        "name": "Lavik kai",
        "minutesMin": 140,
        "minutesMax": 140,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:36984",
        "lat": 61.104534,
        "lng": 5.507957
      },
      {
        "seq": 8,
        "name": "Nordeide kai",
        "minutesMin": 172,
        "minutesMax": 172,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:36820",
        "lat": 61.173496,
        "lng": 5.986739
      },
      {
        "seq": 9,
        "name": "Vik kai",
        "minutesMin": 215,
        "minutesMax": 215,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:34790",
        "lat": 61.08883,
        "lng": 6.58066
      },
      {
        "seq": 10,
        "name": "Balestrand kai",
        "minutesMin": 238,
        "minutesMax": 238,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:34831",
        "lat": 61.209922,
        "lng": 6.538137
      },
      {
        "seq": 11,
        "name": "Leikanger kai",
        "minutesMin": 258,
        "minutesMax": 258,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:35069",
        "lat": 61.182777,
        "lng": 6.798102
      },
      {
        "seq": 12,
        "name": "Nærøyfjord (solo passaggio, senza fermata)",
        "call": "solo_passaggio"
      },
      {
        "seq": 13,
        "name": "Aurland kai",
        "call": "solo_discesa",
        "nsrId": "NSR:StopPlace:34490",
        "lat": 60.90682,
        "lng": 7.18634
      },
      {
        "seq": 14,
        "name": "Flåm kai",
        "minutesMin": 340,
        "minutesMax": 340,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:34484",
        "lat": 60.862892,
        "lng": 7.115664
      }
    ],
    "duration": {
      "min": 340,
      "max": 340,
      "status": "confermato",
      "note": "Bergen 08:00 → Flåm 13:40; ritorno Flåm 15:30 → Bergen 20:45 (315 min). Aurland solo discesa.",
      "sourceKey": "f1-flam-tt"
    },
    "summerFrequency": {
      "text": "1 corsa al giorno per senso (tutti i giorni), Bergen 08:00, Flåm 15:30",
      "status": "confermato",
      "sourceKey": "f1-flam-tt"
    },
    "season": {
      "text": "1 aprile – 31 ottobre 2027 (orario estivo pubblicato)",
      "status": "confermato",
      "sourceKey": "f1-flam-tt"
    },
    "fare": {
      "status": "confermato",
      "year": 2027,
      "period": "18 maggio – 31 agosto 2027",
      "sourceKey": "f1-flam-prices",
      "note": "La pagina non dice in modo esplicito se il prezzo è di sola andata; da verificare.",
      "verifyForTripYear": true,
      "passengerRule": "a_pagamento",
      "freeUnderAge": 6,
      "childAgeText": "6–17",
      "rules": [
        "Bambino con adulto pagante: massimo 209 NOK per bambino, a tratta",
        "Massimo 4 bambini per famiglia, compresi i minori di 6 anni",
        "Fuori dal periodo 18/5–31/8: adulto 1349, bambino 649, famiglia 3099"
      ],
      "fares": [
        {
          "trip": "andata",
          "year": 2027,
          "sourceKey": "f1-flam-prices",
          "category": "adulto",
          "amountNok": 1449,
          "period": "18 maggio – 31 agosto 2027",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2027,
          "sourceKey": "f1-flam-prices",
          "category": "bambino",
          "amountNok": 719,
          "ageMin": 6,
          "ageMax": 17,
          "ageText": "6–17",
          "period": "18 maggio – 31 agosto 2027",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2027,
          "sourceKey": "f1-flam-prices",
          "category": "senior",
          "amountNok": 1449,
          "ageMin": 67,
          "ageText": "67+",
          "period": "18 maggio – 31 agosto 2027",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2027,
          "sourceKey": "f1-flam-prices",
          "category": "famiglia",
          "amountNok": 3299,
          "adultsIncluded": 2,
          "childrenIncluded": 2,
          "period": "18 maggio – 31 agosto 2027",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "period": "fuori dal 18/5–31/8 (2027)",
          "year": 2027,
          "status": "confermato",
          "sourceKey": "f1-flam-prices",
          "category": "adulto",
          "amountNok": 1349
        },
        {
          "trip": "andata",
          "period": "fuori dal 18/5–31/8 (2027)",
          "year": 2027,
          "status": "confermato",
          "sourceKey": "f1-flam-prices",
          "category": "bambino",
          "amountNok": 649,
          "ageText": "6–17",
          "ageMin": 6,
          "ageMax": 17
        },
        {
          "trip": "andata",
          "period": "fuori dal 18/5–31/8 (2027)",
          "year": 2027,
          "status": "confermato",
          "sourceKey": "f1-flam-prices",
          "category": "famiglia",
          "amountNok": 3099,
          "adultsIncluded": 2,
          "childrenIncluded": 2
        }
      ],
      "childCapNok": 209
    },
    "places": {
      "from": "bergen",
      "to": "flam",
      "along": [
        "balestrand",
        "sognefjord",
        "naeroyfjord",
        "aurlandsfjord"
      ]
    },
    "sourceKeys": [
      "f1-flam-tt",
      "f1-flam-prices",
      "f1-exp",
      "norled-flam",
      "nsr"
    ],
    "notes": [
      "Unico battello Bergen–Flåm: con il treno di Flåm e la ferrovia Bergen–Oslo forma un anello senza auto.",
      "Coordinate delle fermate dal registro NSR (Entur)."
    ],
    "checkedAt": "2026-11-09"
  },
  {
    "key": "bergen-sogndal-express",
    "name": "Bergen – Balestrand – Sogndal (battello veloce tutto l'anno)",
    "operator": "Fjord1 dal 1/12/2026 (Entur indica ancora Norled per la linea 890)",
    "mode": "hurtigbat",
    "zone": "Vestland – Sognefjord",
    "region": "Fiordi occidentali",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Bergen (Strandkaiterminalen)",
    "toName": "Sogndal kai",
    "stops": [
      {
        "seq": 1,
        "name": "Strandkaiterminalen båtkai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:30219",
        "lat": 60.395259,
        "lng": 5.321964
      },
      {
        "seq": 2,
        "name": "Lygra kai",
        "minutesMin": 50,
        "minutesMax": 50,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:70402",
        "lat": 60.691292,
        "lng": 5.106347
      },
      {
        "seq": 3,
        "name": "Mjømna kai",
        "minutesMin": 80,
        "minutesMax": 80,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:37461",
        "lat": 60.918285,
        "lng": 4.901333
      },
      {
        "seq": 4,
        "name": "Skjerjehamn kai",
        "minutesMin": 90,
        "minutesMax": 90,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:37458",
        "lat": 60.943546,
        "lng": 4.953598
      },
      {
        "seq": 5,
        "name": "Sollibotn kai",
        "minutesMin": 97,
        "minutesMax": 101,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:37394",
        "lat": 60.98635,
        "lng": 5.035641
      },
      {
        "seq": 6,
        "name": "Rysjedalsvika kai",
        "minutesMin": 122,
        "minutesMax": 130,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:36713",
        "lat": 61.114199,
        "lng": 5.283348
      },
      {
        "seq": 7,
        "name": "Lavik kai",
        "minutesMin": 147,
        "minutesMax": 155,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:36984",
        "lat": 61.104534,
        "lng": 5.507957
      },
      {
        "seq": 8,
        "name": "Nordeide kai",
        "minutesMin": 180,
        "minutesMax": 185,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:36820",
        "lat": 61.173496,
        "lng": 5.986739
      },
      {
        "seq": 9,
        "name": "Vik kai",
        "minutesMin": 219,
        "minutesMax": 225,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:34790",
        "lat": 61.08883,
        "lng": 6.58066
      },
      {
        "seq": 10,
        "name": "Balestrand kai",
        "minutesMin": 241,
        "minutesMax": 245,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:34831",
        "lat": 61.209922,
        "lng": 6.538137
      },
      {
        "seq": 11,
        "name": "Leikanger kai",
        "minutesMin": 260,
        "minutesMax": 261,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:35069",
        "lat": 61.182777,
        "lng": 6.798102
      },
      {
        "seq": 12,
        "name": "Sogndal kai",
        "minutesMin": 285,
        "minutesMax": 290,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:34257",
        "lat": 61.22969,
        "lng": 7.10477
      }
    ],
    "duration": {
      "min": 285,
      "max": 290,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "estate 2027: 1 corsa pomeridiana Bergen 16:30 → Sogndal 21:20 (sabato 14:15 → 19:00) + mattina Sogndal 07:05 → Bergen 11:50",
      "status": "confermato",
      "sourceKey": "f1-flam-tt"
    },
    "season": {
      "text": "tutto l'anno",
      "status": "confermato",
      "sourceKey": "f1-sogn"
    },
    "fare": {
      "status": "assente",
      "sourceKey": "skyss-fares",
      "note": "Pagina Fjord1 senza prezzi; da verificare sulla prenotazione Fjord1.",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "rules": [],
      "generalRules": "Vestland: bambini sotto 6 anni gratis, 6–17 circa metà prezzo (Skyss); le linee Bergen–Sogn/Nordfjord hanno però prezzi propri.",
      "fares": []
    },
    "places": {
      "from": "bergen",
      "along": [
        "balestrand",
        "sognefjord"
      ]
    },
    "sourceKeys": [
      "f1-sogn",
      "f1-flam-tt",
      "f1-exp",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "SKY:Line:890",
      "code": "890",
      "name": "Sogn-Bergen",
      "operator": "Norled AS",
      "validFrom": "2026-11-07",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 2,
        "sat": 2,
        "sun": 2
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "bergen-nordfjord-express",
    "name": "Bergen – Florø – Måløy – Selje (battello veloce)",
    "operator": "Fjord1 dal 1/12/2026 (Entur indica Norled, linea 190)",
    "mode": "hurtigbat",
    "zone": "Vestland – costa di Sogn og Fjordane",
    "region": "Fiordi occidentali",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Bergen (Strandkaiterminalen)",
    "toName": "Selje kai",
    "stops": [
      {
        "seq": 1,
        "name": "Strandkaiterminalen båtkai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:30219",
        "lat": 60.395259,
        "lng": 5.321964
      },
      {
        "seq": 2,
        "name": "Lygra kai",
        "minutesMin": 50,
        "minutesMax": 50,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:70402",
        "lat": 60.691292,
        "lng": 5.106347
      },
      {
        "seq": 3,
        "name": "Vardetangen kai",
        "minutesMin": 68,
        "minutesMax": 70,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:70401",
        "lat": 60.802891,
        "lng": 4.951181
      },
      {
        "seq": 4,
        "name": "Skjerjehamn kai",
        "minutesMin": 85,
        "minutesMax": 90,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:37458",
        "lat": 60.943546,
        "lng": 4.953598
      },
      {
        "seq": 5,
        "name": "Sollibotn kai",
        "minutesMin": 97,
        "minutesMax": 98,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:37394",
        "lat": 60.98635,
        "lng": 5.035641
      },
      {
        "seq": 6,
        "name": "Krakhella kai",
        "minutesMin": 114,
        "minutesMax": 117,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:36556",
        "lat": 61.12893,
        "lng": 5.019454
      },
      {
        "seq": 7,
        "name": "Askvoll kai",
        "minutesMin": 152,
        "minutesMax": 155,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:35723",
        "lat": 61.345497,
        "lng": 5.065444
      },
      {
        "seq": 8,
        "name": "Florø terminal",
        "minutesMin": 200,
        "minutesMax": 202,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:37066",
        "lat": 61.601838,
        "lng": 5.028723
      },
      {
        "seq": 9,
        "name": "Smørhamn kai",
        "minutesMin": 222,
        "minutesMax": 227,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:34950",
        "lat": 61.779453,
        "lng": 4.947399
      },
      {
        "seq": 10,
        "name": "Leirgulen kai",
        "minutesMin": 260,
        "minutesMax": 260,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:34937",
        "lat": 61.861518,
        "lng": 5.310017
      },
      {
        "seq": 11,
        "name": "Måløy hurtigbåtterminal",
        "minutesMin": 272,
        "minutesMax": 279,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:35011",
        "lat": 61.933285,
        "lng": 5.114278
      },
      {
        "seq": 12,
        "name": "Selje kai",
        "minutesMin": 300,
        "minutesMax": 310,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:36354",
        "lat": 62.04521,
        "lng": 5.342231
      }
    ],
    "duration": {
      "min": 300,
      "max": 310,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 4 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutti i giorni dell'anno",
      "status": "confermato",
      "sourceKey": "f1-nordfjord"
    },
    "fare": {
      "status": "assente",
      "sourceKey": "f1-nordfjord",
      "note": "Nessun prezzo pubblicato sulla pagina.",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "rules": [],
      "fares": []
    },
    "places": {
      "from": "bergen",
      "along": []
    },
    "sourceKeys": [
      "f1-nordfjord",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "SKY:Line:190",
      "code": "190",
      "name": "Bergen - Nordfjord",
      "operator": "Norled AS",
      "validFrom": "2026-11-07",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 4,
        "sat": 2,
        "sun": 2
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "bergen-rosendal-express",
    "name": "Hardangerfjordekspressen Bergen – Rosendal",
    "operator": "Rødne (L. Rødne & Sønner)",
    "mode": "hurtigbat",
    "zone": "Vestland – Hardanger/Sunnhordland",
    "region": "Fiordi occidentali",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Bergen (Strandkaiterminalen)",
    "toName": "Rosendal båtkai",
    "stops": [
      {
        "seq": 1,
        "name": "Strandkaiterminalen båtkai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:30219",
        "lat": 60.395259,
        "lng": 5.321964
      },
      {
        "seq": 2,
        "name": "Flesland båtkai",
        "minutesMin": 25,
        "minutesMax": 25,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:30217",
        "lat": 60.291885,
        "lng": 5.205522
      },
      {
        "seq": 3,
        "name": "Os båtkai",
        "minutesMin": 60,
        "minutesMax": 60,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:29096",
        "lat": 60.183456,
        "lng": 5.469503
      },
      {
        "seq": 4,
        "name": "Malkenes båtkai",
        "minutesMin": 80,
        "minutesMax": 80,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:31526",
        "lat": 60.07737,
        "lng": 5.687741
      },
      {
        "seq": 5,
        "name": "Rosendal båtkai",
        "minutesMin": 115,
        "minutesMax": 115,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:31805",
        "lat": 59.986745,
        "lng": 6.006764
      }
    ],
    "duration": {
      "min": 115,
      "max": 115,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 7 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "servizio di linea; stagione estiva da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "validFrom": "2026-02-01",
      "sourceKey": "rodne-hfe",
      "note": "Età gratuita non indicata nel listino (Skyss: sotto 6 anni gratis, da verificare per Rødne).",
      "verifyForTripYear": true,
      "passengerRule": "a_pagamento",
      "childAgeText": "6–17 (anche senior/militari, 50%)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "rodne-hfe",
          "category": "adulto",
          "amountNok": 581,
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "rodne-hfe",
          "category": "bambino",
          "amountNok": 291,
          "ageMin": 6,
          "ageMax": 17,
          "ageText": "6–17 (anche senior/militari, 50%)",
          "status": "confermato"
        },
        {
          "trip": "andata_ritorno",
          "year": 2026,
          "sourceKey": "rodne-hfe",
          "category": "adulto",
          "amountNok": 872,
          "status": "confermato"
        },
        {
          "trip": "andata_ritorno",
          "year": 2026,
          "sourceKey": "rodne-hfe",
          "category": "bambino",
          "amountNok": 436,
          "ageMin": 6,
          "ageMax": 17,
          "ageText": "6–17 (anche senior/militari, 50%)",
          "status": "confermato"
        }
      ]
    },
    "places": {
      "from": "bergen",
      "along": []
    },
    "sourceKeys": [
      "rodne-hfe",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "SKY:Line:2075",
      "code": "2075",
      "name": "Hardangerfjordekspressen",
      "operator": "L. Rødne & Sønner AS",
      "validFrom": "2026-11-07",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 7,
        "sat": 2,
        "sun": 3
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "flam-gudvangen",
    "name": "Crociera sul Nærøyfjord Flåm – Gudvangen",
    "operator": "Lustrabåtane / GlacierTour AS (altra offerta: Norway's Best / The Fjords, dati non letti)",
    "mode": "turistico",
    "zone": "Vestland – Sognefjord",
    "region": "Fiordi occidentali",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Flåm kai",
    "toName": "Gudvangen ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Flåm kai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:34484",
        "lat": 60.862892,
        "lng": 7.115664
      },
      {
        "seq": 2,
        "name": "Gudvangen ferjekai",
        "minutesMin": 120,
        "minutesMax": 120,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:34496",
        "lat": 60.88141,
        "lng": 6.84142
      }
    ],
    "duration": {
      "min": 120,
      "max": 120,
      "status": "da_verificare",
      "note": "Entur (linea Lustrabaatane, dati giugno 2026): 120 min; Visit Bergen non indica la durata della sola crociera.",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "1/6–31/8/2026: 4 partenze per senso (08:30, 11:00, 13:30, 16:00)",
      "status": "da_verificare",
      "sourceKey": "visitbergen-flam"
    },
    "season": {
      "text": "20/4–31/12/2026 (orari ridotti fuori estate)",
      "status": "da_verificare",
      "sourceKey": "visitbergen-flam"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "visitbergen-flam",
      "note": "Fonte: scheda Visit Bergen (ente turistico), non il sito dell'operatore. «Prices may be subject to change».",
      "verifyForTripYear": true,
      "passengerRule": "a_pagamento",
      "freeUnderAge": 4,
      "childAgeText": "4–15",
      "adultAgeText": "16+",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "visitbergen-flam",
          "category": "adulto",
          "amountNok": 550,
          "ageText": "16+",
          "status": "da_verificare"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "visitbergen-flam",
          "category": "bambino",
          "amountNok": 275,
          "ageMin": 4,
          "ageMax": 15,
          "ageText": "4–15",
          "status": "da_verificare"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "visitbergen-flam",
          "category": "famiglia",
          "amountNok": 1365,
          "adultsIncluded": 2,
          "childrenIncluded": 2,
          "status": "da_verificare"
        },
        {
          "trip": "andata_ritorno",
          "year": 2026,
          "sourceKey": "visitbergen-flam",
          "category": "adulto",
          "amountNok": 815,
          "ageText": "16+",
          "status": "da_verificare"
        },
        {
          "trip": "andata_ritorno",
          "year": 2026,
          "sourceKey": "visitbergen-flam",
          "category": "famiglia",
          "amountNok": 2030,
          "adultsIncluded": 2,
          "childrenIncluded": 2,
          "status": "da_verificare"
        }
      ]
    },
    "places": {
      "from": "flam",
      "along": [
        "aurlandsfjord",
        "naeroyfjord"
      ]
    },
    "sourceKeys": [
      "visitbergen-flam",
      "entur",
      "nsr"
    ],
    "notes": [
      "Non porta auto: chi viaggia in auto deve tornare a prenderla (o usare bus Gudvangen–Flåm, da verificare)."
    ],
    "enturLine": {
      "id": "SOF:Line:2468_69",
      "code": "150",
      "name": "Gudvangen-Flåm",
      "operator": null,
      "validFrom": "2026-06-17",
      "validTo": "2026-06-23",
      "sampleTrips": {
        "wed": 0,
        "sat": 0,
        "sun": 0
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "mortavika-arsvagen",
    "name": "Mortavika – Arsvågen (E39 Boknafjorden)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Rogaland",
    "region": "Sørlandet e Rogaland",
    "road": "E39",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Arsvågen ferjekai",
    "toName": "Mortavika ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Arsvågen ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:57913",
        "lat": 59.17066,
        "lng": 5.453159
      },
      {
        "seq": 2,
        "name": "Mortavika ferjekai",
        "minutesMin": 24,
        "minutesMax": 28,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:58652",
        "lat": 59.13727,
        "lng": 5.58802
      }
    ],
    "duration": {
      "min": 24,
      "max": 28,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "ogni 15 minuti nel pomeriggio (pagina Fjord1, novembre 2026)",
      "status": "da_verificare",
      "sourceKey": "fjord1-pagina-tratta"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis («People travel for free on all connections»)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 178,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "traghetto 104 + pedaggio 74"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [
      "Collega Stavanger a nord verso Haugesund/Bergen sulla E39."
    ],
    "enturLine": {
      "id": "KOL:Line:30_1130",
      "code": "1130",
      "name": "Mortavika - Arsvågen",
      "operator": "Fjord1 ASA",
      "validFrom": "2026-11-09",
      "validTo": "2027-03-29",
      "sampleTrips": {
        "wed": 140,
        "sat": 99,
        "sun": 115
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "halhjem-sandvikvag",
    "name": "Halhjem – Sandvikvåg (E39 Bjørnafjorden)",
    "operator": "Torghatten",
    "mode": "ferje",
    "zone": "Vestland",
    "region": "Fiordi occidentali",
    "road": "E39",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Halhjem ferjekai",
    "toName": "Sandvikvåg ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Halhjem ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:29088",
        "lat": 60.145655,
        "lng": 5.426696
      },
      {
        "seq": 2,
        "name": "Sandvikvåg ferjekai",
        "minutesMin": 45,
        "minutesMax": 50,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:30297",
        "lat": 59.968321,
        "lng": 5.334047
      }
    ],
    "duration": {
      "min": 45,
      "max": 45,
      "status": "confermato",
      "note": "Torghatten: «Overfarten tar 45 minutter»; Entur 45–50",
      "sourceKey": "torg-1018"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 108 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "torg-1018",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis (regola Vestland)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "torg-1018",
          "category": "veicolo",
          "amountNok": 176,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "da_verificare",
          "note": "«Fullpris»; anno non indicato sulla pagina, pagina letta nel 2026"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "torg-1018",
      "skyss-ferje",
      "entur",
      "nsr"
    ],
    "notes": [
      "Tratta principale Bergen–Stavanger."
    ],
    "enturLine": {
      "id": "SKY:Line:1018",
      "code": "1018",
      "name": "Halhjem - Sandvikvåg",
      "operator": "Torghatten trafikkselskap AS",
      "validFrom": "2026-11-07",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 108,
        "sat": 84,
        "sun": 98
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "halhjem-vage",
    "name": "Halhjem – Våge (Tysnes)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Vestland",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Halhjem ferjekai",
    "toName": "Våge ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Halhjem ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:29088",
        "lat": 60.145655,
        "lng": 5.426696
      },
      {
        "seq": 2,
        "name": "Våge ferjekai",
        "minutesMin": 35,
        "minutesMax": 35,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:30445",
        "lat": 60.046692,
        "lng": 5.524162
      }
    ],
    "duration": {
      "min": 35,
      "max": 35,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 24 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis (regola Vestland)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 129,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "skyss-ferje",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "SKY:Line:1021",
      "code": "1021",
      "name": "Våge - Halhjem",
      "operator": "Fjord1",
      "validFrom": "2026-11-06",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 24,
        "sat": 24,
        "sun": 22
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "lavik-oppedal",
    "name": "Lavik – Oppedal (E39 Sognefjorden)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Vestland – Sognefjord",
    "region": "Fiordi occidentali",
    "road": "E39",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Oppedal ferjekai",
    "toName": "Lavik ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Oppedal ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:37139",
        "lat": 61.054604,
        "lng": 5.504574
      },
      {
        "seq": 2,
        "name": "Lavik ferjekai",
        "minutesMin": 20,
        "minutesMax": 25,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:36986",
        "lat": 61.104754,
        "lng": 5.507128
      }
    ],
    "duration": {
      "min": 20,
      "max": 25,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "ogni 15 minuti nel pomeriggio (pagina Fjord1, novembre 2026)",
      "status": "da_verificare",
      "sourceKey": "fjord1-pagina-tratta"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis (regola Vestland)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 81,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "zona tariffaria 6"
        }
      ]
    },
    "places": {
      "along": [
        "sognefjord"
      ]
    },
    "sourceKeys": [
      "skyss-ferje",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "SKY:Line:1045",
      "code": "1045",
      "name": "Lavik - Oppedal",
      "operator": "Fjord1",
      "validFrom": "2026-11-07",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 128,
        "sat": 92,
        "sun": 116
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "anda-lote",
    "name": "Anda – Lote (E39 Nordfjord)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Vestland – Nordfjord",
    "region": "Fiordi occidentali",
    "road": "E39",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Anda ferjekai",
    "toName": "Lote ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Anda ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:35862",
        "lat": 61.846394,
        "lng": 6.082006
      },
      {
        "seq": 2,
        "name": "Lote ferjekai",
        "minutesMin": 11,
        "minutesMax": 11,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:36362",
        "lat": 61.864013,
        "lng": 6.079534
      }
    ],
    "duration": {
      "min": 11,
      "max": 11,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 106 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis (regola Vestland)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 63,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "zona tariffaria 3"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "skyss-ferje",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "SKY:Line:1044",
      "code": "1044",
      "name": "Lote - Anda",
      "operator": "Fjord1",
      "validFrom": "2026-11-07",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 106,
        "sat": 106,
        "sun": 98
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "leirvag-slovag",
    "name": "Leirvåg – Sløvåg (Fv57, verso Sognefjord)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Vestland",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Leirvågen ferjekai",
    "toName": "Sløvågen ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Leirvågen ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:33470",
        "lat": 60.814715,
        "lng": 5.004892
      },
      {
        "seq": 2,
        "name": "Sløvågen ferjekai",
        "minutesMin": 20,
        "minutesMax": 20,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:37262",
        "lat": 60.856807,
        "lng": 5.063858
      }
    ],
    "duration": {
      "min": 20,
      "max": 20,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 34 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis (regola Vestland)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 88,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "zona tariffaria 7"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "skyss-ferje",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "SKY:Line:1029",
      "code": "1029",
      "name": "Leirvåg - Sløvåg",
      "operator": "Fjord1",
      "validFrom": "2026-11-07",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 34,
        "sat": 34,
        "sun": 34
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "mannheller-fodnes",
    "name": "Mannheller – Fodnes (Rv5 Sognefjorden)",
    "operator": "Norled",
    "mode": "ferje",
    "zone": "Vestland – Sognefjord",
    "region": "Fiordi occidentali",
    "road": "Rv5",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Fodnes ferjekai",
    "toName": "Mannheller ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Fodnes ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:34746",
        "lat": 61.14871,
        "lng": 7.383429
      },
      {
        "seq": 2,
        "name": "Mannheller ferjekai",
        "minutesMin": 15,
        "minutesMax": 15,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:34249",
        "lat": 61.160332,
        "lng": 7.336877
      }
    ],
    "duration": {
      "min": 15,
      "max": 15,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 116 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "fergeruter",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fergeruter",
          "category": "veicolo",
          "amountNok": 69,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "da_verificare",
          "note": "fonte secondaria (fergeruter.info), da confermare su Norled/Skyss"
        }
      ]
    },
    "places": {
      "along": [
        "sognefjord"
      ]
    },
    "sourceKeys": [
      "fergeruter",
      "skyss-ferje",
      "entur",
      "nsr"
    ],
    "notes": [
      "Collega la E16 (Lærdal) a Sogndal/Kaupanger."
    ],
    "enturLine": {
      "id": "SKY:Line:1047",
      "code": "1047",
      "name": "Manheller-. Fodnes",
      "operator": "Norled AS",
      "validFrom": "2026-11-07",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 116,
        "sat": 116,
        "sun": 116
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "vangsnes-hella-dragsvik",
    "name": "Vangsnes – Hella – Dragsvik (Rv13 Sognefjorden)",
    "operator": "Norled",
    "mode": "ferje",
    "zone": "Vestland – Sognefjord",
    "region": "Fiordi occidentali",
    "road": "Rv13",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Vangsnes ferjekai",
    "toName": "Dragsvik ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Vangsnes ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:37166",
        "lat": 61.174963,
        "lng": 6.637408
      },
      {
        "seq": 2,
        "name": "Hella ferjekai",
        "minutesMin": 15,
        "minutesMax": 15,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:35119",
        "lat": 61.207448,
        "lng": 6.597636
      },
      {
        "seq": 3,
        "name": "Dragsvik ferjekai",
        "minutesMin": 30,
        "minutesMax": 40,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:57912",
        "lat": 61.214685,
        "lng": 6.566166
      }
    ],
    "duration": {
      "min": 30,
      "max": 40,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 60 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "fergeruter",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fergeruter",
          "category": "veicolo",
          "amountNok": 81,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "da_verificare",
          "note": "Vangsnes–Dragsvik; prezzo per singolo tratto via Hella non indicato"
        }
      ]
    },
    "places": {
      "along": [
        "sognefjord",
        "balestrand"
      ]
    },
    "sourceKeys": [
      "fergeruter",
      "skyss-ferje",
      "entur",
      "nsr"
    ],
    "notes": [
      "Dragsvik è a pochi km da Balestrand (distanza stradale da calcolare, non in linea d'aria)."
    ],
    "enturLine": {
      "id": "SKY:Line:1046",
      "code": "1046",
      "name": "Vangsnes-Hella-Dragsvik",
      "operator": "Norled AS",
      "validFrom": "2026-11-06",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 60,
        "sat": 58,
        "sun": 58
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "solvorn-ornes",
    "name": "Solvorn – Ornes (Lustrafjorden, chiesa di Urnes)",
    "operator": "Lustrabåtane",
    "mode": "ferje",
    "zone": "Vestland – Sognefjord",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Solvorn ferjekai",
    "toName": "Ornes ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Solvorn ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:36366",
        "lat": 61.301363,
        "lng": 7.248654
      },
      {
        "seq": 2,
        "name": "Ornes ferjekai",
        "minutesMin": 20,
        "minutesMax": 20,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:57933",
        "lat": 61.299383,
        "lng": 7.312611
      }
    ],
    "duration": {
      "min": 20,
      "max": 20,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 8 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "assente",
      "note": "Prezzo non trovato.",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "rules": [],
      "fares": []
    },
    "places": {
      "along": [
        "sognefjord"
      ]
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "SKY:Line:1048",
      "code": "1048",
      "name": "Solvorn-Ornes",
      "operator": "Lustrabaatane AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 8,
        "sat": 0,
        "sun": 2
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "jondal-torvikbygd",
    "name": "Jondal – Tørvikbygd (Hardangerfjorden)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Vestland – Hardanger",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Tørvikbygd ferjekai",
    "toName": "Jondal ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Tørvikbygd ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:33122",
        "lat": 60.300803,
        "lng": 6.171754
      },
      {
        "seq": 2,
        "name": "Jondal ferjekai",
        "minutesMin": 20,
        "minutesMax": 20,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:32218",
        "lat": 60.275691,
        "lng": 6.25151
      }
    ],
    "duration": {
      "min": 20,
      "max": 20,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "circa ogni ora (pagina Fjord1, novembre 2026)",
      "status": "da_verificare",
      "sourceKey": "fjord1-pagina-tratta"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis (regola Vestland)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 88,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "zona tariffaria 7"
        }
      ]
    },
    "places": {
      "along": [
        "hardangerfjord"
      ]
    },
    "sourceKeys": [
      "skyss-ferje",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "SKY:Line:1026",
      "code": "1026",
      "name": "Jondal - Tørvikbygd",
      "operator": "Fjord1",
      "validFrom": "2026-11-07",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 36,
        "sat": 32,
        "sun": 32
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "utne-kvanndal",
    "name": "Utne – Kvanndal (Hardangerfjorden)",
    "operator": "Boreal",
    "mode": "ferje",
    "zone": "Vestland – Hardanger",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Kvanndal ferjekai",
    "toName": "Utne ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Kvanndal ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:59337",
        "lat": 60.471748,
        "lng": 6.612112
      },
      {
        "seq": 2,
        "name": "Utne ferjekai",
        "minutesMin": 20,
        "minutesMax": 20,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:31023",
        "lat": 60.424023,
        "lng": 6.621791
      }
    ],
    "duration": {
      "min": 20,
      "max": 20,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 34 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "fergeruter",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fergeruter",
          "category": "veicolo",
          "amountNok": 88,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "da_verificare",
          "note": "fonte secondaria"
        }
      ]
    },
    "places": {
      "along": [
        "hardangerfjord"
      ]
    },
    "sourceKeys": [
      "fergeruter",
      "skyss-ferje",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "SKY:Line:1024",
      "code": "1024",
      "name": "Utne - Kvanndal",
      "operator": "Boreal",
      "validFrom": "2026-11-07",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 34,
        "sat": 30,
        "sun": 32
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "kinsarvik-utne",
    "name": "Kinsarvik – Utne (Hardangerfjorden)",
    "operator": "Boreal",
    "mode": "ferje",
    "zone": "Vestland – Hardanger",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Kinsarvik ferjekai",
    "toName": "Utne ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Kinsarvik ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:31076",
        "lat": 60.375978,
        "lng": 6.719095
      },
      {
        "seq": 2,
        "name": "Utne ferjekai",
        "minutesMin": 28,
        "minutesMax": 28,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:31023",
        "lat": 60.424023,
        "lng": 6.621791
      }
    ],
    "duration": {
      "min": 28,
      "max": 28,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 20 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "fergeruter",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fergeruter",
          "category": "veicolo",
          "amountNok": 0,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "da_verificare",
          "note": "indicata gratuita da fonte secondaria; da verificare su Skyss/Boreal"
        }
      ]
    },
    "places": {
      "along": [
        "hardangerfjord"
      ]
    },
    "sourceKeys": [
      "fergeruter",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "SKY:Line:1025",
      "code": "1025",
      "name": "Kinsarvik - Utne",
      "operator": "Boreal",
      "validFrom": "2026-11-07",
      "validTo": "2027-03-14",
      "sampleTrips": {
        "wed": 20,
        "sat": 8,
        "sun": 10
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "lysefjord-turistferje",
    "name": "Traghetto turistico del Lysefjord Lauvvik – Lysebotn",
    "operator": "Rødne",
    "mode": "turistico",
    "zone": "Rogaland – Lysefjord",
    "region": "Sørlandet e Rogaland",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Lauvvik (da settembre 2026 anche Oanes al posto di Forsand)",
    "toName": "Lysebotn",
    "stops": [
      {
        "seq": 1,
        "name": "Lauvvik ferjekai",
        "call": "fermata",
        "nsrId": "NSR:StopPlace:27056",
        "lat": 58.894253,
        "lng": 6.055429
      },
      {
        "seq": 2,
        "name": "Forsand / Oanes",
        "call": "fermata"
      },
      {
        "seq": 3,
        "name": "Songesand ferjekai",
        "call": "fermata",
        "nsrId": "NSR:StopPlace:27124",
        "lat": 59.016224,
        "lng": 6.3233
      },
      {
        "seq": 4,
        "name": "Flørli ferjekai",
        "call": "fermata",
        "nsrId": "NSR:StopPlace:28301",
        "lat": 59.015266,
        "lng": 6.431338
      },
      {
        "seq": 5,
        "name": "Lysebotn ferjekai",
        "call": "fermata",
        "nsrId": "NSR:StopPlace:27354",
        "lat": 59.054695,
        "lng": 6.645238
      }
    ],
    "duration": {
      "min": 150,
      "max": 150,
      "status": "confermato",
      "note": "«circa 2,5 ore» per senso; tempi per tappa non pubblicati",
      "sourceKey": "rodne-lyse"
    },
    "summerFrequency": {
      "text": "partenze giornaliere; orario nel PDF (non letto)",
      "status": "da_verificare",
      "sourceKey": "rodne-lyse"
    },
    "season": {
      "text": "15 maggio – 27 settembre 2026 (la stessa pagina indica anche 29 settembre; florli.no: 30 settembre)",
      "status": "da_verificare",
      "sourceKey": "rodne-lyse"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "rodne-lyse-pdf",
      "verifyForTripYear": true,
      "passengerRule": "a_pagamento",
      "freeUnderAge": 4,
      "childAgeText": "4–15",
      "rules": [
        "Veicoli e moto includono il conducente",
        "A Flørli non scendono veicoli",
        "Fuori dal sistema AutoPASS"
      ],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "rodne-lyse-pdf",
          "category": "adulto",
          "amountNok": 595,
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "rodne-lyse-pdf",
          "category": "bambino",
          "amountNok": 350,
          "ageMin": 4,
          "ageMax": 15,
          "ageText": "4–15",
          "status": "confermato"
        },
        {
          "trip": "andata_ritorno",
          "year": 2026,
          "sourceKey": "rodne-lyse-pdf",
          "category": "adulto",
          "amountNok": 893,
          "status": "confermato"
        },
        {
          "trip": "andata_ritorno",
          "year": 2026,
          "sourceKey": "rodne-lyse-pdf",
          "category": "bambino",
          "amountNok": 525,
          "ageMin": 4,
          "ageMax": 15,
          "ageText": "4–15",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "rodne-lyse-pdf",
          "category": "veicolo",
          "amountNok": 1290,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "andata e ritorno 2580"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "rodne-lyse-pdf",
          "category": "pacchetto_veicolo",
          "vehicleClass": "fino_6m",
          "note": "auto fino a 6 m + fino a 5 passeggeri (conducente compreso nel conteggio da verificare)",
          "amountNok": 1990,
          "status": "da_verificare",
          "driverIncluded": null,
          "passengersIncluded": 5
        },
        {
          "trip": "andata_ritorno",
          "year": 2026,
          "sourceKey": "rodne-lyse-pdf",
          "category": "pacchetto_veicolo",
          "vehicleClass": "fino_6m",
          "note": "auto fino a 6 m + fino a 5 passeggeri (conducente compreso nel conteggio da verificare)",
          "amountNok": 3980,
          "status": "da_verificare",
          "driverIncluded": null,
          "passengersIncluded": 5
        }
      ]
    },
    "places": {
      "along": [
        "lysefjord"
      ]
    },
    "sourceKeys": [
      "rodne-lyse-pdf",
      "rodne-lyse",
      "florli",
      "nsr"
    ],
    "notes": [
      "Lysebotn è la base per Kjerag; Preikestolen si raggiunge da terra (non da questa linea)."
    ],
    "checkedAt": "2026-11-09"
  },
  {
    "key": "lauvvik-lysebotn-kolumbus",
    "name": "Lauvvik – Lysebotn (linea pubblica Kolumbus)",
    "operator": "Rødne Trafikk per Kolumbus",
    "mode": "ferje",
    "zone": "Rogaland – Lysefjord",
    "region": "Sørlandet e Rogaland",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Lauvvik ferjekai",
    "toName": "Lysebotn ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Lauvvik ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:27056",
        "lat": 58.894253,
        "lng": 6.055429
      },
      {
        "seq": 2,
        "name": "Forsand ferjekai",
        "minutesMin": 5,
        "minutesMax": 5,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:28351",
        "lat": 58.90152,
        "lng": 6.088172
      },
      {
        "seq": 3,
        "name": "Revså hurtigbåtkai",
        "minutesMin": 20,
        "minutesMax": 20,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:64356",
        "lat": 58.969092,
        "lng": 6.157553
      },
      {
        "seq": 4,
        "name": "Bratteli hurtigbåtkai",
        "minutesMin": 35,
        "minutesMax": 35,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:28558",
        "lat": 59.011864,
        "lng": 6.263118
      },
      {
        "seq": 5,
        "name": "Bakken hurtigbåtkai",
        "minutesMin": 40,
        "minutesMax": 40,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:28285",
        "lat": 59.013218,
        "lng": 6.290624
      },
      {
        "seq": 6,
        "name": "Songesand ferjekai",
        "minutesMin": 45,
        "minutesMax": 45,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:27124",
        "lat": 59.016224,
        "lng": 6.3233
      },
      {
        "seq": 7,
        "name": "Kalleli hurtigbåtkai",
        "minutesMin": 55,
        "minutesMax": 55,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:26974",
        "lat": 59.00892,
        "lng": 6.39366
      },
      {
        "seq": 8,
        "name": "Flørli ferjekai",
        "minutesMin": 60,
        "minutesMax": 60,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:28301",
        "lat": 59.015266,
        "lng": 6.431338
      },
      {
        "seq": 9,
        "name": "Håheller hurtigbåtkai",
        "minutesMin": 75,
        "minutesMax": 75,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:26688",
        "lat": 59.040276,
        "lng": 6.513715
      },
      {
        "seq": 10,
        "name": "Lysebotn ferjekai",
        "minutesMin": 90,
        "minutesMax": 90,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:27354",
        "lat": 59.054695,
        "lng": 6.645238
      }
    ],
    "duration": {
      "min": 90,
      "max": 90,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 4 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno; orario invernale valido fino al 31/3/2027, da marzo 2027 orario estivo con più partenze; non opera il sabato (orario invernale)",
      "status": "da_verificare",
      "sourceKey": "florli"
    },
    "fare": {
      "status": "assente",
      "sourceKey": "kolumbus-lyse",
      "note": "Kolumbus non pubblica prezzi sulla pagina; prenotazione su billetter.kolumbus.no (vendita chiude 120 min prima).",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "rules": [],
      "fares": []
    },
    "places": {
      "along": [
        "lysefjord"
      ]
    },
    "sourceKeys": [
      "kolumbus-lyse",
      "florli",
      "entur",
      "nsr"
    ],
    "notes": [
      "Kolumbus indica le rotte 561 (passeggeri) e 563 (auto, MF Sveio); in Entur la linea è la 560: numerazione da chiarire."
    ],
    "enturLine": {
      "id": "KOL:Line:8_5460",
      "code": "560",
      "name": "560",
      "operator": "Rødne Trafikk AS",
      "validFrom": "2026-11-09",
      "validTo": "2027-03-29",
      "sampleTrips": {
        "wed": 4,
        "sat": 2,
        "sun": 2
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "stavanger-lysefjord-cruise",
    "name": "Crociera Stavanger – Lysefjord e Preikestolen (andata e ritorno)",
    "operator": "Rødne",
    "mode": "turistico",
    "zone": "Rogaland – Lysefjord",
    "region": "Sørlandet e Rogaland",
    "carriesCar": false,
    "roundTrip": true,
    "fromName": "Stavanger (Strandkaien)",
    "toName": "Stavanger (Strandkaien)",
    "stops": [
      {
        "seq": 1,
        "name": "Stavanger Strandkaien",
        "call": "fermata"
      },
      {
        "seq": 2,
        "name": "Lysefjord (sotto Preikestolen, senza sbarco indicato)",
        "call": "senza_sbarco"
      },
      {
        "seq": 3,
        "name": "Stavanger Strandkaien",
        "call": "fermata"
      }
    ],
    "duration": {
      "min": 180,
      "max": 210,
      "status": "confermato",
      "note": "3–3,5 ore",
      "sourceKey": "rodne-lyse"
    },
    "summerFrequency": {
      "text": "assente",
      "status": "assente"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "assente",
      "note": "Prezzi non indicati sulla pagina letta.",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "rules": [],
      "fares": []
    },
    "places": {
      "from": "stavanger",
      "to": "stavanger",
      "along": [
        "lysefjord",
        "preikestolen"
      ]
    },
    "sourceKeys": [
      "rodne-lyse"
    ],
    "notes": [],
    "checkedAt": "2026-11-09"
  },
  {
    "key": "hjelmeland-nesvik",
    "name": "Hjelmeland – Nesvik (Rv13 Ryfylke)",
    "operator": "Norled",
    "mode": "ferje",
    "zone": "Rogaland – Ryfylke",
    "region": "Sørlandet e Rogaland",
    "road": "Rv13",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Hjelmeland ferjekai",
    "toName": "Nesvik ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Hjelmeland ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:26462",
        "lat": 59.234396,
        "lng": 6.165803
      },
      {
        "seq": 2,
        "name": "Nesvik ferjekai",
        "minutesMin": 12,
        "minutesMax": 13,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:27370",
        "lat": 59.261368,
        "lng": 6.159095
      }
    ],
    "duration": {
      "min": 12,
      "max": 13,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 112 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "assente",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "rules": [],
      "fares": []
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [
      "Strada turistica Ryfylke tra Stavanger e Hardanger/Odda (Rv13)."
    ],
    "enturLine": {
      "id": "KOL:Line:26_5958",
      "code": "1054",
      "name": "Hjelmeland - Nesvik - Skipavik",
      "operator": "Norled AS",
      "validFrom": "2026-11-09",
      "validTo": "2027-03-24",
      "sampleTrips": {
        "wed": 112,
        "sat": 110,
        "sun": 100
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "geiranger-hellesylt",
    "name": "Geiranger – Hellesylt (Geirangerfjorden)",
    "operator": "Fjord1",
    "mode": "turistico",
    "zone": "Møre og Romsdal – Geiranger",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Geiranger ferjekai",
    "toName": "Hellesylt ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Geiranger ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:39824",
        "lat": 62.1036,
        "lng": 7.20273
      },
      {
        "seq": 2,
        "name": "Hellesylt ferjekai",
        "minutesMin": 65,
        "minutesMax": 65,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:59931",
        "lat": 62.087378,
        "lng": 6.870108
      }
    ],
    "duration": {
      "min": 65,
      "max": 65,
      "status": "da_verificare",
      "note": "Fjord1: circa 65 min; Entur (dati ottobre 2026, operatore «Vestlandske»): 45 min. Valori in conflitto.",
      "sourceKey": "f1-gh"
    },
    "summerFrequency": {
      "text": "1/6–13/9/2026: da Geiranger 10:00, 11:30, 13:00, 14:30, 16:00, 17:30, 18:45; da Hellesylt 08:30, 10:00, 11:30, 13:00, 14:30, 16:00, 17:30",
      "status": "confermato",
      "sourceKey": "f1-gh-pdf",
      "year": 2026
    },
    "season": {
      "text": "1 aprile – 31 ottobre 2026 (alta stagione maggio–settembre)",
      "status": "confermato",
      "sourceKey": "f1-gh-pdf"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "f1-gh-pdf",
      "verifyForTripYear": true,
      "passengerRule": "a_pagamento",
      "freeUnderAge": 4,
      "childAgeText": "non indicata",
      "rules": [
        "50% di sconto sul ritorno (adulto e bambino)"
      ],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "f1-gh-pdf",
          "category": "adulto",
          "amountNok": 420,
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "f1-gh-pdf",
          "category": "bambino",
          "amountNok": 210,
          "ageText": "non indicata",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "f1-gh-pdf",
          "category": "veicolo",
          "amountNok": 810,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "auto fino a 6 m, conducente incluso"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "f1-gh-pdf",
          "category": "pacchetto_veicolo",
          "vehicleClass": "fino_6m",
          "note": "auto fino a 6 m con conducente + 4 passeggeri",
          "amountNok": 1650,
          "status": "confermato",
          "driverIncluded": true,
          "passengersIncluded": 4
        }
      ],
      "returnDiscountPct": 50
    },
    "places": {
      "from": "geiranger",
      "along": [
        "geirangerfjord",
        "sju-sostrene"
      ]
    },
    "sourceKeys": [
      "f1-gh-pdf",
      "f1-gh",
      "nsr"
    ],
    "notes": [
      "Il pacchetto auto (1650) costa meno di auto + 3 passeggeri a prezzo pieno; per la famiglia (auto + 1 adulto + 2 bambini) confrontare: 810 + 420 + 210 + 210 = 1650."
    ],
    "checkedAt": "2026-11-09"
  },
  {
    "key": "alesund-geiranger",
    "name": "Ålesund – Geiranger (Silent Fjord Cruise)",
    "operator": "Geiranger Fjordservice (Visit Geiranger)",
    "mode": "turistico",
    "zone": "Møre og Romsdal – Geiranger",
    "region": "Fiordi occidentali",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Ålesund (Skutvika / Nedre Strandgate 53)",
    "toName": "Geiranger hurtigbåtkai",
    "stops": [
      {
        "seq": 1,
        "name": "Ålesund Skutvika",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:64389",
        "lat": 62.469784,
        "lng": 6.139692
      },
      {
        "seq": 2,
        "name": "Stranda hurtigbåtkai",
        "minutesMin": 105,
        "minutesMax": 105,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:59975",
        "lat": 62.308495,
        "lng": 6.949292
      },
      {
        "seq": 3,
        "name": "Geiranger hurtigbåtkai",
        "minutesMin": 180,
        "minutesMax": 180,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:59974",
        "lat": 62.102269,
        "lng": 7.204818
      }
    ],
    "duration": {
      "min": 180,
      "max": 180,
      "status": "confermato",
      "note": "15/5–settembre: Ålesund 08:30 → Geiranger 11:30; ritorno 15:30 → 18:30",
      "sourceKey": "gfs-pdf"
    },
    "summerFrequency": {
      "text": "15 maggio – settembre: 1 andata e ritorno al giorno",
      "status": "confermato",
      "sourceKey": "gfs-pdf"
    },
    "season": {
      "text": "tutto l'anno (orario 2026/2027)",
      "status": "confermato",
      "sourceKey": "gfs-pdf"
    },
    "fare": {
      "status": "confermato",
      "yearLabel": "2026/2027",
      "sourceKey": "gfs-pdf",
      "note": "Aprile–ottobre. Sconti bambini non indicati nel PDF (una scheda online cita 5–15 anni 50%: da verificare).",
      "verifyForTripYear": true,
      "passengerRule": "a_pagamento",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "sourceKey": "gfs-pdf",
          "category": "adulto",
          "amountNok": 1124,
          "status": "confermato"
        },
        {
          "trip": "andata",
          "sourceKey": "gfs-pdf",
          "category": "bambino",
          "amountNok": null,
          "status": "assente"
        },
        {
          "trip": "andata_ritorno",
          "sourceKey": "gfs-pdf",
          "category": "adulto",
          "amountNok": 2247,
          "status": "confermato"
        }
      ]
    },
    "places": {
      "from": "alesund",
      "to": "geiranger",
      "along": [
        "geirangerfjord"
      ]
    },
    "sourceKeys": [
      "gfs-pdf",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "GFS:FlexibleLine:88f9e793-74bc-4173-8d42-146703a86a86",
      "code": "1147",
      "name": "Ålesund-Geirangerfjord",
      "operator": "Geiranger Fjordservice",
      "validFrom": "2026-11-02",
      "validTo": "2027-10-31",
      "sampleTrips": {
        "wed": 2,
        "sat": 0,
        "sun": 0
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "eidsdal-linge",
    "name": "Eidsdal – Linge (Rv63, tra Geiranger e Trollstigen)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Møre og Romsdal – Geiranger",
    "region": "Fiordi occidentali",
    "road": "Rv63",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Eidsdal ferjekai",
    "toName": "Linge ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Eidsdal ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:58772",
        "lat": 62.262806,
        "lng": 7.171881
      },
      {
        "seq": 2,
        "name": "Linge ferjekai",
        "minutesMin": 13,
        "minutesMax": 13,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:58656",
        "lat": 62.284286,
        "lng": 7.187338
      }
    ],
    "duration": {
      "min": 13,
      "max": 13,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 58 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "passengersText": "non indicato sulla pagina (in Vestland/Rogaland/Nordland passeggeri gratis: da verificare per Møre og Romsdal)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 81,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato"
        }
      ]
    },
    "places": {
      "along": [
        "geiranger",
        "trollstigen"
      ]
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [
      "Tratta obbligata sulla «strada d'oro» Geiranger–Trollstigen."
    ],
    "enturLine": {
      "id": "MOR:Line:1054",
      "code": "1054",
      "name": "Eidsdal-Linge",
      "operator": "Fjord1",
      "validFrom": "2026-11-08",
      "validTo": "2027-04-10",
      "sampleTrips": {
        "wed": 58,
        "sat": 54,
        "sun": 52
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "stranda-liabygda",
    "name": "Stranda – Liabygda (Storfjorden)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Møre og Romsdal – Geiranger",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Stranda ferjekai",
    "toName": "Liabygda ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Stranda ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:58897",
        "lat": 62.309063,
        "lng": 6.94925
      },
      {
        "seq": 2,
        "name": "Liabygda ferjekai",
        "minutesMin": 13,
        "minutesMax": 13,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:58899",
        "lat": 62.308316,
        "lng": 7.005793
      }
    ],
    "duration": {
      "min": 13,
      "max": 13,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 58 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "passengersText": "non indicato sulla pagina (in Vestland/Rogaland/Nordland passeggeri gratis: da verificare per Møre og Romsdal)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 81,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "MOR:Line:1053",
      "code": "1053",
      "name": "Liabygda-Stranda",
      "operator": "Fjord1",
      "validFrom": "2026-11-08",
      "validTo": "2027-04-10",
      "sampleTrips": {
        "wed": 58,
        "sat": 52,
        "sun": 50
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "magerholm-sykkylven",
    "name": "Magerholm – Sykkylven (verso Ålesund)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Møre og Romsdal – Sunnmøre",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Magerholm ferjekai",
    "toName": "Sykkylven ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Magerholm ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:70399",
        "lat": 62.432278,
        "lng": 6.497206
      },
      {
        "seq": 2,
        "name": "Sykkylven ferjekai",
        "minutesMin": 15,
        "minutesMax": 15,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:40205",
        "lat": 62.410144,
        "lng": 6.547712
      }
    ],
    "duration": {
      "min": 15,
      "max": 15,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 112 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "passengersText": "non indicato sulla pagina (in Vestland/Rogaland/Nordland passeggeri gratis: da verificare per Møre og Romsdal)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 88,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "MOR:Line:1055",
      "code": "1055",
      "name": "Magerholm-Sykkylven",
      "operator": "Fjord1",
      "validFrom": "2026-11-08",
      "validTo": "2027-04-10",
      "sampleTrips": {
        "wed": 112,
        "sat": 98,
        "sun": 98
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "hareid-sulesund",
    "name": "Hareid – Sulesund (verso Ålesund/Runde)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Møre og Romsdal – Sunnmøre",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Hareid ferjekai",
    "toName": "Sulesund ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Hareid ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:38669",
        "lat": 62.370199,
        "lng": 6.030877
      },
      {
        "seq": 2,
        "name": "Sulesund ferjekai",
        "minutesMin": 23,
        "minutesMax": 23,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:58754",
        "lat": 62.395002,
        "lng": 6.164373
      }
    ],
    "duration": {
      "min": 23,
      "max": 23,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 98 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "passengersText": "non indicato sulla pagina (in Vestland/Rogaland/Nordland passeggeri gratis: da verificare per Møre og Romsdal)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 110,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato"
        }
      ]
    },
    "places": {
      "along": [
        "alesund",
        "runde"
      ]
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [
      "Collega Ålesund al lato di Runde."
    ],
    "enturLine": {
      "id": "MOR:Line:1068",
      "code": "1068",
      "name": "Hareid - Sulesund",
      "operator": "Fjord1",
      "validFrom": "2026-11-08",
      "validTo": "2027-04-10",
      "sampleTrips": {
        "wed": 98,
        "sat": 68,
        "sun": 66
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "solsnes-afarnes",
    "name": "Sølsnes – Åfarnes (Romsdal)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Møre og Romsdal – Romsdal",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Sølsnes ferjekai",
    "toName": "Åfarnes ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Sølsnes ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:58749",
        "lat": 62.684788,
        "lng": 7.464652
      },
      {
        "seq": 2,
        "name": "Åfarnes ferjekai",
        "minutesMin": 15,
        "minutesMax": 15,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:38739",
        "lat": 62.663743,
        "lng": 7.504845
      }
    ],
    "duration": {
      "min": 15,
      "max": 15,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 102 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "passengersText": "non indicato sulla pagina (in Vestland/Rogaland/Nordland passeggeri gratis: da verificare per Møre og Romsdal)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 88,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "MOR:Line:1060",
      "code": "1060",
      "name": "Sølsnes-Åfarnes",
      "operator": "Fjord1",
      "validFrom": "2026-11-08",
      "validTo": "2027-04-10",
      "sampleTrips": {
        "wed": 102,
        "sat": 84,
        "sun": 76
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "halsa-kanestraum",
    "name": "Halsa – Kanestraum (E39 Nordmøre)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Møre og Romsdal – Nordmøre",
    "region": "Fiordi occidentali",
    "road": "E39",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Halsa ferjekai",
    "toName": "Kanestraum ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Halsa ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:38565",
        "lat": 63.068321,
        "lng": 8.227537
      },
      {
        "seq": 2,
        "name": "Kanestraum ferjekai",
        "minutesMin": 20,
        "minutesMax": 20,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:39782",
        "lat": 63.053097,
        "lng": 8.124985
      }
    ],
    "duration": {
      "min": 20,
      "max": 20,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 100 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "passengersText": "non indicato sulla pagina (in Vestland/Rogaland/Nordland passeggeri gratis: da verificare per Møre og Romsdal)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 81,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "MOR:Line:1072",
      "code": "1072",
      "name": "Halsa-Kanestraum",
      "operator": "Fjord1",
      "validFrom": "2026-11-08",
      "validTo": "2027-04-10",
      "sampleTrips": {
        "wed": 100,
        "sat": 72,
        "sun": 96
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "saebo-leknes",
    "name": "Sæbø – Lekneset (Hjørundfjorden)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Møre og Romsdal – Sunnmøre",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Sæbø ferjekai",
    "toName": "Lekneset ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Sæbø ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:58764",
        "lat": 62.21102,
        "lng": 6.47599
      },
      {
        "seq": 2,
        "name": "Lekneset ferjekai",
        "minutesMin": 13,
        "minutesMax": 13,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:39234",
        "lat": 62.205733,
        "lng": 6.534416
      }
    ],
    "duration": {
      "min": 13,
      "max": 13,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 36 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "passengersText": "non indicato",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 0,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "0 NOK per tutte le classi (zona tariffaria 1)"
        }
      ]
    },
    "places": {
      "along": [
        "hjorundfjord"
      ]
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "MOR:Line:1135",
      "code": "1135",
      "name": "Sæbø-Leknes",
      "operator": "Fjord1",
      "validFrom": "2026-11-08",
      "validTo": "2027-04-10",
      "sampleTrips": {
        "wed": 36,
        "sat": 30,
        "sun": 32
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "festoya-hundeidvika",
    "name": "Festøya – Hundeidvika",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Møre og Romsdal – Sunnmøre",
    "region": "Fiordi occidentali",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Festøya ferjekai",
    "toName": "Hundeidvik ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Festøya ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:38754",
        "lat": 62.374922,
        "lng": 6.33147
      },
      {
        "seq": 2,
        "name": "Hundeidvik ferjekai",
        "minutesMin": 20,
        "minutesMax": 25,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:58756",
        "lat": 62.371677,
        "lng": 6.424135
      }
    ],
    "duration": {
      "min": 20,
      "max": 25,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 26 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "passengersText": "non indicato",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 0,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "0 NOK (zona 1)"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "MOR:Line:1049",
      "code": "1049",
      "name": "Festøya-Hundeidvika",
      "operator": "Fjord1",
      "validFrom": "2026-11-08",
      "validTo": "2027-04-10",
      "sampleTrips": {
        "wed": 26,
        "sat": 16,
        "sun": 18
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "festoya-solavagen",
    "name": "Festøya – Solavågen (E39 verso Ålesund)",
    "operator": "Norled",
    "mode": "ferje",
    "zone": "Møre og Romsdal – Sunnmøre",
    "region": "Fiordi occidentali",
    "road": "E39",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Festøya ferjekai",
    "toName": "Solavågen ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Festøya ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:38754",
        "lat": 62.374922,
        "lng": 6.33147
      },
      {
        "seq": 2,
        "name": "Solavågen ferjekai",
        "minutesMin": 20,
        "minutesMax": 20,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:41550",
        "lat": 62.413704,
        "lng": 6.32823
      }
    ],
    "duration": {
      "min": 20,
      "max": 20,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 104 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "fergeruter",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fergeruter",
          "category": "veicolo",
          "amountNok": 75,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "da_verificare",
          "note": "fonte secondaria"
        }
      ]
    },
    "places": {
      "along": [
        "alesund"
      ]
    },
    "sourceKeys": [
      "fergeruter",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "MOR:Line:1069",
      "code": "1069",
      "name": "Festøya-Solavågen",
      "operator": "Norled ferje",
      "validFrom": "2026-11-08",
      "validTo": "2027-04-10",
      "sampleTrips": {
        "wed": 104,
        "sat": 76,
        "sun": 76
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "molde-vestnes",
    "name": "Molde – Vestnes (E39 Romsdalsfjorden)",
    "operator": "Boreal Sjø",
    "mode": "ferje",
    "zone": "Møre og Romsdal – Romsdal",
    "region": "Fiordi occidentali",
    "road": "E39",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Molde ferjekai",
    "toName": "Furneset ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Molde ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:40439",
        "lat": 62.737009,
        "lng": 7.168901
      },
      {
        "seq": 2,
        "name": "Furneset ferjekai",
        "minutesMin": 33,
        "minutesMax": 36,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:39508",
        "lat": 62.651628,
        "lng": 7.085018
      }
    ],
    "duration": {
      "min": 33,
      "max": 36,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 102 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "fergeruter",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fergeruter",
          "category": "veicolo",
          "amountNok": 116,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "da_verificare",
          "note": "fonte secondaria"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "fergeruter",
      "entur",
      "nsr"
    ],
    "notes": [
      "Il molo di Vestnes in Entur è «Furneset ferjekai»."
    ],
    "enturLine": {
      "id": "MOR:Line:1070",
      "code": "1070",
      "name": "Molde-Vestnes",
      "operator": "Boreal Sjø",
      "validFrom": "2026-11-08",
      "validTo": "2027-04-10",
      "sampleTrips": {
        "wed": 102,
        "sat": 72,
        "sun": 70
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "alesund-hareid-express",
    "name": "Ålesund – Valderøya – Hareid (battello veloce)",
    "operator": "Boreal Sjø (per FRAM)",
    "mode": "hurtigbat",
    "zone": "Møre og Romsdal – Sunnmøre",
    "region": "Fiordi occidentali",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Ålesund hurtigbåtkai Skateflukaia",
    "toName": "Hareid hurtigbåtkai",
    "stops": [
      {
        "seq": 1,
        "name": "Ålesund hurtigbåtkai Skateflukaia",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:38768",
        "lat": 62.474562,
        "lng": 6.154449
      },
      {
        "seq": 2,
        "name": "Valderøya hurtigbåtkai",
        "minutesMin": 8,
        "minutesMax": 10,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:58746",
        "lat": 62.49582,
        "lng": 6.129025
      },
      {
        "seq": 3,
        "name": "Hareid hurtigbåtkai",
        "minutesMin": 28,
        "minutesMax": 30,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:38672",
        "lat": 62.370917,
        "lng": 6.031355
      }
    ],
    "duration": {
      "min": 28,
      "max": 30,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 32 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "assente",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "rules": [],
      "fares": []
    },
    "places": {
      "from": "alesund",
      "along": []
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "MOR:Line:1145",
      "code": "1145",
      "name": "Hareid-Valderøya-Ålesund",
      "operator": "Boreal Sjø",
      "validFrom": "2026-11-08",
      "validTo": "2027-04-10",
      "sampleTrips": {
        "wed": 32,
        "sat": 18,
        "sun": 20
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "bodo-moskenes",
    "name": "Bodø – Moskenes (Lofoten)",
    "operator": "Torghatten Nord",
    "mode": "ferje",
    "zone": "Nordland – Lofoten",
    "region": "Nordland e Lofoten",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Bodø ferjekai",
    "toName": "Moskenes ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Bodø ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49735",
        "lat": 67.288332,
        "lng": 14.394311
      },
      {
        "seq": 2,
        "name": "Moskenes ferjekai",
        "minutesMin": 195,
        "minutesMax": 195,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47301",
        "lat": 67.899835,
        "lng": 13.043995
      }
    ],
    "duration": {
      "min": 195,
      "max": 195,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 4 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno; orario estivo 2027 non ancora pubblicato (pagina con orario invernale dal 7/9/2026)",
      "status": "da_verificare",
      "sourceKey": "torg-782"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "torg-782",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis («Selve fergeturen koster ikke noe for passasjerer, kun kjøretøy»)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "torg-782",
          "category": "veicolo",
          "amountNok": 605,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "anno non indicato sulla pagina; fergeruter.info riporta lo stesso valore per il 2026"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "torg-782",
          "category": "prenotazione_adulto",
          "optional": true,
          "amountNok": 65,
          "note": "Plassgaranti facoltativa, in aggiunta al biglietto; da pagare prima della conferma",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "torg-782",
          "category": "prenotazione_bambino",
          "optional": true,
          "amountNok": 35,
          "note": "Plassgaranti facoltativa, in aggiunta al biglietto; da pagare prima della conferma",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "torg-782",
          "category": "prenotazione_veicolo",
          "optional": true,
          "vehicleClass": "fino_6m",
          "amountNok": 130,
          "note": "Plassgaranti facoltativa, in aggiunta al biglietto; da pagare prima della conferma",
          "status": "confermato"
        }
      ]
    },
    "places": {
      "along": [
        "bodo-moskenes",
        "lofoten"
      ]
    },
    "sourceKeys": [
      "torg-782",
      "reis-ferge",
      "fergeruter",
      "entur",
      "nsr"
    ],
    "notes": [
      "La scheda catalogo «bodo-moskenes» esiste già in destinations.ts: collegare la tratta a quella scheda.",
      "Moskenes è vicino a Å e Reine (distanza stradale da calcolare).",
      "D'estate la capacità per auto è il collo di bottiglia: prenotazione consigliata."
    ],
    "enturLine": {
      "id": "NOR:Line:12_8782",
      "code": "18-782",
      "name": "A-rute Bodø - Værøy - Røst - Moskenes",
      "operator": "Torghatten Nord AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-29",
      "sampleTrips": {
        "wed": 4,
        "sat": 3,
        "sun": 3
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "bodo-vaeroy-rost",
    "name": "Bodø – Røst – Værøy – Bodø (varianti con Moskenes)",
    "operator": "Torghatten Nord",
    "mode": "ferje",
    "zone": "Nordland – Lofoten",
    "region": "Nordland e Lofoten",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Bodø ferjekai",
    "toName": "Bodø ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Bodø ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49735",
        "lat": 67.288332,
        "lng": 14.394311
      },
      {
        "seq": 2,
        "name": "Røst ferjekai",
        "minutesMin": 210,
        "minutesMax": 210,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49624",
        "lat": 67.5049,
        "lng": 12.07147
      },
      {
        "seq": 3,
        "name": "Værøy ferjekai",
        "minutesMin": 315,
        "minutesMax": 330,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49490",
        "lat": 67.65269,
        "lng": 12.711028
      },
      {
        "seq": 4,
        "name": "Bodø ferjekai",
        "minutesMin": 510,
        "minutesMax": 525,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49735",
        "lat": 67.288332,
        "lng": 14.394311
      }
    ],
    "duration": {
      "min": 510,
      "max": 525,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 4 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "torg-782",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "torg-782",
          "category": "veicolo",
          "amountNok": 605,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "da_verificare",
          "note": "la pagina riporta un unico listino per la rotta 18-782: non è chiaro se valga per ogni tratto"
        }
      ]
    },
    "places": {
      "along": [
        "lofoten"
      ]
    },
    "sourceKeys": [
      "torg-782",
      "entur",
      "nsr"
    ],
    "notes": [
      "Giro a tappe: le isole Værøy e Røst sono in fondo alle Lofoten."
    ],
    "enturLine": {
      "id": "NOR:Line:12_8782",
      "code": "18-782",
      "name": "A-rute Bodø - Værøy - Røst - Moskenes",
      "operator": "Torghatten Nord AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-29",
      "sampleTrips": {
        "wed": 4,
        "sat": 3,
        "sun": 3
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "bodo-svolvaer-express",
    "name": "Bodø – Skutvik – Svolvær (battello veloce NEX 2)",
    "operator": "Boreal Sjø (per Reis Nordland)",
    "mode": "hurtigbat",
    "zone": "Nordland – Lofoten",
    "region": "Nordland e Lofoten",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Bodø hurtigbåtkai",
    "toName": "Svolvær hurtigbåtkai",
    "stops": [
      {
        "seq": 1,
        "name": "Bodø hurtigbåtkai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49739",
        "lat": 67.284044,
        "lng": 14.372917
      },
      {
        "seq": 2,
        "name": "Helnessund hurtigbåtkai",
        "minutesMin": 65,
        "minutesMax": 65,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49001",
        "lat": 67.732972,
        "lng": 14.772864
      },
      {
        "seq": 3,
        "name": "Nordskot hurtigbåtkai",
        "minutesMin": 80,
        "minutesMax": 80,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47435",
        "lat": 67.835153,
        "lng": 14.788354
      },
      {
        "seq": 4,
        "name": "Holkestad hurtigbåtkai",
        "minutesMin": 100,
        "minutesMax": 100,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49002",
        "lat": 67.885034,
        "lng": 14.887346
      },
      {
        "seq": 5,
        "name": "Bogøy hurtigbåtkai",
        "minutesMin": 115,
        "minutesMax": 115,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49005",
        "lat": 67.899876,
        "lng": 15.189618
      },
      {
        "seq": 6,
        "name": "Skutvik hurtigbåtkai",
        "minutesMin": 132,
        "minutesMax": 142,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49158",
        "lat": 68.015253,
        "lng": 15.336522
      },
      {
        "seq": 7,
        "name": "Skrova hurtigbåtkai",
        "minutesMin": 190,
        "minutesMax": 190,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49648",
        "lat": 68.16683,
        "lng": 14.66215
      },
      {
        "seq": 8,
        "name": "Svolvær hurtigbåtkai",
        "minutesMin": 205,
        "minutesMax": 205,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47288",
        "lat": 68.231434,
        "lng": 14.566731
      }
    ],
    "duration": {
      "min": 205,
      "max": 205,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 2 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "assente",
      "sourceKey": "reis-priser",
      "note": "Reis Nordland non pubblica prezzi per tratta («cerca la tratta nell'app Reis»).",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "rules": [],
      "generalRules": "Reis Nordland: bambini sotto 6 anni gratis; biglietto bambino 6–15 (prezzo non indicato).",
      "fares": []
    },
    "places": {
      "to": "svolvaer",
      "along": [
        "lofoten"
      ]
    },
    "sourceKeys": [
      "reis-hb",
      "reis-priser",
      "entur",
      "nsr"
    ],
    "notes": [
      "Alternativa senza auto Bodø → Lofoten centrali (Svolvær), con fermata a Skutvik."
    ],
    "enturLine": {
      "id": "NOR:Line:12_3755",
      "code": "23-755",
      "name": "Bodø - Svolvær - Bodø",
      "operator": "Boreal Sjø AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-31",
      "sampleTrips": {
        "wed": 2,
        "sat": 2,
        "sun": 2
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "bodo-sandnessjoen-express",
    "name": "Bodø – Ørnes – Sandnessjøen (battello veloce NEX 1)",
    "operator": "Boreal Sjø (per Reis Nordland)",
    "mode": "hurtigbat",
    "zone": "Nordland – Helgeland",
    "region": "Nordland e Lofoten",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Bodø hurtigbåtkai",
    "toName": "Sandnessjøen hurtigbåtkai",
    "stops": [
      {
        "seq": 1,
        "name": "Bodø hurtigbåtkai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49739",
        "lat": 67.284044,
        "lng": 14.372917
      },
      {
        "seq": 2,
        "name": "Sørarnøy hurtigbåtkai",
        "minutesMin": 30,
        "minutesMax": 30,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47145",
        "lat": 67.136275,
        "lng": 13.976777
      },
      {
        "seq": 3,
        "name": "Støtt hurtigbåtkai",
        "minutesMin": 70,
        "minutesMax": 70,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:50499",
        "lat": 66.92611,
        "lng": 13.434234
      },
      {
        "seq": 4,
        "name": "Ørnes hurtigbåtkai",
        "minutesMin": 90,
        "minutesMax": 90,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:46882",
        "lat": 66.86863,
        "lng": 13.702011
      },
      {
        "seq": 5,
        "name": "Grønnøy hurtigbåtkai",
        "minutesMin": 115,
        "minutesMax": 115,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:46880",
        "lat": 66.794109,
        "lng": 13.452075
      },
      {
        "seq": 6,
        "name": "Bolga hurtigbåtkai",
        "minutesMin": 130,
        "minutesMax": 130,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49759",
        "lat": 66.804988,
        "lng": 13.236976
      },
      {
        "seq": 7,
        "name": "Vågaholmen hurtigbåtkai",
        "minutesMin": 150,
        "minutesMax": 150,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:46886",
        "lat": 66.710494,
        "lng": 13.280121
      },
      {
        "seq": 8,
        "name": "Rødøy hurtigbåtkai",
        "minutesMin": 170,
        "minutesMax": 170,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:50922",
        "lat": 66.656183,
        "lng": 13.066193
      },
      {
        "seq": 9,
        "name": "Gjerøy hurtigbåtkai",
        "minutesMin": 175,
        "minutesMax": 175,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47644",
        "lat": 66.614612,
        "lng": 12.992044
      },
      {
        "seq": 10,
        "name": "Selsøyvik hurtigbåtkai",
        "minutesMin": 185,
        "minutesMax": 185,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:50045",
        "lat": 66.57431,
        "lng": 12.978405
      },
      {
        "seq": 11,
        "name": "Tonnes hurtigbåtkai",
        "minutesMin": 205,
        "minutesMax": 205,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47500",
        "lat": 66.511896,
        "lng": 13.007926
      },
      {
        "seq": 12,
        "name": "Indre Kvarøy hurtigbåtkai",
        "minutesMin": 210,
        "minutesMax": 210,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:48692",
        "lat": 66.488968,
        "lng": 12.966474
      },
      {
        "seq": 13,
        "name": "Onøy hurtigbåtkai",
        "minutesMin": 230,
        "minutesMax": 230,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47503",
        "lat": 66.393038,
        "lng": 12.824105
      },
      {
        "seq": 14,
        "name": "Nesna hurtigbåtkai",
        "minutesMin": 265,
        "minutesMax": 265,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47511",
        "lat": 66.20046,
        "lng": 13.008145
      },
      {
        "seq": 15,
        "name": "Sandnessjøen hurtigbåtkai",
        "minutesMin": 305,
        "minutesMax": 305,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:49452",
        "lat": 66.022865,
        "lng": 12.633902
      }
    ],
    "duration": {
      "min": 305,
      "max": 305,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 2 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "assente",
      "sourceKey": "reis-priser",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "rules": [],
      "generalRules": "bambini sotto 6 anni gratis (Reis Nordland)",
      "fares": []
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "reis-hb",
      "reis-priser",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "NOR:Line:12_3731",
      "code": "23-731",
      "name": "Bodø-Helgeland",
      "operator": "Boreal Sjø AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-31",
      "sampleTrips": {
        "wed": 2,
        "sat": 2,
        "sun": 2
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "skutvik-svolvaer",
    "name": "Skutvik – Skrova – Svolvær",
    "operator": "Torghatten Nord",
    "mode": "ferje",
    "zone": "Nordland – Lofoten",
    "region": "Nordland e Lofoten",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Skutvik ferjekai",
    "toName": "Svolvær ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Skutvik ferjekai",
        "call": "fermata",
        "nsrId": "NSR:StopPlace:58676",
        "lat": 68.014935,
        "lng": 15.335412
      },
      {
        "seq": 2,
        "name": "Skrova ferjekai",
        "call": "fermata",
        "nsrId": "NSR:StopPlace:48069",
        "lat": 68.16713,
        "lng": 14.66281
      },
      {
        "seq": 3,
        "name": "Svolvær ferjekai",
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47285",
        "lat": 68.234587,
        "lng": 14.551885
      }
    ],
    "duration": {
      "status": "assente",
      "note": "Nei dati invernali Entur compare solo Skrova–Svolvær (30 min); il tratto Skutvik non è pubblicato per l'inverno.",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "assente",
      "status": "assente"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "sourceKey": "reis-ferge",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "sourceKey": "reis-ferge",
          "category": "veicolo",
          "amountNok": null,
          "driverIncluded": null,
          "status": "assente",
          "note": "Gratis per i veicoli fuori dall'estate; tariffa estiva non pubblicata (calcolatore autopassferje.no)"
        }
      ]
    },
    "places": {
      "to": "svolvaer",
      "along": [
        "lofoten"
      ]
    },
    "sourceKeys": [
      "reis-ferge",
      "entur",
      "nsr"
    ],
    "notes": [],
    "checkedAt": "2026-11-09"
  },
  {
    "key": "bognes-lodingen",
    "name": "Bognes – Lødingen (verso Lofoten/Vesterålen)",
    "operator": "Torghatten Nord",
    "mode": "ferje",
    "zone": "Nordland – Lofoten/Vesterålen",
    "region": "Nordland e Lofoten",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Bognes ferjekai",
    "toName": "Lødingen ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Bognes ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:48052",
        "lat": 68.224379,
        "lng": 16.074301
      },
      {
        "seq": 2,
        "name": "Lødingen ferjekai",
        "minutesMin": 60,
        "minutesMax": 60,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:48065",
        "lat": 68.420041,
        "lng": 15.994278
      }
    ],
    "duration": {
      "min": 60,
      "max": 60,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 28 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "torg-703",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis (regola Reis Nordland)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "torg-703",
          "category": "veicolo",
          "amountNok": 187,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "da_verificare",
          "note": "«Fullpris», anno non indicato"
        }
      ]
    },
    "places": {
      "along": [
        "lofoten"
      ]
    },
    "sourceKeys": [
      "torg-703",
      "reis-ferge",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "NOR:Line:12_8703",
      "code": "18-703",
      "name": "Bognes-Lødingen",
      "operator": "Torghatten Nord AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-31",
      "sampleTrips": {
        "wed": 28,
        "sat": 26,
        "sun": 26
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "bognes-skarberget",
    "name": "Bognes – Skarberget (E6 Tysfjorden)",
    "operator": "Fjord1",
    "mode": "ferje",
    "zone": "Nordland",
    "region": "Nordland e Lofoten",
    "road": "E6",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Bognes ferjekai",
    "toName": "Skarberget ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Bognes ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:48052",
        "lat": 68.224379,
        "lng": 16.074301
      },
      {
        "seq": 2,
        "name": "Skarberget ferjekai",
        "minutesMin": 25,
        "minutesMax": 25,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:48048",
        "lat": 68.232394,
        "lng": 16.234818
      }
    ],
    "duration": {
      "min": 25,
      "max": 25,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 48 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "fjord1-pagina-tratta",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis (regola Reis Nordland)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fjord1-pagina-tratta",
          "category": "veicolo",
          "amountNok": 104,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "zona tariffaria 10"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "reis-ferge",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "NOR:Line:12_8611",
      "code": "18-611",
      "name": "Skarberget - Bognes",
      "operator": "Fjord1 AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-31",
      "sampleTrips": {
        "wed": 48,
        "sat": 48,
        "sun": 48
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "fiskebol-melbu",
    "name": "Fiskebøl – Melbu (Lofoten – Vesterålen)",
    "operator": "Torghatten Nord",
    "mode": "ferje",
    "zone": "Nordland – Lofoten/Vesterålen",
    "region": "Nordland e Lofoten",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Fiskebøl ferjekai",
    "toName": "Melbu ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Fiskebøl ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:48078",
        "lat": 68.430895,
        "lng": 14.824312
      },
      {
        "seq": 2,
        "name": "Melbu ferjekai",
        "minutesMin": 25,
        "minutesMax": 25,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:48073",
        "lat": 68.49865,
        "lng": 14.801009
      }
    ],
    "duration": {
      "min": 25,
      "max": 25,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 22 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "fergeruter",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fergeruter",
          "category": "veicolo",
          "amountNok": 116,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "da_verificare",
          "note": "tariffa ridotta secondo Reis Nordland; valore da fonte secondaria"
        }
      ]
    },
    "places": {
      "along": [
        "lofoten"
      ]
    },
    "sourceKeys": [
      "fergeruter",
      "reis-ferge",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "NOR:Line:12_8732",
      "code": "18-732",
      "name": "Melbu - Fiskebøl",
      "operator": "Torghatten Nord AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-31",
      "sampleTrips": {
        "wed": 22,
        "sat": 22,
        "sun": 20
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "andenes-gryllefjord",
    "name": "Andenes – Gryllefjord (Vesterålen – Senja, solo estate)",
    "operator": "Torghatten Nord (per Svipper/Troms)",
    "mode": "ferje",
    "zone": "Nordland/Troms – Vesterålen e Senja",
    "region": "Nordland e Lofoten",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Andenes ferjekai",
    "toName": "Gryllefjord ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Andenes ferjekai",
        "call": "fermata",
        "nsrId": "NSR:StopPlace:63911",
        "lat": 69.326799,
        "lng": 16.133369
      },
      {
        "seq": 2,
        "name": "Gryllefjord ferjekai",
        "call": "fermata",
        "nsrId": "NSR:StopPlace:60125",
        "lat": 69.3633,
        "lng": 17.052289
      }
    ],
    "duration": {
      "status": "assente",
      "note": "Linea estiva non presente nei dati invernali Entur."
    },
    "summerFrequency": {
      "text": "assente",
      "status": "assente"
    },
    "season": {
      "text": "estate: 15 giugno – 27 settembre 2026",
      "status": "confermato",
      "sourceKey": "svipper-180-news"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "svipper-180",
      "note": "Il biglietto passeggero era una prova per la stagione 2026: da verificare per il 2027.",
      "verifyForTripYear": true,
      "passengerRule": "a_pagamento",
      "passengersText": "2026 (prova): adulto 30–66 anni 100 NOK; bambini, giovani e senior gratis; conducente incluso nel prezzo del veicolo",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-180",
          "category": "adulto",
          "amountNok": 100,
          "ageText": "30–66",
          "status": "confermato",
          "ageMin": 30,
          "ageMax": 66,
          "note": "Solo i passeggeri oltre al conducente (compreso nel prezzo del veicolo)"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-180",
          "category": "bambino",
          "amountNok": 0,
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-180",
          "category": "veicolo",
          "amountNok": 925,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "prezzo ordinario; 833 con AutoPASS, 463 con accordo privato"
        }
      ]
    },
    "places": {
      "from": "andenes",
      "to": "senja",
      "along": []
    },
    "sourceKeys": [
      "svipper-180",
      "svipper-180-news",
      "nsr"
    ],
    "notes": [
      "Scorciatoia estiva Vesterålen → Senja → Tromsø."
    ],
    "checkedAt": "2026-11-09"
  },
  {
    "key": "festvag-misten",
    "name": "Festvåg – Misten (verso Kjerringøy, Bodø)",
    "operator": "Torghatten Nord",
    "mode": "ferje",
    "zone": "Nordland – Kystriksveien/Bodø",
    "region": "Nordland e Lofoten",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Festvåg ferjekai",
    "toName": "Misten ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Festvåg ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47405",
        "lat": 67.43861,
        "lng": 14.761843
      },
      {
        "seq": 2,
        "name": "Misten ferjekai",
        "minutesMin": 10,
        "minutesMax": 10,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47408",
        "lat": 67.452793,
        "lng": 14.729496
      }
    ],
    "duration": {
      "min": 10,
      "max": 10,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 40 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "sourceKey": "reis-ferge",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "sourceKey": "reis-ferge",
          "category": "veicolo",
          "amountNok": null,
          "driverIncluded": null,
          "status": "assente",
          "note": "Gratis per i veicoli fuori dall'estate (Reis Nordland); tariffa estiva non pubblicata"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "reis-ferge",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "NOR:Line:12_8538",
      "code": "18-538",
      "name": "Festvåg - Misten",
      "operator": "Torghatten Nord AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-31",
      "sampleTrips": {
        "wed": 40,
        "sat": 26,
        "sun": 34
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "kilboghamn-jektvik",
    "name": "Kilboghamn – Jektvik (Fv17 Kystriksveien, Circolo polare)",
    "operator": "Torghatten Nord",
    "mode": "ferje",
    "zone": "Nordland – Kystriksveien/Bodø",
    "region": "Nordland e Lofoten",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Kilboghamn ferjekai",
    "toName": "Jektvik ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Kilboghamn ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47989",
        "lat": 66.489032,
        "lng": 13.227493
      },
      {
        "seq": 2,
        "name": "Sørfjorden ferjekai",
        "minutesMin": 10,
        "minutesMax": 10,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47974",
        "lat": 66.506542,
        "lng": 13.302185
      },
      {
        "seq": 3,
        "name": "Jektvik ferjekai",
        "minutesMin": 65,
        "minutesMax": 65,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47701",
        "lat": 66.624295,
        "lng": 13.285483
      }
    ],
    "duration": {
      "min": 65,
      "max": 65,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 12 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "sourceKey": "reis-ferge",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "sourceKey": "reis-ferge",
          "category": "veicolo",
          "amountNok": null,
          "driverIncluded": null,
          "status": "assente",
          "note": "Gratis per i veicoli fuori dall'estate (Reis Nordland); tariffa estiva non pubblicata"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "reis-ferge",
      "entur",
      "nsr"
    ],
    "notes": [
      "Attraversa il Circolo polare artico."
    ],
    "enturLine": {
      "id": "NOR:Line:12_8414",
      "code": "18-414",
      "name": "Jektvik - Kilboghamn A-ferge",
      "operator": "Torghatten Nord AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-31",
      "sampleTrips": {
        "wed": 12,
        "sat": 8,
        "sun": 10
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "foroy-agskardet",
    "name": "Forøy – Ågskardet (Fv17, Svartisen)",
    "operator": "Torghatten Nord",
    "mode": "ferje",
    "zone": "Nordland – Kystriksveien/Bodø",
    "region": "Nordland e Lofoten",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Forøy ferjekai",
    "toName": "Ågskardet ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Forøy ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:48011",
        "lat": 66.73861,
        "lng": 13.51394
      },
      {
        "seq": 2,
        "name": "Ågskardet ferjekai",
        "minutesMin": 10,
        "minutesMax": 10,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:48020",
        "lat": 66.720021,
        "lng": 13.476443
      }
    ],
    "duration": {
      "min": 10,
      "max": 10,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 40 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "sourceKey": "reis-ferge",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "sourceKey": "reis-ferge",
          "category": "veicolo",
          "amountNok": null,
          "driverIncluded": null,
          "status": "assente",
          "note": "Gratis per i veicoli fuori dall'estate (Reis Nordland); tariffa estiva non pubblicata"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "reis-ferge",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "NOR:Line:12_8421",
      "code": "18-421",
      "name": "Forøy - Ågskardet",
      "operator": "Torghatten Nord AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-31",
      "sampleTrips": {
        "wed": 40,
        "sat": 30,
        "sun": 32
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "tjotta-forvik",
    "name": "Tjøtta – Forvik (Fv17 Kystriksveien)",
    "operator": "Boreal Sjø",
    "mode": "ferje",
    "zone": "Nordland – Kystriksveien/Bodø",
    "region": "Nordland e Lofoten",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Tjøtta ferjekai",
    "toName": "Forvik ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Tjøtta ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47451",
        "lat": 65.821893,
        "lng": 12.43014
      },
      {
        "seq": 2,
        "name": "Mindland ferjekai",
        "minutesMin": 15,
        "minutesMax": 20,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47447",
        "lat": 65.807031,
        "lng": 12.494909
      },
      {
        "seq": 3,
        "name": "Tro ferjekai",
        "minutesMin": 25,
        "minutesMax": 30,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47671",
        "lat": 65.796731,
        "lng": 12.526533
      },
      {
        "seq": 4,
        "name": "Stokkasjøen ferjekai",
        "minutesMin": 30,
        "minutesMax": 35,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47437",
        "lat": 65.758648,
        "lng": 12.55696
      },
      {
        "seq": 5,
        "name": "Vågsodden ferjekai",
        "minutesMin": 50,
        "minutesMax": 60,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47433",
        "lat": 65.721527,
        "lng": 12.45138
      },
      {
        "seq": 6,
        "name": "Forvik ferjekai",
        "minutesMin": 55,
        "minutesMax": 70,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:59698",
        "lat": 65.712723,
        "lng": 12.459102
      }
    ],
    "duration": {
      "min": 55,
      "max": 70,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 22 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "sourceKey": "reis-ferge",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "sourceKey": "reis-ferge",
          "category": "veicolo",
          "amountNok": null,
          "driverIncluded": null,
          "status": "assente",
          "note": "Gratis per i veicoli fuori dall'estate (Reis Nordland); tariffa estiva non pubblicata"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "reis-ferge",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "NOR:Line:12_8162",
      "code": "18-162",
      "name": "Tjøtta - Forvik",
      "operator": "Boreal Sjø AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-31",
      "sampleTrips": {
        "wed": 22,
        "sat": 12,
        "sun": 16
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "nesna-levang",
    "name": "Nesna – Levang (Fv17 Kystriksveien)",
    "operator": "Torghatten Nord",
    "mode": "ferje",
    "zone": "Nordland – Kystriksveien",
    "region": "Nordland e Lofoten",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Nesna ferjekai",
    "toName": "Levang ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Nesna ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47187",
        "lat": 66.200679,
        "lng": 13.011479
      },
      {
        "seq": 2,
        "name": "Levang ferjekai",
        "minutesMin": 25,
        "minutesMax": 30,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47674",
        "lat": 66.153175,
        "lng": 13.078864
      }
    ],
    "duration": {
      "min": 25,
      "max": 30,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 26 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "sourceKey": "reis-ferge",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "sourceKey": "reis-ferge",
          "category": "veicolo",
          "amountNok": null,
          "driverIncluded": null,
          "status": "assente",
          "note": "Tariffa ridotta (Reis Nordland), importo non pubblicato"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "reis-ferge",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "NOR:Line:12_8335",
      "code": "18-335",
      "name": "Nesna - Levang N",
      "operator": "Torghatten Nord AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-31",
      "sampleTrips": {
        "wed": 26,
        "sat": 18,
        "sun": 18
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "reine-vindstad",
    "name": "Reinefjorden: Reine – Kirkefjord – Vindstad (barca locale)",
    "operator": "Charter i Nord (per Reis Nordland)",
    "mode": "hurtigbat",
    "zone": "Nordland – Lofoten",
    "region": "Nordland e Lofoten",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Reine hurtigbåtkai",
    "toName": "Vindstad hurtigbåtkai",
    "stops": [
      {
        "seq": 1,
        "name": "Reine hurtigbåtkai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:48469",
        "lat": 67.935463,
        "lng": 13.094791
      },
      {
        "seq": 2,
        "name": "Rostad hurtigbåtkai",
        "minutesMin": 15,
        "minutesMax": 15,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47101",
        "lat": 67.962109,
        "lng": 13.04487
      },
      {
        "seq": 3,
        "name": "Kirkefjord hurtigbåtkai",
        "minutesMin": 25,
        "minutesMax": 25,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47103",
        "lat": 67.992307,
        "lng": 13.015384
      },
      {
        "seq": 4,
        "name": "Vindstad hurtigbåtkai",
        "minutesMin": 40,
        "minutesMax": 40,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:47097",
        "lat": 67.957221,
        "lng": 13.005294
      }
    ],
    "duration": {
      "min": 40,
      "max": 40,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 4 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "assente",
      "sourceKey": "reis-priser",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "rules": [],
      "generalRules": "bambini sotto 6 anni gratis (Reis Nordland)",
      "fares": []
    },
    "places": {
      "from": "reine",
      "along": [
        "lofoten"
      ]
    },
    "sourceKeys": [
      "reis-priser",
      "entur",
      "nsr"
    ],
    "notes": [
      "Vindstad è il punto di partenza del sentiero per la spiaggia di Bunes (informazione da verificare prima di inserirla nella scheda)."
    ],
    "enturLine": {
      "id": "NOR:Line:12_8773",
      "code": "18-773",
      "name": "Reinefjorden",
      "operator": "Charter i Nord AS",
      "validFrom": "2026-11-08",
      "validTo": "2027-03-29",
      "sampleTrips": {
        "wed": 4,
        "sat": 0,
        "sun": 4
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "tromso-harstad-express",
    "name": "Tromsø – Finnsnes – Harstad (battello veloce linea 2)",
    "operator": "Norled (per Svipper)",
    "mode": "hurtigbat",
    "zone": "Troms",
    "region": "Troms e Finnmark",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Tromsø Prostneset",
    "toName": "Harstad hurtigbåtkai",
    "stops": [
      {
        "seq": 1,
        "name": "Tromsø Prostneset hurtigbåtkai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:52279",
        "lat": 69.646316,
        "lng": 18.957687
      },
      {
        "seq": 2,
        "name": "Finnsnes kai",
        "minutesMin": 75,
        "minutesMax": 75,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:55427",
        "lat": 69.229089,
        "lng": 17.974282
      },
      {
        "seq": 3,
        "name": "Brøstadbotn hurtigbåtkai",
        "minutesMin": 110,
        "minutesMax": 110,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:56219",
        "lat": 69.072048,
        "lng": 17.657841
      },
      {
        "seq": 4,
        "name": "Engenes kai",
        "minutesMin": 140,
        "minutesMax": 140,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:55174",
        "lat": 68.925935,
        "lng": 17.125438
      },
      {
        "seq": 5,
        "name": "Harstad hurtigbåtkai",
        "minutesMin": 180,
        "minutesMax": 180,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:70023",
        "lat": 68.801062,
        "lng": 16.546732
      }
    ],
    "duration": {
      "min": 180,
      "max": 180,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 4 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "validFrom": "2026-02-01",
      "sourceKey": "svipper-l2",
      "note": "Fasce d'età lette sulla pagina tariffe bus di Svipper; applicazione ai battelli da verificare. Dal 1/2/2026 posto garantito: biglietto per una partenza precisa.",
      "verifyForTripYear": true,
      "passengerRule": "a_pagamento",
      "freeUnderAge": 6,
      "childAgeText": "6–17 (categorie Svipper)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-l2",
          "category": "adulto",
          "amountNok": 630,
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-l2",
          "category": "bambino",
          "amountNok": 209,
          "ageMin": 6,
          "ageMax": 17,
          "ageText": "6–17 (categorie Svipper)",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-l2",
          "category": "giovane",
          "amountNok": 377,
          "ageMin": 18,
          "ageMax": 29,
          "ageText": "18–29",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-l2",
          "category": "adulto",
          "dayType": "sabato",
          "amountNok": 277,
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-l2",
          "category": "bambino",
          "dayType": "sabato",
          "amountNok": 154,
          "ageMin": 6,
          "ageMax": 17,
          "ageText": "6–17 (categorie Svipper)",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-l2",
          "category": "adulto",
          "amountNok": 295,
          "fromStop": "Tromsø",
          "toStop": "Finnsnes",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-l2",
          "category": "bambino",
          "amountNok": 98,
          "ageMin": 6,
          "ageMax": 17,
          "ageText": "6–17 (categorie Svipper)",
          "fromStop": "Tromsø",
          "toStop": "Finnsnes",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-l2",
          "category": "adulto",
          "amountNok": 381,
          "fromStop": "Finnsnes",
          "toStop": "Harstad",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-l2",
          "category": "bambino",
          "amountNok": 126,
          "ageMin": 6,
          "ageMax": 17,
          "ageText": "6–17 (categorie Svipper)",
          "fromStop": "Finnsnes",
          "toStop": "Harstad",
          "status": "confermato"
        }
      ]
    },
    "places": {
      "from": "tromso",
      "along": [
        "senja"
      ]
    },
    "sourceKeys": [
      "svipper-l2",
      "svipper-hb",
      "svipper-bus",
      "entur",
      "nsr"
    ],
    "notes": [
      "Finnsnes è la porta di Senja; Harstad è vicina all'aeroporto di Evenes (distanza da calcolare)."
    ],
    "enturLine": {
      "id": "TRO:Line:1_2",
      "code": "2",
      "name": "Tromsø - Finnsnes - Harstad",
      "operator": "Norled hurtigbåt",
      "validFrom": "2026-11-09",
      "validTo": "2027-04-30",
      "sampleTrips": {
        "wed": 4,
        "sat": 4,
        "sun": 4
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "tromso-skjervoy-express",
    "name": "Tromsø – Skjervøy (battello veloce linea 3)",
    "operator": "Norled (per Svipper)",
    "mode": "hurtigbat",
    "zone": "Troms",
    "region": "Troms e Finnmark",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Tromsø Prostneset hurtigbåtkai",
    "toName": "Skjervøy kai",
    "stops": [
      {
        "seq": 1,
        "name": "Tromsø Prostneset hurtigbåtkai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:52279",
        "lat": 69.646316,
        "lng": 18.957687
      },
      {
        "seq": 2,
        "name": "Finnkroken hurtigbåtkai",
        "minutesMin": 30,
        "minutesMax": 30,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:55399",
        "lat": 69.834185,
        "lng": 19.436038
      },
      {
        "seq": 3,
        "name": "Vannvåg kai",
        "minutesMin": 75,
        "minutesMax": 75,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:52707",
        "lat": 70.072438,
        "lng": 19.99214
      },
      {
        "seq": 4,
        "name": "Nord-Lenangen",
        "minutesMin": 105,
        "minutesMax": 105,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:56050",
        "lat": 69.909302,
        "lng": 20.163453
      },
      {
        "seq": 5,
        "name": "Arnøyhamn kai",
        "minutesMin": 135,
        "minutesMax": 135,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:55270",
        "lat": 70.052904,
        "lng": 20.636074
      },
      {
        "seq": 6,
        "name": "Nikkeby",
        "minutesMin": 150,
        "minutesMax": 150,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:55951",
        "lat": 70.074228,
        "lng": 20.815288
      },
      {
        "seq": 7,
        "name": "Skjervøy kai",
        "minutesMin": 170,
        "minutesMax": 170,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:53630",
        "lat": 70.035446,
        "lng": 20.983748
      }
    ],
    "duration": {
      "min": 170,
      "max": 170,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 1 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "validFrom": "2026-02-01",
      "sourceKey": "svipper-l3",
      "verifyForTripYear": true,
      "passengerRule": "a_pagamento",
      "freeUnderAge": 6,
      "childAgeText": "6–17 (categorie Svipper)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-l3",
          "category": "adulto",
          "amountNok": 424,
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-l3",
          "category": "bambino",
          "amountNok": 142,
          "ageMin": 6,
          "ageMax": 17,
          "ageText": "6–17 (categorie Svipper)",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-l3",
          "category": "giovane",
          "amountNok": 253,
          "ageMin": 18,
          "ageMax": 29,
          "ageText": "18–29",
          "status": "confermato"
        }
      ]
    },
    "places": {
      "from": "tromso",
      "along": []
    },
    "sourceKeys": [
      "svipper-l3",
      "svipper-bus",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "TRO:Line:1_3",
      "code": "3",
      "name": "Tromsø - Skjervøy",
      "operator": "Norled hurtigbåt",
      "validFrom": "2026-11-09",
      "validTo": "2027-04-30",
      "sampleTrips": {
        "wed": 1,
        "sat": 0,
        "sun": 2
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "botnhamn-brensholmen",
    "name": "Botnhamn – Brensholmen (Senja – Kvaløya/Tromsø)",
    "operator": "Torghatten Nord (per Svipper)",
    "mode": "ferje",
    "zone": "Troms",
    "region": "Troms e Finnmark",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Botnhamn ferjekai",
    "toName": "Brensholmen ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Botnhamn ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:70258",
        "lat": 69.506933,
        "lng": 17.908503
      },
      {
        "seq": 2,
        "name": "Brensholmen ferjekai",
        "minutesMin": 35,
        "minutesMax": 35,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:56141",
        "lat": 69.607852,
        "lng": 18.031594
      }
    ],
    "duration": {
      "min": 35,
      "max": 35,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 8 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "svipper-181",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis («Personer og sykler: Gratis»)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "svipper-181",
          "category": "veicolo",
          "amountNok": 247,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "confermato",
          "note": "20/6–31/8/2026; dal 31/8: 228"
        }
      ]
    },
    "places": {
      "from": "senja",
      "along": []
    },
    "sourceKeys": [
      "svipper-181",
      "svipper-180-news",
      "entur",
      "nsr"
    ],
    "notes": [
      "Tratta stagionale più frequente d'estate (da verificare); collega Senja a Tromsø."
    ],
    "enturLine": {
      "id": "TRO:Line:1_181",
      "code": "181",
      "name": "Botnhamn - Brensholmen",
      "operator": "Torghatten Nord",
      "validFrom": "2026-11-09",
      "validTo": "2027-04-30",
      "sampleTrips": {
        "wed": 8,
        "sat": 4,
        "sun": 6
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "breivikeidet-svensby",
    "name": "Breivikeidet – Svensby (Lyngen)",
    "operator": "Norled (per Svipper)",
    "mode": "ferje",
    "zone": "Troms – Lyngen",
    "region": "Troms e Finnmark",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Breivikeidet ferjekai",
    "toName": "Svensby ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Breivikeidet ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:70319",
        "lat": 69.669926,
        "lng": 19.65081
      },
      {
        "seq": 2,
        "name": "Svensby ferjekai",
        "minutesMin": 20,
        "minutesMax": 20,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:70320",
        "lat": 69.66337,
        "lng": 19.809251
      }
    ],
    "duration": {
      "min": 20,
      "max": 20,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 30 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "assente",
      "verifyForTripYear": true,
      "passengerRule": "non_indicata",
      "rules": [],
      "fares": []
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "entur",
      "nsr"
    ],
    "notes": [
      "Via breve Tromsø → Lyngen."
    ],
    "enturLine": {
      "id": "TRO:Line:1_191",
      "code": "191",
      "name": "Breivikeidet - Svensby",
      "operator": "Norled Ferge",
      "validFrom": "2026-11-09",
      "validTo": "2027-04-30",
      "sampleTrips": {
        "wed": 30,
        "sat": 22,
        "sun": 24
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "lyngseidet-olderdalen",
    "name": "Lyngseidet – Olderdalen (Lyngenfjorden)",
    "operator": "Norled (per Svipper)",
    "mode": "ferje",
    "zone": "Troms – Lyngen",
    "region": "Troms e Finnmark",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Lyngseidet ferjekai",
    "toName": "Olderdalen ferjekai",
    "stops": [
      {
        "seq": 1,
        "name": "Lyngseidet ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:70315",
        "lat": 69.577181,
        "lng": 20.2237
      },
      {
        "seq": 2,
        "name": "Olderdalen ferjekai",
        "minutesMin": 40,
        "minutesMax": 40,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:70316",
        "lat": 69.601573,
        "lng": 20.532672
      }
    ],
    "duration": {
      "min": 40,
      "max": 40,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 18 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "fergeruter",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "fergeruter",
          "category": "veicolo",
          "amountNok": 152,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "da_verificare",
          "note": "fonte secondaria"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "fergeruter",
      "entur",
      "nsr"
    ],
    "notes": [
      "Con Breivikeidet–Svensby forma la scorciatoia Tromsø → E6 verso il Finnmark."
    ],
    "enturLine": {
      "id": "TRO:Line:1_190",
      "code": "190",
      "name": "Lyngseidet - Olderdalen",
      "operator": "Norled Ferge",
      "validFrom": "2026-11-09",
      "validTo": "2027-04-30",
      "sampleTrips": {
        "wed": 18,
        "sat": 14,
        "sun": 14
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "hammerfest-alta-express",
    "name": "Hammerfest – Alta (VargsundXpressen)",
    "operator": "Boreal Sjø (per Snelandia)",
    "mode": "hurtigbat",
    "zone": "Finnmark",
    "region": "Troms e Finnmark",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Hammerfest havn",
    "toName": "Alta hurtigbåtterminal",
    "stops": [
      {
        "seq": 1,
        "name": "Hammerfest havn",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:56851",
        "lat": 70.664175,
        "lng": 23.682516
      },
      {
        "seq": 2,
        "name": "Alta hurtigbåtterminal",
        "minutesMin": 95,
        "minutesMax": 95,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:60051",
        "lat": 69.976851,
        "lng": 23.328427
      }
    ],
    "duration": {
      "min": 95,
      "max": 95,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 4 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "validFrom": "2026-02-01",
      "sourceKey": "snelandia-hb",
      "note": "«Gratis sotto 4 anni» indicato solo su alcune righe del listino: da verificare. Tutte le fermate del battello vanno prenotate in anticipo.",
      "verifyForTripYear": true,
      "passengerRule": "a_pagamento",
      "childAgeText": "4–19 (anche honnør/militari)",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "snelandia-hb",
          "category": "adulto",
          "amountNok": 420,
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "snelandia-hb",
          "category": "bambino",
          "amountNok": 263,
          "ageMin": 4,
          "ageMax": 19,
          "ageText": "4–19 (anche honnør/militari)",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "snelandia-hb",
          "category": "giovane",
          "amountNok": 315,
          "ageMin": 20,
          "ageMax": 29,
          "ageText": "20–29",
          "status": "confermato"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "snelandia-hb",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "FIN:Line:2330",
      "code": "B330",
      "name": "VargsundXpressen",
      "operator": "Boreal Sjø - hurtigbåt",
      "validFrom": "2026-10-01",
      "validTo": "2027-01-15",
      "sampleTrips": {
        "wed": 4,
        "sat": 0,
        "sun": 2
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "hammerfest-havoysund-express",
    "name": "Hammerfest – Ingøy – Havøysund (MåsøyXpressen)",
    "operator": "Boreal Sjø (per Snelandia)",
    "mode": "hurtigbat",
    "zone": "Finnmark",
    "region": "Troms e Finnmark",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Hammerfest havn",
    "toName": "Havøysund kai",
    "stops": [
      {
        "seq": 1,
        "name": "Hammerfest havn",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:56851",
        "lat": 70.664175,
        "lng": 23.682516
      },
      {
        "seq": 2,
        "name": "Gunnarnes kai",
        "minutesMin": 60,
        "minutesMax": 70,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:57336",
        "lat": 70.992232,
        "lng": 24.128953
      },
      {
        "seq": 3,
        "name": "Ingøy kai",
        "minutesMin": 105,
        "minutesMax": 115,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:57338",
        "lat": 71.084273,
        "lng": 24.06193
      },
      {
        "seq": 4,
        "name": "Havøysund kai",
        "minutesMin": 150,
        "minutesMax": 160,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:57328",
        "lat": 70.994496,
        "lng": 24.676172
      }
    ],
    "duration": {
      "min": 150,
      "max": 160,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 6 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "validFrom": "2026-02-01",
      "sourceKey": "snelandia-hb",
      "verifyForTripYear": true,
      "passengerRule": "a_pagamento",
      "childAgeText": "4–19",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "snelandia-hb",
          "category": "adulto",
          "amountNok": 327,
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "snelandia-hb",
          "category": "bambino",
          "amountNok": 204,
          "ageMin": 4,
          "ageMax": 19,
          "ageText": "4–19",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "snelandia-hb",
          "category": "giovane",
          "amountNok": 245,
          "ageMin": 20,
          "ageMax": 29,
          "ageText": "20–29",
          "status": "confermato"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "snelandia-hb",
      "entur",
      "nsr"
    ],
    "notes": [
      "Havøysund è anche porto Hurtigruten; da Havøysund a Honningsvåg/Capo Nord non c'è battello pubblico Snelandia nei dati."
    ],
    "enturLine": {
      "id": "FIN:Line:2350",
      "code": "B350",
      "name": "MåsøyXpressen",
      "operator": "Boreal Sjø - hurtigbåt",
      "validFrom": "2026-10-01",
      "validTo": "2027-01-15",
      "sampleTrips": {
        "wed": 6,
        "sat": 0,
        "sun": 6
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "hammerfest-hasvik-oksfjord-express",
    "name": "Hammerfest – Hasvik – Øksfjord (LoppaXpressen)",
    "operator": "Boreal Sjø (per Snelandia)",
    "mode": "hurtigbat",
    "zone": "Finnmark",
    "region": "Troms e Finnmark",
    "carriesCar": false,
    "roundTrip": false,
    "fromName": "Hammerfest havn",
    "toName": "Øksfjord hurtigbåtkai",
    "stops": [
      {
        "seq": 1,
        "name": "Hammerfest havn",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:56851",
        "lat": 70.664175,
        "lng": 23.682516
      },
      {
        "seq": 2,
        "name": "Kårhamn kai",
        "minutesMin": 30,
        "minutesMax": 40,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:56847",
        "lat": 70.546553,
        "lng": 23.158413
      },
      {
        "seq": 3,
        "name": "Hasvik kai",
        "minutesMin": 90,
        "minutesMax": 100,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:57206",
        "lat": 70.483277,
        "lng": 22.163037
      },
      {
        "seq": 4,
        "name": "Øksfjord hurtigbåtkai",
        "minutesMin": 135,
        "minutesMax": 145,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:57164",
        "lat": 70.238444,
        "lng": 22.348516
      }
    ],
    "duration": {
      "min": 135,
      "max": 145,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 3 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "confermato",
      "year": 2026,
      "sourceKey": "snelandia-hb",
      "note": "Prezzo fino a Øksfjord non letto.",
      "verifyForTripYear": true,
      "passengerRule": "a_pagamento",
      "childAgeText": "4–19",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "snelandia-hb",
          "category": "adulto",
          "amountNok": 327,
          "fromStop": "Hammerfest",
          "toStop": "Hasvik",
          "status": "confermato"
        },
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "snelandia-hb",
          "category": "bambino",
          "amountNok": 204,
          "ageMin": 4,
          "ageMax": 19,
          "ageText": "4–19",
          "fromStop": "Hammerfest",
          "toStop": "Hasvik",
          "status": "confermato"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "snelandia-hb",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "FIN:Line:2320",
      "code": "B320",
      "name": "LoppaXpressen",
      "operator": "Boreal Sjø - hurtigbåt",
      "validFrom": "2026-10-01",
      "validTo": "2027-01-15",
      "sampleTrips": {
        "wed": 3,
        "sat": 0,
        "sun": 2
      }
    },
    "checkedAt": "2026-11-09"
  },
  {
    "key": "oksfjord-hasvik",
    "name": "Øksfjord – Hasvik (Sørøya)",
    "operator": "Boreal Sjø (per Snelandia)",
    "mode": "ferje",
    "zone": "Finnmark",
    "region": "Troms e Finnmark",
    "carriesCar": true,
    "roundTrip": false,
    "fromName": "Øksfjord ferjekai",
    "toName": "Hasvik kai",
    "stops": [
      {
        "seq": 1,
        "name": "Øksfjord ferjekai",
        "minutesMin": 0,
        "minutesMax": 0,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:57179",
        "lat": 70.23317,
        "lng": 22.357564
      },
      {
        "seq": 2,
        "name": "Hasvik kai",
        "minutesMin": 75,
        "minutesMax": 75,
        "call": "fermata",
        "nsrId": "NSR:StopPlace:57210",
        "lat": 70.483803,
        "lng": 22.161698
      }
    ],
    "duration": {
      "min": 75,
      "max": 75,
      "status": "confermato",
      "note": "orario invernale 2026/27 (Entur); d'estate da verificare",
      "sourceKey": "entur"
    },
    "summerFrequency": {
      "text": "non pubblicata; riferimento invernale: 8 corse/giorno (entrambi i sensi) mercoledì 18/11/2026",
      "status": "assente",
      "sourceKey": "entur"
    },
    "season": {
      "text": "tutto l'anno secondo l'orario Entur; estate 2027 da verificare",
      "status": "da_verificare"
    },
    "fare": {
      "status": "da_verificare",
      "year": 2026,
      "sourceKey": "snelandia-ferge",
      "verifyForTripYear": true,
      "passengerRule": "gratis",
      "passengersText": "gratis",
      "rules": [],
      "fares": [
        {
          "trip": "andata",
          "year": 2026,
          "sourceKey": "snelandia-ferge",
          "category": "veicolo",
          "amountNok": 0,
          "vehicleClass": "fino_6m",
          "driverIncluded": true,
          "status": "da_verificare",
          "note": "«Ferge i Finnmark er gratis»; la pagina non distingue passeggeri e veicoli"
        }
      ]
    },
    "places": {
      "along": []
    },
    "sourceKeys": [
      "snelandia-ferge",
      "entur",
      "nsr"
    ],
    "notes": [],
    "enturLine": {
      "id": "FIN:Line:2500",
      "code": "500",
      "name": "Øksfjord - Hasvik",
      "operator": "Boreal Sjø - ferje",
      "validFrom": "2026-04-04",
      "validTo": "2027-01-15",
      "sampleTrips": {
        "wed": 8,
        "sat": 4,
        "sun": 4
      }
    },
    "checkedAt": "2026-11-09"
  }
];
