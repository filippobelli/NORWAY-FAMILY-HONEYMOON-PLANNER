# Graph Report - NORWAY-FAMILY-HONEYMOON-PLANNER  (2026-11-03)

## Corpus Check
- 103 files · ~188,142 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .webmanifest 1)

## Summary
- 1010 nodes · 3439 edges · 28 communities (23 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0ed8a810`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- itinerary.ts
- CoastalView.tsx
- useTrip
- Viaggio in Norvegia 2027 project context
- package.json
- CatalogView.tsx
- cloudSync.tsx
- e2e.cjs
- configurator.ts
- ItineraryView.tsx
- react-shim.d.ts
- domain/types.ts
- PlannerView.tsx
- osrm.ts
- compilerOptions
- TravelView.tsx
- overview.ts
- destinations.ts
- ConfiguratorView.tsx
- LeafletApi
- RegionMap.tsx
- LLayer
- build-local.mjs
- tsconfig.verify.json
- RatesPanel
- Fragment
- jsxs
- sw.js

## God Nodes (most connected - your core abstractions)
1. `useTrip()` - 66 edges
2. `newId()` - 50 edges
3. `computeDays()` - 50 edges
4. `Trip` - 46 edges
5. `syncLegs()` - 43 edges
6. `createEmptyTrip()` - 38 edges
7. `formatDateIt()` - 38 edges
8. `Field()` - 38 edges
9. `computeBudget()` - 34 edges
10. `Stop` - 34 edges

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

## Communities (28 total, 5 thin omitted)

### Community 0 - "itinerary.ts"
Cohesion: 0.06
Nodes (97): computeBudget(), createEmptyTrip(), isNum(), normalizeTrip(), validateTripShape(), flightAdvice, accommodationChanges(), addDays() (+89 more)

### Community 1 - "CoastalView.tsx"
Cohesion: 0.12
Nodes (28): RFC-4122, CatalogDay, catalogFor(), CatalogPrice, COASTAL_CATALOG, CoastalCatalogVoyage, findCatalogVoyage(), COASTAL_FACTS (+20 more)

### Community 2 - "useTrip"
Cohesion: 0.07
Nodes (48): react-dom, App(), readHash(), saveLabel(), SECTIONS, Shell(), el, fetchEurNok() (+40 more)

### Community 3 - "Viaggio in Norvegia 2027 project context"
Cohesion: 0.05
Nodes (50): Delivery checks (typecheck, test, lint, build), Layered architecture (src/domain, src/services, src/ui, src/state), CLAUDE.md project instructions, Trip versioned document (schemaVersion), Audit of 27 October 2026, Coordinate verification on OpenStreetMap (A-11), Daily load model and rhythm strip (Fase 3), False conflict after re-login (A-07) (+42 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (40): dependencies, react, react-dom, description, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+32 more)

### Community 5 - "CatalogView.tsx"
Cohesion: 0.17
Nodes (19): CATEGORY_LABEL, WIKI, WikiRef, cacheGet(), cacheSet(), commonsFilePage(), commonsImageUrl(), fetchImageCredit() (+11 more)

### Community 6 - "cloudSync.tsx"
Cohesion: 0.05
Nodes (87): AUTO_SETTINGS, GROUPS, MergeConflict, mergeDiary(), MergeResult, mergeTrips(), pick(), PLAN_KEYS (+79 more)

### Community 7 - "e2e.cjs"
Cohesion: 0.07
Nodes (24): { chromium }, fs, http, path, srv, { chromium }, fail(), fs (+16 more)

### Community 8 - "configurator.ts"
Cohesion: 0.15
Nodes (23): COASTAL_PORTS_NORTHBOUND, airKm(), AVG_KMH, ConfiguratorInput, ConfiguratorResult, configureItinerary(), estDriveHours(), isVisit() (+15 more)

### Community 9 - "ItineraryView.tsx"
Cohesion: 0.06
Nodes (88): react, applySuggestion(), computeDayLoads(), DayLoad, describeLoad(), distKm(), emptyPlan(), levelFor() (+80 more)

### Community 10 - "react-shim.d.ts"
Cohesion: 0.09
Nodes (19): Context, *.css, Dispatch, Element, ElementChildrenAttribute, Ev, ImportMeta, IntrinsicAttributes (+11 more)

### Community 11 - "domain/types.ts"
Cohesion: 0.08
Nodes (47): BUDGET_CATEGORIES, budgetCompleteness, BudgetLine, BudgetOverlap, budgetOverlaps(), BudgetSummary, capStatus, categoryBreakdown (+39 more)

### Community 12 - "PlannerView.tsx"
Cohesion: 0.05
Nodes (91): findDestination(), restorePlanOnly(), AIRPORT_RADIUS_KM, airportLabel(), AirportPick, DEFAULT_HOME_AIRPORTS, EndpointAdvice, InternalAdvice (+83 more)

### Community 13 - "osrm.ts"
Cohesion: 0.18
Nodes (10): provider, createOsrmProvider(), OsrmResponse, OsrmStep, simplifyLine(), stepsToSegments(), LatLng, RouteResult (+2 more)

### Community 14 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, exactOptionalPropertyTypes, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 15 - "TravelView.tsx"
Cohesion: 0.09
Nodes (47): ACTIVITY_STATE_LABEL, activityState(), actualsOf(), addDiaryEntry(), diaryOf(), editDiaryEntry(), EMPTY, newDiaryEntry() (+39 more)

### Community 16 - "overview.ts"
Cohesion: 0.12
Nodes (21): TRIP_MAX_DAYS, TRIP_MIN_DAYS, CrossingRef, DEPENDS_ON, FIRM, HeavyDay, LegRef, LodgingRow (+13 more)

### Community 17 - "destinations.ts"
Cohesion: 0.13
Nodes (15): CoordCheck, COORDS_CHECKED_AT, VERIFIED_COORDS, DESTINATIONS, REGION_FIX, Seed, SEEDS, OFFICIAL_CHECKED_AT (+7 more)

### Community 18 - "ConfiguratorView.tsx"
Cohesion: 0.16
Nodes (14): Pace, PACE_MIN_NIGHTS, scenarioKindFor(), TRAVEL_MODE_LABEL, TRAVEL_MODES, TravelMode, airportLabel(), AIRPORTS (+6 more)

### Community 20 - "RegionMap.tsx"
Cohesion: 0.10
Nodes (16): COUNTIES, County, REGION_COUNTIES, BASE_IDS, Region, LBounds, LLayerGroup, LMap (+8 more)

### Community 22 - "build-local.mjs"
Cohesion: 0.25
Nodes (3): env, html, root

### Community 23 - "tsconfig.verify.json"
Cohesion: 0.25
Nodes (7): ../tsconfig.json, compilerOptions, jsx, typeRoots, types, extends, include

### Community 24 - "RatesPanel"
Cohesion: 1.00
Nodes (3): formatPeriod(), fuelCostPerKm(), RatesPanel()

## Ambiguous Edges - Review These
- `Trip configurator section` → `No straight-line distance as road distance`  [AMBIGUOUS]
  docs/STATO.md · relation: conceptually_related_to

## Knowledge Gaps
- **26 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `tsx` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 306 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `ItineraryView.tsx` to `itinerary.ts`, `CoastalView.tsx`, `useTrip`, `package.json`, `CatalogView.tsx`, `cloudSync.tsx`, `domain/types.ts`, `PlannerView.tsx`, `TravelView.tsx`, `overview.ts`, `ConfiguratorView.tsx`, `RegionMap.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `itinerary.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05586398334489938 - nodes in this community are weakly interconnected._
- **Why does `Trip` connect `itinerary.ts` to `useTrip`, `cloudSync.tsx`, `ItineraryView.tsx`, `domain/types.ts`, `PlannerView.tsx`, `TravelView.tsx`, `overview.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `CoastalView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12312312312312312 - nodes in this community are weakly interconnected._
- **Should `useTrip` be split into smaller, more focused modules?**
  _Cohesion score 0.07077922077922078 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Trip configurator section` and `No straight-line distance as road distance`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._