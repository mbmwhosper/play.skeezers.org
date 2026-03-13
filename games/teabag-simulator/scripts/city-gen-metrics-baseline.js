#!/usr/bin/env node
"use strict";

/**
 * Deterministic baseline harness for current building generation behavior.
 * Mirrors teabag-simulator.html generation loop structure for B0 analysis.
 */

const W = 960;
const CAMERA_LEAD_FACTOR = 0.35;
const START_X_OFFSET_ENDLESS = 200;
const BOOTSTRAP_GEN_SEED_PAD = 200;

const ZONES = [
  {
    id: "downtown",
    width: 13000,
    buildingColors: ["#7B8794", "#616E7C", "#9AA5B4", "#52606D", "#8896A4", "#6B7B8D"],
    accentColors: ["#E53E3E", "#DD6B20", "#D69E2E", "#38A169", "#3182CE", "#805AD5"],
    propTypes: ["lamp", "hydrant", "bench"],
    propWeights: { lamp: 40, hydrant: 25, bench: 15 },
    bgBuildingHeightRange: [180, 380]
  },
  {
    id: "shopping",
    width: 13000,
    buildingColors: ["#C8B896", "#B8A67E", "#D4C4A0", "#A89878", "#BCA86E", "#D0B880"],
    accentColors: ["#E53E3E", "#FF6B6B", "#FFD700", "#FF8C42", "#FF69B4", "#00CED1"],
    propTypes: ["lamp", "sign", "awning_pole", "bench"],
    propWeights: { lamp: 25, sign: 30, awning_pole: 30, bench: 15 },
    bgBuildingHeightRange: [100, 200]
  },
  {
    id: "park",
    width: 13000,
    buildingColors: ["#6B8E6B", "#5A7E5A", "#7B9E7B", "#4A6E4A", "#88AA88", "#3D6B3D"],
    accentColors: ["#38A169", "#48BB78", "#68D391", "#2F855A", "#9AE6B4", "#276749"],
    propTypes: ["tree", "bush", "fountain", "bench"],
    propWeights: { tree: 35, bush: 30, fountain: 5, bench: 30 },
    bgBuildingHeightRange: [120, 250]
  },
  {
    id: "redlight",
    width: 13000,
    buildingColors: ["#3D1F4E", "#4A2060", "#2D1040", "#5A2878", "#3A1848", "#4D2868"],
    accentColors: ["#FF1493", "#FF00FF", "#FF69B4", "#00FFFF", "#FF4500", "#FFD700"],
    propTypes: ["lamp", "neon_sign"],
    propWeights: { lamp: 40, neon_sign: 60 },
    bgBuildingHeightRange: [150, 300]
  },
  {
    id: "industrial",
    width: 13000,
    buildingColors: ["#6B6B6B", "#5A5A5A", "#7B7B7B", "#4A4A4A", "#8A8A8A", "#555555"],
    accentColors: ["#DD6B20", "#E8A020", "#FFD700", "#F0A030", "#C05621", "#E07020"],
    propTypes: ["lamp", "pipe", "barrel", "smokestack_small"],
    propWeights: { lamp: 20, pipe: 30, barrel: 30, smokestack_small: 20 },
    bgBuildingHeightRange: [160, 320]
  },
  {
    id: "suburbs",
    width: 13000,
    buildingColors: ["#E8D8C4", "#D4C4B0", "#F0E0CC", "#C8B8A4", "#DCC8B4", "#ECD4C0"],
    accentColors: ["#E53E3E", "#3182CE", "#38A169", "#805AD5", "#DD6B20", "#D69E2E"],
    propTypes: ["lamp", "mailbox", "fence_segment", "garden_bush"],
    propWeights: { lamp: 15, mailbox: 25, fence_segment: 35, garden_bush: 25 },
    bgBuildingHeightRange: [80, 160]
  }
];

