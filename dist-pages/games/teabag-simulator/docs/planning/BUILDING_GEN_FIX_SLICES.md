# Building Generation Fix Slices

Purpose: reduce building overlap/clumping while keeping city layout visibly random and zone-specific.

Status: planning-only doc (no game-file edits in this step).

## Problem Summary (Read-Only Findings)

1. Foreground rightward generation steps by random distances unrelated to generated building width, causing frequent overlap in wide-width zones.
2. Leftward generation uses a guessed width seed (`bw`) instead of the actual generated width, causing directional asymmetry (left mostly gaps, right frequent overlap).
3. Prop placement is cursor-relative and not footprint-aware, so props can clump or stack visually.

## Design Goals

1. Preserve randomness and zone flavor.
2. Eliminate most obvious FG/BG building overlap.
3. Keep generation performance stable.
4. Keep draw order and world pacing unchanged.

## Invariants (Must Not Change)

1. Render order remains unchanged.
2. World generation still streams both directions.
3. Zone transitions and blending behavior remain unchanged.
4. Bootstrap generation and streaming generation calls stay in existing update/startup flows.
5. No gameplay movement/combat balance changes in this workstream.

## Target Metrics (Acceptance Targets)

1. FG overlap rate (adjacent generated buildings in same layer/direction): less than or equal to 3% in synthetic sampling.
2. BG overlap rate: less than or equal to 5% in synthetic sampling.
3. Prop clump rule: no two same-lane props spawn closer than configured minimum spacing.
4. No new frame hitching from generation logic in normal gameplay.

## Proposed Slice Plan

## B0: Baseline + Harness (Read-Only + Optional Script)

Scope:
1. Record current generation behavior and overlap/clump baseline.
2. Add a lightweight metrics harness (script or debug helper) to compare before/after overlap and gap distributions.

Acceptance:
1. Baseline overlap/gap numbers captured per zone and layer.
2. Harness can run repeatedly and output deterministic summary format.

## B1: Width-Aware Gap Config

Scope:
1. Add zone-aware gap profile for FG/BG generation (min/max gap + rare large-gap chance).
2. Add helper to compute next cursor advance from actual generated width + sampled gap.
3. Keep randomness by rolling gap distribution, not fixed spacing.

Acceptance:
1. Generation code has a single width-aware stepping path for FG and BG.
2. Zone gap values are centralized near other tuning/config constants.

## B2: Foreground Placement Symmetry

Scope:
1. Rewrite FG right/left generation loops to use generated building object width (`b.w`) for cursor updates.
2. Remove guessed-width asymmetry path.
3. Keep zone lookup, building styles, and spawn cadence intact.

Acceptance:
1. Right and left FG placement use equivalent logic patterns.
2. FG overlap target meets threshold in harness.
3. No zone-specific building style regressions.

## B3: Background Placement Symmetry

Scope:
1. Apply same width-aware symmetric stepping to BG generation.
2. Preserve BG parallax behavior and zone style selection.

Acceptance:
1. BG overlap target meets threshold in harness.
2. Skyline density remains visually varied (not uniform tiling).

## B4: Prop Slotting + Spacing Guards

Scope:
1. Place props relative to each new building footprint (inset slots) instead of raw cursor offsets.
2. Add min-spacing and optional type-specific spacing footprints.
3. Add exclusion windows around bus stops/platform anchors to prevent awkward stacking.

Acceptance:
1. Prop clustering visibly reduced.
2. No props spawn inside restricted exclusion windows.
3. Zone prop variety remains intact.

## B5: Tune + Validate + Document

Scope:
1. Tune per-zone gap/spacing ranges for feel (industrial/shopping denser logic, park/suburbs roomier logic).
2. Run gameplay flow and visual sanity checks when runtime validation is available.
3. Update docs.

Acceptance:
1. Gameplay flow sanity path reported when runtime validation is available: title -> mode select -> gameplay -> pause -> zone transition -> prestige.
2. Visual checks pass in all zones (no obvious overlap walls or prop stacks).
3. `SCHEMATICS.md` updated for any signature/flow/anchor changes.
4. `README.md` updated if behavior is user-facing enough to document.

## Validation Checklist (Whole Workstream)

1. Syntax check passes (`node --check` on extracted inline JS).
2. Overlap metrics meet targets.
3. No draw-order regressions.
4. No input/menu/pause regression.
5. No measurable generation slowdown in normal run.

## Risk Notes

1. Over-correction can make streets look too uniform.
2. Zone boundaries can expose spacing discontinuities if gap profile changes too abruptly.
3. Prop exclusions can starve props in short segments if thresholds are too strict.

## Recommended Execution Order

1. B0
2. B1
3. B2
4. B3
5. B4
6. B5
