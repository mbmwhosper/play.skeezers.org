# Cloudflare Pages migration notes

## Recommended target
- Host: Cloudflare Pages
- Production domain: `play.skeezers.org`
- DNS remains in Cloudflare

## Why move from GitHub Pages
- Faster deploy propagation
- Better preview deploys
- Better fit since DNS is already on Cloudflare
- Simpler control over redirects/headers for the rebuild

## Suggested Cloudflare Pages settings
- Framework preset: None
- Build command: `npm run build:v2-data`
- Build output directory: `.`
- Root directory: `/`
- Node version: 22

## Important compatibility notes
- Keep `play.skeezers.org` unchanged so browser game saves remain same-origin.
- Preserve legacy game paths where possible.
- Keep SPA fallback enabled so deep links like `#game/...` and future routes survive reloads.
- `_headers` and `_redirects` are included for Pages compatibility.

## Suggested cutover plan
1. Connect repo to Cloudflare Pages.
2. Configure build command and output directory.
3. Test the generated preview URL.
4. Add `play.skeezers.org` as a custom domain in Pages.
5. In Cloudflare DNS, repoint the current Pages target to Cloudflare Pages when preview looks good.
6. Verify game launches, save continuity, and route reloads.

## Smoke test checklist
- Homepage loads on preview and production.
- `npm run build:v2-data` runs during deploy.
- Existing game paths still open.
- Existing browser saves still appear for games that use same-origin storage.
- Deep links reload correctly.
- Custom domain TLS is valid.
