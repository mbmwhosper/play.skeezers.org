# Feature Roadmap (Draft)

Note: this is captured as-is from planning discussion. Next step is to flesh this into mechanical implementation slices with acceptance gates (similar to refactor slices).
Campaign/boss-mode planning companion: `docs/planning/CAMPAIGN_BOSS_ROADMAP.md`.

## Shared Foundation (Do This Once First)

1. Add a single runtime-effects surface in state, e.g. `gameCtx.state.runModifiers`, `gameCtx.state.activeZoneEvent`, `gameCtx.state.zoneEventTimer`.
2. Add one aggregator helper that returns merged multipliers for the current frame (instead of scattering ad-hoc math), fed by run modifiers + elites + zone event.
3. Keep base balance in `TUNING` (`teabag-simulator.html:370`) and apply runtime multipliers at coordinator/deep-call boundaries only.
4. Render effect labels in HUD (`teabag-simulator.html:3701`) so players always know what is active.

## 1) Run Modifiers

1. Design target: each run feels different in first 10 seconds without needing new content assets.
2. V1 rule set: roll 2 modifiers at `startGame(gameCtx)` (`teabag-simulator.html:2821`), one "player-side" and one "world-side," with mutual exclusions.
3. Suggested starter modifiers:
1. `Glass Cannon`: teabag damage up, NPC contact safety down (or mount window stricter).
2. `Heavy Air`: lower jump height, stronger score multiplier.
3. `Rage Crowd`: NPC spawn pressure up, chain window slightly up.
4. `Clean Combo`: combo decay slower, KO base score slightly lower.
4. Hook points:
1. Assign at run start in `startGame(gameCtx)` (`teabag-simulator.html:2821`).
2. Apply movement/combat multipliers in `updatePlayerMovementAndJump` (`teabag-simulator.html:3017`) and `updateMountedCombatState` (`teabag-simulator.html:3145`).
3. Apply spawn pressure multipliers in `updateNPCSpawning` (`teabag-simulator.html:3346`).
4. Show active chips in `renderHUDLayer(gameCtx)` (`teabag-simulator.html:3701`).
5. Balance guardrails:
1. Keep modifier multipliers in ~0.8x to 1.3x for V1.
2. For any negative player modifier, pair with score upside so it still feels rewarding.
3. Never stack two modifiers that both reduce control precision in V1.
6. Risk to watch: "invisible difficulty." Mitigation: always-visible HUD chips + one-line start banner.

## 2) Elite NPC Variants

1. Design target: make known NPC roster feel fresh via instance-level variance, not new art.
2. V1 rule set: low elite chance on spawn, rising by prestige/zone depth; elites get affix behavior + visual tag + KO bonus.
3. Suggested V1 affixes:
1. `Tank`: +HP, lower knockback.
2. `Skittish`: faster panic/flee transitions.
3. `Anchor`: harder to dismount from, lower chain carry consistency.
4. `Sprinter`: burst reposition behavior after near-mount.
4. Hook points:
1. Assign elite affix on NPC creation in spawn model (`teabag-simulator.html:2644` + spawn flow around `teabag-simulator.html:3346`).
2. Consume affix behavior in `updateNPCFSM` (`teabag-simulator.html:3285`) and mounted combat checks (`teabag-simulator.html:3145`).
3. Add elite visual language in entity rendering around `drawCharacter` path (`teabag-simulator.html:3574` / `teabag-simulator.html:2068`).
4. Add KO text/score bonus via KO tracking flow (`teabag-simulator.html:2719`, `teabag-simulator.html:3145`).
5. Balance guardrails:
1. Start elite chance around 6-10%, cap around 25%.
2. Ensure no affix hard-counters core loop (mount -> bag -> launch).
3. Reward elites with clear points/feedback so difficulty feels fair.
6. Risk to watch: readability in crowds. Mitigation: one strong visual mark (outline/crown color), not multiple subtle effects.

## 3) Zone Events

1. Design target: zones feel alive beyond background art, with short "match states."
2. V1 rule set: event roll on zone entry with cooldown; one active event max; lasts 15-30s.
3. Suggested V1 events:
1. Downtown `Rush Hour`: more cars + denser NPC lanes.
2. Park `Fog Bank`: visibility/postFX change + slightly slower NPC reaction.
3. Red Light `After Hours`: higher special/elite chance.
4. Industrial `Shift Change`: burst spawn waves near bus/platform clusters.
4. Hook points:
1. Trigger/clear in zone progression logic at `updateWorldState(gameCtx, dt, p)` (`teabag-simulator.html:3390`).
2. Feed event multipliers into spawn/FSM at `teabag-simulator.html:3346` and `teabag-simulator.html:3285`.
3. Render event atmosphere via `renderPostFX` (`teabag-simulator.html:3655`) plus label in HUD (`teabag-simulator.html:3701`).
4. Announce start/end through existing center banner flow near zone transitions (`teabag-simulator.html:3390` + HUD paths).
5. Balance guardrails:
1. Cooldown between events so pacing breathes.
2. Keep first implementation additive, not punitive.
3. Avoid events that remove core control reliability.
6. Risk to watch: "too much at once" when paired with modifiers/elites. Mitigation: cap active complexity to run modifiers + one zone event + normal elite chance.

## Recommended Build Sequence

1. Shared runtime-effects foundation.
2. Run Modifiers (fastest replay-value win).
3. Elite NPCs.
4. Zone Events (easy after effect plumbing exists).

## Next Planning Task

Create `FEATURE_SLICES_123.md` with strict, mechanical slices and acceptance gates for:

1. Shared foundation
2. Run modifiers
3. Elite NPC variants
4. Zone events
