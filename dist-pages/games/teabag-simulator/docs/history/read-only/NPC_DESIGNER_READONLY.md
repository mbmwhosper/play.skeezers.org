# NPC Designer Read-Only Plan

Task: build a standalone NPC character designer with layered pose authoring and JSON round-trip support.

## Exact Files To Add/Edit

1. Add `npc-designer.html`
2. Add `npc-designer.css`
3. Add `npc-designer.js`
4. Edit `README.md` (new feature documentation section)
5. Add `docs/history/read-only/NPC_DESIGNER_READONLY.md` (this file)
6. Edit `docs/planning/REFACTOR_SLICES.md` (large-task slice plan addendum)
7. Edit `docs/planning/REFACTOR_CHECKLIST.md` (large-task execution checklist addendum)

Notes:
- No gameplay implementation files are planned for edit.
- `SCHEMATICS.md` update is **not required** unless a game file is edited (`teabag-simulator.html`, `sound-designer.html`, `index.html`, `sw.js`, `manifest.json`).

## Exact Integration Points For Height References

Source-of-truth anchors in `teabag-simulator.html`:

1. Base dimensions used by character types:
- `teabag-simulator.html:666` (`const BASE_W = 24, BASE_H = 46`)

2. Existing NPC archetype registry with per-type scales:
- `teabag-simulator.html:667-955` (`const CHARACTER_DEFS = [...]`)
- `hScale` and `label` fields are the required inputs for designer height overlays.

3. Existing game-side height projection logic:
- `teabag-simulator.html:2603-2608` (`GALLERY_TYPES` derives display `w/h` from `BASE_W/BASE_H` and `wScale/hScale`)

Planned designer integration strategy:
- Mirror current NPC height references into `npc-designer.js` as `GAME_CHARACTER_HEIGHT_REFERENCES`, using:
  - `heightPx = Math.round(BASE_H * hScale)`
  - `widthPx = Math.round(BASE_W * wScale)`
- Use that dataset to draw:
  - labeled horizontal height guide lines
  - optional silhouette capsules for size comparison
- Keep references toggleable from the designer UI.

## Planned Function/Module Surface (Implementation Contract)

`npc-designer.js` planned core API (exact function names to implement):

1. Boot/State
- `createDesignerState()`
- `initDesigner()`
- `loadInitialDocument()`

2. Templates/Pose Management
- `createBaseTemplate(templateId)`
- `resetPoseToTemplate(templateId, poseId)`
- `resetAllPosesToTemplate(templateId)`
- `copyPoseToPose(fromPoseId, toPoseId)`

3. Layer CRUD/Selection
- `createLayer(type, start, end)`
- `duplicateSelectedLayers()`
- `deleteSelectedLayers()`
- `setLayerVisibility(layerId, visible)`
- `setLayerLock(layerId, locked)`
- `renameLayer(layerId, name)`
- `reorderLayer(layerId, direction)`
- `setLayerSelection(layerId, additive, range)`

4. Canvas Editing + Transforms
- `screenToWorld(x, y)`
- `hitTestLayers(worldPoint)`
- `beginTransform(handleType, worldPoint)`
- `updateTransform(worldPoint, keepAspect)`
- `applyGroupTransform(transform)`
- `moveSelectedLayers(dx, dy)`
- `resizeSelectedLayers(anchor, scaleX, scaleY)`
- `reshapePointHandle(layerId, pointPath, worldPoint)`

5. Tools
- `setActiveTool(toolId)`
- `startToolGesture(worldPoint, modifiers)`
- `updateToolGesture(worldPoint, modifiers)`
- `finishToolGesture(worldPoint, modifiers)`

6. Styling
- `applyColorToSelection(fillColor, strokeColor)`
- `applyGradientToSelection(gradientConfig)`
- `sampleColorAtPoint(worldPoint)`

7. Rendering
- `renderEditorCanvas()`
- `renderPosePreview(previewCanvas, poseId, facing)`
- `renderHeightReferences(ctx)`
- `renderSelectionOverlays(ctx)`

8. JSON IO
- `exportEditableJson()`
- `importEditableJson(jsonText)`
- `exportIntegrationPayload()`
- `copyJsonToClipboard(text)`
- `downloadJson(filename, text)`

## Caller/Callee Map (High-Level)

1. Initialization
- `initDesigner()` -> `createDesignerState()` -> `loadInitialDocument()` -> `renderEditorCanvas()`

2. Input flow
- Pointer/keyboard handlers -> `startToolGesture` / `updateToolGesture` / `finishToolGesture` -> layer/transform mutators -> `renderEditorCanvas()`

3. Pose flow
- Pose tabs/selectors -> `copyPoseToPose` / template reset helpers -> `renderEditorCanvas()` + preview refresh

4. Layer flow
- Layer panel actions -> layer mutators (`rename/reorder/duplicate/delete/lock/visibility`) -> `renderEditorCanvas()`

5. Serialization flow
- Export buttons -> `exportEditableJson` / `exportIntegrationPayload`
- Import UI -> `importEditableJson` -> state replace -> `renderEditorCanvas()`

