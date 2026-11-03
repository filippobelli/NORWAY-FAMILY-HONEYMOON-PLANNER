# Graph Report - NORWAY-FAMILY-HONEYMOON-PLANNER  (2026-11-03)

## Corpus Check
- 104 files · ~189,711 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .webmanifest 1)

## Summary
- 1021 nodes · 3514 edges · 41 communities (35 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ee807553`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- budget.ts
- CoastalView.tsx
- App.tsx
- Viaggio in Norvegia 2027 project context
- package.json
- CatalogView.tsx
- cloudSync.tsx
- e2e.cjs
- configurator.ts
- PlannerView.tsx
- react-shim.d.ts
- BudgetView.tsx
- placement.ts
- osrm.ts
- compilerOptions
- domain/types.ts
- OverviewView.tsx
- destinations.ts
- ConfiguratorView.tsx
- LeafletApi
- RegionMap.tsx
- LLayer
- build-local.mjs
- tsconfig.verify.json
- planImpact.ts
- Fragment
- jsxs
- sw.js
- scenarios.ts
- itinerary.ts
- HytteView.tsx
- store.tsx
- ItineraryView.tsx
- search.ts
- MapView.tsx
- features.test.ts
- fase4-lacune.test.ts
- OfficialLink.tsx
- LMap
- defaults.ts
- useTrip

## God Nodes (most connected - your core abstractions)
1. `useTrip()` - 66 edges
2. `newId()` - 50 edges
3. `computeDays()` - 50 edges
4. `Trip` - 46 edges
5. `syncLegs()` - 43 edges
6. `createEmptyTrip()` - 38 edges
7. `formatDateIt()` - 38 edges
8. `Field()` - 38 edges
9. `Icon()` - 36 edges
10. `Shell()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `action()` --calls--> `tripOverview`  [EXTRACTED]
  tests/fase4-lacune.test.ts → src/domain/overview.ts
- `Hash routing instead of React Router` --conceptually_related_to--> `Layered architecture (src/domain, src/services, src/ui, src/state)`  [INFERRED]
  docs/STATO.md → CLAUDE.md
- `Trip configurator section` --conceptually_related_to--> `No straight-line distance as road distance`  [AMBIGUOUS]
  docs/STATO.md → CLAUDE.md
- `budgetTrip()` --calls--> `computeBudget()`  [EXTRACTED]
  tests/fase4-lacune.test.ts → src/domain/budget.ts
- `cat()` --calls--> `categoryBreakdown`  [EXTRACTED]
  tests/fase4-lacune.test.ts → src/domain/budget.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **External services isolated in src/services** — readme_osrm_routing, readme_leaflet_map, readme_overpass_search, docs_stato_supabase_rest, docs_audit_2026_10_27_nominatim_fallback [EXTRACTED 1.00]
- **Data honesty rules across the project** — docs_contesto_guiding_principle, claude_data_status_distinction, docs_stato_coastal_catalog, docs_stato_scenario_comparability, docs_stato_budget_overlaps [INFERRED 0.85]
- **Cloud save and conflict flow** — readme_supabase_cloud_save, docs_stato_supabase_rest, docs_stato_conditional_autosave, readme_conflict_handling, claude_trip_document [INFERRED 0.95]

## Communities (41 total, 6 thin omitted)

### Community 0 - "budget.ts"
Cohesion: 0.10
Nodes (30): BUDGET_CATEGORIES, budgetCompleteness, budgetOverlaps(), FUEL_UNIT, FuelCost, MONTHS, ORIGIN_TEXT, createEmptyTrip() (+22 more)

### Community 1 - "CoastalView.tsx"
Cohesion: 0.10
Nodes (37): CatalogDay, catalogFor(), CatalogPrice, COASTAL_CATALOG, CoastalCatalogVoyage, findCatalogVoyage(), COASTAL_FACTS, COASTAL_PORTS_NORTHBOUND (+29 more)

### Community 2 - "App.tsx"
Cohesion: 0.15
Nodes (28): react, react-dom, App(), readHash(), saveIcon(), saveLabel(), SECTIONS, Shell() (+20 more)

### Community 3 - "Viaggio in Norvegia 2027 project context"
Cohesion: 0.05
Nodes (50): Delivery checks (typecheck, test, lint, build), Layered architecture (src/domain, src/services, src/ui, src/state), CLAUDE.md project instructions, Trip versioned document (schemaVersion), Audit of 27 October 2026, Coordinate verification on OpenStreetMap (A-11), Daily load model and rhythm strip (Fase 3), False conflict after re-login (A-07) (+42 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (40): dependencies, react, react-dom, description, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+32 more)

### Community 5 - "CatalogView.tsx"
Cohesion: 0.16
Nodes (21): WIKI, WikiRef, cacheGet(), cacheSet(), commonsFilePage(), commonsImageUrl(), fetchImageCredit(), fetchWikiIntro() (+13 more)

### Community 6 - "cloudSync.tsx"
Cohesion: 0.06
Nodes (77): AUTO_SETTINGS, GROUPS, MergeConflict, mergeDiary(), MergeResult, mergeTrips(), pick(), PLAN_KEYS (+69 more)

### Community 7 - "e2e.cjs"
Cohesion: 0.07
Nodes (24): { chromium }, fs, http, path, srv, { chromium }, fail(), fs (+16 more)

### Community 8 - "configurator.ts"
Cohesion: 0.18
Nodes (20): airKm(), AVG_KMH, Base, ConfiguratorResult, configureItinerary(), estDriveHours(), isVisit(), nearestAirport() (+12 more)

### Community 9 - "PlannerView.tsx"
Cohesion: 0.09
Nodes (44): RFC-4122, DESTINATIONS, ORIGIN_NAME, applySuggestion(), computeDayLoads(), DayLoad, describeLoad(), distKm() (+36 more)

### Community 10 - "react-shim.d.ts"
Cohesion: 0.09
Nodes (19): Context, *.css, Dispatch, Element, ElementChildrenAttribute, Ev, ImportMeta, IntrinsicAttributes (+11 more)

### Community 11 - "BudgetView.tsx"
Cohesion: 0.18
Nodes (16): capStatus, formatEur(), formatPeriod(), fuelCostPerKm(), STATUS_LABEL, TripSettings, fmtDate(), refreshRatesNow() (+8 more)

### Community 12 - "placement.ts"
Cohesion: 0.06
Nodes (75): AIRPORT_RADIUS_KM, airportLabel(), AirportPick, DEFAULT_HOME_AIRPORTS, flightAdvice, ITALIAN_AIRPORTS, NorwayAirport, norwayAirports() (+67 more)

### Community 13 - "osrm.ts"
Cohesion: 0.18
Nodes (10): provider, createOsrmProvider(), OsrmResponse, OsrmStep, simplifyLine(), stepsToSegments(), LatLng, RouteResult (+2 more)

### Community 14 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, exactOptionalPropertyTypes, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 15 - "domain/types.ts"
Cohesion: 0.06
Nodes (80): ACTIVITY_STATE_LABEL, activityState(), actualsOf(), addDiaryEntry(), diaryOf(), editDiaryEntry(), EMPTY, newDiaryEntry() (+72 more)

### Community 16 - "OverviewView.tsx"
Cohesion: 0.18
Nodes (13): LodgingRow, NextAction, StepState, AccommodationStatus, IconName, ACC_TEXT, Clipped(), fmtLongDate() (+5 more)

### Community 17 - "destinations.ts"
Cohesion: 0.19
Nodes (11): CoordCheck, COORDS_CHECKED_AT, VERIFIED_COORDS, CATEGORY_LABEL, findDestination(), REGION_FIX, Seed, SEEDS (+3 more)

### Community 18 - "ConfiguratorView.tsx"
Cohesion: 0.15
Nodes (12): Pace, PACE_MIN_NIGHTS, TRAVEL_MODE_LABEL, TRAVEL_MODES, TravelMode, airportLabel(), AIRPORTS, AUTO_ROUTE_KEY (+4 more)

### Community 20 - "RegionMap.tsx"
Cohesion: 0.18
Nodes (13): COUNTIES, County, REGION_COUNTIES, BASE_IDS, ConfiguratorInput, Region, iconSvg(), PATHS (+5 more)

### Community 22 - "build-local.mjs"
Cohesion: 0.25
Nodes (3): env, html, root

### Community 23 - "tsconfig.verify.json"
Cohesion: 0.25
Nodes (7): ../tsconfig.json, compilerOptions, jsx, typeRoots, types, extends, include

### Community 24 - "planImpact.ts"
Cohesion: 0.17
Nodes (25): isRoutableLeg(), orphanDayKeys(), totalNights(), routeDiff, applyVersion(), BookedItem, BudgetDelta, checkIns() (+17 more)

### Community 28 - "scenarios.ts"
Cohesion: 0.15
Nodes (25): addScenario(), addScenarioWithPlan(), applyPlan(), clone(), comparability(), CompareBasis, ensureScenarios(), removeScenario() (+17 more)

### Community 29 - "itinerary.ts"
Cohesion: 0.17
Nodes (22): computeBudget(), accommodationChanges(), addDays(), computeDays(), isAutoSeg(), legSummary, legTotals, moveItem() (+14 more)

### Community 30 - "HytteView.tsx"
Cohesion: 0.21
Nodes (19): restorePlanOnly(), upsertAccommodation(), externalSearchLinks(), searchNearbyOsm(), Badge(), Empty(), fmtDateTime(), fmtMoney() (+11 more)

### Community 31 - "store.tsx"
Cohesion: 0.13
Nodes (14): CURRENT_SCHEMA, Doc, FutureSchemaError, migrateDocument(), STEPS, LocalLoadResult, saveLocalTrip(), Ctx (+6 more)

### Community 32 - "ItineraryView.tsx"
Cohesion: 0.18
Nodes (12): LegState, isAutoSegment(), mergeRouted(), TransportMode, getRoutingProvider(), MODE_LABEL, ACC_STATUS_LABEL, FIRM_STATUS (+4 more)

### Community 33 - "search.ts"
Cohesion: 0.19
Nodes (15): ExternalSearchLink, fetchWithTimeout(), haversineKm(), KIND_LABEL, NearbyPlace, NearbyResult, NearbySource, NominatimEl (+7 more)

### Community 34 - "MapView.tsx"
Cohesion: 0.20
Nodes (10): LBounds, LLayerGroup, loadLeaflet(), TILE_OPTIONS, TILE_URL, MODE_COLOR, esc(), legendModes() (+2 more)

### Community 35 - "features.test.ts"
Cohesion: 0.23
Nodes (11): scenarioKindFor(), fetchEurNok(), fetchFuelPrice(), FuelPrice, getJson(), JsonStat2, parseNorgesBank(), parseSsbFuel() (+3 more)

### Community 36 - "fase4-lacune.test.ts"
Cohesion: 0.33
Nodes (7): categoryBreakdown, acc(), action(), budgetTrip(), cat(), stop(), trip()

### Community 37 - "OfficialLink.tsx"
Cohesion: 0.38
Nodes (5): OFFICIAL_CHECKED_AT, OFFICIAL_KIND_LABEL, OFFICIAL_SITES, OfficialKind, OfficialSite

### Community 39 - "defaults.ts"
Cohesion: 0.53
Nodes (5): isNum(), normalizeTrip(), validateTripShape(), DEFAULT_ASSUMPTIONS, migrateDayKeys()

### Community 40 - "useTrip"
Cohesion: 0.60
Nodes (6): useTrip(), blankAccommodation, ItineraryView(), LegCard(), StopCard(), Inspector()

## Ambiguous Edges - Review These
- `Trip configurator section` → `No straight-line distance as road distance`  [AMBIGUOUS]
  docs/STATO.md · relation: conceptually_related_to

## Knowledge Gaps
- **26 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `tsx` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 310 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `ItineraryView.tsx`, `CoastalView.tsx`, `MapView.tsx`, `package.json`, `CatalogView.tsx`, `cloudSync.tsx`, `PlannerView.tsx`, `BudgetView.tsx`, `placement.ts`, `domain/types.ts`, `OverviewView.tsx`, `ConfiguratorView.tsx`, `RegionMap.tsx`, `planImpact.ts`, `scenarios.ts`, `HytteView.tsx`, `store.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `budget.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0966183574879227 - nodes in this community are weakly interconnected._
- **Why does `Trip` connect `budget.ts` to `ItineraryView.tsx`, `MapView.tsx`, `fase4-lacune.test.ts`, `cloudSync.tsx`, `defaults.ts`, `PlannerView.tsx`, `placement.ts`, `domain/types.ts`, `planImpact.ts`, `scenarios.ts`, `itinerary.ts`, `store.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `CoastalView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1014799154334038 - nodes in this community are weakly interconnected._
- **Why does `newId()` connect `placement.ts` to `budget.ts`, `CoastalView.tsx`, `ItineraryView.tsx`, `CatalogView.tsx`, `cloudSync.tsx`, `defaults.ts`, `configurator.ts`, `PlannerView.tsx`, `useTrip`, `BudgetView.tsx`, `osrm.ts`, `domain/types.ts`, `planImpact.ts`, `scenarios.ts`, `itinerary.ts`, `HytteView.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Trip configurator section` and `No straight-line distance as road distance`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._