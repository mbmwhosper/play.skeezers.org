# Skeezers Arcade v2 deploy checklist

## What is already done in repo
- Cloudflare Pages-friendly build command is in place
- `_headers` and `_redirects` are present
- hash-route compatibility is in place for legacy patterns
- rebuilt catalog and curated collections are generated into `js/catalog-v2.js`

## What to verify before cutover
1. `npm run build:pages` passes locally or in Cloudflare Pages
2. preview deploy loads homepage correctly
3. `#item/<slug>` and legacy `#game/<slug>` links reopen correctly on refresh
4. a few known games still preserve local save continuity under `play.skeezers.org`
5. custom domain `play.skeezers.org` is attached in Cloudflare Pages
6. DNS points the live site at the Pages project

## Manual post-cutover smoke test
- launch a few iframe-safe local games
- open one app/reference surface
- open one emulator detail page
- test mobile nav/menu
- verify continue/recent/favorites still persist in browser storage

## If something breaks
- compare localStorage keys under old and rebuilt shell
- inspect game iframe path changes
- confirm oversized games are intentionally routed to detail pages until external hosting is wired
- check Cloudflare Pages redirect and header handling
