# A3_READONLY

Slice: **A3 (startup/progression/menu/pause threading only)**

## Exact Functions / Signatures To Change

Current -> Target signatures:

1. `teabag-simulator.html:2821`
- `function startGame()`
- -> `function startGame(gameCtx)`

2. `teabag-simulator.html:2870`
- `function triggerPrestige()`
- -> `function triggerPrestige(gameCtx)`

3. `teabag-simulator.html:2904`
- `function updateTitleMenuState(dt)`
- -> `function updateTitleMenuState(gameCtx, dt)`

4. `teabag-simulator.html:2909`
- `function updateModeSelectState()`
- -> `function updateModeSelectState(gameCtx)`

5. `teabag-simulator.html:2928`
- `function updateZonePickerState()`
- -> `function updateZonePickerState(gameCtx)`

6. `teabag-simulator.html:2969`
- `function updatePauseNavigation()`
- -> `function updatePauseNavigation(gameCtx)`

7. `teabag-simulator.html:2980`
- `function updatePauseSelectionAction()`
- -> `function updatePauseSelectionAction(gameCtx)`

8. `teabag-simulator.html:2994`
- `function updatePauseAdjustments()`
- -> `function updatePauseAdjustments(gameCtx)`

9. Progression call-edge threading (compile-critical immediate caller)
- `function updateWorldState(dt, p)`
- -> `function updateWorldState(gameCtx, dt, p)`

## Exact Caller / Callee Map

Startup/progression:
- `updateModeSelectState(gameCtx)` -> `startGame(gameCtx)` when campaign selected
- `updateZonePickerState(gameCtx)` -> `startGame(gameCtx)` when unlocked endless zone selected
- `updateWorldState(gameCtx, dt, p)` -> `triggerPrestige(gameCtx)` on campaign boundary crossing

Menu immediate layer:
- `updateMenuState(gameCtx, dt)` -> `updateTitleMenuState(gameCtx, dt)`
- `updateMenuState(gameCtx, dt)` -> `updateModeSelectState(gameCtx)`
- `updateMenuState(gameCtx, dt)` -> `updateZonePickerState(gameCtx)`

Pause immediate layer:
- `updatePauseState(gameCtx)` -> `updatePauseNavigation(gameCtx)`
- `updatePauseState(gameCtx)` -> `updatePauseSelectionAction(gameCtx)`
- `updatePauseState(gameCtx)` -> `updatePauseAdjustments(gameCtx)`

Playing immediate layer:
- `updatePlayingState(gameCtx, dt)` -> `updateWorldState(gameCtx, dt, p)`

## In Scope

- Thread `gameCtx` through startup/progression signatures and immediate call sites listed above.
- Thread `gameCtx` through title/mode/zone-picker helper signatures and pause helper signatures plus immediate call sites.
- Preserve existing logic flow and branch behavior; parameter threading only.
- Update `SCHEMATICS.md` signatures/anchors impacted by these changes.

## Out of Scope

- Deep player/NPC/world internals (`updatePlayer*`, `updateNPC*` logic changes).
- Render dispatcher/helper threading (A4+).
- Gameplay tuning/content changes.
- Save schema/version changes.
- Opportunistic cleanup or style rewrites.

## Invariants That Must Stay Identical

1. Update dispatcher ordering:
- `updateMenuState(gameCtx, dt)` gate first
- `updatePauseState(gameCtx)` gate second
- `updatePlayingState(gameCtx, dt)` third

2. Menu/pause branch semantics:
- Title/modeselect/zonepicker transitions remain identical.
- Pause menu navigation/selection/mute/volume behavior remains identical.

3. Pause-entry timing:
- Playing pause gate remains before `updatePlayerState`, `updateNPCState`, and world updates.

4. Frame-end input reset timing:
- `endFrameInputReset(gameCtx)` remains after `render(gameCtx, dt)` in `loop`.

5. Startup/progression semantics:
- Campaign/endless start behavior and prestige boundary trigger behavior remain unchanged.

## Risk Checks

1. Missed call-site risk:
- No stale calls to old signatures (`startGame()`, `triggerPrestige()`, helper calls without `gameCtx`).

2. Pause row behavior regression risk:
- Verify pause row 1/2 left-right adjustment behavior is unchanged (mute toggle and volume clamp).

3. Branch/gate drift risk:
- Verify no changes to early returns in menu/pause dispatchers.

4. Input timing risk:
- Verify `loop` and `endFrameInputReset` are untouched.

## Acceptance Gates

- Syntax check passes: extracted inline JS + `node --check`.
- Gameplay flow sanity path executed and reported when runtime validation is available:
  - title -> mode select -> gameplay -> pause -> resume -> quit to modeselect -> endless/zonepicker path -> zone transition -> prestige
- Sound-path validation reported only if sound assets/defs/runtime SFX paths were changed.
- `SCHEMATICS.md` updated in same task if `teabag-simulator.html` changed.
