# A2_READONLY

Slice: **A2 (update dispatcher threading only)**

Branch baseline observed: `refactor/update-render-split` (working tree clean for this branch snapshot before A2 edits).

## Exact Functions / Signatures To Change

Current -> Target:

1. `teabag-simulator.html:2950`
- `function updateMenuState(dt)`
- -> `function updateMenuState(gameCtx, dt)`

2. `teabag-simulator.html:3008`
- `function updatePauseState()`
- -> `function updatePauseState(gameCtx)`

3. `teabag-simulator.html:3435`
- `function updatePlayingState(dt)`
- -> `function updatePlayingState(gameCtx, dt)`

4. `teabag-simulator.html:3447`
- already `function update(gameCtx, dt)`
- internal call wiring changes only:
  - `updateMenuState(dt)` -> `updateMenuState(gameCtx, dt)`
  - `updatePauseState()` -> `updatePauseState(gameCtx)`
  - `updatePlayingState(dt)` -> `updatePlayingState(gameCtx, dt)`

## Caller / Callee Map (Exact Affected Edges)

Callers:
- `loop(gameCtx, timestamp)` -> `update(gameCtx, dt)`

`update(gameCtx, dt)` dispatch edges:
- `update(gameCtx, dt)` -> `updateMenuState(gameCtx, dt)`
- `update(gameCtx, dt)` -> `updatePauseState(gameCtx)`
- `update(gameCtx, dt)` -> `updatePlayingState(gameCtx, dt)`

Inside menu dispatcher (unchanged helper signatures in A2):
- `updateMenuState(gameCtx, dt)` -> `updateTitleMenuState(dt)`
- `updateMenuState(gameCtx, dt)` -> `updateModeSelectState()`
- `updateMenuState(gameCtx, dt)` -> `updateZonePickerState()`

Inside pause dispatcher (unchanged helper signatures in A2):
- `updatePauseState(gameCtx)` -> `updatePauseNavigation()`
- `updatePauseState(gameCtx)` -> `updatePauseSelectionAction()`
- `updatePauseState(gameCtx)` -> `updatePauseAdjustments()`

Inside playing dispatcher:
- `updatePlayingState(gameCtx, dt)` -> `updatePlayerState(dt)`
- `updatePlayingState(gameCtx, dt)` -> `updateNPCState(dt, p)`
- `updatePlayingState(gameCtx, dt)` -> `updateWorldState(dt, p)`

## In-Scope vs Out-of-Scope

| Area | In Scope (A2) | Out of Scope (A2) |
| --- | --- | --- |
| Dispatcher signatures | Add `gameCtx` param to `updateMenuState`, `updatePauseState`, `updatePlayingState`; wire calls in `update` | Changing non-target function signatures (A3/A4+) |
| Dispatcher state reads/writes | Allow dispatcher-level gating via `gameCtx.state` / `gameCtx.input` where needed | Rewriting menu/pause helper internals to ctx threading |
| Gameplay internals | Keep `updatePlayerState`, `updateNPCState`, `updateWorldState` call sequence intact | Deep player/NPC/world refactors |
| Render | None | Render dispatcher and render helper threading |
| Tuning/data | None | Gameplay tuning/content changes |
| Cleanup | None | Opportunistic style/architecture cleanup |

## Invariants To Preserve

1. Branch/order behavior:
- `update()` must keep exact order and short-circuit semantics:
  - menu gate first
  - pause gate second
  - gameplay update third

2. Pause/menu gate semantics:
- Menu states (`title`, `modeselect`, `zonepicker`) continue returning early from frame update.
- Pause state continues returning early from frame update.
- Playing pause input gate remains at start of `updatePlayingState` before player/NPC/world updates.

3. Frame-end input reset timing:
- No changes to `endFrameInputReset(gameCtx)` ordering in loop.
- Reset remains after `render(gameCtx, dt)`.

## Regression Risk Checks

1. Signature mismatch risk:
- Verify no remaining calls to old forms `updateMenuState(dt)`, `updatePauseState()`, `updatePlayingState(dt)`.

2. Gate inversion risk:
- Verify dispatcher `if (...) return` structure unchanged except parameter threading.

3. Pause transition timing risk:
- Verify pause key/touch check still occurs before `updatePlayerState(dt)` call.

4. Input reset coupling risk:
- Verify no edits to `loop`/`endFrameInputReset` for A2.

5. Diff scope risk:
- Limit edits to `teabag-simulator.html`, `SCHEMATICS.md`, and `docs/history/read-only/A2_READONLY.md` only.
