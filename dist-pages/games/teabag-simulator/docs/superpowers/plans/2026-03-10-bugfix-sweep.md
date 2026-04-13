# Bugfix Sweep Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the confirmed runtime, offline, sound-designer, and NPC-designer bugs without widening scope.

**Architecture:** Use one regression suite to pin the broken behaviors, then apply minimal in-place fixes to the existing runtime and tooling files. Keep gameplay tuning, state ordering, and asset contracts unchanged unless directly required by the bugfix.

**Tech Stack:** Inline browser JavaScript, service worker caching, Node built-in test runner, ESLint, Prettier

---

## Chunk 1: Planning And Regression Harness

### Task 1: Add the failing regression suite

**Files:**
- Create: `/Users/sherwoodmm/Desktop/teabag-simulator/scripts/regression-bugfixes.test.js`

- [ ] **Step 1: Write runtime regression tests**
  Add tests for:
  - payload URL resolution fetch path
  - gallery-mode update short-circuit
  - touch crouch release across pause transitions
  - active-NPC-based spawn cap logic

- [ ] **Step 2: Write tooling/source regression tests**
  Add tests for:
  - service worker precache entries for first offline launch assets
  - sound-designer JS export materializing all sound slots
  - NPC designer runtime base list including the missing shipped archetypes

- [ ] **Step 3: Run the suite and verify RED**

Run: `node --test /Users/sherwoodmm/Desktop/teabag-simulator/scripts/regression-bugfixes.test.js`
Expected: multiple failures corresponding to the confirmed bugs

## Chunk 2: Runtime Fixes

### Task 2: Fix the runtime/gameplay bugs in `teabag-simulator.html`

**Files:**
- Modify: `/Users/sherwoodmm/Desktop/teabag-simulator/teabag-simulator.html`

- [ ] **Step 1: Fix designer payload URL resolution**
  Resolve payload filenames relative to `DESIGNER_PAYLOAD_INDEX_PATH`, not `location.href`.

- [ ] **Step 2: Freeze simulation while gallery mode is active**
  Short-circuit `update(gameCtx, dt)` when `galleryMode` is on, keeping the gallery render path intact.

- [ ] **Step 3: Fix mobile crouch state recomputation**
  Make `touch.crouch` derive from the held touch gameplay buttons so pause/resume transitions cannot leave crouch stuck.

- [ ] **Step 4: Fix NPC spawn-cap accounting**
  Base both spawn-cap gates on active NPCs instead of all lingering NPC records.

- [ ] **Step 5: Run regression suite and verify GREEN for runtime cases**

Run: `node --test /Users/sherwoodmm/Desktop/teabag-simulator/scripts/regression-bugfixes.test.js`
Expected: runtime-related tests pass; non-runtime tests may still fail

## Chunk 3: Tooling And Offline Fixes

### Task 3: Fix the supporting tooling surfaces

**Files:**
- Modify: `/Users/sherwoodmm/Desktop/teabag-simulator/sw.js`
- Modify: `/Users/sherwoodmm/Desktop/teabag-simulator/sound-designer.html`
- Modify: `/Users/sherwoodmm/Desktop/teabag-simulator/npc-designer-constraints.js`

- [ ] **Step 1: Expand the offline precache manifest**
  Add the first-load assets needed for offline startup that are currently missing from `ASSETS`.

- [ ] **Step 2: Materialize complete sound exports**
  Make `Copy JS` export a full `SOUND_DEFS` map, including untouched slots with defaults applied.

- [ ] **Step 3: Restore missing runtime archetypes in designer constraints**
  Add the missing shipped NPC archetypes so the designer can parity-preview them.

- [ ] **Step 4: Re-run regression suite**

Run: `node --test /Users/sherwoodmm/Desktop/teabag-simulator/scripts/regression-bugfixes.test.js`
Expected: full suite passes

## Chunk 4: Docs And Verification

### Task 4: Update docs and verify the change set

**Files:**
- Modify: `/Users/sherwoodmm/Desktop/teabag-simulator/SCHEMATICS.md`
- Modify: `/Users/sherwoodmm/Desktop/teabag-simulator/docs/planning/REFACTOR_SLICES.md`
- Modify: `/Users/sherwoodmm/Desktop/teabag-simulator/docs/planning/REFACTOR_CHECKLIST.md`

- [ ] **Step 1: Update schematics anchors and notes**
  Document the runtime loader, touch input, spawn logic, and offline cache changes because game files changed.

- [ ] **Step 2: Run syntax and repository checks**

Run:
- `node --check /Users/sherwoodmm/Desktop/teabag-simulator/sw.js`
- `node --check /Users/sherwoodmm/Desktop/teabag-simulator/npc-designer-constraints.js`
- `node --test /Users/sherwoodmm/Desktop/teabag-simulator/scripts/regression-bugfixes.test.js`
- `npm run lint`
- `npm run format:check`

Expected: all commands succeed

- [ ] **Step 3: Run runtime validation**

Run: browser smoke pass against `/Users/sherwoodmm/Desktop/teabag-simulator/index.html`
Expected: payload registry loads without 404s and no new startup errors

- [ ] **Step 4: Report explicit validation status**
  Include runtime validation status and sound-path validation status in the final handoff.