## Proposed Editable JSON Schema (Round-Trip)

```json
{
  "version": 1,
  "meta": {
    "id": "npc_custom_001",
    "label": "Custom NPC",
    "baseTemplate": "male_base",
    "createdAt": "2026-02-21T00:00:00.000Z",
    "updatedAt": "2026-02-21T00:00:00.000Z"
  },
  "canvas": {
    "width": 960,
    "height": 540,
    "unit": "game_px"
  },
  "editor": {
    "zoom": 1,
    "panX": 0,
    "panY": 0,
    "facing": 1,
    "showGrid": true,
    "showHeightLines": true,
    "showSilhouettes": false
  },
  "poses": {
    "normal": { "layers": [] },
    "panic": { "layers": [] },
    "ko": { "layers": [] }
  }
}
```

Layer schema (inside each pose):

```json
{
  "id": "layer_xxx",
  "name": "Torso",
  "type": "rect|ellipse|line|curve|polygon",
  "visible": true,
  "locked": false,
  "transform": {
    "x": 0,
    "y": 0,
    "scaleX": 1,
    "scaleY": 1,
    "rotation": 0
  },
  "geometry": {
    "rect": { "x": 0, "y": 0, "w": 10, "h": 10 },
    "ellipse": { "cx": 0, "cy": 0, "rx": 5, "ry": 5 },
    "line": { "x1": 0, "y1": 0, "x2": 10, "y2": 10 },
    "curve": { "x1": 0, "y1": 0, "cx": 5, "cy": 8, "x2": 10, "y2": 0 },
    "polygon": { "points": [{ "x": 0, "y": 0 }] }
  },
  "style": {
    "fill": "#ff0000",
    "stroke": "#111111",
    "strokeWidth": 1,
    "opacity": 1,
    "fillMode": "solid|gradient",
    "gradient": {
      "type": "linear",
      "angle": 90,
      "stops": [
        { "offset": 0, "color": "#ffffff" },
        { "offset": 1, "color": "#000000" }
      ]
    }
  }
}
```

## Compact Integration Payload Schema (Downstream)

```json
{
  "id": "npc_custom_001",
  "label": "Custom NPC",
  "baseTemplate": "male_base",
  "bounds": { "w": 24, "h": 46 },
  "poses": {
    "normal": [{ "type": "polygon", "points": [], "style": {} }],
    "panic": [{ "type": "polygon", "points": [], "style": {} }],
    "ko": [{ "type": "polygon", "points": [], "style": {} }]
  }
}
```

Design intent:
- Editable export preserves full editor metadata/state.
- Compact payload strips editor-only fields but preserves pose geometry/style for conversion into game character data.

## In-Scope vs Out-of-Scope

| Area | In Scope | Out of Scope |
| --- | --- | --- |
| New designer tooling | Full standalone editor page + JS/CSS + JSON workflows | Embedding designer into gameplay UI |
| Pose authoring | Independent `normal`/`panic`/`ko` workspaces + pose copy action | Rewriting in-game character renderer |
| Layer system | Multi-select, rename/reorder, hide/lock, duplicate/delete, group transforms | Non-layer procedural mesh system |
| Shape tools | Select/move/resize + rect/ellipse/line/curve/polygon + color/gradient/eyedropper + hand/zoom | Bitmap painting and texture pipeline |
| Height references | Overlay lines + labels from existing game character height data + optional silhouettes | Runtime loading/parsing of game JS modules |
| Documentation | README feature section updates | Gameplay mechanics documentation rewrites unrelated to tool |

## Invariants That Must Not Change

1. No gameplay logic behavior changes.
2. No draw-order or runtime update-order changes in the game.
3. No save-shape/localStorage migration changes for gameplay saves.
4. No input mapping changes for actual gameplay controls.
5. No sound asset/definition/runtime SFX path changes.

## Risk Checks

1. Selection/transform correctness:
- Validate multi-select add/remove and stable group move/resize across all shape types.

2. Pose isolation:
- Validate edits to one pose do not mutate the others unless explicitly copied.

3. JSON fidelity:
- Validate import/export round-trip reproduces exact editable state (including base-template edits).

4. Height overlay trustworthiness:
- Validate overlay values match current game dimensions derived from `BASE_H` + `hScale`.

5. Layer lock/visibility safety:
- Validate hidden/locked layers are excluded from hit tests and transform operations.

## Acceptance Gates (Must Pass)

1. Designer loads in browser and all required tools are wired.
2. `male_base` and `female_base` are editable like any other layers.
3. Multi-select and group move/resize are functional.
4. `normal`, `panic`, and `ko` pose data are independent and persisted.
5. Height references display labels/lines and optional silhouettes.
6. Editable JSON and compact payload export are available.
7. JSON import recreates full editable document exactly.
8. README includes purpose, usage, controls, pose flow, height references, JSON flow.
9. Syntax checks pass on changed JS.
10. Runtime validation and sound-path validation statuses are explicitly reported.
