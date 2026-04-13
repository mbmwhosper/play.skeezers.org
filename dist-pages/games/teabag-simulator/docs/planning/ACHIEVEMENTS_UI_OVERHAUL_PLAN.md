# ACHIEVEMENTS_UI_OVERHAUL_PLAN

Proposal-only plan. No gameplay or UI implementation changes are included in this task.

## 1) Target Outcome

Deliver two coordinated features:
1. Achievements system with reliable unlock tracking, persistence, and in-run feedback.
2. GSAP-driven UI motion overhaul for menus, HUD, and announcements while preserving gameplay/input invariants.

Design constraints pulled from current codebase and roadmaps:
- Keep gameplay loop and pause/menu gates deterministic.
- Preserve desktop + touch parity and control hints.
- Keep `update -> render -> endFrameInputReset` ordering intact.
- Use existing canvas pipeline (animate state objects, not DOM overlays by default).
- Reserve boss achievement hooks for future campaign boss slices without blocking current rollout.

## 2) Achievement Architecture

### 2.1 State Model (Runtime + Persistent)

Proposed `gameCtx.state.achievements` shape:
- `definitionsVersion: number` (content/version of achievement definitions)
- `unlocked: Record<string, { unlockedAt: number, runMode: 'campaign' | 'endless', context?: object }>`
- `progress: Record<string, number>` (for cumulative counters)
- `run:`
  - `pendingUnlocks: string[]`
  - `toastQueue: Array<{ id: string, title: string, rarity: string, icon?: string }>`
  - `recentUnlockAt: number`
- `meta:`
  - `seenToastIds: string[]` (optional de-dupe)
  - `lastEvaluatedTick: number`

### 2.2 Definition Contract

Each achievement definition:
- `id`, `title`, `description`, `category`
- `type`: `instant | threshold | streak | oneRun | modeSpecific | bossSpecific`
- `event`: canonical trigger key (example: `ko`, `chain_up`, `zone_enter`, `mode_start`, `prestige`, `boss_defeat`)
- `threshold` and optional qualifier fields (`zoneId`, `npcType`, `runMode`)
- `points` or `rarity` for UI sorting
- `hidden: boolean`

Suggested categories for V1:
- Core combat (`first_ko`, `combo_10`, `chain_5`, `aerial_chain`)
- Progression (`zone_discovery_*`, `first_prestige`, `campaign_loop`)
- Mode (`first_endless_run`, `first_campaign_run`)
- Mastery (`no_miss_window`, `special_npc_streak`)
- Reserved boss (`boss_*`) as dormant definitions until boss runtime exists

### 2.3 Unlock Logic Pipeline

Proposed flow:
1. Event emitters at existing hooks call `recordAchievementEvent(type, payload)`.
2. Event handler updates lightweight counters/progress.
3. Evaluator checks only definitions mapped to that event type.
4. Newly unlocked IDs:
   - written to `unlocked`
   - pushed into `run.pendingUnlocks` and `toastQueue`
   - persisted via throttled save path

Avoid:
- Full definition scan every frame.
- Unlock evaluation in render path.

### 2.4 Notification UX (Toast + HUD)

Toast behavior proposal:
- Top-right stack below existing HUD row.
- Max 2 visible toasts at once; additional queue.
- Lifetime: ~2.2s visible + eased enter/exit.
- Inputs do not dismiss or block gameplay.

HUD surface proposal:
- Small achievement progress chip cluster near existing chain HUD.
- Example chips:
  - session unlock count
  - tracked objective (optional: "Next milestone")
- Add minimal "Achievements" row in pause menu stats panel.

## 3) Save Strategy (`SAVE_VERSION` + Migration)

### 3.1 Versioning Contract

Introduce:
- `const SAVE_VERSION = 2` in save section.
- Persist `teabag_save` as:
  - `saveVersion`
  - existing fields (`unlockedZones`, `bestPrestige`, `allTimeKOs`, `bestChainCombo`)
  - new `achievements` object