const CITY_GAP_PROFILE = Object.freeze({
  downtown: Object.freeze({
    fg: Object.freeze({ min: 16, max: 86, largeGapChance: 0.15, largeMin: 110, largeMax: 190 }),
    bg: Object.freeze({ min: 12, max: 70, largeGapChance: 0.2, largeMin: 90, largeMax: 170 })
  }),
  shopping: Object.freeze({
    fg: Object.freeze({ min: 10, max: 76, largeGapChance: 0.12, largeMin: 96, largeMax: 170 }),
    bg: Object.freeze({ min: 10, max: 66, largeGapChance: 0.2, largeMin: 86, largeMax: 160 })
  }),
  park: Object.freeze({
    fg: Object.freeze({ min: 24, max: 112, largeGapChance: 0.18, largeMin: 132, largeMax: 230 }),
    bg: Object.freeze({ min: 16, max: 76, largeGapChance: 0.24, largeMin: 98, largeMax: 180 })
  }),
  redlight: Object.freeze({
    fg: Object.freeze({ min: 14, max: 84, largeGapChance: 0.15, largeMin: 110, largeMax: 184 }),
    bg: Object.freeze({ min: 12, max: 70, largeGapChance: 0.2, largeMin: 90, largeMax: 170 })
  }),
  industrial: Object.freeze({
    fg: Object.freeze({ min: 8, max: 64, largeGapChance: 0.1, largeMin: 82, largeMax: 150 }),
    bg: Object.freeze({ min: 10, max: 68, largeGapChance: 0.2, largeMin: 88, largeMax: 162 })
  }),
  suburbs: Object.freeze({
    fg: Object.freeze({ min: 20, max: 98, largeGapChance: 0.16, largeMin: 122, largeMax: 208 }),
    bg: Object.freeze({ min: 14, max: 72, largeGapChance: 0.22, largeMin: 92, largeMax: 174 })
  }),
  default: Object.freeze({
    fg: Object.freeze({ min: 14, max: 82, largeGapChance: 0.15, largeMin: 108, largeMax: 184 }),
    bg: Object.freeze({ min: 12, max: 70, largeGapChance: 0.2, largeMin: 90, largeMax: 170 })
  })
});

function parseArgs(argv) {
  const cfg = {
    seeds: 20,
    span: 120000,
    seedStart: 1,
    json: false
  };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--seeds" && i + 1 < argv.length) cfg.seeds = Math.max(1, Number(argv[++i]));
    else if (token === "--span" && i + 1 < argv.length)
      cfg.span = Math.max(1000, Number(argv[++i]));
    else if (token === "--seed-start" && i + 1 < argv.length) cfg.seedStart = Number(argv[++i]);
    else if (token === "--json") cfg.json = true;
  }
  return cfg;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatPct(x) {
  return `${(x * 100).toFixed(2)}%`;
}

function mean(arr) {
  if (arr.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < arr.length; i++) total += arr[i];
  return total / arr.length;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const t = idx - lo;
  return sorted[lo] * (1 - t) + sorted[hi] * t;
}

function computeGapStats(gaps) {
  if (gaps.length === 0) {
    return {
      count: 0,
      mean: 0,
      p05: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      min: 0,
      max: 0
    };
  }
  const sorted = gaps.slice().sort((a, b) => a - b);
  return {
    count: gaps.length,
    mean: mean(gaps),
    p05: percentile(sorted, 0.05),
    p25: percentile(sorted, 0.25),
    p50: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.9),
    p95: percentile(sorted, 0.95),
    min: sorted[0],
    max: sorted[sorted.length - 1]
  };
}

function analyzeEdgeSpacing(buildings) {
  if (buildings.length < 2) return { pairCount: 0, overlapCount: 0, overlapRate: 0, gaps: [] };
  const ordered = buildings.slice().sort((a, b) => a.x - b.x);
  const gaps = [];
  let overlapCount = 0;
  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1];
    const curr = ordered[i];
    const gap = curr.x - (prev.x + prev.w);
    gaps.push(gap);
    if (gap < 0) overlapCount++;
  }
  const pairCount = gaps.length;
  return {
    pairCount,
    overlapCount,
    overlapRate: pairCount > 0 ? overlapCount / pairCount : 0,
    gaps
  };
}

function createBucket() {
  return {
    fg: {
      right: { pairCount: 0, overlapCount: 0, gaps: [] },
      left: { pairCount: 0, overlapCount: 0, gaps: [] }
    },
    bg: {
      right: { pairCount: 0, overlapCount: 0, gaps: [] },
      left: { pairCount: 0, overlapCount: 0, gaps: [] }
    }
  };
}

