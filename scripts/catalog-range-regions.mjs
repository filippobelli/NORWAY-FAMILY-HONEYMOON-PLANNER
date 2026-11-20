// Raggruppamenti editoriali di suddivisioni nominate nelle catene P131.
// Si usano soltanto corrispondenze esatte: nessun confine dedotto dalle coordinate.
const groups = {
  DE: [
    ['Berlin', 'Brandenburg'], ['Hamburg', 'Schleswig-Holstein', 'Lower Saxony', 'Bremen', 'Mecklenburg-Western Pomerania'],
    ['North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Hesse'], ['Bavaria'], ['Baden-Württemberg'], ['Saxony', 'Thuringia'],
  ],
  FR: [
    ['Île-de-France'], ['Normandy', 'Brittany'], ['Pays de la Loire', 'Centre-Val de Loire'], ['Grand Est'], ['Auvergne-Rhône-Alpes'],
    ["Provence-Alpes-Côte d'Azur"], ['Nouvelle-Aquitaine', 'Occitania', 'Occitanie'], ['Hauts-de-France'], ['Bourgogne-Franche-Comté'], ['Corsica', 'Haute-Corse', 'Corse-du-Sud'],
  ],
  JP: [
    ['Tokyo', 'Tokyo Metropolis', 'Kanagawa Prefecture', 'Chiba Prefecture', 'Saitama Prefecture', 'Ibaraki Prefecture', 'Tochigi Prefecture', 'Gunma Prefecture'],
    ['Kyoto Prefecture', 'Osaka Prefecture', 'Hyōgo Prefecture', 'Shiga Prefecture', 'Nara Prefecture', 'Wakayama Prefecture', 'Mie Prefecture'],
    ['Aichi Prefecture', 'Fukui Prefecture', 'Gifu Prefecture', 'Ishikawa Prefecture', 'Nagano Prefecture', 'Niigata Prefecture', 'Shizuoka Prefecture', 'Toyama Prefecture', 'Yamanashi Prefecture'],
    ['Hokkaido', 'Hokkaidō'], ['Akita Prefecture', 'Aomori Prefecture', 'Fukushima Prefecture', 'Iwate Prefecture', 'Miyagi Prefecture', 'Yamagata Prefecture'],
    ['Ehime Prefecture', 'Hiroshima Prefecture', 'Kagawa Prefecture', 'Kōchi Prefecture', 'Okayama Prefecture', 'Shimane Prefecture', 'Tokushima Prefecture', 'Tottori Prefecture', 'Yamaguchi Prefecture'],
    ['Fukuoka Prefecture', 'Kagoshima Prefecture', 'Kumamoto Prefecture', 'Miyazaki Prefecture', 'Nagasaki Prefecture', 'Ōita Prefecture', 'Okinawa Prefecture', 'Saga Prefecture'],
  ],
  NL: [['North Holland'], ['South Holland'], ['Utrecht'], ['North Brabant', 'Limburg'], ['Friesland', 'Groningen', 'Drenthe'], ['Gelderland', 'Overijssel'], ['Zeeland', 'Flevoland']],
  DK: [['Zealand', 'Region Zealand'], ['Funen'], ['Central Denmark Region', 'Region of Southern Denmark'], ['North Denmark Region'], ['Bornholm']],
  SE: [
    ['Stockholm County', 'Uppsala County', 'Södermanland County', 'Västmanland County', 'Örebro County'],
    ['Västra Götaland County', 'Halland County'], ['Skåne County', 'Blekinge County'], ['Kronoberg County', 'Kalmar County', 'Jönköping County', 'Öland'],
    ['Gotland County', 'Gotland'], ['Dalarna County', 'Gävleborg County', 'Jämtland County'], ['Norrbotten County'], ['Västerbotten County', 'Västernorrland County'],
  ],
  SI: [['Central Slovenia Statistical Region'], ['Upper Carniola Statistical Region'], ['Coastal–Karst Statistical Region', 'Littoral–Inner Carniola Statistical Region', 'Gorizia Statistical Region'], ['Drava Statistical Region', 'Savinja Statistical Region', 'Carinthia Statistical Region'], ['Southeast Slovenia Statistical Region', 'Lower Sava Statistical Region'], ['Mura Statistical Region']],
  AT: [['Vienna', 'Lower Austria'], ['Salzburg', 'Salzburg state'], ['Tyrol'], ['Vorarlberg'], ['Carinthia'], ['Styria'], ['Upper Austria'], ['Burgenland']],
  ES: [
    ['Community of Madrid', 'Castilla-La Mancha'], ['Catalonia'], ['Andalusia'], ['Valencian Community', 'Region of Murcia'], ['Basque Country', 'Navarre', 'La Rioja'],
    ['Galicia', 'Asturias', 'Cantabria'], ['Castile and León', 'Extremadura'], ['Aragon'], ['Balearic Islands'], ['Canary Islands'],
  ],
  PT: [
    ['Lisbon District', 'Setúbal District'], ['Porto District', 'Braga District', 'Viana do Castelo District', 'Vila Real District', 'Bragança District'],
    ['Aveiro District', 'Coimbra District', 'Viseu District', 'Guarda District', 'Castelo Branco District', 'Leiria District'], ['Évora District', 'Beja District', 'Portalegre District', 'Alentejo'],
    ['Faro District', 'Algarve'], ['Madeira'], ['Azores'],
  ],
  HR: [
    ['Zagreb', 'Zagreb County', 'Karlovac County', 'Krapina-Zagorje County', 'Varaždin County', 'Međimurje County', 'Sisak-Moslavina County', 'Koprivnica-Križevci County', 'Bjelovar-Bilogora County'],
    ['Istria County'], ['Primorje-Gorski Kotar County'], ['Zadar County', 'Šibenik-Knin County'], ['Split-Dalmatia County'], ['Dubrovnik-Neretva County'],
    ['Osijek-Baranja County', 'Vukovar-Syrmia County', 'Brod-Posavina County', 'Požega-Slavonia County', 'Virovitica-Podravina County'],
  ],
  GR: [['Attica'], ['Peloponnese'], ['Central Greece', 'Thessaly'], ['Central Macedonia', 'Eastern Macedonia and Thrace', 'Western Macedonia', 'Epirus'], ['Ionian Islands'], ['Cyclades', 'Sporades'], ['Crete'], ['Dodecanese', 'North Aegean']],
  TR: [
    ['Istanbul Province', 'Edirne Province', 'Kırklareli Province', 'Tekirdağ Province', 'Kocaeli Province', 'Sakarya Province', 'Yalova Province', 'Bursa Province', 'Bilecik Province', 'Balıkesir Province', 'Çanakkale Province'],
    ['İzmir Province', 'Aydın Province', 'Muğla Province', 'Manisa Province', 'Denizli Province', 'Uşak Province', 'Afyonkarahisar Province', 'Kütahya Province'],
    ['Antalya Province', 'Mersin Province', 'Adana Province', 'Hatay Province', 'Burdur Province', 'Isparta Province', 'Osmaniye Province'],
    ['Ankara Province', 'Konya Province', 'Nevşehir Province', 'Kayseri Province', 'Aksaray Province', 'Niğde Province', 'Kırşehir Province', 'Yozgat Province', 'Kırıkkale Province', 'Eskişehir Province', 'Karaman Province', 'Sivas Province'],
    ['Trabzon Province', 'Rize Province', 'Artvin Province', 'Giresun Province', 'Ordu Province', 'Samsun Province', 'Sinop Province', 'Kastamonu Province', 'Bartın Province', 'Karabük Province', 'Zonguldak Province', 'Bolu Province', 'Düzce Province', 'Amasya Province', 'Tokat Province', 'Çorum Province', 'Gümüşhane Province', 'Bayburt Province'],
    ['Van Province', 'Erzurum Province', 'Kars Province', 'Erzincan Province', 'Ağrı Province', 'Iğdır Province', 'Diyarbakır Province', 'Mardin Province', 'Şanlıurfa Province', 'Gaziantep Province', 'Adıyaman Province', 'Malatya Province', 'Elazığ Province', 'Batman Province', 'Bitlis Province', 'Bingöl Province', 'Tunceli Province', 'Siirt Province', 'Şırnak Province', 'Hakkâri Province', 'Muş Province'],
  ],
  IS: [['Capital Region', 'Southern Peninsula'], ['Southern Region'], ['Western Region'], ['Westfjords'], ['Northwestern Region', 'Northeastern Region'], ['Eastern Region']],
  FI: [['Uusimaa'], ['Southwest Finland', 'Åland', 'Satakunta'], ['Pirkanmaa', 'Tavastia Proper', 'Päijät-Häme', 'Central Finland'], ['North Savo', 'South Savo', 'North Karelia', 'South Karelia'], ['Ostrobothnia', 'South Ostrobothnia', 'Central Ostrobothnia', 'North Ostrobothnia', 'Kainuu'], ['Lapland']],
  IE: [
    ['County Dublin', 'County Wicklow', 'Dublin'], ['County Cork', 'County Waterford', 'County Wexford', 'County Kilkenny', 'County Carlow', 'County Tipperary'], ['County Kerry', 'County Limerick'],
    ['County Clare', 'County Galway'], ['County Mayo', 'County Sligo', 'County Donegal', 'County Leitrim'], ['County Kildare', 'County Meath', 'County Louth', 'County Offaly', 'County Laois', 'County Westmeath', 'County Longford', 'County Roscommon', 'County Cavan', 'County Monaghan'],
  ],
  KH: [
    ['Phnom Penh', 'Kandal Province', 'Kampong Speu Province', 'Takeo Province', 'Prey Veng Province', 'Svay Rieng Province'],
    ['Siem Reap Province', 'Kampong Thom Province', 'Oddar Meanchey Province'], ['Battambang Province', 'Banteay Meanchey Province', 'Pailin Province', 'Pursat Province', 'Kampong Chhnang Province'],
    ['Kampot Province', 'Kep Province', 'Preah Sihanouk Province', 'Sihanoukville Province', 'Koh Kong Province'], ['Stung Treng Province', 'Ratanakiri Province', 'Mondulkiri Province', 'Kratié Province', 'Kampong Cham Province', 'Tboung Khmum Province', 'Preah Vihear Province'],
  ],
};
const norm = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export function regionFromAncestry(code, ancestors, entities, regions) {
  const mapping = groups[code]; if (!mapping) return undefined;
  const byName = new Map(mapping.flatMap((names, index) => names.map((n) => [norm(n), index])));
  const matches = ancestors.flatMap((qid) => {
    const label = entities[qid]?.labels?.en?.value;
    const index = label ? byName.get(norm(label)) : undefined;
    return index !== undefined && regions[index] ? [{ qid, label, region: regions[index] }] : [];
  });
  // Non scegliere arbitrariamente tra zone diverse (parchi estesi e relazioni storiche).
  if (new Set(matches.map((m) => m.region)).size !== 1) return undefined;
  return matches[0];
}
