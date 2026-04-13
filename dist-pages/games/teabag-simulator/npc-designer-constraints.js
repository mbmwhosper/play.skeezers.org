(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.NPCDesignerConstraints = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const POSE_IDS = ["normal", "panic", "ko"];
  const LAYER_TYPES = ["rect", "ellipse", "line", "curve", "polygon"];
  const HAIR_STYLE_OPTIONS = [
    "short",
    "long",
    "ponytail",
    "mohawk",
    "bun",
    "spiky",
    "pompadour",
    "karenbob",
    "headscarf",
    "highpony",
    "headband",
    "fade",
    "buzz",
    "longgoth"
  ];

  const RUNTIME_BASE_DEFS = [
    {
      name: "normal",
      label: "Pedestrian",
      wScale: 1,
      hScale: 1,
      healthMin: 60,
      healthMax: 100,
      color: "#3182CE",
      skinColor: "#F0C8A0",
      hairColor: "#8B4513",
      hairStyle: "long"
    },
    {
      name: "small",
      label: "Small",
      wScale: 0.8,
      hScale: 0.85,
      healthMin: 30,
      healthMax: 50,
      color: "#38A169",
      skinColor: "#FBBF6B",
      hairColor: "#DAA520",
      hairStyle: "spiky"
    },
    {
      name: "tall",
      label: "Tall",
      wScale: 0.95,
      hScale: 1.15,
      healthMin: 80,
      healthMax: 130,
      color: "#805AD5",
      skinColor: "#D4956B",
      hairColor: "#3D2B1F",
      hairStyle: "ponytail"
    },
    {
      name: "muscle",
      label: "Muscle",
      wScale: 1.4,
      hScale: 1.1,
      healthMin: 250,
      healthMax: 400,
      color: "#8B0000",
      skinColor: "#D4956B",
      hairColor: "#2C2C2C",
      hairStyle: "buzz",
      isBig: true,
      isSpecial: true,
      bareArm: true,
      exposedShoulders: true,
      angryBrows: true
    },
    {
      name: "sumo",
      label: "Sumo",
      wScale: 1.6,
      hScale: 0.95,
      healthMin: 400,
      healthMax: 600,
      color: "#C8A870",
      skinColor: "#FBBF6B",
      hairColor: "#1A1A2E",
      hairStyle: "buzz",
      legColor: "#C8A870",
      shoeColor: "#8B7355",
      isBig: true,
      isSpecial: true,
      bareArm: true,
      angryBrows: true
    },
    {
      name: "giant",
      label: "Giant",
      wScale: 1.1,
      hScale: 1.35,
      healthMin: 200,
      healthMax: 350,
      color: "#4A0E4E",
      skinColor: "#C68642",
      hairColor: "#2C2C2C",
      hairStyle: "buzz",
      isBig: true,
      isSpecial: true,
      bareArm: true,
      exposedShoulders: true,
      angryBrows: true
    },
    {
      name: "chad",
      label: "Chad",
      wScale: 1.3,
      hScale: 1.15,
      healthMin: 300,
      healthMax: 500,
      color: "#CC2222",
      skinColor: "#FFDBAC",
      hairColor: "#DAA520",
      hairStyle: "pompadour",
      eyeColor: "#3B82F6",
      legColor: "#65D637",
      isBig: true,
      isSpecial: true,
      bareArm: true,
      exposedShoulders: true
    },
    {
      name: "karen",
      label: "Karen",
      wScale: 1.05,
      hScale: 1,
      healthMin: 150,
      healthMax: 250,
      color: "#84CC16",
      skinColor: "#F0C8A0",
      hairColor: "#8B4513",
      hairStyle: "karenbob",
      legColor: "#2C2C3E",
      feminineBody: true,
      bustScale: 0.85,
      isSpecial: true
    },
    {
      name: "babushka",
      label: "Babushka",
      wScale: 1.5,
      hScale: 0.85,
      healthMin: 350,
      healthMax: 550,
      color: "#8B4587",
      skinColor: "#F0C8A0",
      hairColor: "#9CA3AF",
      hairStyle: "headscarf",
      legColor: "#8B4587",
      isBig: true,
      isSpecial: true
    },
    {
      name: "gymgirl",
      label: "Gym Girl",
      wScale: 0.95,
      hScale: 1.05,
      healthMin: 180,
      healthMax: 300,
      color: "#FF1493",
      skinColor: "#D4956B",
      hairColor: "#1A1A2E",
      hairStyle: "highpony",
      legColor: "#D4956B",
      feminineBody: true,
      bustScale: 0.85,
      isSpecial: true,
      bareArm: true
    },
    {
      name: "baller",
      label: "Baller",
      wScale: 1.15,
      hScale: 1.3,
      healthMin: 250,
      healthMax: 400,
      color: "#E53E3E",
      skinColor: "#8D5524",
      hairColor: "#1A1A1A",
      hairStyle: "fade",
      legColor: "#F0F0F0",
      isBig: true,
      isSpecial: true,
      bareArm: true,
      exposedShoulders: true
    },
    {
      name: "gothmommy",
      label: "Goth Mommy",
      wScale: 1.35,
      hScale: 1.25,
      healthMin: 300,
      healthMax: 500,
      color: "#2D2D50",
      skinColor: "#F5E6D3",
      hairColor: "#0A0A0A",
      hairStyle: "longgoth",
      eyeColor: "#8B5CF6",
      legColor: "#3D2B1F",
      shoeColor: "#2D1B4E",
      feminineBody: true,
      bustScale: 1.25,
      isBig: true,
      isSpecial: true,
      bareArm: true,
      exposedShoulders: true
    },
    {
      name: "party_girl",
      label: "Party Girl",
      wScale: 0.9,
      hScale: 0.95,
      healthMin: 70,
      healthMax: 120,
      color: "#FF1493",
      skinColor: "#F5E6D3",
      hairColor: "#DAA520",
      hairStyle: "long",
      legColor: "#2C2C3E",
      shoeColor: "#2D3748",
      feminineBody: true,
      bustScale: 0.85,
      hasDress: true,
      shortDress: true
    },
    {
      name: "shopaholic",
      label: "Shopaholic",
      wScale: 0.95,
      hScale: 1,
      healthMin: 80,
      healthMax: 140,
      color: "#FF69B4",
      skinColor: "#F0C8A0",
      hairColor: "#DAA520",
      hairStyle: "long",
      legColor: "#4A5568",
      feminineBody: true,
      bustScale: 0.85
    },
    {
      name: "influencer",
      label: "Influencer",
      wScale: 0.9,
      hScale: 0.95,
      healthMin: 60,
      healthMax: 100,
      color: "#00CED1",
      skinColor: "#FFDBAC",
      hairColor: "#1A1A2E",
      hairStyle: "bun",
      legColor: "#2C2C3E",
      feminineBody: true,
      bustScale: 1
    },
    {
      name: "jogger",
      label: "Jogger",
      wScale: 0.95,
      hScale: 1.1,
      healthMin: 120,
      healthMax: 200,
      color: "#48BB78",
      skinColor: "#D4956B",
      hairColor: "#8B4513",
      hairStyle: "headband",
      legColor: "#2D3748",
      bareArm: true
    },
    {
      name: "dog_walker",
      label: "Dog Walker",
      wScale: 0.95,
      hScale: 1,
      healthMin: 80,
      healthMax: 130,
      color: "#805AD5",
      skinColor: "#FBBF6B",
      hairColor: "#3D2B1F",
      hairStyle: "ponytail",
      legColor: "#4A5568"
    },
    {
      name: "club_dude",
      label: "Club Dude",
      wScale: 1.1,
      hScale: 1.1,
      healthMin: 150,
      healthMax: 250,
      color: "#1A1A2E",
      skinColor: "#C68642",
      hairColor: "#1A1A1A",
      hairStyle: "spiky",
      legColor: "#2D3748"
    },
    {
      name: "sundress_girl",
      label: "Sundress Girl",
      wScale: 0.9,
      hScale: 0.95,
      healthMin: 50,
      healthMax: 90,
      color: "#87CEEB",
      skinColor: "#F5E6D3",
      hairColor: "#DAA520",
      hairStyle: "long",
      feminineBody: true,
      bustScale: 0.85,
      hasDress: true
    },
    {
      name: "bouncer",
      label: "Bouncer",
      wScale: 1.5,
      hScale: 1.2,
      healthMin: 400,
      healthMax: 600,
      color: "#1A1A2E",
      skinColor: "#8D5524",
      hairColor: "#1A1A1A",
      hairStyle: "buzz",
      legColor: "#1A1A2E",
      isBig: true,
      isSpecial: true,
      angryBrows: true
    },
    {
      name: "hard_hat",
      label: "Hard Hat",
      wScale: 1.1,
      hScale: 1.1,
      healthMin: 180,
      healthMax: 280,
      color: "#DD6B20",
      skinColor: "#D4956B",
      hairColor: "#3D2B1F",
      hairStyle: "buzz",
      legColor: "#4A4A3A"
    },
    {
      name: "forklift_phil",
      label: "Forklift Phil",
      wScale: 1.4,
      hScale: 1.15,
      healthMin: 250,
      healthMax: 400,
      color: "#B7791F",
      skinColor: "#C68642",
      hairColor: "#2C2C2C",
      hairStyle: "buzz",
      legColor: "#4A4A3A",
      isBig: true,
      isSpecial: true,
      bareArm: true,
      exposedShoulders: true,
      angryBrows: true
    },
    {
      name: "soccer_mom",
      label: "Soccer Mom",
      wScale: 1.05,
      hScale: 1,
      healthMin: 130,
      healthMax: 220,
      color: "#E53E3E",
      skinColor: "#F0C8A0",
      hairColor: "#8B4513",
      hairStyle: "ponytail",
      legColor: "#4A5568",
      feminineBody: true,
      bustScale: 0.85
    },
    {
      name: "mailman",
      label: "Mailman",
      wScale: 1,
      hScale: 1.05,
      healthMin: 100,
      healthMax: 180,
      color: "#3182CE",
      skinColor: "#FBBF6B",
      hairColor: "#2C2C2C",
      hairStyle: "short",
      legColor: "#2D3748"
    },
    {
      name: "lawn_dad",
      label: "Lawn Dad",
      wScale: 1.15,
      hScale: 1.05,
      healthMin: 150,
      healthMax: 250,
      color: "#38A169",
      skinColor: "#D4956B",
      hairColor: "#9CA3AF",
      hairStyle: "short",
      legColor: "#8B7355"
    }
  ];

  const CONSTRAINT_REFERENCE = [
    {
      id: "hard-doc-shape",
      type: "hard",
      title: "Document structure integrity",
      guidance: "All three poses must exist and every layer must keep valid geometry for its type."
    },
    {
      id: "hard-runtime-profile",
      type: "hard",
      title: "Runtime profile safety",
      guidance: "npcType, scale, health, and core color/hair fields must remain runtime-safe."
    },
    {
      id: "hard-export-gate",
      type: "hard",
      title: "Export safety gate",
      guidance: "Compact/runtime export is blocked only when hard blockers exist."
    },
    {
      id: "visual-contrast",
      type: "visual",
      title: "Contrast guidance",
      guidance: "Body, leg, and shoe colors should stay visually separable for readability."
    },
    {
      id: "visual-overflow",
      type: "visual",
      title: "Stylization overflow guidance",
      guidance: "Large runtime scales are allowed but flagged so framing can be verified."
    },
    {
      id: "visual-dress",
      type: "visual",
      title: "Dress coherence guidance",
      guidance: "shortDress should pair with hasDress to avoid contradictory runtime styling."
    }
  ];

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function num(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeHex(color) {
    if (typeof color !== "string") return null;
    const trimmed = color.trim();
    if (!trimmed) return null;
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return null;
    if (trimmed.length === 4) {
      return (
        "#" +
        trimmed[1] +
        trimmed[1] +
        trimmed[2] +
        trimmed[2] +
        trimmed[3] +
        trimmed[3]
      ).toUpperCase();
    }
    return trimmed.toUpperCase();
  }

  function luminance(hex) {
    const normalized = normalizeHex(hex);
    if (!normalized) return 0;
    const n = parseInt(normalized.slice(1), 16);
    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrast(a, b) {
    return Math.abs(luminance(a) - luminance(b));
  }

  function defaultRuntimeBase(baseTemplate) {
    return baseTemplate === "female_base" ? "karen" : "normal";
  }

  function baseDefMap() {
    const map = Object.create(null);
    for (const def of RUNTIME_BASE_DEFS) map[def.name] = def;
    return map;
  }

  function createDefaultRuntimeProfile(baseTemplate) {
    const baseType = defaultRuntimeBase(baseTemplate);
    const defMap = baseDefMap();
    const def = defMap[baseType] || RUNTIME_BASE_DEFS[0];
    return {
      baseType: def.name,
      npcType: `${def.name}_custom`,
      wScale: def.wScale,
      hScale: def.hScale,
      healthMin: def.healthMin,
      healthMax: def.healthMax,
      color: def.color,
      skinColor: def.skinColor,
      hairColor: def.hairColor,
      hairStyle: def.hairStyle,
      eyeColor: def.eyeColor || "#1A1A2E",
      legColor: def.legColor || "#4A5568",
      shoeColor: def.shoeColor || "#2D3748",
      feminineBody: !!def.feminineBody,
      bustScale: def.bustScale || 0,
      hasDress: !!def.hasDress,
      shortDress: !!def.shortDress
    };
  }

  function normalizeRuntimeProfile(profile, baseTemplate) {
    const defMap = baseDefMap();
    const fallback = createDefaultRuntimeProfile(baseTemplate);
    const raw = profile && typeof profile === "object" ? profile : {};

    const baseType =
      typeof raw.baseType === "string" && defMap[raw.baseType] ? raw.baseType : fallback.baseType;
    const base = defMap[baseType] || defMap[fallback.baseType] || RUNTIME_BASE_DEFS[0];

    return {
      baseType,
      npcType: typeof raw.npcType === "string" ? raw.npcType.trim() : fallback.npcType,
      wScale: num(raw.wScale, fallback.wScale),
      hScale: num(raw.hScale, fallback.hScale),
      healthMin: num(raw.healthMin, fallback.healthMin),
      healthMax: num(raw.healthMax, fallback.healthMax),
      color: normalizeHex(raw.color) || normalizeHex(fallback.color) || "#3B82F6",
      skinColor: normalizeHex(raw.skinColor) || normalizeHex(fallback.skinColor) || "#FBBF6B",
      hairColor: normalizeHex(raw.hairColor) || normalizeHex(fallback.hairColor) || "#3D2B1F",
      hairStyle: typeof raw.hairStyle === "string" ? raw.hairStyle : fallback.hairStyle,
      eyeColor: normalizeHex(raw.eyeColor) || normalizeHex(fallback.eyeColor) || "#1A1A2E",
      legColor: normalizeHex(raw.legColor) || normalizeHex(fallback.legColor) || "#4A5568",
      shoeColor: normalizeHex(raw.shoeColor) || normalizeHex(fallback.shoeColor) || "#2D3748",
      feminineBody: raw.feminineBody !== undefined ? !!raw.feminineBody : !!fallback.feminineBody,
      bustScale: num(raw.bustScale, fallback.bustScale),
      hasDress: raw.hasDress !== undefined ? !!raw.hasDress : !!fallback.hasDress,
      shortDress: raw.shortDress !== undefined ? !!raw.shortDress : !!fallback.shortDress,
      isBig: !!base.isBig,
      isSpecial: !!base.isSpecial,
      bareArm: !!base.bareArm,
      exposedShoulders: !!base.exposedShoulders,
      angryBrows: !!base.angryBrows,
      randomizeVisuals: !!base.randomizeVisuals
    };
  }

  function issue(kind, target, message, extra) {
    return Object.assign({ kind, target, message }, extra || {});
  }

  function isFinitePoint(point) {
    return point && Number.isFinite(point.x) && Number.isFinite(point.y);
  }

  function validateLayerShape(layer, poseId, hardFailures) {
    const targetPrefix = `layer:${poseId}:${layer.id || "unknown"}`;
    if (!layer || typeof layer !== "object") {
      hardFailures.push(issue("hard", targetPrefix, "Layer is not a valid object."));
      return;
    }

    if (!LAYER_TYPES.includes(layer.type)) {
      hardFailures.push(issue("hard", targetPrefix, `Unsupported layer type "${layer.type}".`));
      return;
    }

    const g = layer.geometry || {};
    if (layer.type === "rect" || layer.type === "ellipse") {
      if (![g.x, g.y, g.w, g.h].every(Number.isFinite)) {
        hardFailures.push(
          issue("hard", targetPrefix, `${layer.type} geometry requires finite x/y/w/h.`)
        );
      }
    } else if (layer.type === "line") {
      if (![g.x1, g.y1, g.x2, g.y2].every(Number.isFinite)) {
        hardFailures.push(
          issue("hard", targetPrefix, "line geometry requires finite x1/y1/x2/y2.")
        );
      }
    } else if (layer.type === "curve") {
      if (![g.x1, g.y1, g.cx, g.cy, g.x2, g.y2].every(Number.isFinite)) {
        hardFailures.push(
          issue("hard", targetPrefix, "curve geometry requires finite x1/y1/cx/cy/x2/y2.")
        );
      }
    } else if (layer.type === "polygon") {
      if (!Array.isArray(g.points) || g.points.length < 3 || !g.points.every(isFinitePoint)) {
        hardFailures.push(
          issue("hard", targetPrefix, "polygon geometry requires at least 3 finite points.")
        );
      }
    }

    const style = layer.style || {};
    if (style.fill && !normalizeHex(style.fill)) {
      hardFailures.push(issue("hard", targetPrefix, "Layer fill color must be valid hex."));
    }
    if (style.stroke && !normalizeHex(style.stroke)) {
      hardFailures.push(issue("hard", targetPrefix, "Layer stroke color must be valid hex."));
    }
    if (style.fillMode === "gradient") {
      const gradient = style.gradient || {};
      const stops = Array.isArray(gradient.stops) ? gradient.stops : [];
      if (stops.length < 2) {
        hardFailures.push(issue("hard", targetPrefix, "Gradient fill requires at least 2 stops."));
      } else {
        for (const stop of stops) {
          if (
            !Number.isFinite(stop.offset) ||
            stop.offset < 0 ||
            stop.offset > 1 ||
            !normalizeHex(stop.color)
          ) {
            hardFailures.push(
              issue("hard", targetPrefix, "Gradient stops must keep valid offset and hex color.")
            );
            break;
          }
        }
      }
    }
  }

  function validateDesignerDocument(designDoc, opts) {
    const options = opts || {};
    const strictVisualRules =
      options.strictVisualRules !== undefined ? !!options.strictVisualRules : true;
    const autoFixVisualIssues =
      options.autoFixVisualIssues !== undefined
        ? !!options.autoFixVisualIssues
        : strictVisualRules
          ? true
          : false;
    const applyAutoFix = options.applyAutoFix !== false;

    const doc = deepClone(designDoc || {});
    const hardFailures = [];
    const visualWarnings = [];
    const autoFixes = [];

    if (!doc.meta || typeof doc.meta !== "object") doc.meta = {};
    if (!doc.poses || typeof doc.poses !== "object") doc.poses = {};

    const id = typeof doc.meta.id === "string" ? doc.meta.id.trim() : "";
    const label = typeof doc.meta.label === "string" ? doc.meta.label.trim() : "";
    const baseTemplate = doc.meta.baseTemplate === "female_base" ? "female_base" : "male_base";

    if (!/^[a-z0-9_]+$/.test(id)) {
      hardFailures.push(
        issue(
          "hard",
          "field:char-id",
          "Character ID must use lowercase letters, numbers, and underscore only."
        )
      );
    }

    if (label.length < 2) {
      hardFailures.push(
        issue("hard", "field:char-label", "Character label must be at least 2 characters.")
      );
    }

    for (const poseId of POSE_IDS) {
      const pose = doc.poses[poseId];
      if (!pose || !Array.isArray(pose.layers)) {
        hardFailures.push(
          issue("hard", `pose:${poseId}`, `Pose "${poseId}" must contain a layers array.`)
        );
        continue;
      }

      if (!pose.layers.length) {
        visualWarnings.push(issue("visual", `pose:${poseId}`, `Pose "${poseId}" has no layers.`));
      }

      let visibleCount = 0;
      for (const layer of pose.layers) {
        if (layer && layer.visible !== false) visibleCount += 1;
        validateLayerShape(layer, poseId, hardFailures);
      }
      if (visibleCount === 0) {
        visualWarnings.push(
          issue("visual", `pose:${poseId}`, `Pose "${poseId}" has no visible layers.`)
        );
      }
    }

    const defMap = baseDefMap();
    const runtimeProfile = normalizeRuntimeProfile(doc.runtimeProfile, baseTemplate);
    doc.runtimeProfile = runtimeProfile;

    if (!defMap[runtimeProfile.baseType]) {
      hardFailures.push(
        issue(
          "hard",
          "field:runtime-base-type",
          "Runtime base NPC type must match a known runtime type."
        )
      );
    }

    if (!/^[a-z0-9_]+$/.test(runtimeProfile.npcType || "")) {
      hardFailures.push(
        issue(
          "hard",
          "field:runtime-npc-type",
          "Runtime npcType must use lowercase letters, numbers, and underscore only."
        )
      );
    }

    if (
      !Number.isFinite(runtimeProfile.wScale) ||
      runtimeProfile.wScale < 0.5 ||
      runtimeProfile.wScale > 2.2
    ) {
      hardFailures.push(issue("hard", "field:runtime-scale", "wScale must be within 0.5-2.2."));
    }

    if (
      !Number.isFinite(runtimeProfile.hScale) ||
      runtimeProfile.hScale < 0.5 ||
      runtimeProfile.hScale > 2.2
    ) {
      hardFailures.push(issue("hard", "field:runtime-scale", "hScale must be within 0.5-2.2."));
    }

    if (!Number.isFinite(runtimeProfile.healthMin) || runtimeProfile.healthMin <= 0) {
      hardFailures.push(
        issue("hard", "field:runtime-health", "healthMin must be a finite number greater than 0.")
      );
    }

    if (!Number.isFinite(runtimeProfile.healthMax) || runtimeProfile.healthMax <= 0) {
      hardFailures.push(
        issue("hard", "field:runtime-health", "healthMax must be a finite number greater than 0.")
      );
    }

    if (
      Number.isFinite(runtimeProfile.healthMin) &&
      Number.isFinite(runtimeProfile.healthMax) &&
      runtimeProfile.healthMin > runtimeProfile.healthMax
    ) {
      hardFailures.push(
        issue(
          "hard",
          "field:runtime-health",
          "healthMax must be greater than or equal to healthMin."
        )
      );
    }

    if (
      !normalizeHex(runtimeProfile.color) ||
      !normalizeHex(runtimeProfile.skinColor) ||
      !normalizeHex(runtimeProfile.hairColor)
    ) {
      hardFailures.push(
        issue(
          "hard",
          "field:runtime-colors",
          "Body, skin, and hair colors must be valid hex values."
        )
      );
    }

    if (!HAIR_STYLE_OPTIONS.includes(runtimeProfile.hairStyle)) {
      hardFailures.push(
        issue("hard", "field:runtime-colors", "Hair style must match a runtime-supported style.")
      );
    }

    if (
      !Number.isFinite(runtimeProfile.bustScale) ||
      runtimeProfile.bustScale < 0 ||
      runtimeProfile.bustScale > 2
    ) {
      hardFailures.push(
        issue("hard", "field:runtime-dress", "Bust scale must be between 0 and 2.")
      );
    }

    if (contrast(runtimeProfile.color, runtimeProfile.legColor) < 0.1) {
      const autoFixed = strictVisualRules && autoFixVisualIssues && applyAutoFix;
      if (autoFixed) {
        runtimeProfile.legColor = "#4A5568";
        autoFixes.push("Adjusted legColor for readability contrast.");
      }
      visualWarnings.push(
        issue("visual", "field:runtime-colors", "Leg color is too close to body color.", {
          autoFixed
        })
      );
    }

    if (contrast(runtimeProfile.legColor, runtimeProfile.shoeColor) < 0.08) {
      const autoFixed = strictVisualRules && autoFixVisualIssues && applyAutoFix;
      if (autoFixed) {
        runtimeProfile.shoeColor = "#1A1A2E";
        autoFixes.push("Adjusted shoeColor for readability contrast.");
      }
      visualWarnings.push(
        issue("visual", "field:runtime-colors", "Shoe color is too close to leg color.", {
          autoFixed
        })
      );
    }

    if (runtimeProfile.shortDress && !runtimeProfile.hasDress) {
      const autoFixed = strictVisualRules && autoFixVisualIssues && applyAutoFix;
      if (autoFixed) {
        runtimeProfile.hasDress = true;
        autoFixes.push("Enabled hasDress because shortDress is enabled.");
      }
      visualWarnings.push(
        issue(
          "visual",
          "field:runtime-dress",
          "shortDress is enabled while hasDress is disabled.",
          { autoFixed }
        )
      );
    }

    if (runtimeProfile.wScale > 1.6 || runtimeProfile.hScale > 1.6) {
      visualWarnings.push(
        issue(
          "visual",
          "field:runtime-scale",
          "Large runtime scale may reduce readability in crowded scenes."
        )
      );
    }

    const canExport = hardFailures.length === 0;
    const summary = {
      hardFailureCount: hardFailures.length,
      visualWarningCount: visualWarnings.length,
      autoFixCount: autoFixes.length,
      strictVisualRules,
      autoFixVisualIssues
    };

    return {
      resolvedDocument: doc,
      runtimeProfile: runtimeProfile,
      hardFailures,
      visualWarnings,
      autoFixes,
      canExport,
      summary,
      metadata: {
        strictVisualRules,
        autoFixVisualIssues,
        overrideEnabled: !strictVisualRules
      }
    };
  }

  function getConstraintReference() {
    return deepClone(CONSTRAINT_REFERENCE);
  }

  function getRuntimeBaseDefs() {
    return deepClone(RUNTIME_BASE_DEFS);
  }

  return {
    POSE_IDS: POSE_IDS.slice(),
    LAYER_TYPES: LAYER_TYPES.slice(),
    HAIR_STYLE_OPTIONS: HAIR_STYLE_OPTIONS.slice(),
    getRuntimeBaseDefs,
    createDefaultRuntimeProfile,
    normalizeRuntimeProfile,
    validateDesignerDocument,
    getConstraintReference
  };
});