function appendStats(bucket, layer, dir, stats) {
  const target = bucket[layer][dir];
  target.pairCount += stats.pairCount;
  target.overlapCount += stats.overlapCount;
  target.gaps.push(...stats.gaps);
}

function summarizeBucket(bucket) {
  function summarizeLayerDir(layerDir) {
    return {
      pairCount: layerDir.pairCount,
      overlapCount: layerDir.overlapCount,
      overlapRate: layerDir.pairCount > 0 ? layerDir.overlapCount / layerDir.pairCount : 0,
      gap: computeGapStats(layerDir.gaps)
    };
  }

  function summarizeLayer(layer) {
    const right = summarizeLayerDir(layer.right);
    const left = summarizeLayerDir(layer.left);
    const pairCount = right.pairCount + left.pairCount;
    const overlapCount = right.overlapCount + left.overlapCount;
    const combinedGaps = layer.right.gaps.concat(layer.left.gaps);
    return {
      overall: {
        pairCount,
        overlapCount,
        overlapRate: pairCount > 0 ? overlapCount / pairCount : 0,
        gap: computeGapStats(combinedGaps)
      },
      right,
      left
    };
  }

  return {
    fg: summarizeLayer(bucket.fg),
    bg: summarizeLayer(bucket.bg)
  };
}

