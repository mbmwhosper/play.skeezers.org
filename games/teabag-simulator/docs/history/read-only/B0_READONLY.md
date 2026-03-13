# B0 Read-Only Discovery: Building Generation Baseline and B1/B2 Edit Map

Scope: B0 only. This file captures read-only analysis, baseline findings, and an implementation-ready map for B1+B2. No gameplay generation behavior changes were made in this task.

## Exact Functions To Change In B1+B2

Primary existing function to edit:

- `teabag-simulator.html:1619` `function generateCity(leftBound, rightBound)`

Supporting config + helper additions for B1 (new code near existing generation/tuning constants):

- `teabag-simulator.html:370` `const TUNING = Object.freeze(...)` (or adjacent constants area near city generation)
- Add a zone/layer gap config constant (recommended name: `CITY_GAP_PROFILE`).
- Add one cursor-advance helper (recommended signature):
  - `function sampleCityGap(zoneId, layer)` -> number
  - `function advanceCityCursor(cursor, dir, width, zoneId, layer)` -> number

No other gameplay systems require logic edits for B1+B2.

## Caller/Callee Map (Current)

Upstream callers of generation:

- `teabag-simulator.html:2827` `startGame(gameCtx)` -> `generateCity(...)` (bootstrap fill)
- `teabag-simulator.html:2876` `triggerPrestige(gameCtx)` -> `generateCity(...)` (post-prestige rebuild)
- `teabag-simulator.html:3396` `updateWorldState(gameCtx, dt, p)` -> `generateCity(...)` (streaming generation)

Generation internals:

- `teabag-simulator.html:1619` `generateCity(leftBound, rightBound)`
  - calls `getZoneAtX(...)` at `teabag-simulator.html:630`
  - calls `genBuilding(...)` at `teabag-simulator.html:1532`
  - calls `pickZoneProp(...)` at `teabag-simulator.html:1583`
  - calls `createProp(...)` at `teabag-simulator.html:1593`
  - uses cursor state:
    - `cityGenRight`, `cityGenLeft`, `bgGenRight`, `bgGenLeft` at `teabag-simulator.html:1525`

## Root-Cause Analysis (Overlap/Clumping)

1. FG rightward overlap driver:
- In `generateCity`, FG right places a building at `cityGenRight` and advances by a random step independent of generated width.
- When sampled step < generated width, adjacent overlap is guaranteed.

2. FG directional asymmetry driver:
- FG left pre-subtracts guessed width `bw = randInt(60, 140)` before generation.
- That guessed width is not the actual generated building width and not zone-specific (e.g., industrial can generate much wider FG buildings).
- Result: right side tends toward overlap; left side tends toward larger positive gaps.

3. BG has the same asymmetry pattern:
- BG left uses guessed `bw = randInt(50, 120)` while right uses step-only spacing.
- Similar right-heavy overlap / left-heavy gap pattern appears in BG metrics.

4. Prop clumping driver (not addressed in B1/B2):
- Props are cursor-relative offsets (`cityGen* + rand(...)`) rather than footprint-slot-aware placements.
- Multiple prop rolls in the same cycle can land close together.

## Baseline Evidence Snapshot

From `scripts/city-gen-metrics-baseline.js` with `--seeds 20 --span 120000`:

- FG right overlap ranges ~12% (park) to ~78% (industrial).
- FG left overlap ranges ~0% to ~16%.
- BG right overlap ~50% across zones; BG left ~1.5%.
- Largest FG asymmetry: industrial, right-left delta = 62.75 percentage points.

Details are in `docs/history/metrics/BASELINE_GENERATION_METRICS.md`.

## B1+B2 In-Scope vs Out-of-Scope

In scope (B1+B2):

- Add centralized zone/layer gap profile config.
- Introduce width-aware cursor advance helper.
- Rewrite FG right and FG left stepping to use actual generated width (`b.w`) + sampled gap.
- Remove guessed FG left width seed path.

Out of scope (B1+B2):

- BG stepping rewrite (planned for B3).
- Prop footprint/spacing guard changes (planned for B4).
- Render order changes, platform generation changes, movement/combat tuning, NPC/cars logic.
- Any non-generation gameplay tuning.

## Invariants To Preserve In B1+B2

- Keep generation call sites and timing unchanged (`startGame`, `triggerPrestige`, `updateWorldState`).
- Keep world streaming bidirectional (left and right loops both active).
- Keep zone lookup behavior (`getZoneAtX`) unchanged.
- Keep draw order and parallax behavior unchanged.
- Keep bootstrap and runtime generation margins as-is (`TUNING.world`).

## Implementation-Ready Plan For B1+B2

1. Add gap profile constants:
- Define per-zone `fg` and `bg` gap ranges near tuning/constants.
- Keep values explicit and centralized.

2. Add helper(s):
- `sampleCityGap(zoneId, layer)` to return sampled gap from profile.
- `advanceCityCursor(cursor, dir, width, zoneId, layer)` to apply `width + gap`.

3. Refactor FG right loop in `generateCity`:
- Generate `b = genBuilding(cityGenRight, 'fg', zone)`.
- Push `b`.
- Advance `cityGenRight = advanceCityCursor(cityGenRight, +1, b.w, zone.id, 'fg')`.

4. Refactor FG left loop in `generateCity`:
- Remove guessed `bw` seed path.
- Generate building width first (by creating `b`), then set/align placement with actual `b.w`.
- Advance with mirrored helper: `cityGenLeft = advanceCityCursor(cityGenLeft, -1, b.w, zone.id, 'fg')`.

5. Keep props unchanged in B1+B2:
- Preserve current prop random rolls/offset behavior until B4.

6. Validate with harness:
- Re-run baseline script after B1+B2 and compare FG overlap rates against target.

## Risks and Regression Checks

Primary risks:

- Over-correction can create uniform spacing and reduce randomness feel.
- Incorrect left-anchor handling can create jumps/gaps near cursor seam.
- Zone-boundary transitions can expose abrupt spacing profile changes.

Regression checks for B1+B2:

- Confirm no changes to generation call sites in update/start/prestige flow.
- Confirm FG right/left use equivalent width-aware stepping logic.
- Re-run baseline harness and compare right-vs-left overlap deltas.
- Gameplay flow sanity check for world traversal and zone transitions after implementation slice when runtime validation is available.
