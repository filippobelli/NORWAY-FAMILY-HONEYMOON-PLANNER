# Graph Report - NORWAY-FAMILY-HONEYMOON-PLANNER  (2026-11-03)

## Corpus Check
- 104 files · ~189,888 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .webmanifest 1)

## Summary
- 1022 nodes · 3518 edges · 40 communities (34 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df0496a7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- syncLegs
- CoastalView.tsx
- store.tsx
- Viaggio in Norvegia 2027 project context
- package.json
- services/wiki.ts
- offline.test.ts
- e2e.cjs
- configurator.ts
- PlannerView.tsx
- react-shim.d.ts
- RatesPanel.tsx
- placement.ts
- osrm.ts
- compilerOptions
- TravelView.tsx
- computeDays
- destinations.ts
- ConfiguratorView.tsx
- LeafletApi
- RegionMap.tsx
- LLayer
- build-local.mjs
- tsconfig.verify.json
- PlanBDialog.tsx
- Fragment
- jsxs
- sw.js
- scenarios.ts
- domain/types.ts
- HytteView.tsx
- supabase.ts
- cloudSync.tsx
- merge.ts
- MapView.tsx
- SyncTransport
- budget.ts
- placement.test.ts
- Mem
- audit.test.ts

## God Nodes (most connected - your core abstractions)
1. `useTrip()` - 66 edges
2. `newId()` - 50 edges
3. `computeDays()` - 50 edges
4. `Trip` - 46 edges
5. `syncLegs()` - 43 edges
6. `createEmptyTrip()` - 38 edges
7. `formatDateIt()` - 38 edges
8. `Field()` - 38 edges
9. `Shell()` - 36 edges
10. `Icon()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `action()` --calls--> `tripOverview`  [EXTRACTED]
  tests/fase4-lacune.test.ts → src/domain/overview.ts
- `Hash routing instead of React Router` --conceptually_related_to--> `Layered architecture (src/domain, src/services, src/ui, src/state)`  [INFERRED]
  docs/STATO.md → CLAUDE.md
- `Trip configurator section` --conceptually_related_to--> `No straight-line distance as road distance`  [AMBIGUOUS]
  docs/STATO.md → CLAUDE.md
- `regionsOf()` --calls--> `findDestination()`  [EXTRACTED]
  tests/regioni-aeroporti.test.ts → src/data/destinations.ts
- `budgetTrip()` --calls--> `computeBudget()`  [EXTRACTED]
  tests/fase4-lacune.test.ts → src/domain/budget.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **External services isolated in src/services** — readme_osrm_routing, readme_leaflet_map, readme_overpass_search, docs_stato_supabase_rest, docs_audit_2026_10_27_nominatim_fallback [EXTRACTED 1.00]
- **Data honesty rules across the project** — docs_contesto_guiding_principle, claude_data_status_distinction, docs_stato_coastal_catalog, docs_stato_scenario_comparability, docs_stato_budget_overlaps [INFERRED 0.85]
- **Cloud save and conflict flow** — readme_supabase_cloud_save, docs_stato_supabase_rest, docs_stato_conditional_autosave, readme_conflict_handling, claude_trip_document [INFERRED 0.95]

## Communities (40 total, 6 thin omitted)

### Community 0 - "syncLegs"
Cohesion: 0.14
Nodes (19): budgetOverlaps(), createEmptyTrip(), syncLegs(), Accommodation, BudgetItem, Stop, road, stop() (+11 more)

### Community 1 - "CoastalView.tsx"
Cohesion: 0.13
Nodes (27): RFC-4122, CatalogDay, catalogFor(), CatalogPrice, COASTAL_CATALOG, CoastalCatalogVoyage, findCatalogVoyage(), COASTAL_FACTS (+19 more)

### Community 2 - "store.tsx"
Cohesion: 0.13
Nodes (27): react, exportTripFile(), loadLocalTrip(), LocalLoadResult, readTripFile(), saveLocalTrip(), CloudTripRow, isConfigFromEnv() (+19 more)

### Community 3 - "Viaggio in Norvegia 2027 project context"
Cohesion: 0.05
Nodes (50): Delivery checks (typecheck, test, lint, build), Layered architecture (src/domain, src/services, src/ui, src/state), CLAUDE.md project instructions, Trip versioned document (schemaVersion), Audit of 27 October 2026, Coordinate verification on OpenStreetMap (A-11), Daily load model and rhythm strip (Fase 3), False conflict after re-login (A-07) (+42 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (42): dependencies, react, react-dom, description, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+34 more)

### Community 5 - "services/wiki.ts"
Cohesion: 0.22
Nodes (13): WIKI, WikiRef, cacheGet(), cacheSet(), commonsFilePage(), fetchImageCredit(), fetchWikiIntro(), ImageCredit (+5 more)

### Community 6 - "offline.test.ts"
Cohesion: 0.19
Nodes (28): adoptMerged(), allKeys(), baseKey(), clearSyncState(), done(), enqueue(), getLastSync(), getOwner() (+20 more)

### Community 7 - "e2e.cjs"
Cohesion: 0.07
Nodes (24): { chromium }, fs, http, path, srv, { chromium }, fail(), fs (+16 more)

### Community 8 - "configurator.ts"
Cohesion: 0.15
Nodes (23): COASTAL_PORTS_NORTHBOUND, airKm(), AIRPORT_RADIUS_KM, AVG_KMH, Base, ConfiguratorInput, configureItinerary(), estDriveHours() (+15 more)

### Community 9 - "PlannerView.tsx"
Cohesion: 0.05
Nodes (115): App(), readHash(), saveIcon(), saveLabel(), SECTIONS, Shell(), DESTINATIONS, findDestination() (+107 more)

### Community 10 - "react-shim.d.ts"
Cohesion: 0.09
Nodes (19): Context, *.css, Dispatch, Element, ElementChildrenAttribute, Ev, ImportMeta, IntrinsicAttributes (+11 more)

### Community 11 - "RatesPanel.tsx"
Cohesion: 0.15
Nodes (20): formatPeriod(), fuelCostPerKm(), CarSettings, FuelType, fetchEurNok(), fetchFuelPrice(), FuelPrice, getJson() (+12 more)

### Community 12 - "placement.ts"
Cohesion: 0.07
Nodes (71): airportLabel(), AirportPick, DEFAULT_HOME_AIRPORTS, EndpointAdvice, flightAdvice, InternalAdvice, ITALIAN_AIRPORTS, NorwayAirport (+63 more)

### Community 13 - "osrm.ts"
Cohesion: 0.13
Nodes (14): mergeRouted(), LegInfo, Leg, provider, createOsrmProvider(), OsrmResponse, OsrmStep, simplifyLine() (+6 more)

### Community 14 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, exactOptionalPropertyTypes, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 15 - "TravelView.tsx"
Cohesion: 0.07
Nodes (58): ACTIVITY_STATE_LABEL, activityState(), actualsOf(), addDiaryEntry(), diaryOf(), editDiaryEntry(), EMPTY, newDiaryEntry() (+50 more)

### Community 16 - "computeDays"
Cohesion: 0.26
Nodes (19): computeBudget(), computeDays(), isRoutableLeg(), legTotals, orphanDayKeys(), totalDays(), totalNights(), tripWarnings() (+11 more)

### Community 17 - "destinations.ts"
Cohesion: 0.15
Nodes (13): CoordCheck, COORDS_CHECKED_AT, VERIFIED_COORDS, CATEGORY_LABEL, REGION_FIX, Seed, SEEDS, OFFICIAL_CHECKED_AT (+5 more)

### Community 18 - "ConfiguratorView.tsx"
Cohesion: 0.13
Nodes (14): ConfiguratorResult, Pace, PACE_MIN_NIGHTS, scenarioKindFor(), TRAVEL_MODE_LABEL, TRAVEL_MODES, TravelMode, airportLabel() (+6 more)

### Community 20 - "RegionMap.tsx"
Cohesion: 0.23
Nodes (11): COUNTIES, County, REGION_COUNTIES, BASE_IDS, Region, iconSvg(), esc(), Props (+3 more)

### Community 22 - "build-local.mjs"
Cohesion: 0.25
Nodes (3): env, html, root

### Community 23 - "tsconfig.verify.json"
Cohesion: 0.25
Nodes (7): ../tsconfig.json, compilerOptions, jsx, typeRoots, types, extends, include

### Community 24 - "PlanBDialog.tsx"
Cohesion: 0.23
Nodes (15): applyVersion(), draftMoveStop(), draftRemoveStop(), draftSetNights(), previewVersion(), saveAlternative(), undoVersion(), ApplyVersionDialog() (+7 more)

### Community 28 - "scenarios.ts"
Cohesion: 0.20
Nodes (22): addScenario(), addScenarioWithPlan(), applyPlan(), clone(), comparability(), CompareBasis, ensureScenarios(), removeScenario() (+14 more)

### Community 29 - "domain/types.ts"
Cohesion: 0.09
Nodes (33): computeDayLoads(), distKm(), emptyPlan(), levelFor(), LoadFactor, loadFactors(), LoadLevel, midRouteCandidates() (+25 more)

### Community 30 - "HytteView.tsx"
Cohesion: 0.09
Nodes (42): restorePlanOnly(), toEur(), airKm(), decisionFor(), externalHref(), lodgingComparison(), LodgingDecision, LodgingOption (+34 more)

### Community 31 - "supabase.ts"
Cohesion: 0.30
Nodes (18): authError(), AuthResponse, call(), CloudError, getCloudTripMeta(), listCloudTrips(), loadCloudTrip(), loadSession() (+10 more)

### Community 32 - "cloudSync.tsx"
Cohesion: 0.23
Nodes (15): MergeResult, Side, CloudConfig, CloudSession, env(), getCloudConfig(), PushResult, CloudConflict (+7 more)

### Community 33 - "merge.ts"
Cohesion: 0.27
Nodes (9): AUTO_SETTINGS, GROUPS, MergeConflict, mergeDiary(), mergeTrips(), pick(), PLAN_KEYS, resolveConflicts() (+1 more)

### Community 34 - "MapView.tsx"
Cohesion: 0.13
Nodes (11): LBounds, LLayerGroup, LMap, loadLeaflet(), TILE_OPTIONS, TILE_URL, MODE_COLOR, esc() (+3 more)

### Community 35 - "SyncTransport"
Cohesion: 0.22
Nodes (3): ConditionalSaveResult, SyncTransport, Server

### Community 36 - "budget.ts"
Cohesion: 0.19
Nodes (11): BUDGET_CATEGORIES, FUEL_UNIT, FuelCost, MONTHS, ORIGIN_TEXT, TripSettings, acc(), action() (+3 more)

### Community 37 - "placement.test.ts"
Cohesion: 0.33
Nodes (4): road, route(), stop(), tripWith()

### Community 39 - "audit.test.ts"
Cohesion: 0.29
Nodes (7): isNum(), normalizeTrip(), validateTripShape(), accommodationChanges(), DEFAULT_ASSUMPTIONS, migrateDayKeys(), moveItem()

## Ambiguous Edges - Review These
- `Trip configurator section` → `No straight-line distance as road distance`  [AMBIGUOUS]
  docs/STATO.md · relation: conceptually_related_to

## Knowledge Gaps
- **26 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `tsx` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 310 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `store.tsx` to `cloudSync.tsx`, `CoastalView.tsx`, `MapView.tsx`, `package.json`, `PlannerView.tsx`, `RatesPanel.tsx`, `placement.ts`, `TravelView.tsx`, `ConfiguratorView.tsx`, `RegionMap.tsx`, `PlanBDialog.tsx`, `scenarios.ts`, `HytteView.tsx`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `syncLegs` be split into smaller, more focused modules?**
  _Cohesion score 0.13825757575757575 - nodes in this community are weakly interconnected._
- **Why does `Trip` connect `domain/types.ts` to `cloudSync.tsx`, `merge.ts`, `store.tsx`, `SyncTransport`, `budget.ts`, `MapView.tsx`, `offline.test.ts`, `audit.test.ts`, `syncLegs`, `PlannerView.tsx`, `placement.test.ts`, `placement.ts`, `TravelView.tsx`, `computeDays`, `PlanBDialog.tsx`, `scenarios.ts`, `HytteView.tsx`, `supabase.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `CoastalView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1253968253968254 - nodes in this community are weakly interconnected._
- **Should `store.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Trip configurator section` and `No straight-line distance as road distance`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._