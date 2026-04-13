# Helper Prompt: Building Gen Fix (B1+B2)

Branch from `refactor/update-render-split` (or current integration branch as directed).

Task: implement **B1 + B2 only** from `docs/planning/BUILDING_GEN_FIX_SLICES.md` (width-aware gap config + FG placement symmetry), with strict dual-pass workflow.

## Non-Negotiables

1. Preserve gameplay behavior and render order.
2. Keep randomness; do not force deterministic spacing patterns.
3. No BG rewrite in this task (B3 out of scope).
4. No prop system rewrite in this task (B4 out of scope).
5. No opportunistic cleanup outside scoped functions.

## Phase 1: Read-Only Pass (Required)

1. Read `AGENTS.md`, `SCHEMATICS.md`, `docs/planning/BUILDING_GEN_FIX_SLICES.md`.
2. Create `docs/history/read-only/B1_B2_READONLY.md` with:
1. exact functions/signatures to touch
2. exact caller/callee map
3. in-scope vs out-of-scope table
4. invariants to preserve
5. regression risks and acceptance checks

## Phase 2: Edit Pass (B1+B2 only)

1. Add centralized FG/BG gap config (zone-aware).
2. Add width-aware stepping helper(s) that advance by `generatedWidth + sampledGap`.
3. Refactor FG right/left generation loops to use actual generated width and symmetric logic shape.
4. Keep zone lookup, building style generation, and generation trigger points unchanged.
5. If any game file changed, update `SCHEMATICS.md` in same task.

## Validation (Required)

1. Syntax check on extracted inline JS with `node --check`.
2. Run overlap metrics check and report before/after FG overlap rates by zone.
3. Gameplay flow sanity path (when runtime validation is available):
1. title -> mode select -> gameplay -> pause -> zone transition -> prestige
4. Visual sanity pass:
1. downtown, shopping, industrial, suburbs
2. confirm reduced obvious overlap without uniform spacing look

## Pre-Commit Self-Check (Report PASS/FAIL)

- [ ] Diff scope only expected files for B1+B2.
- [ ] Width-aware stepping is based on actual generated building width.
- [ ] FG right/left generation logic is symmetric in placement strategy.
- [ ] Randomness preserved (no obvious deterministic tiling).
- [ ] Syntax check passed.
- [ ] Overlap metrics improved and reported.
- [ ] `SCHEMATICS.md` updated if game files changed.
- [ ] `README.md` updated only if user-facing feature behavior changed.
- [ ] Mechanics change log included.

## Commit Rule

1. Do not commit until all checklist items are PASS.
2. Commit message: `refactor: make foreground city generation width-aware and symmetric`
