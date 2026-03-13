# Tech Debt

## HTML Formatting + Inline Script Linting

Status: deferred on purpose until it can be done as a low-risk maintenance pass.

Scope:
- `teabag-simulator.html`
- `sound-designer.html`
- `index.html`
- `SCHEMATICS.md`
- local formatter/linter scripts/config

Why this is deferred:
- Formatting the HTML files will create a large one-time diff with mostly whitespace and wrapping churn.
- Reformatting `teabag-simulator.html` will move line anchors, so `SCHEMATICS.md` must be resynced in the same task.
- ESLint does not lint inline `<script>` blocks in HTML by default, so the game/runtime HTML needs a dedicated extraction or HTML-aware lint path.

Recommended execution order:
1. Run a dedicated Prettier formatting pass for the HTML files only.
2. Update `SCHEMATICS.md` immediately after the `teabag-simulator.html` line numbers shift.
3. Add a reliable inline-script lint command for `teabag-simulator.html` and `sound-designer.html`.

Acceptance notes for the future pass:
- Keep the formatting work in isolated commits so review stays readable.
- Do not mix gameplay logic changes with the formatting sweep.
- Re-run `node --check` on extracted inline JS after the lint support is added.
