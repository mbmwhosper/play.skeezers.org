# B1+B2 Read-Only Plan: Width-Aware Gap Config + Foreground Symmetry

Scope: implement B1+B2 only from `docs/planning/BUILDING_GEN_FIX_SLICES.md`.

Baseline references used for acceptance:
- `docs/history/read-only/B0_READONLY.md`
- `docs/history/metrics/BASELINE_GENERATION_METRICS.md`

## Exact Functions/Signatures To Touch

Primary game-file targets:
- `teabag-simulator.html`:
  - `const TUNING = Object.freeze(...)` neighborhood (config adjacency only)
  - `function generateCity(leftBound, rightBound)`

New helper additions (city generation section):
- `const CITY_GAP_PROFILE = Object.freeze(...)` (zone-aware FG/BG gap ranges)
- `function sampleCityGap(zoneId, layer)` -> `number`
- `function advanceCityCursor(cursor, dir, width, zoneId, layer)` -> `number`

No signature changes for existing functions.

## Caller/Callee Map (Affected)

Callers of `generateCity(leftBound, rightBound)` (unchanged):
- `startGame(gameCtx)` -> bootstrap generation
- `triggerPrestige(gameCtx)` -> rebuild generation
- `updateWorldState(gameCtx, dt, p)` -> streaming generation

Generation internal callees (unchanged usage intent):
- `getZoneAtX(...)`
- `genBuilding(...)`
- `pickZoneProp(...)`
- `createProp(...)`

New helper call graph:
- `generateCity(...)` -> `advanceCityCursor(...)`
- `advanceCityCursor(...)` -> `sampleCityGap(...)`

## In-Scope vs Out-of-Scope

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| FG spacing | Width-aware cursor updates using `generatedWidth + sampledGap` for both directions | Any deterministic/fixed spacing pattern |
| FG symmetry | Right/left loops use equivalent logic shape and actual generated widths | Changes to zone selection, style randomization, prop randomization rules |
| Gap config | Centralized, zone-aware FG/BG config in constants area | Any deep tuning outside city generation |
| BG loops | Config/helper can support BG | No BG loop stepping rewrite in this slice (B3) |
| Props | Keep current behavior and spawn rolls | Prop footprint slotting/clump guards (B4) |
| Runtime flow | Keep generation entry points, render order, and pacing unchanged | Start/update/prestige flow changes |

## Invariants To Preserve

1. Gameplay behavior and render order remain unchanged.
2. Generation call sites/timing remain in existing startup, prestige, and world-streaming paths.
3. Randomness is preserved (sampled ranges/chances, no deterministic tiling).
4. Zone lookup and building style generation remain unchanged (`getZoneAtX`, `genBuilding`).
5. BG placement behavior remains untouched in this slice (B3 deferred).

## Regression Risks

1. Leftward FG anchoring bug risk if cursor advance is applied in wrong order.
2. Over-correction risk if FG gaps become too large or too uniform.
3. Zone-boundary transition risk if gap profile introduces abrupt visual discontinuities.
4. Accidental BG behavior drift if helpers are wired into BG loops in this slice.

## Acceptance Checks

1. `git diff --name-only` limited to expected B1+B2 artifacts.
2. FG right/left in `generateCity` both advance via `advanceCityCursor(..., b.w, zone.id, 'fg')`.
3. Width-aware stepping uses actual generated building width (`b.w`), not guessed `bw`.
4. Syntax check passes (`node --check` on extracted inline JS).
5. Overlap metrics report before/after FG overlap by zone:
- Before baselines from `docs/history/metrics/BASELINE_GENERATION_METRICS.md`
- After run from current implementation harness comparison
6. `SCHEMATICS.md` updated in same task because `teabag-simulator.html` changes.
7. Gameplay flow sanity status reported when runtime validation is available: title -> mode select -> gameplay -> pause -> zone transition -> prestige.
8. Visual sanity status reported for downtown, shopping, industrial, suburbs.