function runZoneSeed(zone, seed, span) {
  const random = mulberry32(seed);
  const rand = (a, b) => a + random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));

  const fgRight = [];
  const fgLeft = [];
  const bgRight = [];
  const bgLeft = [];
  const props = [];

  function getZoneAtX() {
    return { zone };
  }

  function sampleCityGap(zoneId, layer) {
    const zoneProfile = CITY_GAP_PROFILE[zoneId] || CITY_GAP_PROFILE.default;
    const profile = zoneProfile[layer] || CITY_GAP_PROFILE.default[layer];
    if (random() < profile.largeGapChance) return randInt(profile.largeMin, profile.largeMax);
    return randInt(profile.min, profile.max);
  }

  function advanceCityCursor(cursor, dir, width, zoneId, layer) {
    const gap = sampleCityGap(zoneId, layer);
    return cursor + (Math.max(0, width) + gap) * dir;
  }

  function genBuilding(x, layer, zoneArg) {
    const z = zoneArg;
    const bColors = z.buildingColors;
    const aColors = z.accentColors;
    const hRange = z.bgBuildingHeightRange || [180, 380];
    const zid = z.id;
    let w;
    let h;

    if (layer === "bg") {
      w = randInt(50, 120);
      h = randInt(hRange[0], hRange[1]);
    } else if (zid === "shopping") {
      w = randInt(80, 160);
      h = randInt(90, 160);
    } else if (zid === "park") {
      w = randInt(40, 80);
      h = randInt(60, 110);
    } else if (zid === "industrial") {
      w = randInt(100, 200);
      h = randInt(100, 220);
    } else if (zid === "suburbs") {
      w = randInt(70, 130);
      h = randInt(80, 150);
    } else {
      w = randInt(60, 140);
      h = randInt(150, 320);
    }

    // Consume same random index picks as runtime.
    randInt(0, bColors.length - 1);
    randInt(0, aColors.length - 1);

    const windowCols = Math.floor(w / 20);
    const windowRows = Math.floor(h / 25);
    for (let r = 0; r < windowRows; r++) {
      for (let c = 0; c < windowCols; c++) {
        random(); // lit
        random(); // nightLit
      }
    }

    // Consume zone-specific random draws.
    if (zid === "shopping" && layer !== "bg") {
      randInt(0, aColors.length - 1);
      randInt(0, aColors.length - 1);
      random();
    } else if (zid === "redlight" && layer !== "bg") {
      randInt(0, 5);
      randInt(1, 3);
    } else if (zid === "industrial" && layer !== "bg") {
      random();
      random();
    }

    return { x, w };
  }

  function pickZoneProp(zoneArg) {
    const z = zoneArg;
    const types = z.propTypes;
    const weights = z.propWeights;
    const totalW = types.reduce((s, t) => s + (weights[t] || 10), 0);
    let r = random() * totalW;
    for (let i = 0; i < types.length; i++) {
      const t = types[i];
      r -= weights[t] || 10;
      if (r <= 0) return t;
    }
    return types[0];
  }

  function createProp(type, x, zoneId) {
    const p = { type, x, zoneId };
    if (type === "neon_sign") {
      randInt(0, 5);
      randInt(12, 24);
      randInt(6, 12);
    }
    if (type === "tree") {
      randInt(30, 50);
      randInt(18, 30);
      randInt(0, 4);
    }
    if (type === "garden_bush") {
      randInt(0, 3);
      randInt(8, 14);
    }
    if (type === "fence_segment") {
      randInt(30, 60);
    }
    return p;
  }

  function generateCity(leftBound, rightBound) {
    let cityGenRight = START_X_OFFSET_ENDLESS - BOOTSTRAP_GEN_SEED_PAD;
    let cityGenLeft = START_X_OFFSET_ENDLESS - BOOTSTRAP_GEN_SEED_PAD;
    let bgGenRight = START_X_OFFSET_ENDLESS - BOOTSTRAP_GEN_SEED_PAD;
    let bgGenLeft = START_X_OFFSET_ENDLESS - BOOTSTRAP_GEN_SEED_PAD;

    while (cityGenRight < rightBound + 300) {
      const zoneNow = getZoneAtX(cityGenRight).zone;
      const b = genBuilding(cityGenRight, "fg", zoneNow);
      fgRight.push({ x: b.x, w: b.w });
      if (random() > 0.5)
        props.push(createProp(pickZoneProp(zoneNow), b.x + rand(10, 50), zoneNow.id));
      if (random() > 0.7)
        props.push(createProp(pickZoneProp(zoneNow), b.x + rand(20, 80), zoneNow.id));
      cityGenRight = advanceCityCursor(cityGenRight, 1, b.w, zoneNow.id, "fg");
    }

    while (cityGenLeft > leftBound - 300) {
      const zoneNow = getZoneAtX(cityGenLeft).zone;
      const b = genBuilding(cityGenLeft, "fg", zoneNow);
      b.x = cityGenLeft - b.w;
      fgLeft.push({ x: b.x, w: b.w });
      if (random() > 0.5)
        props.push(createProp(pickZoneProp(zoneNow), b.x + rand(10, 50), zoneNow.id));
      if (random() > 0.7)
        props.push(createProp(pickZoneProp(zoneNow), b.x + rand(20, 80), zoneNow.id));
      cityGenLeft = advanceCityCursor(cityGenLeft, -1, b.w, zoneNow.id, "fg");
    }

    const bgRightBound = rightBound + W / 0.3;
    while (bgGenRight < bgRightBound) {
      const zoneNow = getZoneAtX(bgGenRight).zone;
      const b = genBuilding(bgGenRight, "bg", zoneNow);
      bgRight.push({ x: b.x, w: b.w });
      bgGenRight = advanceCityCursor(bgGenRight, 1, b.w, zoneNow.id, "bg");
    }

    const bgLeftBound = leftBound - W / 0.3;
    while (bgGenLeft > bgLeftBound) {
      const zoneNow = getZoneAtX(bgGenLeft).zone;
      const b = genBuilding(bgGenLeft, "bg", zoneNow);
      b.x = bgGenLeft - b.w;
      bgLeft.push({ x: b.x, w: b.w });
      bgGenLeft = advanceCityCursor(bgGenLeft, -1, b.w, zoneNow.id, "bg");
    }
  }

  const startX = START_X_OFFSET_ENDLESS;
  const camX = startX - W * CAMERA_LEAD_FACTOR;
  const rightBound = Math.max(camX + W + 500, span);
  const leftBound = Math.min(camX - 500, -span);
  generateCity(leftBound, rightBound);

  return {
    fgRight: analyzeEdgeSpacing(fgRight),
    fgLeft: analyzeEdgeSpacing(fgLeft),
    bgRight: analyzeEdgeSpacing(bgRight),
    bgLeft: analyzeEdgeSpacing(bgLeft),
    samples: {
      fgRightBuildings: fgRight.length,
      fgLeftBuildings: fgLeft.length,
      bgRightBuildings: bgRight.length,
      bgLeftBuildings: bgLeft.length,
      props: props.length
    }
  };
}

