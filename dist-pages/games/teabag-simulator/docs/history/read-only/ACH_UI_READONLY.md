# ACH_UI_READONLY

Read-only discovery artifact for achievements + UI overhaul planning.

Branch context:
- Base branch: `codex/s1-s2-runtime-editor-bridge`
- Base commit: `b90672e`
- Working branch: `codex/achievements-ui-spike` (inherits `b90672e`)

Files reviewed in required order:
1. `AGENTS.md`
2. `SCHEMATICS.md`
3. `docs/planning/FEATURE_ROADMAP.md`
4. `docs/planning/CAMPAIGN_BOSS_ROADMAP.md`
5. `README.md`
6. `docs/README.md`
7. `teabag-simulator.html`
8. `index.html`
9. `sound-designer.html`
10. `sw.js`
11. `manifest.json`

## 1) Exact UI Entry Points And Render/Update Flow Map

Primary runtime entry points in `teabag-simulator.html`:
- `function createGameContext()` at line 2915
- `function update(gameCtx, dt)` at line 3676
- `function render(gameCtx, dt)` at line 4083
- `function endFrameInputReset(gameCtx)` at line 4576
- `function loop(gameCtx, timestamp)` at line 4583

Authoritative frame ordering:
1. `update(gameCtx, dt)` (`3676`) dispatches:
   - `updateMenuState(gameCtx, dt)` (`3135`) with early return for `title/modeselect/zonepicker`
   - `updatePauseState(gameCtx)` (`3193`) with early return for `paused`
   - `updatePlayingState(gameCtx, dt)` (`3664`) otherwise
2. `render(gameCtx, dt)` (`4083`) dispatches:
   - `renderFrontScreen(gameCtx)` (`3683`) short-circuit for gallery/title/modeselect/zonepicker
   - world + entities + overlay/HUD pipeline
   - pause overlay if paused
   - `drawSideBars()` last
3. `endFrameInputReset(gameCtx)` (`4576`) clears keyboard/touch one-frame inputs.

Gameplay-side update detail (when `gameState === 'playing'`):
- `updatePlayerState(dt)` (`3466`) -> `updatePlayerMovementAndJump` (`3202`) + `updateMountedCombatState` (`3330`) + `updatePlayerTimersAndFX` (`3428`)
- `updateNPCState(dt, p)` (`3579`) -> FSM/spawn/bus-stop ambient
- `updateWorldState(gameCtx, dt, p)` (`3585`) -> camera, zone/progression, generation, timers, particles

Menu and overlay entry points:
- `drawTitleScreen()` (`4274`)
- `drawModeSelect()` (`4361`)
- `drawZonePicker()` (`4397`)
- `drawPauseMenu()` (`4468`)
- `renderHUDLayer(gameCtx)` (`3936`)
- `renderPostFX(sky)` (`3890`)

Input parity entry points:
- Desktop keyboard state and sprint double-tap: lines `1062-1101`
- Touch mapping + touch sprint double-tap: lines `1102-1225`
- Mobile on-screen control rendering: `drawSideBars()` (`1228`)

Supporting UI files:
- `index.html`: immediate meta-refresh redirect to `teabag-simulator.html`
- `sound-designer.html`: separate tool UI (slot panel, viz canvas, parameter panel); not called by main game loop
- `sw.js`: cache shell/offline assets for UI load path
- `manifest.json`: fullscreen landscape shell metadata

## 2) Current GSAP Usage And Extension Points

Current GSAP footprint in game runtime:
- Library load: `<script src="vendor/gsap.min.js"></script>` at line 23.
- Single tween integration:
  - `setSprintCameraTightening(isTight, isAirSprintJump)` (`1564`)
  - Uses `window.gsap.to(cam, {...})` at `1583`
  - Kills prior tween before replacing (`1581`)
  - Fallback path if GSAP unavailable (`1574-1579`)
- Call sites:
  - Per-frame gate in `updateWorldState` (`3589-3593`)
  - Reset cleanup in `startGame` (`3021-3027`)

GSAP extension seams (no code changes yet):
1. UI state object tweening:
   - Add a dedicated `uiAnim` state object (menu card offsets, alpha, pulse, toast stack offsets, HUD chip emphasis).
   - Tween object values; consume values in existing canvas draw functions.
2. Banner/announcement transitions:
   - Existing `centerKO` and `zoneTransitionAnim` flows already time-boxed and can be wrapped with GSAP-driven easing while preserving timers as fallback.
3. Menu focus transitions:
   - `drawModeSelect` and `drawZonePicker` currently use static selected-state rendering; card positions/scales can tween via UI state.
4. Pause panel micro-transitions:
   - `drawPauseMenu` row highlight and slider indicator can be motion-enhanced without changing control gates.

Constraints for GSAP extension:
- Keep `window.gsap` null-safe fallback behavior.
- Do not move pause/menu gate logic out of update dispatch.
- Do not replace frame loop timing with GSAP ticker.

## 3) Current Persistence/Save Shape And Migration Implications

Main gameplay save (`localStorage` key `teabag_save`):
- Load path: lines `643-650`
- Save path: `saveProgress()` lines `652-656`
- Current payload shape:
  - `unlockedZones: string[]`
  - `bestPrestige: number`
  - `allTimeKOs: number`
  - `bestChainCombo: number`
- No `SAVE_VERSION` currently present.