### 3.2 Migration Plan

Legacy states to support:
1. Unversioned saves (current production shape).
2. Partial/corrupt saves (missing keys or bad types).

Migration function proposal:
- `loadProgress()` returns normalized object with defaults.
- If `saveVersion` missing, treat as v1 and migrate to v2.
- Type-check every field; never trust truthy checks for numeric values.
- If migration fails hard, log warning and continue with defaults (no crash).

### 3.3 Compatibility Notes

- Existing `saveProgress()` call sites stay valid and keep writing old fields.
- Achievement data should be additive and optional in early slices.
- No changes to `teabag_sfx` schema required.

## 4) GSAP UI Overhaul Plan

### 4.1 Motion Foundation

Add a small animation facade:
- `tweenUI(target, vars)` wrapper around `window.gsap?.to`
- No-op/fallback assignment path when GSAP unavailable
- Centralize durations/eases in `TUNING.uiTiming` additions

Canvas-compatible approach:
- Tween plain JS state values consumed by draw functions.
- Avoid DOM overlay dependency and avoid replacing RAF loop.

### 4.2 Overhaul Surfaces

Menu screens:
- `drawTitleScreen`: staged reveal (title, subtitle, prompt pulse)
- `drawModeSelect`: selected card scale/offset tween
- `drawZonePicker`: carousel card depth/alpha transitions
- `drawPauseMenu`: row highlight glide and slider micro-interactions

HUD and banners:
- Chain card pulse smoothing (replace sine-only pulse with state tween)
- Center KO + zone transition banner easing unification
- Achievement toast enter/exit motions
- Subtle tracker count bump on unlock events

Polish:
- Reduced-motion flag to shorten/disable nonessential tweens
- Keep readability-first z-order and alpha guards in crowded scenes

## 5) Phased Rollout Slices (With Acceptance + Rollback)

## Slice A0: Scaffolding + Non-Behavioral Plumbing
Scope:
- Add achievement definition table skeleton and event enum.
- Add empty `achievements` runtime container in game context.

Acceptance:
- Game boots and runs unchanged in all modes.
- No unlock UI visible yet.
- No save shape changes yet.

Rollback point:
- Revert new achievement container/definitions only; no gameplay coupling.

## Slice A1: Save Versioning + Migration
Scope:
- Add `SAVE_VERSION`, `loadProgress()` normalization, v1->v2 migration.
- Keep current fields exactly intact.

Acceptance:
- Old unversioned saves load without errors.
- Zero values (`0`) preserved correctly (no truthy-loss bugs).
- New saves include `saveVersion` and empty achievements payload.

Rollback point:
- Keep `SAVE_VERSION` but feature-flag writing achievements section if issues appear.

## Slice A2: Event Hooks + Unlock Engine (No UI)
Scope:
- Hook events at current points:
  - KO/teabag/mount/chain in `updateMountedCombatState`
  - zone enter + prestige in `updateWorldState`/`triggerPrestige`
  - mode start in menu/start flow
- Implement unlock evaluator and in-memory queue.

Acceptance:
- Unlock events fire exactly once per condition.
- No measurable frame regression in stress play.
- Save persists unlocked IDs/progress.

Rollback point:
- Disable evaluator path via one runtime flag while keeping schema.

## Slice A3: Achievement Toast + HUD Surface (Static Timing)
Scope:
- Render toast queue and HUD chips using non-GSAP timing first.
- Add pause-menu summary row for achievements.

Acceptance:
- Toasts appear on unlock, do not block controls.
- Text remains readable over existing postFX and zone banners.
- Desktop and touch prompts remain accurate.

Rollback point:
- Keep unlock engine active; hide toast draw path behind feature gate.

## Slice A4: GSAP Motion Foundation + Menus
Scope:
- Add `tweenUI` wrapper and state-driven menu transitions.
- Animate mode select/zone picker/pause row focus.

