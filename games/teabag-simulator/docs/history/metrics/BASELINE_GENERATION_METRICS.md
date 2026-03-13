# Baseline Building Generation Metrics (B0)

This document records current (pre-fix) overlap and gap behavior for city generation, by zone and layer.

Method:

- Harness: `scripts/city-gen-metrics-baseline.js`
- Config: `--seeds 20 --seed-start 1 --span 120000`
- Mode model: endless single-zone per run (isolates each zone's generation profile)
- Metric definition:
  - Edge gap = `curr.x - (prev.x + prev.w)` within same layer+direction adjacency
  - Overlap event = edge gap `< 0`
  - Overlap rate = overlap events / adjacent pairs

## Command Used

```bash
node --check scripts/city-gen-metrics-baseline.js
node scripts/city-gen-metrics-baseline.js --seeds 20 --seed-start 1 --span 120000
```

## Overlap Rate Per Zone

| Zone | FG Overlap (overall) | FG Right | FG Left | BG Overlap (overall) | BG Right | BG Left |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| downtown | 33.21% | 50.05% | 0.94% | 33.32% | 50.20% | 1.79% |
| shopping | 43.85% | 64.64% | 3.86% | 33.04% | 49.98% | 1.54% |
| park | 8.04% | 12.25% | 0.00% | 33.49% | 50.52% | 1.45% |
| redlight | 33.35% | 50.31% | 0.76% | 32.80% | 49.52% | 1.56% |
| industrial | 56.95% | 78.44% | 15.69% | 32.93% | 49.65% | 1.78% |
| suburbs | 34.36% | 52.00% | 0.33% | 33.29% | 50.11% | 1.75% |

## Gap Distribution Summary Per Zone

FG edge-gap stats (overall direction-combined):

| Zone | Mean | P50 | P90 | P95 | Min | Max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| downtown | 43.03 | 32.00 | 142.00 | 173.00 | -90.00 | 309.00 |
| shopping | 22.78 | 12.00 | 122.00 | 154.00 | -110.00 | 287.00 |
| park | 82.87 | 74.00 | 176.00 | 209.00 | -30.00 | 333.00 |
| redlight | 42.79 | 32.00 | 142.00 | 174.00 | -90.00 | 304.00 |
| industrial | -6.70 | -16.00 | 94.00 | 126.00 | -150.00 | 262.00 |
| suburbs | 42.80 | 32.00 | 138.00 | 172.00 | -80.00 | 297.00 |

BG edge-gap stats (overall direction-combined):

| Zone | Mean | P50 | P90 | P95 | Min | Max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| downtown | 42.65 | 32.00 | 141.00 | 175.00 | -85.00 | 304.00 |
| shopping | 42.86 | 33.00 | 142.00 | 173.00 | -85.00 | 302.00 |
| park | 42.28 | 32.00 | 141.00 | 174.00 | -85.00 | 299.00 |
| redlight | 43.48 | 33.00 | 141.00 | 175.00 | -85.00 | 303.00 |
| industrial | 43.09 | 33.00 | 142.00 | 174.00 | -85.00 | 301.00 |
| suburbs | 42.78 | 32.00 | 141.00 | 174.00 | -85.00 | 300.00 |

## Directional Asymmetry Notes (Right vs Left)

- Strong right-vs-left asymmetry exists in all zones/layers.
- FG right overlap is consistently much higher than FG left:
  - Largest delta: `industrial` (+62.75 percentage points right-minus-left).
  - `shopping` also high (+60.78 pp).
- BG shows similar asymmetric pattern in every zone (roughly +48 to +49 pp right-minus-left).
- Park FG is a partial exception only in magnitude (lower overall FG overlap due narrower FG widths), but asymmetry still exists (`12.25%` right vs `0.00%` left).

Interpretation:

- Current rightward stepping overlaps because step size is width-unaware.
- Current leftward stepping uses guessed pre-width seeds that often over-space.
- Together they create overlap-heavy right streams and sparse left streams.

## Raw Harness Output (Captured)

```text
BASELINE_CITY_GEN_METRICS
config: seeds=20 seed_start=1 span=120000
metric: overlap_rate = adjacent edge-gap < 0 within same layer+direction
metric: gap stats use edge-gap (curr.x - (prev.x + prev.w)); negatives indicate overlap

zone=downtown
  FG overlap overall=33.21% right=50.05% left=0.94% delta(right-left)=49.11%
  BG overlap overall=33.32% right=50.20% left=1.79% delta(right-left)=48.40%
  FG gaps mean=43.03 p50=32.00 p90=142.00 p95=173.00 min=-90.00 max=309.00
  BG gaps mean=42.65 p50=32.00 p90=141.00 p95=175.00 min=-85.00 max=304.00
  samples fg_right=22125 fg_left=11548 bg_right=25140 bg_left=13467

zone=shopping
  FG overlap overall=43.85% right=64.64% left=3.86% delta(right-left)=60.78%
  BG overlap overall=33.04% right=49.98% left=1.54% delta(right-left)=48.45%
  FG gaps mean=22.78 p50=12.00 p90=122.00 p95=154.00 min=-110.00 max=287.00
  BG gaps mean=42.86 p50=33.00 p90=142.00 p95=173.00 min=-85.00 max=302.00
  samples fg_right=22185 fg_left=11546 bg_right=25042 bg_left=13474

zone=park
  FG overlap overall=8.04% right=12.25% left=0.00% delta(right-left)=12.25%
  BG overlap overall=33.49% right=50.52% left=1.45% delta(right-left)=49.08%
  FG gaps mean=82.87 p50=74.00 p90=176.00 p95=209.00 min=-30.00 max=333.00
  BG gaps mean=42.28 p50=32.00 p90=141.00 p95=174.00 min=-85.00 max=299.00
  samples fg_right=22125 fg_left=11579 bg_right=25263 bg_left=13442

zone=redlight
  FG overlap overall=33.35% right=50.31% left=0.76% delta(right-left)=49.55%
  BG overlap overall=32.80% right=49.52% left=1.56% delta(right-left)=47.96%
  FG gaps mean=42.79 p50=32.00 p90=142.00 p95=174.00 min=-90.00 max=304.00
  BG gaps mean=43.48 p50=33.00 p90=141.00 p95=175.00 min=-85.00 max=303.00
  samples fg_right=22167 fg_left=11539 bg_right=25024 bg_left=13404

zone=industrial
  FG overlap overall=56.95% right=78.44% left=15.69% delta(right-left)=62.75%
  BG overlap overall=32.93% right=49.65% left=1.78% delta(right-left)=47.88%
  FG gaps mean=-6.70 p50=-16.00 p90=94.00 p95=126.00 min=-150.00 max=262.00
  BG gaps mean=43.09 p50=33.00 p90=142.00 p95=174.00 min=-85.00 max=301.00
  samples fg_right=22101 fg_left=11524 bg_right=25097 bg_left=13482

zone=suburbs
  FG overlap overall=34.36% right=52.00% left=0.33% delta(right-left)=51.67%
  BG overlap overall=33.29% right=50.11% left=1.75% delta(right-left)=48.36%
  FG gaps mean=42.80 p50=32.00 p90=138.00 p95=172.00 min=-80.00 max=297.00
  BG gaps mean=42.78 p50=32.00 p90=141.00 p95=174.00 min=-85.00 max=300.00
  samples fg_right=22201 fg_left=11525 bg_right=25165 bg_left=13426
```
