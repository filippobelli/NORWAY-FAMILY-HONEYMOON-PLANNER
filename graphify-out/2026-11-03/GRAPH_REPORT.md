# Graph Report - NORWAY-FAMILY-HONEYMOON-PLANNER  (2026-11-03)

## Corpus Check
- 91 files · ~163,388 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 752 nodes · 2195 edges · 27 communities (22 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.86)
- Token cost: 112,713 input · 0 output

## Community Hubs (Navigation)
- Budget e test di dominio
- Catalogo crociere costiere
- Interfaccia e schede app
- Documenti e regole progetto
- Dipendenze e pacchetto
- Destinazioni e coordinate
- Cloud Supabase e accesso
- Script di verifica browser
- Configuratore di itinerario
- Carico delle giornate
- Tipi React locali
- Regioni e contee
- Tipi del viaggio
- Calcolo percorsi OSRM
- Configurazione TypeScript
- Tappe e fusione percorsi
- Ricerca luoghi vicini
- Vista configuratore
- Mappa e trasporti
- Tipi del budget
- API Leaflet
- Livelli della mappa
- Build locale
- TypeScript per verifiche
- Controlli vista mappa
- JSX Fragment
- JSX jsxs

## God Nodes (most connected - your core abstractions)
1. `useTrip()` - 38 edges
2. `newId()` - 33 edges
3. `computeDays()` - 30 edges
4. `createEmptyTrip()` - 27 edges
5. `Trip` - 27 edges
6. `syncLegs()` - 26 edges
7. `Badge()` - 26 edges
8. `computeBudget()` - 25 edges
9. `Field()` - 23 edges
10. `Shell()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Trip configurator section` --conceptually_related_to--> `No straight-line distance as road distance`  [AMBIGUOUS]
  docs/STATO.md → CLAUDE.md
- `Hash routing instead of React Router` --conceptually_related_to--> `Layered architecture (src/domain, src/services, src/ui, src/state)`  [INFERRED]
  docs/STATO.md → CLAUDE.md
- `cat()` --calls--> `categoryBreakdown`  [EXTRACTED]
  tests/fase4-lacune.test.ts → src/domain/budget.ts
- `action()` --calls--> `tripOverview`  [EXTRACTED]
  tests/fase4-lacune.test.ts → src/domain/overview.ts
- `Guiding principle: a tool for real decisions, not a demo` --rationale_for--> `Data status distinction (confermato, stimato, da verificare, prenotato, pagato)`  [INFERRED]
  docs/CONTESTO.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Data honesty rules across the project** — docs_contesto_guiding_principle, claude_data_status_distinction, docs_stato_coastal_catalog, docs_stato_scenario_comparability, docs_stato_budget_overlaps [INFERRED 0.85]
- **Cloud save and conflict flow** — readme_supabase_cloud_save, docs_stato_supabase_rest, docs_stato_conditional_autosave, readme_conflict_handling, claude_trip_document [INFERRED 0.95]
- **External services isolated in src/services** — readme_osrm_routing, readme_leaflet_map, readme_overpass_search, docs_stato_supabase_rest, docs_audit_2026_10_27_nominatim_fallback [EXTRACTED 1.00]

## Communities (27 total, 5 thin omitted)

### Community 0 - "Budget e test di dominio"
Cohesion: 0.05
Nodes (98): BUDGET_CATEGORIES, budgetCompleteness, budgetOverlaps(), capStatus, computeBudget(), formatPeriod(), FUEL_UNIT, FuelCost (+90 more)

### Community 1 - "Catalogo crociere costiere"
Cohesion: 0.07
Nodes (77): RFC-4122, CatalogDay, catalogFor(), CatalogPrice, COASTAL_CATALOG, CoastalCatalogVoyage, findCatalogVoyage(), COASTAL_FACTS (+69 more)

### Community 2 - "Interfaccia e schede app"
Cohesion: 0.07
Nodes (56): react-dom, App(), readHash(), saveLabel(), Shell(), TabId, TABS, NextAction (+48 more)

### Community 3 - "Documenti e regole progetto"
Cohesion: 0.05
Nodes (50): Delivery checks (typecheck, test, lint, build), Layered architecture (src/domain, src/services, src/ui, src/state), CLAUDE.md project instructions, Trip versioned document (schemaVersion), Audit of 27 October 2026, Coordinate verification on OpenStreetMap (A-11), Daily load model and rhythm strip (Fase 3), False conflict after re-login (A-07) (+42 more)

### Community 4 - "Dipendenze e pacchetto"
Cohesion: 0.05
Nodes (40): dependencies, react, react-dom, description, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+32 more)

### Community 5 - "Destinazioni e coordinate"
Cohesion: 0.08
Nodes (35): CoordCheck, COORDS_CHECKED_AT, VERIFIED_COORDS, CATEGORY_LABEL, DESTINATIONS, REGION_FIX, Seed, SEEDS (+27 more)

