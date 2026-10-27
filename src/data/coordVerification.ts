// Verifica delle coordinate del catalogo su OpenStreetMap (Nominatim), eseguita il 27/10/2026.
// Regola: risultato accettato solo se coerente con la scheda (stesso luogo, tipo plausibile).
// Per i comuni (confini amministrativi) si tengono le coordinate del centro abitato, confermate entro 1 km.
// Esclusi perché il risultato non era affidabile: alesund (trovato un altro luogo), lofoten (area),
// aurlandsfjellet e lofotr (nessun risultato), dovrefjell (catena montuosa, punto non significativo),
// hardangerfjord (risultato non pertinente). Non verificati perché non sono luoghi puntuali:
// whale-andenes, aurora, midnight-sun, bodo-moskenes.

export const COORDS_CHECKED_AT = '2026-10-27';

export interface CoordCheck {
  lat: number;
  lng: number;
  /** oggetto OpenStreetMap (tipo/id) usato come fonte */
  osm: string;
  match: string;
  kind: string;
}

export const VERIFIED_COORDS: Record<string, CoordCheck> = {
  'oslo': { lat: 59.913, lng: 10.752, osm: 'relation/406091', match: "Oslo", kind: 'centro abitato confermato entro 1 km' },
  'bergen': { lat: 60.392, lng: 5.324, osm: 'relation/404159', match: "Bergen", kind: 'centro abitato confermato entro 1 km' },
  'trondheim': { lat: 63.43, lng: 10.395, osm: 'relation/10143487', match: "Trondheim", kind: 'centro abitato confermato entro 1 km' },
  'tromso': { lat: 69.649, lng: 18.955, osm: 'relation/407754', match: "Tromsø", kind: 'centro abitato confermato entro 1 km' },
  'stavanger': { lat: 58.97, lng: 5.733, osm: 'relation/10150658', match: "Stavanger", kind: 'centro abitato confermato entro 1 km' },
  'flam': { lat: 60.86295, lng: 7.11318, osm: 'node/59438430', match: "Flåm", kind: 'railway/station' },
  'geiranger': { lat: 62.10063, lng: 7.2059, osm: 'node/85999901', match: "Geiranger", kind: 'place/village' },
  'balestrand': { lat: 61.20962, lng: 6.53608, osm: 'node/138044945', match: "Balestrand", kind: 'place/village' },
  'undredal': { lat: 60.95091, lng: 7.10474, osm: 'node/9081352383', match: "Undredal", kind: 'place/village' },
  'lillehammer': { lat: 61.11467, lng: 10.46428, osm: 'node/5921083794', match: "Sentrum legekontor Lillehammer", kind: 'amenity/doctors' },
  'roros': { lat: 62.57739, lng: 11.38779, osm: 'way/165624467', match: "Røros Church", kind: 'amenity/place_of_worship' },
  'odda': { lat: 60.06792, lng: 6.54693, osm: 'node/31264122', match: "Odda", kind: 'place/town' },
  'geirangerfjord': { lat: 62.10314, lng: 7.09886, osm: 'way/351531275', match: "Geirangerfjorden", kind: 'natural/bay' },
  'naeroyfjord': { lat: 60.94324, lng: 6.92991, osm: 'way/1188520478', match: "Nærøyfjorden", kind: 'natural/bay' },
  'sognefjord': { lat: 61.09191, lng: 6.36853, osm: 'way/413063461', match: "Sognefjorden", kind: 'natural/bay' },
  'lysefjord': { lat: 59.01094, lng: 6.34465, osm: 'way/932038893', match: "Lysefjorden", kind: 'natural/bay' },
  'hjorundfjord': { lat: 62.28787, lng: 6.44396, osm: 'way/1191892678', match: "Hjørundfjorden", kind: 'natural/bay' },
  'aurlandsfjord': { lat: 60.9595, lng: 7.10254, osm: 'way/367610220', match: "Aurlandsfjorden", kind: 'natural/bay' },
  'briksdalsbreen': { lat: 61.66405, lng: 6.89153, osm: 'relation/5873859', match: "Briksdalsbreen", kind: 'natural/glacier' },
  'nigardsbreen': { lat: 61.68809, lng: 7.19445, osm: 'relation/5742213', match: "Nigardsbreen", kind: 'natural/glacier' },
  'voringsfossen': { lat: 60.42705, lng: 7.25088, osm: 'node/3608821784', match: "Vøringsfossen", kind: 'waterway/waterfall' },
  'steinsdalsfossen': { lat: 60.37079, lng: 6.10288, osm: 'node/315464192', match: "Steinsdalsfossen", kind: 'waterway/waterfall' },
  'latefossen': { lat: 59.9479, lng: 6.58476, osm: 'node/422750347', match: "Låtefossen", kind: 'waterway/waterfall' },
  'sju-sostrene': { lat: 62.10738, lng: 7.09376, osm: 'node/3949062642', match: "The seven sisters", kind: 'waterway/waterfall' },
  'jotunheimen': { lat: 61.55292, lng: 8.53071, osm: 'relation/269939', match: "Jotunheimen nasjonalpark", kind: 'boundary/national_park' },
  'preikestolen': { lat: 58.98514, lng: 6.18704, osm: 'way/712461892', match: "Pulpit Rock", kind: 'natural/cliff' },
  'trolltunga': { lat: 60.13296, lng: 6.754, osm: 'node/1377795111', match: "Troll tongue", kind: 'tourism/viewpoint' },
  'trollstigen': { lat: 62.45403, lng: 7.66442, osm: 'node/2396565678', match: "Trollstigen", kind: 'amenity/cafe' },
  'atlanterhavsveien': { lat: 63.00763, lng: 7.2995, osm: 'way/223182005', match: "Atlantic road", kind: 'highway/primary' },
  'dalsnibba': { lat: 62.04785, lng: 7.27131, osm: 'node/4563187298', match: "Dalsnibba", kind: 'natural/peak' },
  'stegastein': { lat: 60.90863, lng: 7.21177, osm: 'node/276585995', match: "Stegastein", kind: 'tourism/viewpoint' },
  'ornesvingen': { lat: 62.12624, lng: 7.1673, osm: 'node/6372453306', match: "Ørnesvingen", kind: 'highway/bus_stop' },
  'reine': { lat: 67.93247, lng: 13.08877, osm: 'node/249162202', match: "Reine", kind: 'place/village' },
  'henningsvaer': { lat: 68.15289, lng: 14.20072, osm: 'node/249162242', match: "Henningsvær", kind: 'place/village' },
  'a-lofoten': { lat: 67.87962, lng: 12.98404, osm: 'node/249162214', match: "Å", kind: 'place/village' },
  'svolvaer': { lat: 68.23217, lng: 14.5646, osm: 'node/31264147', match: "Svolvær", kind: 'place/town' },
  'nusfjord': { lat: 68.03541, lng: 13.3477, osm: 'node/249162199', match: "Nusfjord", kind: 'place/village' },
  'hamnoy': { lat: 67.94639, lng: 13.13762, osm: 'node/14021506316', match: "Hamnøy", kind: 'highway/bus_stop' },
  'haukland': { lat: 68.19799, lng: 13.52919, osm: 'relation/5596833', match: "Haukland Beach", kind: 'natural/beach' },
  'andenes': { lat: 69.3123, lng: 16.10571, osm: 'way/38307260', match: "Andenes", kind: 'landuse/residential' },
  'runde': { lat: 62.39844, lng: 5.63105, osm: 'relation/6383076', match: "Runde", kind: 'place/island' },
  'senja': { lat: 69.30398, lng: 17.45908, osm: 'relation/4106830', match: "Senja", kind: 'place/island' },
  'flamsbana': { lat: 60.86295, lng: 7.11318, osm: 'node/59438430', match: "Flåm", kind: 'railway/station' },
  'bergensbanen': { lat: 60.73517, lng: 7.12283, osm: 'node/5526332022', match: "Myrdal", kind: 'railway/station' },
  'raumabanen': { lat: 62.56763, lng: 7.68933, osm: 'node/8663874752', match: "2", kind: 'highway/bus_stop' },
  'polar-park': { lat: 68.69155, lng: 18.11038, osm: 'way/164080671', match: "Polar Park", kind: 'building/retail' },
  'langedrag': { lat: 60.44759, lng: 8.87788, osm: 'way/603948508', match: "Langedrag naturpark", kind: 'amenity/parking' },
  'saltstraumen': { lat: 67.23214, lng: 14.61005, osm: 'node/925351629', match: "Saltstraumen", kind: 'tourism/attraction' },
  'folkemuseum': { lat: 59.90681, lng: 10.68436, osm: 'way/134403996', match: "The Norwegian Museum of Cultural History", kind: 'tourism/museum' },
  'fram': { lat: 59.90336, lng: 10.69955, osm: 'way/128980495', match: "Fram Museum", kind: 'tourism/museum' },
  'bergen-aquarium': { lat: 60.39965, lng: 5.30374, osm: 'relation/6637426', match: "Bergen Aquarium", kind: 'tourism/aquarium' },
  'atlanterhavsparken': { lat: 62.46558, lng: 6.09603, osm: 'relation/13568581', match: "The Atlantic Ocean Park", kind: 'tourism/aquarium' },
  'polaria': { lat: 69.64368, lng: 18.9499, osm: 'way/97567917', match: "Polaria", kind: 'tourism/aquarium' },
  'glacier-museum': { lat: 61.42335, lng: 6.7634, osm: 'way/292098104', match: "The Norwegian Glacier Museum", kind: 'tourism/museum' },
  'fjellsenter': { lat: 61.83799, lng: 8.56566, osm: 'node/1396351284', match: "Norsk Fjellsenter", kind: 'tourism/museum' },
  'hunderfossen': { lat: 61.22721, lng: 10.43522, osm: 'relation/10678827', match: "Hunderfossen Familiepark", kind: 'tourism/theme_park' },
  'kongeparken': { lat: 58.77846, lng: 5.84399, osm: 'relation/6598772', match: "Kongeparken", kind: 'tourism/theme_park' },
  'tusenfryd': { lat: 59.74696, lng: 10.77544, osm: 'way/48672338', match: "Tusenfryd", kind: 'tourism/theme_park' },
  'dyreparken': { lat: 58.18597, lng: 8.14234, osm: 'way/69166520', match: "Kristiansand Dyrepark", kind: 'tourism/theme_park' },
  'nordkapp': { lat: 71.16995, lng: 25.78589, osm: 'node/33728378', match: "Capo Nord", kind: 'place/hamlet' },
  'osl': { lat: 60.19787, lng: 11.09968, osm: 'way/425295012', match: "Oslo Airport, Gardermoen", kind: 'aeroway/aerodrome' },
  'bgo': { lat: 60.29653, lng: 5.21982, osm: 'relation/6303432', match: "Bergen Airport, Flesland", kind: 'aeroway/aerodrome' },
  'aes': { lat: 62.56022, lng: 6.11343, osm: 'way/390604273', match: "Ålesund Airport, Vigra", kind: 'aeroway/aerodrome' },
  'trd': { lat: 63.45477, lng: 10.92513, osm: 'relation/10264031', match: "Trondheim Airport, Værnes", kind: 'aeroway/aerodrome' },
  'tos': { lat: 69.67979, lng: 18.90698, osm: 'node/9249660206', match: "Tromsø lufthavn", kind: 'highway/bus_stop' },
  'boo': { lat: 67.26439, lng: 14.34775, osm: 'relation/17061527', match: "Bodø Airport", kind: 'aeroway/aerodrome' },
  'eve': { lat: 68.48915, lng: 16.69119, osm: 'relation/4203400', match: "Evenes Airport", kind: 'aeroway/aerodrome' },
};
