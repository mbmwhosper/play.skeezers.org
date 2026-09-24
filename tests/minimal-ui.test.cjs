const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js/index.js'), 'utf8');

// Match the already-built minimal Skeezers shell.
assert.match(html, /class="site-header"/);
assert.match(html, /class="brand"/);
assert.match(html, /class="hero"/);
assert.match(html, /<h1>Pick a game\.<\/h1>/);
assert.match(html, /id="summary"/);
assert.match(html, /id="search"/);
assert.match(html, /id="gameList"/);
assert.match(html, /id="player"/);

// The dashboard/card/filter redesign is explicitly unwanted.
for (const unwanted of [
  'class="sidebar"',
  'class="topbar"',
  'id="category"',
  'id="sort"',
  'id="modeFilter"',
  'id="vibeFilter"',
  'id="iframeSafeOnly"',
  'id="favoritesOnly"',
  'id="spotlights"',
  'id="shelves"',
  'id="gamesGrid"',
  'class="hero-panels"',
]) assert.equal(html.includes(unwanted), false, `unexpected dashboard UI: ${unwanted}`);

assert.match(css, /\.game-list\s*\{/);
assert.match(css, /\.game-row\s*\{/);
assert.equal(/\.card\s*\{/.test(css), false, 'card component must be removed');
assert.equal(/\.filter-summary\s*\{/.test(css), false, 'filter component must be removed');

assert.match(js, /gameList/);
assert.match(js, /function renderList/);
assert.equal(js.includes('function renderGrid'), false);
assert.equal(js.includes('function renderFilterSummary'), false);
assert.equal(js.includes('function renderShelves'), false);
assert.equal(js.includes('function renderSpotlights'), false);

console.log('minimal-ui contract: PASS');
