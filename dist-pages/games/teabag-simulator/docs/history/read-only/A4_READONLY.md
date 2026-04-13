# A4_READONLY

Slice: **A4 (render dispatcher threading only)**

## Exact Target Functions / Signatures

Current -> Target:

1. `teabag-simulator.html:3454`
- `function renderFrontScreen()`
- -> `function renderFrontScreen(gameCtx)`

2. `teabag-simulator.html:3701`
- `function renderHUDLayer()`
- -> `function renderHUDLayer(gameCtx)`

3. `teabag-simulator.html:3843`
- `function renderOverlayLayer(sky)`
- -> `function renderOverlayLayer(gameCtx, sky)`

4. `teabag-simulator.html:3848`
- keep `function render(gameCtx, dt)`
- update immediate call wiring only:
  - `renderFrontScreen()` -> `renderFrontScreen(gameCtx)`
  - `renderOverlayLayer(sky)` -> `renderOverlayLayer(gameCtx, sky)`
  - pause overlay gate uses threaded context state at dispatcher layer

## Caller / Callee Map

Callers:
- `loop(gameCtx, timestamp)` -> `render(gameCtx, dt)` (already threaded; unchanged)

Render dispatcher edges:
- `render(gameCtx, dt)` -> `renderFrontScreen(gameCtx)`
- `render(gameCtx, dt)` -> `renderWorldLayer(sky)` (unchanged)
- `render(gameCtx, dt)` -> `renderEntityLayer()` (unchanged)
- `render(gameCtx, dt)` -> `renderOverlayLayer(gameCtx, sky)`
- `render(gameCtx, dt)` -> `drawPauseMenu()` gate remains after world restore and before sidebars

Overlay subtree:
- `renderOverlayLayer(gameCtx, sky)` -> `renderPostFX(sky)` (unchanged)
- `renderOverlayLayer(gameCtx, sky)` -> `renderHUDLayer(gameCtx)`

## In Scope vs Out of Scope

| Area | In Scope (A4) | Out of Scope (A4) |
| --- | --- | --- |
| Render signatures | Thread `gameCtx` through render dispatcher/front/overlay/HUD immediate layer | Threading deep draw helpers (`renderWorldLayer`, `renderEntityLayer`, `renderPostFX`, draw primitives) |
| Render logic | Dispatcher/front/overlay gating reads can use `gameCtx.state` where immediate | Deep renderer data access rewrites or algorithm changes |
| Draw pipeline | Keep exact call order and pause/sidebar placement | Any reorder of layers/effects |
| Gameplay/input/tuning | None | Any gameplay, tuning, save, input mapping changes |

## Invariants (Must Stay Identical)

1. Draw order in `render(gameCtx, dt)` remains exactly:
- front-screen early return path
- world draw block (sky -> world -> entities -> overlay)
- pause overlay after world block
- sidebars last

2. Pause overlay timing/position remains identical:
- draw only when paused
- drawn with `ctx.translate(GAME_OX, 0)`
- drawn before `drawSideBars()`

3. Front-screen routing unchanged:
- `galleryMode`, `title`, `modeselect`, `zonepicker` branches and return behavior unchanged.
- each branch still draws sidebars and returns `true`.

4. Frame-end input reset timing unchanged:
- no edits to `loop` or `endFrameInputReset` ordering.

## Regression Risk Checks

1. Layer order drift risk:
- confirm no moved or reordered calls inside `render(gameCtx, dt)`.

2. Routing regression risk:
- confirm `renderFrontScreen(gameCtx)` branch conditions preserve existing states and early return semantics.

3. Pause overlay regression risk:
- confirm pause gate remains after world restores and before sidebars.

4. Compile wiring risk:
- confirm no stale calls to `renderFrontScreen()` or `renderOverlayLayer(sky)`/`renderHUDLayer()` without `gameCtx` where threaded.

## Acceptance Gates

- Syntax check passes: extracted inline JS + `node --check`.
- Visual sanity report covers:
  - title/front screen
  - mode select / zone picker
  - gameplay HUD
  - paused overlay
  - sidebars on touch-visible path
  - gallery mode rendering path
- Sound-path validation reported only if sound assets/defs/runtime SFX paths changed.
- `SCHEMATICS.md` updated in same task if `teabag-simulator.html` changed.