SFX settings save (`localStorage` key `teabag_sfx`):
- Load path: line `296` parse
- Save path: `saveSFXSettings()` lines `300-301`
- Payload:
  - `volume: number`
  - `muted: boolean`

Sound designer persistence (`sound-designer.html`):
- Key: `teabag_sound_designer` (`235`)
- Debounced save `scheduleSave()` (`237-243`)
- Has per-sound migration helper `migrateSound()` (`217-224`) but no explicit global save version.

Migration implications for achievements:
1. Adding achievements to `teabag_save` without versioning risks inconsistent defaults on older saves.
2. Existing truthy checks (`if (saved.bestPrestige)`) can skip valid zero values; migration should normalize with explicit type checks.
3. New nested progress data needs defensive parsing and fallback if missing/corrupt.
4. If new UI assets/scripts are introduced for overhaul, `sw.js` cache manifest (`ASSETS`) and `CACHE_NAME` must be updated in same implementation task.

## 4) Achievement Hook Points (KO/Combo/Zone/Mode/Boss/Progression)

KO/combat hooks:
- KO event completion:
  - `updateMountedCombatState` lines `3362-3393`
  - Signals available: npc type, special flag, score delta, chain count, total KOs
- Mount event:
  - lines `3398-3421`
  - Signals: aerial mount, chain active, mount count potential
- Teabag hit event:
  - lines `3352-3361`
  - Signals: combo stack, damage per hit, timing-valid crouch release

Combo/chain hooks:
- Combo increment + timer set: `3353-3355`
- Chain increment + window refresh: `3372-3374`, `3411`
- Combo/chain decay/fail windows: `3431-3433`

Zone/mode/progression hooks:
- Mode selection:
  - Campaign path: `updateModeSelectState` (`3101-3104`)
  - Endless path: `3106-3108` + `updateZonePickerState` `3122-3128`
- Zone transition:
  - `updateWorldState` zone change block `3635-3644`
  - Includes unlock-on-enter in campaign
- Prestige progression:
  - `triggerPrestige(gameCtx)` (`3055-3087`)
  - Unlock-all-zones and progression save

HUD/notification hooks for achievement UX:
- Existing overlay channels:
  - `centerKO` banner (`3988-4004`)
  - `zoneTransitionAnim` banner (`4062-4075`)
  - popup particles (`1532+`, used by combat flow)
- Existing HUD surfaces:
  - top HUD score/KO/chain (`3946-3978`)
  - bottom tracker (`4006-4032`)
  - zone pill + prestige tag (`4039-4058`)

Boss/progression (future roadmap) hook seams:
- Current code has no boss runtime object or hazard-boss state machine.
- `docs/planning/CAMPAIGN_BOSS_ROADMAP.md` defines intended future runtime (`bossEncounter`, campaign checkpoints, boss phases).
- Achievement design should reserve boss hook interface now (for `bossStart`, `bossPhaseClear`, `bossNoHit`, `bossDefeat`) but implementation should gate these behind existence of boss runtime slice.

## 5) In-Scope Vs Out-Of-Scope Boundaries (For Upcoming Implementation)

In-scope:
- Achievements state model and unlock evaluator wiring.
- Achievement toast/notification UI in canvas HUD pipeline.
- Save schema versioning and migration for achievements payload.
- GSAP-driven canvas UI motion states for menu/HUD/banner polish.
- Desktop/touch control-hint parity updates only where UI copy or prompts change.

Out-of-scope:
- Core combat physics rebalance (movement/combat/spawn constants).
- NPC renderer redesign or payload schema changes.
- Boss encounter gameplay implementation (unless separately scoped).
- Sound synthesis runtime/pathing changes.
- Service worker strategy rewrites beyond cache list/version bumps needed by added UI assets.

## 6) Invariants That Must Not Change

1. Update gate ordering:
   - Menu gate first, pause gate second, playing update third.
2. Render gate ordering:
   - front-screen short-circuit before world draw.
3. Frame reset timing:
   - `endFrameInputReset()` remains after `render()` in `loop()`.
4. Pause/menu gates:
   - Pause entry and resume controls stay deterministic (`updatePlayingState`, `updatePauseState`).
5. Desktop/touch parity:
   - Any new action prompt must map keyboard and touch, and control hints stay aligned.
6. Sprint camera behavior:
   - Existing GSAP sprint lens logic remains functionally unchanged unless explicitly scoped.
7. Save safety:
   - Old saves load without crash; missing achievement data must default safely.

## 7) Regression Risk Checklist

- [ ] Menu-to-game transitions still respect `title -> modeselect -> zonepicker/playing` without dead-end states.
- [ ] Pause/resume and quit-to-menu behavior unchanged.
- [ ] `update -> render -> endFrameInputReset` ordering preserved.
- [ ] Touch controls (including sprint double tap and pause button) still map identically to desktop actions.
- [ ] Achievement unlock checks do not run on non-events every frame in a way that causes frame drops.
- [ ] HUD readability remains intact during chain-heavy moments and zone transitions.
- [ ] Existing popup/center banner channels do not conflict with achievement toasts (z-order, alpha, timing).
- [ ] Save migration handles unversioned legacy `teabag_save` payloads and corrupt JSON gracefully.
- [ ] Service worker cache update plan is included if new UI assets are introduced.
- [ ] Freeplay and campaign behavior remains unchanged when achievements are disabled or unavailable.