Acceptance:
- Menu transitions smooth with no navigation lag.
- GSAP-missing fallback behaves correctly.
- Pause/menu gate logic unchanged.

Rollback point:
- Disable per-screen motion flags and fall back to static draw states.

## Slice A5: GSAP HUD/Banner Polish + Toast Motion
Scope:
- GSAP-driven toast enter/exit.
- HUD emphasis tweens (chain, tracker bump, zone label settle).
- Unified banner easing for KO/zone transition/achievement unlock callouts.

Acceptance:
- No overlap deadlock between center KO and achievement toasts.
- Target frame stability in high-action moments.
- Reduced-motion option verified.

Rollback point:
- Keep toasts functional with static alpha/timer; turn off polish tweens only.

## Slice A6: Boss-Ready Achievement Hook Adapter (No Boss Gameplay)
Scope:
- Add no-op boss event interface and dormant definitions.
- Integrate only if boss runtime object exists in future slices.

Acceptance:
- No current gameplay dependency on boss systems.
- Future campaign boss slices can emit events without reshaping achievement schema.

Rollback point:
- Remove adapter wiring while preserving achievement schema fields.

## 6) Test/Validation Plan

Runtime validation (gameplay-affecting slices):
1. Boot and flow:
   - Title -> mode select -> campaign -> pause/resume -> quit.
   - Title -> endless -> zone picker lock/unlock behavior.
2. Achievement trigger checks:
   - First KO, combo threshold, chain threshold, zone entry, prestige.
   - No duplicate unlock spam across single qualifying event.
3. Save migration:
   - Preload legacy `teabag_save` (unversioned) and confirm migration.
   - Corrupt/partial JSON fallback to defaults without crash.
4. Touch parity:
   - Trigger unlocks via touch controls on mobile viewport.
   - Verify on-screen hint text and behavior consistency.
5. Performance checks:
   - Stress sequence (high NPC action + chain + popups + toasts).
   - Confirm no sustained frame stutter from unlock/tween processing.
6. Motion fallback:
   - Simulate missing GSAP and verify UI remains usable.
   - Reduced-motion toggle verification (if added in slice).

Non-goals for this plan:
- Sound-path validation is not required unless sound runtime/assets are changed in later implementation slices.

## 7) Top-Level Risks To Track During Implementation

1. Save migration regressions:
   - Mitigation: strict normalization + migration tests for legacy payloads.
2. UI clutter/readability in overlay stack:
   - Mitigation: toast lane separation, strict max visible toasts, z-order policy.
3. Frame-time spikes from naive unlock checks:
   - Mitigation: event-indexed evaluator and throttled persistence writes.
4. Input parity drift after UI prompt changes:
   - Mitigation: parity checklist for keyboard + touch + hint copy in every slice.
5. GSAP dependency fragility:
   - Mitigation: wrapper with no-GSAP fallback and per-surface feature flags.

## 8) Open Product Questions (Needs Decisions)

1. Achievement set size for V1:
   - Small curated list (~20) vs broad list (~40+).
2. Hidden achievements:
   - Include at launch or defer.
3. Completion reward:
   - Cosmetic badge only vs gameplay-neutral bonus labels.
4. Toast behavior:
   - Stack depth and whether duplicate unlock events should re-toast.
5. Cross-mode semantics:
   - Shared unlocks across campaign/endless or mode-specific completion tracks.
6. Boss achievements timing:
   - Ship dormant definitions now or activate only with first boss slice.
7. Visibility surface:
   - Add dedicated achievements screen in pause menu now or defer to later UI pass.

## 9) Ready-To-Implement Exit Criteria

Implementation should begin only when all are true:
- Slice order and acceptance gates are approved.
- Product answers are provided for at least questions 1, 3, and 4 above.
- Save migration contract (`SAVE_VERSION=2`) is accepted.
- Toast/HUD placement is approved against current HUD density.
- Fallback policy (no GSAP / reduced motion) is accepted.
