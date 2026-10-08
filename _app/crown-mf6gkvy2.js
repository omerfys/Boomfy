import{N as S,P as f,d as k,s as B}from"/_app/index-evjrd1zv.js";

var colGoldLight = k("#fff9c4"),
    colGoldMain = k("#ffd700"),
    colGoldDark = k("#b8860b"),
    colDiamond = k("#ffffff"),
    colRuby = k("#ff1744"),
    colSapphire = k("#00e5ff"),
    colEmerald = k("#00e676"),
    colVelvetRed = k("#800020"),
    colSolarGlow = k("#ffb703");

// Imperial Solar Crown Pattern (7-Prong Jewel Diadem)
var crownPattern = [
  "d.s.r.s.d",
  "#.#.#.#.#",
  "##.###.##",
  "h#h#r#h#h",
  "bbbbbbbbb",
  "d#e#r#e#d",
  "ggggggggg"
];

var colorMap = {
  d: colDiamond,
  s: colSapphire,
  r: colRuby,
  e: colEmerald,
  "#": colGoldMain,
  h: colGoldLight,
  b: colGoldDark,
  g: colGoldDark
};

var shimmerCycle = 2.8,
    shimmerDuration = 0.35;

function getCrownTransform(ctx, sway) {
  let headTr = f(ctx),
      angle = sway?.a ?? 0,
      lift = sway?.lift ?? 0,
      cosA = Math.cos(angle),
      sinA = Math.sin(angle),
      fwdX = headTr.fx * cosA - headTr.fy * sinA,
      fwdY = headTr.fx * sinA + headTr.fy * cosA,
      upX = headTr.ux * cosA - headTr.uy * sinA,
      upY = headTr.ux * sinA + headTr.uy * cosA,
      [baseX, baseY] = headTr.at(0.3, 2.5 + lift);

  return (colIdx, rowIdx) => [
    baseX + fwdX * colIdx + upX * rowIdx,
    baseY + fwdY * colIdx + upY * rowIdx
  ];
}

var g = {
  kind: "item",
  id: "crown",
  name: "Solar Emperor",
  slot: "head",

  step(z) {
    let now = z.rig.now,
        sway = z.data.sway ??= { a: 0, av: 0, lift: 0, lv: 0, vx: now.vx, vy: now.vy, glint: false },
        accelX = now.vx - sway.vx,
        accelY = now.vy - sway.vy;

    sway.vx = now.vx;
    sway.vy = now.vy;

    // Angular tilt sway with spring damping
    sway.av += S(-accelX * 0.75, -45, 45) - (sway.a * 180 + sway.av * 9.5) * z.dt;
    sway.a = S(sway.a + sway.av * z.dt, -0.55, 0.55);

    // Vertical inertia lift on high downward velocity / landings
    if (accelY < -180) {
      sway.lv += S(-accelY * 0.035, 0, 28);
    }
    sway.lv -= (sway.lift * 320 + sway.lv * 13) * z.dt;
    sway.lift = Math.max(0, sway.lift + sway.lv * z.dt);
    if (sway.lift === 0 && sway.lv < 0) sway.lv = 0;

    // Shimmer glint & star particle burst
    let isShimmer = z.t % shimmerCycle < shimmerDuration;
    if (sway.glint && !isShimmer) {
      let tr = getCrownTransform(z, sway),
          [starX, starY] = tr(4, 6.0);
      z.emit("star", starX * B, starY * B, now.vx * 0.2 + (z.rand() - 0.5) * 25, -25 - z.rand() * 25, 0.75, colGoldLight, 0.85);
    }
    sway.glint = isShimmer;
  },

  head(z) {
    let tr = getCrownTransform(z, z.data.sway),
        tMod = z.rig.now.t % shimmerCycle,
        shimmerX = tMod < shimmerDuration ? Math.round(8 * tMod / shimmerDuration) : -1;

    // Draw Imperial Crown pixels
    crownPattern.forEach((row, rIdx) => {
      [...row].forEach((ch, cIdx) => {
        if (ch === ".") return;
        let isGlintCol = rIdx === 3 && cIdx === shimmerX;
        let [px, py] = tr(cIdx - 4, crownPattern.length - 0.5 - rIdx);
        z.px(px, py, isGlintCol ? colDiamond : colorMap[ch], 1);
      });
    });
  },

  glow(z) {
    let tr = getCrownTransform(z, z.data.sway),
        [gx, gy] = tr(0, 2.0);
    // Radiant golden solar illumination
    z.glow(gx, gy, 8, colSolarGlow, 0.28);
    z.glow(gx, gy, 3, colDiamond, 0.22);
  }
};

export default g;