function aggregateZone(zone, config) {
  const bucket = createBucket();
  const sampleCounts = {
    fgRightBuildings: 0,
    fgLeftBuildings: 0,
    bgRightBuildings: 0,
    bgLeftBuildings: 0,
    props: 0
  };

  for (let i = 0; i < config.seeds; i++) {
    const seed = config.seedStart + i;
    const run = runZoneSeed(zone, seed, config.span);
    appendStats(bucket, "fg", "right", run.fgRight);
    appendStats(bucket, "fg", "left", run.fgLeft);
    appendStats(bucket, "bg", "right", run.bgRight);
    appendStats(bucket, "bg", "left", run.bgLeft);
    sampleCounts.fgRightBuildings += run.samples.fgRightBuildings;
    sampleCounts.fgLeftBuildings += run.samples.fgLeftBuildings;
    sampleCounts.bgRightBuildings += run.samples.bgRightBuildings;
    sampleCounts.bgLeftBuildings += run.samples.bgLeftBuildings;
    sampleCounts.props += run.samples.props;
  }

  return {
    zoneId: zone.id,
    seeds: config.seeds,
    span: config.span,
    sampleCounts,
    metrics: summarizeBucket(bucket)
  };
}

function runHarness(config) {
  const results = [];
  for (let i = 0; i < ZONES.length; i++) {
    results.push(aggregateZone(ZONES[i], config));
  }
  return {
    config,
    generatedAt: new Date().toISOString(),
    results
  };
}

function printHuman(report) {
  console.log("BASELINE_CITY_GEN_METRICS");
  console.log(
    `config: seeds=${report.config.seeds} seed_start=${report.config.seedStart} span=${report.config.span}`
  );
  console.log("metric: overlap_rate = adjacent edge-gap < 0 within same layer+direction");
  console.log(
    "metric: gap stats use edge-gap (curr.x - (prev.x + prev.w)); negatives indicate overlap"
  );
  console.log("");

  for (let i = 0; i < report.results.length; i++) {
    const row = report.results[i];
    const fg = row.metrics.fg;
    const bg = row.metrics.bg;
    const fgAsym = fg.right.overlapRate - fg.left.overlapRate;
    const bgAsym = bg.right.overlapRate - bg.left.overlapRate;

    console.log(`zone=${row.zoneId}`);
    console.log(
      `  FG overlap overall=${formatPct(fg.overall.overlapRate)} right=${formatPct(fg.right.overlapRate)} left=${formatPct(fg.left.overlapRate)} delta(right-left)=${formatPct(fgAsym)}`
    );
    console.log(
      `  BG overlap overall=${formatPct(bg.overall.overlapRate)} right=${formatPct(bg.right.overlapRate)} left=${formatPct(bg.left.overlapRate)} delta(right-left)=${formatPct(bgAsym)}`
    );
    console.log(
      `  FG gaps mean=${fg.overall.gap.mean.toFixed(2)} p50=${fg.overall.gap.p50.toFixed(2)} p90=${fg.overall.gap.p90.toFixed(2)} p95=${fg.overall.gap.p95.toFixed(2)} min=${fg.overall.gap.min.toFixed(2)} max=${fg.overall.gap.max.toFixed(2)}`
    );
    console.log(
      `  BG gaps mean=${bg.overall.gap.mean.toFixed(2)} p50=${bg.overall.gap.p50.toFixed(2)} p90=${bg.overall.gap.p90.toFixed(2)} p95=${bg.overall.gap.p95.toFixed(2)} min=${bg.overall.gap.min.toFixed(2)} max=${bg.overall.gap.max.toFixed(2)}`
    );
    console.log(
      `  samples fg_right=${row.sampleCounts.fgRightBuildings} fg_left=${row.sampleCounts.fgLeftBuildings} bg_right=${row.sampleCounts.bgRightBuildings} bg_left=${row.sampleCounts.bgLeftBuildings}`
    );
    console.log("");
  }
}

function main() {
  const config = parseArgs(process.argv.slice(2));
  const report = runHarness(config);
  if (config.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
  }
}

main();
