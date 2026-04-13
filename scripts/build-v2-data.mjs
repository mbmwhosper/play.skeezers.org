import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const configPath = resolve(root, 'config.jsonc');
const overridesPath = resolve(root, 'data/game-overrides.json');
const outPath = resolve(root, 'js/catalog-v2.js');

const rawConfig = readFileSync(configPath, 'utf8');
const configJson = JSON.parse(rawConfig.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => (g ? '' : m)));
const overrides = JSON.parse(readFileSync(overridesPath, 'utf8'));
const showcasePath = resolve(root, 'data/library-showcase.json');
const showcase = JSON.parse(readFileSync(showcasePath, 'utf8'));
const showcaseBySlug = new Map((showcase.featured || []).map((entry) => [entry.slug, entry]));
const libraryItemsPath = resolve(root, 'data/library-items.json');
const libraryItems = JSON.parse(readFileSync(libraryItemsPath, 'utf8'));
const featuredCollectionsPath = resolve(root, 'data/featured-collections.json');
const featuredCollections = JSON.parse(readFileSync(featuredCollectionsPath, 'utf8'));
const externalHostingPlanPath = resolve(root, 'data/external-hosting-plan.json');
const externalHostingPlan = JSON.parse(readFileSync(externalHostingPlanPath, 'utf8'));
const externalHostingBySlug = new Map((externalHostingPlan.oversizedGames || []).map((entry) => [entry.slug, entry]));

const genreMap = new Map([
  ['online', 'multiplayer'],
  ['battle', 'battle'],
  ['escape', 'escape'],
  ['sandbox', 'sandbox'],
  ['simulation', 'simulation'],
  ['strategy', 'strategy'],
  ['tower-defense', 'tower-defense'],
  ['tower defense', 'tower-defense'],
  ['runner', 'runner'],
  ['arcade', 'arcade'],
  ['fps', 'fps'],
  ['party', 'party'],
  ['sports', 'sports'],
  ['puzzle', 'puzzle'],
  ['platformer', 'platformer'],
  ['tycoon', 'tycoon'],
  ['idle', 'idle'],
  ['rts', 'strategy'],
  ['boardgame', 'boardgame'],
]);

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function inferSource(path) {
  if (/^https?:\/\//i.test(path)) return 'external';
  if (path.startsWith('flash/')) return 'flash';
  return 'local';
}

function inferGenres(name, categories) {
  const lower = name.toLowerCase();
  const genres = new Set((categories || []).map((c) => genreMap.get(String(c).toLowerCase()) || String(c).toLowerCase()));
  if (lower.includes('.io')) genres.add('multiplayer');
  if (lower.includes('random')) genres.add('party');
  if (lower.includes('clicker')) genres.add('idle');
  if (lower.includes('run')) genres.add('runner');
  if (lower.includes('chess')) genres.add('boardgame');
  if (lower.includes('kart')) genres.add('racing');
  if (lower.includes('surfers')) genres.add('runner');
  return [...genres].filter(Boolean);
}

function inferPlayers(name, genres) {
  const lower = name.toLowerCase();
  if (genres.includes('multiplayer') || genres.includes('party') || lower.includes('.io')) return { min: 2, max: 16 };
  return { min: 1, max: 1 };
}

function inferSessionLength(name, genres) {
  const lower = name.toLowerCase();
  if (genres.includes('idle') || genres.includes('sandbox') || genres.includes('strategy')) return 'long';
  if (genres.includes('runner') || genres.includes('arcade') || lower.includes('random')) return 'short';
  return 'medium';
}

function inferMoods(name, genres) {
  const lower = name.toLowerCase();
  const moods = new Set();
  if (genres.includes('puzzle') || genres.includes('idle') || genres.includes('sandbox')) moods.add('chill');
  if (genres.includes('multiplayer') || genres.includes('fps') || genres.includes('sports')) moods.add('competitive');
  if (genres.includes('party') || lower.includes('random')) moods.add('chaotic');
  if (genres.includes('strategy') || genres.includes('tower-defense')) moods.add('strategic');
  if (!moods.size) moods.add('arcade');
  return [...moods];
}

const games = Object.entries(configJson.games).map(([name, data]) => {
  const path = data?.path || '';
  const sourceType = inferSource(path);
  const genres = inferGenres(name, data?.categories || []);
  const override = overrides[name] || {};
  const slug = slugify(name);
  const showcaseEntry = showcaseBySlug.get(slug) || {};
  const hostingPlan = externalHostingBySlug.get(slug);
  return {
    id: slug,
    slug,
    name,
    path,
    url: sourceType === 'external' ? path : `games/${path}`,
    sourceType,
    iframeSafe: sourceType !== 'external',
    aliases: data?.aliases || [],
    categories: data?.categories || [],
    genres: override.genres || genres,
    features: override.features || [],
    players: override.players || inferPlayers(name, override.genres || genres),
    sessionLength: override.sessionLength || inferSessionLength(name, override.genres || genres),
    moods: override.moods || inferMoods(name, override.genres || genres),
    difficulty: override.difficulty || 'medium',
    coverGradient: showcaseEntry.coverGradient || '',
    eyebrow: showcaseEntry.eyebrow || '',
    externalHostingStatus: hostingPlan?.status || '',
    externalHostingReason: hostingPlan?.reason || '',
    futureBaseUrl: hostingPlan?.futureBaseUrl || '',
  };
});

const mergedItems = [...games, ...((libraryItems.items || []).map((item) => ({
  id: item.slug,
  slug: item.slug,
  name: item.name,
  path: item.path || '',
  url: item.url || '#',
  sourceType: item.sourceType || 'external',
  iframeSafe: Boolean(item.iframeSafe),
  aliases: item.aliases || [],
  categories: item.categories || [],
  genres: item.genres || [],
  features: item.features || [],
  players: item.players || { min: 1, max: 1 },
  sessionLength: item.sessionLength || 'medium',
  moods: item.moods || [],
  difficulty: item.difficulty || 'medium',
  coverGradient: item.coverGradient || '',
  eyebrow: item.eyebrow || '',
  type: item.type || 'app',
  description: item.description || '',
  featured: Boolean(item.featured),
  tags: item.tags || [],
})))];

const output = {
  generatedAt: new Date().toISOString(),
  totals: {
    items: mergedItems.length,
    games: mergedItems.filter((g) => (g.type || 'game') === 'game').length,
    apps: mergedItems.filter((g) => g.type === 'app').length,
    emulators: mergedItems.filter((g) => g.type === 'emulator').length,
    proxy: mergedItems.filter((g) => g.type === 'proxy').length,
    local: mergedItems.filter((g) => g.sourceType === 'local').length,
    flash: mergedItems.filter((g) => g.sourceType === 'flash').length,
    external: mergedItems.filter((g) => g.sourceType === 'external').length,
  },
  games: mergedItems,
  collections: featuredCollections.collections || [],
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `window.catalogV2 = ${JSON.stringify(output)};\n`, 'utf8');
console.log(`Built ${mergedItems.length} catalog entries -> ${outPath}`);
