# CLAUDE.md

This file supplements `AGENTS.md` for this repo.

- `AGENTS.md` holds the short hard rules.
- `CLAUDE.md` holds the fuller operating protocol when a rule needs more execution detail.
- If both files apply, follow both together.

## Playwright Session Hygiene

When using Playwright CLI or `@playwright/test` in this repo:

1. Capture a baseline snapshot of relevant processes before launch.
   - Include likely overlapping `playwright`, browser, `node`, `zsh`, helper, `crashpad`, and dev-server or Playwright-started `webServer` processes.
2. Launch the session and record the IDs of any newly spawned children tied to that run.
3. Identify the full session-owned process tree after launch.
   - Treat `playwright`, browser, `node`, `zsh`, helper, `crashpad`, and Playwright-started `webServer` processes as cleanup candidates only if they belong to that session and were not already present in the baseline snapshot.
4. After finishing the bugfix or test flow, close only the leftover processes from that session-owned tree.
   - Prefer graceful shutdown first.
   - Never kill pre-existing browser sessions, unrelated shells, or shared dev servers that were already running before launch.
5. Verify the recorded session-owned leftovers are gone before wrapping up.
   - If any remain, report that explicitly instead of assuming cleanup succeeded.

Repeat this process for each separate Playwright launch in the task.
