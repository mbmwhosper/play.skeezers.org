# Proxy engine integration

This repo no longer treats the proxy surface as a fake reference card only. It now has a real request path and runtime wiring for a minimal self-hosted proxy flow.

## What is now wired
- `proxy-worker.mjs`
  - handles `/service/proxy/<urlencoded-target>`
  - forwards upstream requests through the Cloudflare Worker entrypoint
  - strips frame-blocking headers so the workspace iframe can load proxied content
- `wrangler.proxy.toml`
  - deploys the proxy route as a standalone Worker, separate from the oversized static game hosting
- `js/proxy-engine.js`
  - normalizes proxy base paths
  - falls back to same-origin `/service/proxy/` when config points at some unrelated host
  - builds launch URLs for proxy targets
- `js/index.js`
  - treats proxy items as real launch targets when a target URL exists
  - opens them in the existing workspace iframe flow
  - surfaces proxy engine status in the detail panel
- `js/catalog-v2.js`
  - proxy entry now carries `proxyTargetUrl`

## Route shape
`/service/proxy/<urlencoded-target>`

Example:
`/service/proxy/https%3A%2F%2Fexample.org%2F`

## Current limitation
This is a minimal upstream bridge, not a stealth-grade full web proxy. It will work best for simple sites and narrow workspace flows. Complex apps that require URL rewriting, service workers, cookie isolation, websocket proxying, or asset HTML mutation will still want a fuller engine.

## Next upgrade paths
1. Replace the minimal bridge with a full Ultraviolet or Interstellar-compatible backend
2. Add HTML/CSS/JS rewriting for relative asset correctness
3. Add websocket and cookie/session handling
4. Add allowlist and abuse controls before exposing publicly

## Important note
This still cannot run on plain GitHub Pages alone. The active proxy route depends on the Worker runtime.

Also, because the arcade contains files above Cloudflare's 25 MiB asset ceiling, the proxy Worker is deployed separately from the main static game host.
