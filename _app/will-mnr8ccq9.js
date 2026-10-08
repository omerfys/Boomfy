import{M as T,N as O,O as G,d as U,s as Y}from"/_app/index-evjrd1zv.js";

var colWhite = U("#ffffff"),
    colCyan = U("#7df9ff"),
    colPrismViolet = U("#b388ff"),
    colDeepVoid = U("#4a148c"),
    colNear = U("#b8d8ff"),
    colFar = U("#6c82b0"),
    colOutline = U("#0a0614"),
    colGlow = U("#c77dff"),
    colEye = U("#0a0818"),
    plasmaPalette = [colWhite, colCyan, colPrismViolet, colDeepVoid];

var headRadius = 4.4,
    dragFactor = 0.0018,
    // 5 Cosmic Plasma Flares with distinct lengths and physics stiffness
    flares = [
      { len: 10.5, off: -0.2, k: 210, r0: 2.6 }, // Main central streaming stellar tail
      { len: 7.2, off: -3.2, k: 175, r0: 1.9 },  // Top crest flare
      { len: 6.8, off: 2.8, k: 250, r0: 1.9 },   // Bottom flare
      { len: 4.8, off: -5.0, k: 280, r0: 1.4 },  // High wisp
      { len: 4.2, off: 4.5, k: 290, r0: 1.3 }    // Low wisp
    ],
    smoothK = 0.45,
    attenuateA = 0.55,
    eyeOffsets = [-2.0, 1.2],
    ditherTable = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5],
    ditherFn = (v, z) => (ditherTable[(z & 3) << 2 | v & 3] + 0.5) / 16;

function computeFacingAxes(rig) {
  let now = rig.now,
      facing = now.facing,
      vx = -now.vx * dragFactor,
      vy = -1 - now.vy * dragFactor * 0.5,
      len = Math.hypot(vx, vy) || 1;
  vx /= len;
  vy /= len;
  return { ax: vx, ay: vy, qx: -vy * facing, qy: vx * facing };
}

// Procedural plasma field rasterizer
function renderPlasmaField(pen, cx, cy, radius, segments) {
  let minX = cx - radius,
      maxX = cx + radius,
      minY = cy - radius,
      maxY = cy + radius;

  for (let i = 0; i < segments.length; i += 8) {
    let sx = segments[i],
        sy = segments[i + 1],
        r0 = segments[i + 7];
    minX = Math.min(minX, sx - r0, sx + segments[i + 2] - r0);
    maxX = Math.max(maxX, sx + r0, sx + segments[i + 2] + r0);
    minY = Math.min(minY, sy - r0, sy + segments[i + 3] - r0);
    maxY = Math.max(maxY, sy + r0, sy + segments[i + 3] + r0);
  }

  for (let py = Math.floor(minY); py <= Math.ceil(maxY); py++) {
    for (let px = Math.floor(minX); px <= Math.ceil(maxX); px++) {
      let sampleX = px + 0.5,
          sampleY = py + 0.5,
          field = 1 - Math.hypot(sampleX - cx, sampleY - cy) / radius;

      for (let i = 0; i < segments.length; i += 8) {
        let x0 = segments[i],
            y0 = segments[i + 1],
            dx = segments[i + 2],
            dy = segments[i + 3],
            segLenSq = segments[i + 4],
            proj = O(((sampleX - x0) * dx + (sampleY - y0) * dy) / segLenSq, 0, 1),
            tNorm = segments[i + 5] + proj * segments[i + 6],
            segR = segments[i + 7] + (smoothK - segments[i + 7]) * tNorm,
            dist = 1 - Math.hypot(x0 + dx * proj - sampleX, y0 + dy * proj - sampleY) / segR,
            contrib = dist * (1 - attenuateA * tNorm);

        if (contrib > field) field = contrib;
      }

      if (field <= 0) continue;
      let dithered = field + (ditherFn(px, py) - 0.5) * 0.12;
      pen.px(px, py, plasmaPalette[dithered > 0.58 ? 0 : dithered > 0.36 ? 1 : dithered > 0.16 ? 2 : 3], 1);
    }
  }
}

