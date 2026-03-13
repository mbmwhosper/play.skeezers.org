(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.NPCRenderShared = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function fallbackClamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function fallbackRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function createCharacterRenderer(runtime) {
    if (!runtime || !runtime.ctx) {
      throw new Error("createCharacterRenderer requires a canvas 2D context");
    }

    const ctx = runtime.ctx;
    const CHAR_BY_NAME = runtime.CHAR_BY_NAME || {};
    const clamp = runtime.clamp || fallbackClamp;
    const roundRect = runtime.roundRect || fallbackRoundRect;
    const hatImg = runtime.hatImg || { complete: false, naturalWidth: 0, naturalHeight: 0 };

    function toNumber(value, fallback) {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    }

    function getPoseLayers(payload, poseId) {
      if (!payload || typeof payload !== "object") return [];
      const poses = payload.poses || {};
      const pose = poses[poseId];
      if (Array.isArray(pose)) return pose;
      if (pose && Array.isArray(pose.layers)) return pose.layers;
      return [];
    }

    function layerShouldFill(layerType) {
      return layerType !== "line" && layerType !== "curve";
    }

    function buildDesignerLayerPath(layer) {
      if (!layer || typeof layer !== "object" || typeof layer.type !== "string") return false;
      const g = layer.geometry || {};

      if (layer.type === "rect") {
        const x = toNumber(g.x, null);
        const y = toNumber(g.y, null);
        const w = toNumber(g.w, null);
        const h = toNumber(g.h, null);
        if (x === null || y === null || w === null || h === null) return false;
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        return true;
      }

      if (layer.type === "ellipse") {
        const x = toNumber(g.x, null);
        const y = toNumber(g.y, null);
        const w = toNumber(g.w, null);
        const h = toNumber(g.h, null);
        if (x === null || y === null || w === null || h === null) return false;
        ctx.beginPath();
        ctx.ellipse(
          x + w * 0.5,
          y + h * 0.5,
          Math.abs(w) * 0.5,
          Math.abs(h) * 0.5,
          0,
          0,
          Math.PI * 2
        );
        return true;
      }

      if (layer.type === "line") {
        const x1 = toNumber(g.x1, null);
        const y1 = toNumber(g.y1, null);
        const x2 = toNumber(g.x2, null);
        const y2 = toNumber(g.y2, null);
        if (x1 === null || y1 === null || x2 === null || y2 === null) return false;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        return true;
      }

      if (layer.type === "curve") {
        const x1 = toNumber(g.x1, null);
        const y1 = toNumber(g.y1, null);
        const cx = toNumber(g.cx, null);
        const cy = toNumber(g.cy, null);
        const x2 = toNumber(g.x2, null);
        const y2 = toNumber(g.y2, null);
        if (x1 === null || y1 === null || cx === null || cy === null || x2 === null || y2 === null)
          return false;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        return true;
      }

      if (layer.type === "polygon") {
        const points = Array.isArray(g.points) ? g.points : [];
        if (points.length < 2) return false;
        const startX = toNumber(points[0].x, null);
        const startY = toNumber(points[0].y, null);
        if (startX === null || startY === null) return false;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 1; i < points.length; i += 1) {
          const px = toNumber(points[i].x, null);
          const py = toNumber(points[i].y, null);
          if (px === null || py === null) return false;
          ctx.lineTo(px, py);
        }
        if (g.closed !== false) ctx.closePath();
        return true;
      }

      return false;
    }

    function sampleCurvePoints(g, steps) {
      const pts = [];
      const x1 = toNumber(g.x1, null);
      const y1 = toNumber(g.y1, null);
      const cx = toNumber(g.cx, null);
      const cy = toNumber(g.cy, null);
      const x2 = toNumber(g.x2, null);
      const y2 = toNumber(g.y2, null);
      if (x1 === null || y1 === null || cx === null || cy === null || x2 === null || y2 === null)
        return pts;
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const inv = 1 - t;
        pts.push({
          x: inv * inv * x1 + 2 * inv * t * cx + t * t * x2,
          y: inv * inv * y1 + 2 * inv * t * cy + t * t * y2
        });
      }
      return pts;
    }

    function getBoundsFromPoints(points) {
      if (!Array.isArray(points) || !points.length) return null;
      let xMin = Infinity;
      let yMin = Infinity;
      let xMax = -Infinity;
      let yMax = -Infinity;
      for (const point of points) {
        const px = toNumber(point && point.x, null);
        const py = toNumber(point && point.y, null);
        if (px === null || py === null) return null;
        xMin = Math.min(xMin, px);
        yMin = Math.min(yMin, py);
        xMax = Math.max(xMax, px);
        yMax = Math.max(yMax, py);
      }
      return { x: xMin, y: yMin, w: Math.max(0, xMax - xMin), h: Math.max(0, yMax - yMin) };
    }

    function getDesignerLayerBounds(layer) {
      if (!layer || typeof layer !== "object") return null;
      const g = layer.geometry || {};

      if (layer.type === "rect" || layer.type === "ellipse") {
        const x = toNumber(g.x, null);
        const y = toNumber(g.y, null);
        const w = toNumber(g.w, null);
        const h = toNumber(g.h, null);
        if (x === null || y === null || w === null || h === null) return null;
        const bx = Math.min(x, x + w);
        const by = Math.min(y, y + h);
        return { x: bx, y: by, w: Math.abs(w), h: Math.abs(h) };
      }

      if (layer.type === "line") {
        const x1 = toNumber(g.x1, null);
        const y1 = toNumber(g.y1, null);
        const x2 = toNumber(g.x2, null);
        const y2 = toNumber(g.y2, null);
        if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
        return {
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          w: Math.abs(x2 - x1),
          h: Math.abs(y2 - y1)
        };
      }

      if (layer.type === "curve") {
        const points = sampleCurvePoints(g, 40);
        return getBoundsFromPoints(points);
      }

      if (layer.type === "polygon") {
        return getBoundsFromPoints(Array.isArray(g.points) ? g.points : []);
      }

      return null;
    }

    function safeSetFillStyle(styleValue, fallback) {
      try {
        ctx.fillStyle = styleValue;
      } catch (_err) {
        ctx.fillStyle = fallback;
      }
    }

    function safeSetStrokeStyle(styleValue, fallback) {
      try {
        ctx.strokeStyle = styleValue;
      } catch (_err) {
        ctx.strokeStyle = fallback;
      }
    }

    function buildDesignerLayerGradient(layer, bounds) {
      const style = layer.style || {};
      const gradientDef = style.gradient || {};
      const angle = (toNumber(gradientDef.angle, 90) * Math.PI) / 180;
      const cx = bounds.x + bounds.w * 0.5;
      const cy = bounds.y + bounds.h * 0.5;
      const radius = Math.max(bounds.w, bounds.h) * 0.75 + 1;
      const x1 = cx - Math.cos(angle) * radius;
      const y1 = cy - Math.sin(angle) * radius;
      const x2 = cx + Math.cos(angle) * radius;
      const y2 = cy + Math.sin(angle) * radius;
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      const stops =
        Array.isArray(gradientDef.stops) && gradientDef.stops.length >= 2
          ? gradientDef.stops
          : [
              { offset: 0, color: style.fill || "#FFFFFF" },
              { offset: 1, color: "#000000" }
            ];
      for (const stop of stops) {
        const offset = clamp(toNumber(stop && stop.offset, 0), 0, 1);
        const color = stop && typeof stop.color === "string" ? stop.color : "#FFFFFF";
        gradient.addColorStop(offset, color);
      }
      return gradient;
    }

    function getLegacyAnimationState(opts) {
      const safeOpts = opts && typeof opts === "object" ? opts : {};
      const walkPhase = toNumber(safeOpts.walkPhase, 0);
      const breathOffset = toNumber(safeOpts.breathing, 0);
      const isKO = !!safeOpts.isKO;
      const isFleeing = !!safeOpts.isFleeing;
      const isCrouching = !!safeOpts.isCrouching;
      const isMovingJump = !!safeOpts.isMovingJump;
      const airState = safeOpts.airState || null;
      const openMouth = !!safeOpts.openMouth;
      const absWalk = Math.abs(walkPhase);

      let legLAngle = 0;
      let legRAngle = 0;
      if (isKO) {
        legLAngle = 0.5;
        legRAngle = 0;
      } else if (airState && !isCrouching && isMovingJump) {
        if (airState === "rising") {
          legLAngle = 0.6;
          legRAngle = 0.4;
        } else {
          legLAngle = -0.7;
          legRAngle = -0.5;
        }
      } else if (airState && !isCrouching) {
        legLAngle = 0.22;
        legRAngle = 0.28;
      } else if (absWalk > 0.01 && !isCrouching) {
        legLAngle = Math.sin(walkPhase) * 0.45;
        legRAngle = Math.sin(walkPhase + Math.PI) * 0.45;
      }

      let armLAngle = 0;
      let armRAngle = 0;
      const armsUp = isKO || isFleeing;
      if (armsUp && absWalk > 0.01) {
        armLAngle = Math.sin(walkPhase) * 0.45;
        armRAngle = Math.sin(walkPhase + Math.PI) * 0.45;
      } else if (armsUp) {
        armLAngle = 0.2;
        armRAngle = -0.2;
      } else if (airState && !isCrouching && isMovingJump) {
        if (airState === "rising") {
          armLAngle = 0.5;
          armRAngle = 0.4;
        } else {
          armLAngle = -0.6;
          armRAngle = -0.5;
        }
      } else if (airState && !isCrouching) {
        armLAngle = 0.15;
        armRAngle = 0.15;
      } else if (absWalk > 0.01 && !isCrouching) {
        armLAngle = Math.sin(walkPhase + Math.PI) * 0.35;
        armRAngle = Math.sin(walkPhase) * 0.35;
      }

      return {
        walkPhase,
        breathOffset,
        legLAngle,
        legRAngle,
        armLAngle,
        armRAngle,
        armsUp,
        mouthOpenScale: isFleeing || openMouth ? 1.35 : 1.0
      };
    }

    function inferDesignerLayerPart(layer) {
      const explicitPart = layer && typeof layer.partRole === "string" ? layer.partRole : "";
      if (explicitPart) {
        const known = [
          "left_arm",
          "right_arm",
          "left_leg",
          "right_leg",
          "left_shoe",
          "right_shoe",
          "torso",
          "head",
          "hair",
          "mouth",
          "brow",
          "eye",
          "face",
          "other"
        ];
        if (known.includes(explicitPart)) return explicitPart;
      }
      const name = ((layer && layer.name) || "").toLowerCase();
      const id = ((layer && layer.id) || "").toLowerCase();
      const key = `${name} ${id}`;

      if (key.includes("left arm") || key.includes("arm left")) return "left_arm";
      if (key.includes("right arm") || key.includes("arm right")) return "right_arm";
      if (key.includes("left leg") || key.includes("leg left")) return "left_leg";
      if (key.includes("right leg") || key.includes("leg right")) return "right_leg";
      if (key.includes("left shoe") || key.includes("shoe left") || key.includes("left boot"))
        return "left_shoe";
      if (key.includes("right shoe") || key.includes("shoe right") || key.includes("right boot"))
        return "right_shoe";
      if (key.includes("torso") || key.includes("body") || key.includes("chest")) return "torso";
      if (key.includes("head")) return "head";
      if (key.includes("hair") || key.includes("bang")) return "hair";
      if (key.includes("mouth") || key.includes("lip")) return "mouth";
      if (key.includes("brow")) return "brow";
      if (key.includes("eye") || key.includes("pupil")) return "eye";
      if (key.includes("face") || key.includes("nose")) return "face";
      return "other";
    }

    function getDesignerRigMotion(opts) {
      const legacy = getLegacyAnimationState(opts || {});
      return {
        legL: legacy.legLAngle,
        legR: legacy.legRAngle,
        armL: legacy.armLAngle,
        armR: legacy.armRAngle,
        armsUp: legacy.armsUp,
        bodyDy: legacy.breathOffset * 0.7,
        headDy: legacy.breathOffset,
        mouthOpenScale: legacy.mouthOpenScale
      };
    }

    function buildDesignerPartBounds(layers) {
      const partBounds = Object.create(null);
      const partArea = Object.create(null);
      for (const layer of layers) {
        if (!layer || layer.visible === false) continue;
        const part = inferDesignerLayerPart(layer);
        if (part === "other") continue;
        const bounds = getDesignerLayerBounds(layer);
        if (!bounds) continue;
        const area = Math.max(1, bounds.w * bounds.h);
        if (!(part in partBounds) || area > partArea[part]) {
          partBounds[part] = bounds;
          partArea[part] = area;
        }
      }
      return partBounds;
    }

    function getLegPivot(bounds) {
      return {
        x: bounds.x + bounds.w * 0.5,
        y: bounds.y + bounds.h * 0.1
      };
    }

    function getDesignerLayerPivot(part, bounds, partBounds) {
      const cx = bounds.x + bounds.w * 0.5;
      const cy = bounds.y + bounds.h * 0.5;

      if (part === "left_arm")
        return { x: bounds.x + bounds.w * 0.86, y: bounds.y + bounds.h * 0.12 };
      if (part === "right_arm")
        return { x: bounds.x + bounds.w * 0.14, y: bounds.y + bounds.h * 0.12 };
      if (part === "left_leg") {
        const source = (partBounds && partBounds.left_leg) || bounds;
        return getLegPivot(source);
      }
      if (part === "right_leg") {
        const source = (partBounds && partBounds.right_leg) || bounds;
        return getLegPivot(source);
      }
      if (part === "left_shoe") {
        const source = partBounds && partBounds.left_leg;
        if (source) return getLegPivot(source);
        return { x: cx, y: bounds.y + bounds.h * 0.06 };
      }
      if (part === "right_shoe") {
        const source = partBounds && partBounds.right_leg;
        if (source) return getLegPivot(source);
        return { x: cx, y: bounds.y + bounds.h * 0.06 };
      }
      if (part === "head") return { x: cx, y: bounds.y + bounds.h * 0.68 };
      if (part === "hair") return { x: cx, y: bounds.y + bounds.h * 0.55 };
      if (part === "eye" || part === "brow" || part === "mouth" || part === "face")
        return { x: cx, y: cy };
      if (part === "torso") return { x: cx, y: cy };
      return { x: cx, y: cy };
    }

    function getDesignerLayerMotion(part, rig, bounds) {
      if (part === "left_arm") return { angle: rig.armL, dy: rig.bodyDy, flipY: rig.armsUp };
      if (part === "right_arm") return { angle: rig.armR, dy: rig.bodyDy, flipY: rig.armsUp };
      if (part === "left_leg") return { angle: rig.legL, dy: rig.bodyDy };
      if (part === "right_leg") return { angle: rig.legR, dy: rig.bodyDy };
      if (part === "left_shoe") return { angle: rig.legL, dy: rig.bodyDy };
      if (part === "right_shoe") return { angle: rig.legR, dy: rig.bodyDy };
      if (part === "torso") return { dy: rig.bodyDy };
      if (part === "head") return { dy: rig.headDy };
      if (part === "hair") return { dy: rig.headDy };
      if (part === "brow") return { dy: rig.headDy };
      if (part === "mouth") {
        const safeH = Math.max(0.001, bounds.h || 0);
        const pivotY = bounds.y + safeH * 0.5;
        return {
          dy: rig.headDy,
          scaleY: rig.mouthOpenScale,
          scalePivotY: pivotY
        };
      }
      if (part === "eye" || part === "face") return { dy: rig.headDy };
      return null;
    }

    function applyDesignerLayerMotionTransform(targetCtx, bounds, motion, pivotOverride) {
      if (!targetCtx || !bounds || !motion) return;
      const pivotFallbackX = bounds.x + bounds.w * 0.5;
      const pivotFallbackY = bounds.y + bounds.h * 0.5;
      const pivotX = toNumber(pivotOverride && pivotOverride.x, pivotFallbackX);
      const pivotY = toNumber(pivotOverride && pivotOverride.y, pivotFallbackY);
      const dx = toNumber(motion.dx, 0);
      const dy = toNumber(motion.dy, 0);
      const angle = toNumber(motion.angle, 0);
      const scaleLayerX = toNumber(motion.scaleX, 1);
      const scaleLayerY = toNumber(motion.scaleY, 1);
      const flipY = !!motion.flipY;

      if (dx || dy) targetCtx.translate(dx, dy);
      if (angle || scaleLayerX !== 1 || scaleLayerY !== 1 || flipY) {
        const scalePivotY = toNumber(motion.scalePivotY, pivotY);
        targetCtx.translate(pivotX, scalePivotY);
        if (flipY) targetCtx.scale(1, -1);
        if (angle) targetCtx.rotate(angle);
        if (scaleLayerX !== 1 || scaleLayerY !== 1) targetCtx.scale(scaleLayerX, scaleLayerY);
        targetCtx.translate(-pivotX, -scalePivotY);
      }
    }

    function drawDesignerPayloadCharacter(x, y, w, h, opts) {
      if (
        !opts ||
        typeof opts !== "object" ||
        !opts.designerPayload ||
        typeof opts.designerPayload !== "object"
      ) {
        return false;
      }
      const payload = opts.designerPayload;
      const poseId = typeof opts.designerPose === "string" ? opts.designerPose : "normal";
      const layers = getPoseLayers(payload, poseId);
      if (!layers.length) return false;

      const payloadBounds = payload.bounds || {};
      const editorScale = Math.max(0.001, toNumber(payloadBounds.editorScale, 3.2));
      const designW = Math.max(0.001, toNumber(payloadBounds.w, 24) * editorScale);
      const designH = Math.max(0.001, toNumber(payloadBounds.h, 46) * editorScale);
      const origin = payload.origin || {};
      const centerX = toNumber(origin.centerX, 480);
      const baselineY = toNumber(origin.baselineY, 430);

      const f = opts.facing || 1;
      const sqX = opts.squash || 1;
      const sqY = sqX !== 1 ? 1 / sqX : 1;
      const opacity = clamp(opts.opacity !== undefined ? opts.opacity : 1, 0, 1);
      const scaleX = w / designW;
      const scaleY = h / designH;
      const rig = getDesignerRigMotion(opts || {});
      const partBounds = buildDesignerPartBounds(layers);

      let drewAny = false;
      ctx.save();
      try {
        ctx.translate(x, y);
        ctx.scale(sqX * f, sqY);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-centerX, -baselineY);

        for (const layer of layers) {
          if (!layer || layer.visible === false) continue;
          const style = layer.style || {};
          const strokeW = Math.max(0, toNumber(style.strokeWidth, 0));
          const layerOpacity = clamp(toNumber(style.opacity, 1), 0, 1);
          const bounds = getDesignerLayerBounds(layer);
          const part = inferDesignerLayerPart(layer);
          const motion = bounds ? getDesignerLayerMotion(part, rig, bounds) : null;

          try {
            ctx.save();
            if (motion && bounds) {
              const pivot = getDesignerLayerPivot(part, bounds, partBounds);
              applyDesignerLayerMotionTransform(ctx, bounds, motion, pivot);
            }

            if (!buildDesignerLayerPath(layer)) continue;
            ctx.globalAlpha = opacity * layerOpacity;
            if (layerShouldFill(layer.type)) {
              if (style.fillMode === "gradient" && bounds) {
                safeSetFillStyle(buildDesignerLayerGradient(layer, bounds), "#3B82F6");
              } else {
                safeSetFillStyle(style.fill || "#3B82F6", "#3B82F6");
              }
              ctx.fill();
              drewAny = true;
            }
            if (strokeW > 0) {
              safeSetStrokeStyle(style.stroke || "#0F172A", "#0F172A");
              ctx.lineWidth = strokeW;
              ctx.lineJoin = "round";
              ctx.lineCap = "round";
              ctx.stroke();
              drewAny = true;
            }
            ctx.restore();
          } catch (_err) {
            ctx.restore();
            // Skip malformed layer and continue rendering remaining layers.
          }
        }
      } finally {
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      return drewAny;
    }

    function drawCharacter(x, y, w, h, opts) {
      opts = opts || {};
      if (drawDesignerPayloadCharacter(x, y, w, h, opts)) return;
      const legacyMotion = getLegacyAnimationState(opts);
      const f = opts.facing || 1;
      const bodyColor = opts.color || "#3B82F6";
      const skin = opts.skinColor || "#FBBF6B";
      const hair = opts.hairColor || "#3D2B1F";
      const sqX = opts.squash || 1;
      const sqY = sqX !== 1 ? 1 / sqX : 1;
      const breathOffset = legacyMotion.breathOffset;
      const isBlinking = (opts.blinkTimer || 0) < 0.12;
      const isCrouching = opts.isCrouching || false;
      const walkPhase = legacyMotion.walkPhase;
      const opacity = opts.opacity !== undefined ? opts.opacity : 1;
      const npcType = opts.npcType || "normal";
      const charDef = CHAR_BY_NAME[npcType] || {};
      const isBig = charDef.isBig || false;
      const hairStyle = opts.hairStyle || "short";
      const eyeColor = opts.eyeColor || "#1A1A2E";
      const customLegColor = opts.legColor || null;
      const customShoeColor = opts.shoeColor || null;
      const defaultShoeColor =
        npcType === "sumo" ? "#8B7355" : npcType === "gothmommy" ? "#2D1B4E" : "#2D3748";
      const shoeColor = customShoeColor || charDef.shoeColor || defaultShoeColor;
      const isFeminine = opts.feminineBody || false;
      const bustScale = opts.bustScale || 0;
      const hasDress = opts.hasDress || false;
      const shortDress = opts.shortDress || false;
      const shortDressBareLegs = npcType === "party_girl" && shortDress;

      ctx.globalAlpha = opacity;
      ctx.save();
      ctx.translate(x, y);
      // Mirror entire character based on facing direction
      ctx.scale(sqX * f, sqY);

      let bodyH = isCrouching ? h * 0.55 : h * 0.45;
      let bodyW = isBig ? w * 0.85 : w * 0.7;
      const bodyY = isCrouching ? -h * 0.35 : -h * 0.55;
      // Feminine body: slimmer torso
      if (isFeminine) {
        bodyW *= 0.78;
      }
      const headR = w * (isBig ? 0.28 : 0.32);
      const headY = bodyY - headR * 0.7 + breathOffset;
      const bodyDrawY = bodyY + breathOffset * 0.7;

      // Legs (or dress)
      {
        const legColor = customLegColor || charDef.legColor || (isBig ? "#4A4A5A" : "#4A5568");
        if (hasDress && !isCrouching) {
          if (shortDressBareLegs) {
            // Party Girl: keep short dress, but render full-length bare legs like standard NPCs.
            const legW = w * (isBig ? 0.22 : isFeminine ? 0.15 : 0.18);
            const legH = h * 0.35;
            const legSpread = w * (isBig ? 0.22 : isFeminine ? 0.15 : 0.18);
            const legLAngle = legacyMotion.legLAngle;
            const legRAngle = legacyMotion.legRAngle;
            for (const [sign, angle] of [
              [-1, legLAngle],
              [1, legRAngle]
            ]) {
              ctx.save();
              ctx.translate(sign * legSpread, bodyDrawY + bodyH);
              ctx.rotate(angle);
              ctx.fillStyle = skin;
              ctx.fillRect(-legW / 2, 0, legW, legH);
              ctx.fillStyle = shoeColor;
              ctx.fillRect(-legW / 2 - 1, legH - 4, legW + 3, 5);
              ctx.restore();
            }
          }
          // Dress: flared trapezoid, short or long
          const dressTop = bodyDrawY + bodyH * 0.55;
          const dressH = shortDress ? h * 0.18 : h * 0.38;
          const topW = bodyW * 0.9;
          const botW = bodyW * (shortDress ? 1.3 : 1.6);
          const swish = Math.abs(walkPhase) > 0.01 ? Math.sin(walkPhase) * botW * 0.08 : 0;
          ctx.fillStyle = bodyColor;
          ctx.beginPath();
          ctx.moveTo(-topW / 2, dressTop);
          ctx.lineTo(topW / 2, dressTop);
          ctx.lineTo(botW / 2 + swish, dressTop + dressH);
          ctx.lineTo(-botW / 2 + swish, dressTop + dressH);
          ctx.closePath();
          ctx.fill();
          if (!shortDressBareLegs) {
            // Feet peeking out beneath dress
            ctx.fillStyle = skin;
            ctx.fillRect(-botW * 0.25 + swish, dressTop + dressH - 2, 4, 4);
            ctx.fillRect(botW * 0.15 + swish, dressTop + dressH - 2, 4, 4);
            // Heels
            ctx.fillStyle = shoeColor;
            ctx.fillRect(-botW * 0.25 + swish - 1, dressTop + dressH + 2, 5, 3);
            ctx.fillRect(botW * 0.15 + swish - 1, dressTop + dressH + 2, 5, 3);
          }
        } else {
          // Standard legs
          const legW = w * (isBig ? 0.22 : isFeminine ? 0.15 : 0.18);
          const legH = isCrouching ? h * 0.2 : h * 0.35;
          const legSpread = w * (isBig ? 0.22 : isFeminine ? 0.15 : 0.18);
          const legLAngle = legacyMotion.legLAngle;
          const legRAngle = legacyMotion.legRAngle;
          for (const [sign, angle] of [
            [-1, legLAngle],
            [1, legRAngle]
          ]) {
            ctx.save();
            ctx.translate(sign * legSpread, bodyDrawY + bodyH);
            ctx.rotate(angle);
            ctx.fillStyle = legColor;
            ctx.fillRect(-legW / 2, 0, legW, legH);
            if (npcType === "gymgirl") {
              ctx.fillStyle = bodyColor;
              ctx.fillRect(-legW / 2, 0, legW, legH * 0.25);
            }
            if (npcType === "gothmommy") {
              ctx.fillStyle = "#1A1A2E";
              ctx.fillRect(-legW / 2, 0, legW, legH * 0.25);
            }
            ctx.fillStyle = shoeColor;
            ctx.fillRect(-legW / 2 - 1, legH - 4, legW + 3, npcType === "gothmommy" ? 7 : 5);
            ctx.restore();
          }
        }
      }

      // Body
      if (isFeminine) {
        // Hourglass torso with waist taper
        ctx.fillStyle = bodyColor;
        const waistNarrow = bodyW * 0.72;
        const hipFlare = bodyW * 1.05;
        ctx.beginPath();
        ctx.moveTo(-bodyW / 2, bodyDrawY);
        ctx.lineTo(bodyW / 2, bodyDrawY);
        ctx.lineTo(bodyW / 2, bodyDrawY + bodyH * 0.15);
        ctx.quadraticCurveTo(
          waistNarrow / 2,
          bodyDrawY + bodyH * 0.5,
          hipFlare / 2,
          bodyDrawY + bodyH
        );
        ctx.lineTo(-hipFlare / 2, bodyDrawY + bodyH);
        ctx.quadraticCurveTo(
          -waistNarrow / 2,
          bodyDrawY + bodyH * 0.5,
          -bodyW / 2,
          bodyDrawY + bodyH * 0.15
        );
        ctx.closePath();
        ctx.fill();
        // Bust
        if (bustScale > 0) {
          const bustR = bodyW * 0.22 * bustScale;
          const bustY = bodyDrawY + bodyH * 0.3;
          const bustSpread = bustR * 1.15;
          if (npcType === "gothmommy") {
            // Goth Mommy: two separate bust ellipses (revealing top)
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.ellipse(-bustSpread, bustY, bustR * 1.15, bustR, 0, 0, Math.PI * 2);
            ctx.ellipse(bustSpread, bustY, bustR * 1.15, bustR, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(0,0,0,0.07)";
            ctx.beginPath();
            ctx.ellipse(-bustSpread, bustY, bustR * 1.15, bustR, 0, 0, Math.PI * 2);
            ctx.ellipse(bustSpread, bustY, bustR * 1.15, bustR, 0, 0, Math.PI * 2);
            ctx.fill();
            // Underbust shadows
            const moonCY = bustY + bustR * 0.4;
            ctx.fillStyle = "rgba(0,0,0,0.14)";
            ctx.beginPath();
            ctx.ellipse(-bustSpread, moonCY, bustR * 0.9, bustR * 0.5, 0, 0, Math.PI);
            ctx.ellipse(bustSpread, moonCY, bustR * 0.9, bustR * 0.5, 0, 0, Math.PI);
            ctx.fill();
          } else {
            // Everyone else: uniboob capsule (same color as clothes)
            const uniW = (bustSpread + bustR * 1.15) * 2;
            const uniH = bustR * 2;
            ctx.fillStyle = bodyColor;
            roundRect(ctx, -uniW / 2, bustY - bustR, uniW, uniH, bustR);
            // Underbust shadow
            const moonCY = bustY + bustR * 0.4;
            ctx.fillStyle = "rgba(0,0,0,0.14)";
            ctx.beginPath();
            ctx.ellipse(0, moonCY, uniW * 0.4, bustR * 0.5, 0, 0, Math.PI);
            ctx.fill();
          }
        }
      } else {
        ctx.fillStyle = bodyColor;
        roundRect(ctx, -bodyW / 2, bodyDrawY, bodyW, bodyH, 4);
      }
      // Sumo: big round belly
      if (npcType === "sumo") {
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(0, bodyDrawY + bodyH * 0.55, bodyW * 0.45, bodyH * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // Mawashi belt
        ctx.fillStyle = "#C8A870";
        ctx.fillRect(-bodyW * 0.4, bodyDrawY + bodyH * 0.7, bodyW * 0.8, bodyH * 0.15);
      }
      // Muscle/giant/chad/baller: tank top / sleeveless — exposed shoulders
      if (charDef.exposedShoulders) {
        const shoulderR = npcType === "gothmommy" ? w * 0.1 : w * 0.12;
        const shoulderY = npcType === "gothmommy" ? bodyDrawY + 5 : bodyDrawY + 6;
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(-bodyW / 2 - 2, shoulderY, shoulderR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bodyW / 2 + 2, shoulderY, shoulderR, 0, Math.PI * 2);
        ctx.fill();
      }
      // Baller: jersey number
      if (npcType === "baller") {
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.round(bodyH * 0.35)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("69", 0, bodyDrawY + bodyH * 0.65);
      }
      // Babushka: floral dots on dress
      if (npcType === "babushka") {
        ctx.fillStyle = "#D4A0D4";
        for (let fy = 0; fy < 3; fy++)
          for (let fx = -1; fx <= 1; fx++) {
            ctx.beginPath();
            ctx.arc(
              fx * bodyW * 0.25,
              bodyDrawY + bodyH * 0.25 + fy * bodyH * 0.22,
              2,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
      }
      // Karen: sunglasses pushed up on forehead (drawn after head, but body decoration here)
      // Goth Mommy: black shorts (lower body), chest circles
      if (npcType === "gothmommy") {
        // Black shorts — tighter, hip-level
        ctx.fillStyle = "#0A0A0A";
        ctx.fillRect(-bodyW / 2, bodyDrawY + bodyH * 0.62, bodyW, bodyH * 0.38);
      }

      // Arms
      {
        const armW = w * (isBig ? 0.2 : 0.14),
          armH = isCrouching ? h * 0.22 : h * 0.32;
        const armLAngle = legacyMotion.armLAngle;
        const armRAngle = legacyMotion.armRAngle;
        const armsUp = legacyMotion.armsUp;
        const armUpper = charDef.bareArm ? skin : bodyColor;
        for (const [sign, angle] of [
          [-1, armLAngle],
          [1, armRAngle]
        ]) {
          ctx.save();
          ctx.translate(sign * (bodyW / 2 + armW * 0.3), bodyDrawY + 2);
          if (armsUp) ctx.scale(1, -1);
          ctx.rotate(angle);
          ctx.fillStyle = armUpper;
          ctx.fillRect(-armW / 2, 0, armW, armH * 0.45);
          ctx.fillStyle = skin;
          ctx.fillRect(-armW / 2, armH * 0.45, armW, armH * 0.55);
          if (npcType === "gothmommy") {
            ctx.fillStyle = "#0A0A0A";
            ctx.fillRect(-armW / 2, armH * 0.78, armW, 3);
          }
          ctx.restore();
        }
      }

      // Head
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(0, headY, headR, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = hair;
      // All hair styles handled in switch (special types + normal)
      {
        switch (hairStyle) {
          case "pompadour": // Chad
            ctx.beginPath();
            ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-headR * 0.3, headY - headR);
            ctx.quadraticCurveTo(headR * 0.5, headY - headR - 14, headR * 0.9, headY - headR + 4);
            ctx.lineTo(-headR * 0.6, headY - headR + 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(headR - 2, headY - 4, 4, headR * 0.8);
            ctx.fillRect(-headR - 1, headY - 4, 4, headR * 0.8);
            break;
          case "karenbob": // Karen — asymmetric bob, one side longer
            ctx.beginPath();
            ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2);
            ctx.fill();
            // Short side
            ctx.fillRect(-headR - 1, headY - 3, 5, headR * 0.6);
            // Long side (swoops forward and down)
            ctx.fillRect(headR - 3, headY - 3, 5, headR * 1.4);
            ctx.beginPath();
            ctx.moveTo(headR - 3, headY + headR * 1.1);
            ctx.quadraticCurveTo(headR + 4, headY + headR * 0.4, headR + 2, headY - 2);
            ctx.lineTo(headR - 1, headY - 2);
            ctx.closePath();
            ctx.fill();
            break;
          case "headscarf": // Babushka — wrap around head
            // Scarf covers top and wraps under chin
            ctx.beginPath();
            ctx.arc(0, headY - 1, headR + 2, Math.PI * 0.9, Math.PI * 2.1);
            ctx.fill();
            // Scarf sides draping down
            ctx.fillRect(-headR - 2, headY - 2, 5, headR * 1.2);
            ctx.fillRect(headR - 2, headY - 2, 5, headR * 1.2);
            break;
          case "highpony": // Gym Girl — high bouncy ponytail
            ctx.beginPath();
            ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2);
            ctx.fill();
            // Ponytail sprouts from top of head, curves back
            ctx.beginPath();
            ctx.moveTo(-2, headY - headR - 1);
            ctx.quadraticCurveTo(-headR * 0.5, headY - headR - 12, -headR - 3, headY - headR + 2);
            ctx.quadraticCurveTo(-headR - 5, headY - 2, -headR - 2, headY + 6);
            ctx.lineTo(-headR + 1, headY + 4);
            ctx.quadraticCurveTo(-headR + 2, headY - headR - 6, 2, headY - headR - 1);
            ctx.closePath();
            ctx.fill();
            // Scrunchie
            ctx.fillStyle = "#FF69B4";
            ctx.beginPath();
            ctx.arc(0, headY - headR - 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = hair;
            break;
          case "headband": // Jogger — short hair + headband
            ctx.beginPath();
            ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-headR - 1, headY - 4, 4, headR * 0.7);
            ctx.fillRect(headR - 3, headY - 4, 4, headR * 0.7);
            // Headband
            ctx.fillStyle = "#FF4500";
            ctx.fillRect(-headR - 1, headY - headR * 0.3, (headR + 1) * 2, 3);
            ctx.fillStyle = hair;
            break;
          case "fade": // Baller — flat top fade + headband
            // Flat top
            ctx.beginPath();
            ctx.arc(0, headY - 1, headR + 0.5, Math.PI * 1.05, Math.PI * 1.95);
            ctx.fill();
            ctx.fillRect(-headR * 0.7, headY - headR - 3, headR * 1.4, 4);
            // Headband
            ctx.fillStyle = "#E53E3E";
            ctx.fillRect(-headR - 1, headY - headR * 0.3, (headR + 1) * 2, 3);
            ctx.fillStyle = hair;
            break;
          case "buzz": // Generic big types
            ctx.beginPath();
            ctx.arc(0, headY - 1, headR + 0.5, Math.PI * 1.1, Math.PI * 1.9);
            ctx.fill();
            break;
          case "long":
            ctx.beginPath();
            ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-headR - 1, headY - 4, 5, headR * 1.6);
            ctx.fillRect(headR - 3, headY - 4, 5, headR * 1.6);
            break;
          case "ponytail":
            ctx.beginPath();
            ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2);
            ctx.fill();
            // Ponytail behind head (negative X = behind in local space since char faces +X)
            ctx.beginPath();
            ctx.arc(-headR - 4, headY + 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-headR - 6, headY + 2, 4, 10);
            break;
          case "mohawk":
            ctx.beginPath();
            ctx.moveTo(-4, headY - headR + 2);
            ctx.lineTo(-2, headY - headR - 10);
            ctx.lineTo(0, headY - headR - 12);
            ctx.lineTo(2, headY - headR - 10);
            ctx.lineTo(4, headY - headR + 2);
            ctx.fill();
            break;
          case "bun":
            ctx.beginPath();
            ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, headY - headR - 3, 5, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "longgoth": // Goth Mommy — long straight hair with heavy bangs
            ctx.beginPath();
            ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2);
            ctx.fill();
            // Heavy straight bangs covering forehead
            ctx.fillRect(-headR - 1, headY - headR * 0.7, (headR + 1) * 2, headR * 0.5);
            // Long straight hair down both sides
            ctx.fillRect(-headR - 2, headY - 4, 5, headR * 2.4);
            ctx.fillRect(headR - 2, headY - 4, 5, headR * 2.4);
            break;
          case "spiky":
            ctx.beginPath();
            ctx.arc(0, headY - 2, headR + 1, Math.PI * 1.1, Math.PI * 1.9);
            ctx.fill();
            for (let s = -2; s <= 2; s++) {
              const sx = s * (headR * 0.35);
              ctx.beginPath();
              ctx.moveTo(sx - 3, headY - headR + 3);
              ctx.lineTo(sx, headY - headR - 6 - Math.abs(s) * 2);
              ctx.lineTo(sx + 3, headY - headR + 3);
              ctx.fill();
            }
            break;
          default: // 'short'
            ctx.beginPath();
            ctx.arc(0, headY - 2, headR + 1, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-headR - 1, headY - 4, 4, headR * 0.7);
            ctx.fillRect(headR - 3, headY - 4, 4, headR * 0.7);
            break;
        }
      }

      // McHat on player's head
      if (opts.isPlayer && hatImg.complete && hatImg.naturalWidth > 0) {
        const hatW = headR * 2.2;
        const hatH = hatW * (hatImg.naturalHeight / hatImg.naturalWidth);
        ctx.drawImage(hatImg, -hatW / 2, headY - headR - hatH * 0.55, hatW, hatH);
      }
      // Hard Hat: yellow construction helmet
      if (npcType === "hard_hat") {
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(-headR * 0.9, headY - headR - 4, headR * 1.8, 5);
        ctx.beginPath();
        ctx.arc(0, headY - headR - 1, headR * 0.8, Math.PI, Math.PI * 2);
        ctx.fill();
        // Brim
        ctx.fillRect(-headR * 1.1, headY - headR - 1, headR * 2.2, 3);
      }

      // Gym girl: exposed midriff band
      if (npcType === "gymgirl") {
        ctx.fillStyle = skin;
        ctx.fillRect(-bodyW / 2, bodyDrawY + bodyH * 0.58, bodyW, 5);
      }
      // Goth Mommy: midriff + choker
      if (npcType === "gothmommy") {
        ctx.fillStyle = skin;
        ctx.fillRect(-bodyW / 2, bodyDrawY + bodyH * 0.56, bodyW, 4);
        // Choker
        ctx.fillStyle = "#0A0A0A";
        ctx.fillRect(-headR * 0.6, headY + headR - 1, headR * 1.2, 2);
      }
      // Face (no f* needed — ctx.scale handles mirroring)
      const eyeY = headY + 1,
        eyeSpread = headR * 0.35;
      if (opts.isKO) {
        // >< face — scaled to head size, positioned between center and upper third
        const koY = headY - headR * 0.12;
        const sz = headR * 0.28;
        const koSpread = headR * 0.38;
        ctx.strokeStyle = "#2D2D2D";
        ctx.lineWidth = Math.max(1.5, headR * 0.15);
        ctx.beginPath();
        // > (left eye)
        ctx.moveTo(-koSpread - sz, koY - sz);
        ctx.lineTo(-koSpread + sz, koY);
        ctx.moveTo(-koSpread - sz, koY + sz);
        ctx.lineTo(-koSpread + sz, koY);
        // < (right eye)
        ctx.moveTo(koSpread + sz, koY - sz);
        ctx.lineTo(koSpread - sz, koY);
        ctx.moveTo(koSpread + sz, koY + sz);
        ctx.lineTo(koSpread - sz, koY);
        ctx.stroke();
      } else if (isBlinking) {
        ctx.strokeStyle = "#2D2D2D";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-eyeSpread - 2, eyeY);
        ctx.lineTo(-eyeSpread + 3, eyeY);
        ctx.moveTo(eyeSpread - 2, eyeY);
        ctx.lineTo(eyeSpread + 3, eyeY);
        ctx.stroke();
      } else {
        // WHITE SCLERA
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(-eyeSpread, eyeY, 3.5, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(eyeSpread, eyeY, 3.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // PUPILS — dynamic gaze if lookAt is set, otherwise look in facing direction
        let pupilDx = 1.2,
          pupilDy = 0;
        if (opts.lookAtScreenX !== undefined) {
          const dx = (opts.lookAtScreenX - x) * f;
          const dy = (opts.lookAtScreenY !== undefined ? opts.lookAtScreenY : y) - y + (headY + 1);
          pupilDx = clamp(dx * 0.04, -1.7, 1.7);
          pupilDy = clamp(dy * 0.04, -1.0, 1.0);
        }
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(-eyeSpread + pupilDx, eyeY + pupilDy, 1.8, 0, Math.PI * 2);
        ctx.arc(eyeSpread + pupilDx, eyeY + pupilDy, 1.8, 0, Math.PI * 2);
        ctx.fill();
        // Big type angry eyebrows
        if (charDef.angryBrows && !opts.isFleeing) {
          ctx.strokeStyle = "#2D2D2D";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-eyeSpread - 3, eyeY - 5);
          ctx.lineTo(-eyeSpread + 3, eyeY - 3);
          ctx.moveTo(eyeSpread - 3, eyeY - 3);
          ctx.lineTo(eyeSpread + 3, eyeY - 5);
          ctx.stroke();
        }
      }

      // Mouth (KO = no mouth, just XX eyes)
      if (opts.isKO) {
        // no mouth — XX eyes are enough
      } else if (opts.isFleeing || opts.openMouth) {
        ctx.fillStyle = "#2D2D2D";
        ctx.beginPath();
        ctx.ellipse(0, headY + headR * 0.75, 1.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (npcType === "gothmommy") {
        // Dark lipstick — smaller, lower
        ctx.fillStyle = "#4A0028";
        ctx.beginPath();
        ctx.ellipse(0, headY + headR * 0.65, 1.5, 1, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Karen: sunglasses pushed up on forehead
      if (npcType === "karen" && !opts.isKO) {
        ctx.fillStyle = "#1A1A1A";
        ctx.fillRect(-eyeSpread - 4, headY - headR * 0.5, eyeSpread * 2 + 8, 3);
        ctx.fillRect(-eyeSpread - 3, headY - headR * 0.5, 5, 4);
        ctx.fillRect(eyeSpread - 2, headY - headR * 0.5, 5, 4);
      }
      // Bouncer: dark sunglasses over eyes
      if (npcType === "bouncer" && !opts.isKO) {
        ctx.fillStyle = "#0A0A0A";
        ctx.fillRect(-eyeSpread - 4, eyeY - 3, eyeSpread * 2 + 8, 5);
        ctx.fillRect(-eyeSpread - 3, eyeY - 3, 7, 6);
        ctx.fillRect(eyeSpread - 3, eyeY - 3, 7, 6);
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    return {
      drawCharacter,
      getLegacyAnimationState,
      getDesignerRigMotion,
      inferDesignerLayerPart,
      buildDesignerPartBounds,
      getDesignerLayerPivot,
      getDesignerLayerMotion,
      applyDesignerLayerMotionTransform
    };
  }

  return {
    createCharacterRenderer
  };
});
