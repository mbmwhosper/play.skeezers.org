# Bugfix Sweep Design

## Goal

Fix the confirmed runtime, offline, sound-designer, and NPC-designer regressions without expanding scope or rebalancing gameplay.

## Recommended Approach

Use a targeted regression-fix pass with test coverage for each confirmed bug:

- Add a focused Node regression suite that exercises the current inline-runtime functions with stubbed globals and source-backed assertions.
- Patch the runtime in place instead of refactoring large systems:
  - resolve designer payload URLs relative to the payload index path
  - freeze gameplay/menu simulation while gallery mode is active
  - recompute mobile crouch from held touch buttons so pause transitions cannot leave it latched
  - base spawn-cap pressure on active NPCs rather than all lingering NPC records
- Patch the supporting surfaces:
  - expand the service worker precache manifest for first offline launch
  - export fully materialized sound definitions from the sound designer
  - restore the missing runtime archetypes in `npc-designer-constraints.js`

## Boundaries

In scope:

- `/Users/sherwoodmm/Desktop/teabag-simulator/teabag-simulator.html`
- `/Users/sherwoodmm/Desktop/teabag-simulator/sw.js`
- `/Users/sherwoodmm/Desktop/teabag-simulator/sound-designer.html`
- `/Users/sherwoodmm/Desktop/teabag-simulator/npc-designer-constraints.js`
- `/Users/sherwoodmm/Desktop/teabag-simulator/SCHEMATICS.md`
- regression coverage and planning docs

Out of scope:

- gameplay tuning values
- zone definitions and spawn pools
- renderer redesigns
- sound synthesis content in `sfx/sounds.js`
- persistence schema changes

## Risk Controls

- Keep update/render/frame-reset ordering unchanged except for an explicit gallery-mode update short-circuit.
- Keep touch, desktop input, and on-screen control behavior aligned by recomputing shared touch state instead of adding one-off flags.
- Keep offline caching additive only: no fetch-strategy rewrite in this pass.
- Verify fixes with a red/green regression suite, syntax checks, lint, formatting, and a browser smoke test when available.
