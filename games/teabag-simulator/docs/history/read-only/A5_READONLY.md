# A5_READONLY

Slice: **A5 (coordinator-level state access cleanup only)**

## Exact Target Functions To Touch

1. `createGameContext()` (state facade additions only)
2. `startGame(gameCtx)`
3. `updateModeSelectState(gameCtx)`
4. `updateZonePickerState(gameCtx)`
5. `updatePauseNavigation(gameCtx)`
6. `updatePauseSelectionAction(gameCtx)`
7. `updatePauseAdjustments(gameCtx)`
8. `updateWorldState(gameCtx, dt, p)`
9. `renderFrontScreen(gameCtx)`
10. `render(gameCtx, dt)`

## Remaining Direct-Global Primitive Reads/Writes (Current)

## `createGameContext()`
- Missing state accessors needed for coordinator migration:
  - `sfxMuted`
  - `sfxVolume`
  - `galleryMode`

## `startGame(gameCtx)`
- Direct primitive writes:
  - `score = 0`
  - `totalKOs = 0`
  - `centerKO = null`
  - `currentZone = ...`
  - `currentZoneIndex = ...`
  - `dayTime = wt.startDayTime`

## `updateModeSelectState(gameCtx)`
- Direct service calls:
  - `playSFX('menuNav')`
  - `playSFX('menuSelect')`

## `updateZonePickerState(gameCtx)`
- Direct service calls:
  - `playSFX('menuNav')`
  - `playSFX('menuSelect')`

## `updatePauseNavigation(gameCtx)`
- Direct service calls:
  - `playSFX('menuNav')`

## `updatePauseSelectionAction(gameCtx)`
- Direct primitive writes:
  - `sfxMuted = !sfxMuted`
- Direct service calls:
  - `saveSFXSettings()`
  - `playSFX('menuSelect')`

## `updatePauseAdjustments(gameCtx)`
- Direct primitive reads/writes:
  - `sfxMuted`
  - `sfxVolume`
- Direct service calls:
  - `saveSFXSettings()`
  - `playSFX('menuNav')`

## `updateWorldState(gameCtx, dt, p)`
- Direct primitive reads/writes:
  - `gameMode`
  - `currentZone`
  - `currentZoneIndex`
  - `zoneTransitionAnim`
  - `unlockedZones`
  - `dayTime`
- Direct service calls:
  - `playSFX('zoneTransition')`
  - `saveProgress()`

## `renderFrontScreen(gameCtx)`
- Direct primitive read:
  - `galleryMode`

## `render(gameCtx, dt)`
- Direct primitive read:
  - `dayTime`

## Caller / Callee Map (Affected Edges)

Startup/progression:
- `updateModeSelectState(gameCtx)` -> `startGame(gameCtx)`
- `updateZonePickerState(gameCtx)` -> `startGame(gameCtx)`
- `updateWorldState(gameCtx, dt, p)` -> `triggerPrestige(gameCtx)`

Dispatch flow (unchanged):
- `update(gameCtx, dt)` -> `updateMenuState(gameCtx, dt)` -> menu helpers
- `update(gameCtx, dt)` -> `updatePauseState(gameCtx)` -> pause helpers
- `update(gameCtx, dt)` -> `updatePlayingState(gameCtx, dt)` -> `updateWorldState(gameCtx, dt, p)`

Render flow (unchanged order):
- `render(gameCtx, dt)` -> `renderFrontScreen(gameCtx)` (early return path)
- `render(gameCtx, dt)` -> `renderWorldLayer(sky)` -> `renderEntityLayer()` -> `renderOverlayLayer(gameCtx, sky)`
- paused overlay gate in `render(gameCtx, dt)` then `drawSideBars()`

## In-Scope vs Out-of-Scope

| Area | In Scope (A5) | Out of Scope (A5) |
| --- | --- | --- |
| Coordinator primitives | Replace remaining coordinator-layer primitive reads/writes with `gameCtx.state/input/services` | Deep system/global model redesign |
| Coordinator service calls | Switch coordinator-level `playSFX/saveProgress/saveSFXSettings` calls to `gameCtx.services.*` | SFX engine/runtime path rewrites |
| Accessor surface | Add minimal `state` accessors needed for coordinator migration (`sfxMuted`, `sfxVolume`, `galleryMode`) | Save-shape/schema changes |
| World/render deep logic | Keep deep world/renderer internals as-is apart from coordinator state flow touches | Draw algorithm/order rewrites, gameplay system rewrites |

## Invariants To Preserve

1. Update dispatcher order and short-circuit behavior unchanged.
2. Pause/menu/zone/title transition behavior unchanged.
3. Pause entry timing unchanged (before player/NPC/world updates).
4. Render front-screen routing unchanged.
5. Render draw order unchanged.
6. Frame-end input reset remains after render in loop.
7. Prestige trigger edge timing unchanged.

## Risk Checks

1. Accessor gap risk:
- Verify new state accessors cover migrated fields (`sfxMuted`, `sfxVolume`, `galleryMode`) without introducing copies.

2. Gate/order regression risk:
- Verify `update` and `render` call sequence and early returns unchanged.

3. Pause controls regression risk:
- Verify mute/volume row behavior in pause menu remains identical.

4. Prestige/progression regression risk:
- Verify campaign zone crossing still triggers prestige at same boundary conditions.

## Acceptance Gates

1. Syntax check passes (`node --check` on extracted inline JS).
2. Gameplay flow sanity path passes when runtime validation is available:
- `title -> mode select -> gameplay -> pause -> resume -> quit -> endless/zonepicker -> zone transition -> prestige`
3. Visual sanity checks pass:
- title/modeselect/zonepicker routing
- gameplay HUD + pause overlay ordering
- sidebars/touch-visible path
- gallery front-screen path
4. `SCHEMATICS.md` updated if game file changed.
5. Sound-path validation reported only if sound assets/defs/runtime SFX paths changed.