var e = {
  kind: "character",
  id: "will",
  name: "Astral Phantom",
  near: colNear,
  far: colFar,
  outline: colOutline,

  step(v) {
    let rig = v.rig,
        now = rig.now,
        axes = computeFacingAxes(rig),
        tips = v.data.tips ??= [];

    flares.forEach((fl, idx) => {
      let flLen = fl.len * Y * (1 + 0.28 * G(v.t * 2.8 + idx * 3.1, idx * 2.1)),
          targetX = rig.head.x + axes.ax * flLen + axes.qx * fl.off * Y,
          targetY = rig.head.y + axes.ay * flLen + axes.qy * fl.off * Y,
          tip = tips[idx];

      if (!tip || Math.hypot(tip.x - targetX, tip.y - targetY) > 180) {
        tip = tips[idx] = { x: targetX, y: targetY, vx: 0, vy: 0 };
      }

      tip.vx += ((targetX - tip.x) * fl.k - tip.vx * 14) * v.dt;
      tip.vy += ((targetY - tip.y) * fl.k - tip.vy * 14) * v.dt;
      tip.x += tip.vx * v.dt;
      tip.y += tip.vy * v.dt;

      let dx = tip.x - targetX,
          dy = tip.y - targetY,
          dist = Math.hypot(dx, dy),
          maxDist = fl.len * Y * 0.55;

      if (dist > maxDist) {
        tip.x = targetX + dx / dist * maxDist;
        tip.y = targetY + dy / dist * maxDist;
      }
    });

    // Cosmic stardust motes
    let sparks = v.data.sparks ??= { due: 0 };
    sparks.due += v.dt * (4 + Math.hypot(now.vx, now.vy) / 140);
    let leadTip = tips[0] ?? rig.head;
    for (; sparks.due >= 1; sparks.due--) {
      let sparkCol = v.rand() > 0.5 ? colCyan : colWhite;
      v.emit("mote", leadTip.x + (v.rand() - 0.5) * 6, leadTip.y + (v.rand() - 0.5) * 6, now.vx * 0.2 + (v.rand() - 0.5) * 35, -35 - v.rand() * 35 + now.vy * 0.1, 0.5 + v.rand() * 0.6, sparkCol);
    }
  },

  back(v) {
    let rig = v.rig;
    for (let joint of [rig.elbowF, rig.kneeF]) {
      v.disc(joint.x / Y, joint.y / Y, 1.3, v.far);
      v.disc(joint.x / Y, joint.y / Y, 0.6, colPrismViolet);
    }
  },

  body(v) {
    let rig = v.rig;
    // Glowing stardust joints & stellar core
    let cx = rig.chest.x / Y, cy = rig.chest.y / Y;
    v.disc(cx, cy, 1.2, colPrismViolet);
    v.disc(cx, cy, 0.6, colWhite);

    v.disc(rig.kneeN.x / Y, rig.kneeN.y / Y, 1.3, v.near);
    v.disc(rig.kneeN.x / Y, rig.kneeN.y / Y, 0.6, colCyan);

    let H = rig.now.facing;
    for (let [D, I] of [[rig.footF, v.far], [rig.footN, v.near]]) {
      v.cap(D, { x: D.x + H * 2.4 * Y, y: D.y }, 0.65, I);
      v.px(D.x / Y, D.y / Y, colCyan, 2);
    }
  },

  head(v) {
    let rig = v.rig,
        now = rig.now,
        t = now.t,
        facing = now.facing,
        [hx, hy] = T(rig.head),
        axes = computeFacingAxes(rig),
        tips = v.data.tips ?? [],
        segments = [];

    flares.forEach((fl, idx) => {
      let tip = tips[idx];
      if (!tip) return;

      let p0x = hx + axes.qx * fl.off * 0.45,
          p0y = hy + axes.qy * fl.off * 0.45,
          p1x = hx + axes.ax * fl.len * 0.55 + axes.qx * fl.off * 0.8,
          p1y = hy + axes.ay * fl.len * 0.55 + axes.qy * fl.off * 0.8,
          p2x = tip.x / Y,
          p2y = tip.y / Y;

      let bezier = (s) => [
        (1 - s) ** 2 * p0x + 2 * (1 - s) * s * p1x + s * s * p2x,
        (1 - s) ** 2 * p0y + 2 * (1 - s) * s * p1y + s * s * p2y
      ];

      for (let sIdx = 0; sIdx < 6; sIdx++) {
        let [x0, y0] = bezier(sIdx / 6),
            [x1, y1] = bezier((sIdx + 1) / 6),
            dx = x1 - x0,
            dy = y1 - y0,
            lenSq = dx * dx + dy * dy || 0.000001;

        segments.push(x0, y0, dx, dy, lenSq, sIdx / 6, 1 / 6, fl.r0);
      }
    });

    // Render continuous procedural plasma flame head
    renderPlasmaField(v, hx, hy, headRadius * (1 + 0.05 * Math.sin(t * 14)), segments);

    // Glowing Astral Eyes
    let gunCos = Math.round(Math.cos(rig.gunAngle) * 0.8),
        gunSin = Math.round(Math.sin(rig.gunAngle) * 0.8),
        isBlinking = t % 4.6 < 0.12;

    for (let ox of eyeOffsets) {
      let ex = Math.floor(hx + facing * ox) + gunCos,
          ey = Math.floor(hy) + gunSin;

      for (let row = isBlinking ? 1 : -1; row <= 1; row++) {
        for (let col = -1; col <= 0; col++) {
          v.px(ex + col, ey + row, colEye, 1);
        }
      }
      // Glowing White-Cyan Iris Glint
      if (!isBlinking) {
        v.px(ex, ey, colWhite, 2);
      }
    }
  },

  front(v) {
    let rig = v.rig;
    v.disc(rig.elbowN.x / Y, rig.elbowN.y / Y, 1.3, v.near);
    v.disc(rig.elbowN.x / Y, rig.elbowN.y / Y, 0.6, colCyan);
    v.disc(rig.handN.x / Y, rig.handN.y / Y, 1.1, v.near);
    v.px(rig.handN.x / Y, rig.handN.y / Y, colWhite, 2);
  },

  glow(v) {
    let [hx, hy] = T(v.rig.head),
        pulse = O(0.65 + 0.35 * G(v.rig.now.t * 3.2, 2), 0, 1);
    // Multitier celestial cyan and violet illumination
    v.glow(hx, hy - 2, 18, colGlow, 0.22 + 0.12 * pulse);
    v.glow(hx, hy - 2, 8, colCyan, 0.28 + 0.15 * pulse);
  }
};

export default e;