### Community 6 - "Cloud Supabase e accesso"
Cohesion: 0.15
Nodes (34): authError(), AuthResponse, call(), CloudConfig, CloudError, CloudSession, CloudTripRow, ConditionalSaveResult (+26 more)

### Community 7 - "Script di verifica browser"
Cohesion: 0.07
Nodes (24): { chromium }, fs, http, path, srv, { chromium }, fail(), fs (+16 more)

### Community 8 - "Configuratore di itinerario"
Cohesion: 0.16
Nodes (22): findDestination(), airKm(), AVG_KMH, BASE_IDS, ConfiguratorResult, configureItinerary(), estDriveHours(), isVisit() (+14 more)

### Community 9 - "Carico delle giornate"
Cohesion: 0.18
Nodes (21): applySuggestion(), computeDayLoads(), DayLoad, describeLoad(), distKm(), emptyPlan(), levelFor(), LoadFactor (+13 more)

### Community 10 - "Tipi React locali"
Cohesion: 0.09
Nodes (19): Context, *.css, Dispatch, Element, ElementChildrenAttribute, Ev, ImportMeta, IntrinsicAttributes (+11 more)

### Community 11 - "Regioni e contee"
Cohesion: 0.14
Nodes (15): COUNTIES, County, REGION_COUNTIES, ConfiguratorInput, Region, LBounds, LLayerGroup, loadLeaflet() (+7 more)

### Community 12 - "Tipi del viaggio"
Cohesion: 0.14
Nodes (16): STATUS_LABEL, LodgingRow, AccommodationStatus, BudgetEstimates, BudgetItem, CarSettings, Flight, FlightDirection (+8 more)

### Community 13 - "Calcolo percorsi OSRM"
Cohesion: 0.16
Nodes (11): getRoutingProvider(), provider, createOsrmProvider(), OsrmResponse, OsrmStep, simplifyLine(), stepsToSegments(), LatLng (+3 more)

### Community 14 - "Configurazione TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, exactOptionalPropertyTypes, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 15 - "Tappe e fusione percorsi"
Cohesion: 0.18
Nodes (13): COASTAL_PORTS_NORTHBOUND, DayInfo, LegState, uncalculatedSegment(), isAutoSegment(), mergeRouted(), Leg, MODE_ICON (+5 more)

### Community 16 - "Ricerca luoghi vicini"
Cohesion: 0.19
Nodes (15): ExternalSearchLink, fetchWithTimeout(), haversineKm(), KIND_LABEL, NearbyPlace, NearbyResult, NearbySource, NominatimEl (+7 more)

### Community 17 - "Vista configuratore"
Cohesion: 0.16
Nodes (14): Pace, PACE_MIN_NIGHTS, scenarioKindFor(), TRAVEL_MODE_LABEL, TRAVEL_MODES, TravelMode, airportLabel(), AIRPORTS (+6 more)

### Community 18 - "Mappa e trasporti"
Cohesion: 0.33
Nodes (8): react, TransportMode, MODE_COLOR, MODE_LABEL, esc(), legendModes(), MapView(), Props

### Community 19 - "Tipi del budget"
Cohesion: 0.22
Nodes (10): BudgetLine, BudgetOverlap, BudgetSummary, categoryBreakdown, LodgingOption, BudgetCategory, Currency, DataStatus (+2 more)

### Community 22 - "Build locale"
Cohesion: 0.25
Nodes (3): env, html, root

### Community 23 - "TypeScript per verifiche"
Cohesion: 0.25
Nodes (7): ../tsconfig.json, compilerOptions, jsx, typeRoots, types, extends, include

## Ambiguous Edges - Review These
- `No straight-line distance as road distance` → `Trip configurator section`  [AMBIGUOUS]
  docs/STATO.md · relation: conceptually_related_to

## Knowledge Gaps
- **26 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `tsx` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 262 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Mappa e trasporti` to `Budget e test di dominio`, `Catalogo crociere costiere`, `Interfaccia e schede app`, `Dipendenze e pacchetto`, `Destinazioni e coordinate`, `Cloud Supabase e accesso`, `Carico delle giornate`, `Regioni e contee`, `Tipi del viaggio`, `Tappe e fusione percorsi`, `Vista configuratore`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Budget e test di dominio` be split into smaller, more focused modules?**
  _Cohesion score 0.0542432195975503 - nodes in this community are weakly interconnected._
- **Why does `LeafletApi` connect `API Leaflet` to `Mappa e trasporti`, `Regioni e contee`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `Catalogo crociere costiere` be split into smaller, more focused modules?**
  _Cohesion score 0.06566791510611736 - nodes in this community are weakly interconnected._
- **Should `Interfaccia e schede app` be split into smaller, more focused modules?**
  _Cohesion score 0.06586538461538462 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `No straight-line distance as road distance` and `Trip configurator section`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._