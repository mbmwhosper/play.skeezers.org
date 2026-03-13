# B3 Read-Only Plan: Background Placement Symmetry

Scope: implement B3 only from `docs/planning/BUILDING_GEN_FIX_SLICES.md` after B1+B2.

Primary references read:
- `AGENTS.md`
- `SCHEMATICS.md`
- `docs/planning/BUILDING_GEN_FIX_SLICES.md`
- `docs/history/read-only/B0_READONLY.md`
- `docs/history/metrics/BASELINE_GENERATION_METRICS.md`
- `docs/history/read-only/B1_B2_READONLY.md`

## Exact Functions / Signatures To Touch

Game-file edits (B3 core):

- `teabag-simulator.html:1662` `function generateCity(leftBound, rightBound)`
  - BG right loop (`bgGenRight`)
  - BG left loop (`bgGenLeft`)

Helpers/config expected to be reused (no signature change):

- `teabag-simulator.html:1563` `function sampleCityGap(zoneId, layer)`
- `teabag-simulator.html:1570` `function advanceCityCursor(cursor, dir, width, zoneId, layer)`
- `teabag-simulator.html:1532` `const CITY_GAP_PROFILE`

Validation helper scope (non-game file, optional update if needed for parity):

- `scripts/city-gen-metrics-baseline.js` to mirror current generation logic for before/after comparison.

No call-site signature changes are planned.

## Exact Caller / Callee Map

Generation call path (must remain unchanged):

- `startGame(gameCtx)` (`teabag-simulator.html:2865`) -> `generateCity(...)`
- `triggerPrestige(gameCtx)` (`teabag-simulator.html:2914`) -> `generateCity(...)`
- `updateWorldState(gameCtx, dt, p)` (`teabag-simulator.html:3434`) -> `generateCity(...)`

Inside `generateCity(...)`:

- `getZoneAtX(...)` (`teabag-simulator.html:630`)
- `genBuilding(...)` (`teabag-simulator.html:1575`)
- `pickZoneProp(...)` / `createProp(...)` for FG props only (`teabag-simulator.html:1624`, `teabag-simulator.html:1634`)
- `advanceCityCursor(...)` (`teabag-simulator.html:1570`) for stride calculation

BG cursor state variables:

- `bgGenRight`, `bgGenLeft` (`teabag-simulator.html:1527-1528`)

## In-Scope vs Out-of-Scope

| Area | In Scope (B3) | Out of Scope |
| --- | --- | --- |
| BG stepping | Make BG right/left width-aware and symmetric using generated `b.w` + gap helper | Any FG generation rewrite |
| BG randomness | Preserve sampled, zone-aware gap randomness (no fixed spacing) | Converting skyline to deterministic grid/tiling |
| Generation flow | Keep existing generation trigger points and order | Startup/update/prestige call-path rewiring |
| Zone behavior | Keep zone lookup and style selection unchanged | Zone layout/progression/blending changes |
| Props | None (BG loops only) | Prop footprint/spacing rewrite (B4) |
| Tuning | Only if necessary to keep BG overlap sane with existing helper | Gameplay/system tuning changes unrelated to BG generation |

## Invariants To Preserve

1. Render order/parallax remains unchanged (`BG @ 0.3`, `FG @ 0.7` draw sequence preserved).
2. Generation still streams in both directions.
3. `startGame`, `triggerPrestige`, and `updateWorldState` continue calling `generateCity` exactly as now.
4. `getZoneAtX` use and BG style selection via `genBuilding(..., 'bg', zone)` stay intact.
5. Skyline remains varied and non-uniform.
6. No FG or prop behavior changes in this slice.

## BG-Specific Regression Risks

1. Left-anchor mismatch:
- If BG left placement does not mirror right semantics (`b.x` anchoring), spacing can jump or collapse near seam regions.

2. Over-regular skyline:
- If stepping unintentionally becomes too narrow-band, BG can look tiled/robotic.

3. Random-consumption drift in harness:
- If metrics harness does not mirror current random draw order, before/after numbers can be misleading.

4. Cross-layer coupling:
- Accidentally changing FG logic while touching shared helpers would violate slice boundaries.

## Acceptance Checks and Expected Metric Deltas

Required checks:

1. BG loops in `generateCity` use generated width `b.w` and `advanceCityCursor(..., 'bg')` for both right and left.
2. BG right/left loop structure is symmetric (same strategy, mirrored direction).
3. No changes to generation call sites (`startGame`, `triggerPrestige`, `updateWorldState`).
4. Syntax check passes (`node --check` on extracted inline JS).
5. Metrics command runs:
- `node scripts/city-gen-metrics-baseline.js --seeds 20 --seed-start 1 --span 120000`
6. Report before/after BG overlap and right-minus-left deltas by zone.
7. Gameplay flow and visual skyline sanity status are reported when runtime validation is available.

Expected delta direction (from baseline in `docs/history/metrics/BASELINE_GENERATION_METRICS.md`):

- BG right overlap should drop sharply from ~49-51% toward low single digits.
- BG left overlap may increase modestly from ~1.5% toward right-side range as symmetry is restored.
- Overall BG overlap should move materially downward and right-vs-left delta should collapse from ~48-49 percentage points to near zero or low single digits.
