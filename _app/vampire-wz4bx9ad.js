import{$ as N,A as D,M as H,P as v,R as Y,S as m,T as C,U as j,V as G,W as F,X as R,Y as _,Z as P,_ as f,d as X,s as O}from"/_app/index-evjrd1zv.js";

var colNear = X("#1c1428"),
    colFar = X("#0f0a17"),
    colOutline = X("#07040b"),
    colCapeOuter = X("#2c163b"),
    colCapeInner = X("#9e0e22"),
    colCapeRuby = X("#d90429"),
    colCapeGold = X("#ffb703"),
    colSkinPale = X("#f0e8f7"),
    colSkinShadow = X("#bcaec9"),
    colHairBlack = X("#0e0b14"),
    colEyeRed = X("#ff003c"),
    colEyeWhite = X("#ffffff"),
    colBatDark = X("#2e1840"),
    colBatEye = X("#ff1744"),
    capeSegments = 10;

var y = {
  kind: "character",
  id: "vampire",
  name: "Blood Sovereign",
  near: colNear,
  far: colFar,
  outline: colOutline,

  step(q) {
    let rig = q.rig;
    // Dynamic Verlet cape physics
    j(q, "cape", 1, capeSegments, 4.8, () => _(rig, 0.85, 0.65), {
      gravity: D * 0.62,
      drag: 3.2,
      bend: 0.12,
      force: (M, $, g, V, L, k) => {
        let [l, d] = P(rig, g, V, L, k, 1.5 + $ * 0.5, 900, 5),
            [I, o] = f(rig, q.t, $, 0, 14, 55, 1.6),
            w = $ / (capeSegments - 1);
        return [l + I * w, d + o * w];
      }
    });

    // Shadow Bat Familiar orbit physics
    let angle = q.t * 2.2,
        dist = (9 + 3.5 * Math.sin(q.t * 0.4)) * O,
        targetX = rig.head.x + Math.cos(angle) * dist,
        targetY = rig.head.y - 7.5 * O + Math.sin(angle * 2) * 2.8 * O,
        bat = q.data.bat;

    if (!bat || Math.hypot(bat.x - targetX, bat.y - targetY) > 250) {
      bat = q.data.bat = { x: targetX, y: targetY, vx: 0, vy: 0 };
    }

    bat.vx += ((targetX - bat.x) * 40 - bat.vx * 7.5) * q.dt;
    bat.vy += ((targetY - bat.y) * 40 - bat.vy * 7.5) * q.dt;
    bat.x += bat.vx * q.dt;
    bat.y += bat.vy * q.dt;

    // Blood mist motes
    let mist = q.data.mist ??= { due: 0 };
    mist.due += q.dt * (3 + Math.hypot(rig.now.vx, rig.now.vy) / 160);
    for (; mist.due >= 1; mist.due--) {
      q.emit("ember", bat.x + (q.rand() - 0.5) * 4, bat.y + (q.rand() - 0.5) * 4, (q.rand() - 0.5) * 15, -15 - q.rand() * 20, 0.4 + q.rand() * 0.4, colCapeRuby);
    }
  },

  back(q) {
    let cape = G(q, "cape");
    if (!cape) return;

    let pts = R(F(cape, 0));
    // Draw outer dark shadow velvet with crimson lining and gold trim
    N(q, pts, (J) => 1.7 + 4.6 * J ** 0.7, (J, Q) => 0.6 + (0.6 + 2.4 * Q) * J, colCapeOuter, colCapeInner, 2.2);

    // Gold filigree edge along the cape
    for (let J = 2; J < pts.length - 2; J++) {
      q.px(...pts[J], colCapeGold, 1);
    }
  },

  body(q) {
    let rig = q.rig,
        facing = rig.now.facing,
        [cx, cy] = H(rig.chest),
        backX = -facing;

    // Royal Victorian Lapels (Crimson velvet folds)
    for (let poly of [
      [[cx + backX * 0.5, cy - 0.5], [cx + backX * 3.3, cy - 1.2], [cx + backX * 2.5, cy - 5.8]],
      [[cx + facing * 0.3, cy - 0.5], [cx + facing * 2.5, cy - 1.0], [cx + facing * 1.9, cy - 4.4]]
    ]) {
      m(poly, (M, $) => q.px(M, $, colCapeInner, 1));
    }

    // Gold Buttons & Royal Ruby Heart Brooch
    q.px(cx + facing * 0.5, cy + 1, colCapeGold, 2);
    q.px(cx + facing * 0.5, cy + 2, colCapeGold, 2);
    q.px(cx + facing * 0.5, cy, colCapeRuby, 2);
    q.px(cx + facing * 0.5, cy - 1, colEyeWhite, 2);

    // Aristocratic knee guards & boots
    q.disc(rig.kneeN.x / O, rig.kneeN.y / O, 1.3, q.near);
    q.disc(rig.kneeN.x / O, rig.kneeN.y / O, 0.6, colCapeGold);

    for (let [D, I] of [[rig.footF, q.far], [rig.footN, q.near]]) {
      q.cap(D, { x: D.x + facing * 2.5 * O, y: D.y }, 0.65, I);
      q.px(D.x / O, D.y / O, colCapeGold, 2);
    }
  },

  head(q) {
    let headTr = v(q),
        t = q.rig.now.t;

    // Aristocratic Head Shape with Pale Skin & Gothic Hair
    Y(headTr.hx, headTr.hy, 4.6, (Q, Z) => {
      let dx = Q + 0.5 - headTr.hx,
          dy = Z + 0.5 - headTr.hy;
      if (dx * dx + dy * dy > 16.0) return;

      let fwd = dx * headTr.fx + dy * headTr.fy,
          up = dx * headTr.ux + dy * headTr.uy,
          hairThreshold = 1.7 - 1.0 * Math.max(0, 1 - Math.abs(fwd - 1.3) / 1.2),
          isHair = up > hairThreshold || fwd < -1.7;

      q.px(Q, Z, isHair ? colHairBlack : fwd < -0.6 ? colSkinShadow : colSkinPale, 1);
    });

    // Glowing Demonic Crimson Eyes
    let isBlinking = t % 4.2 < 0.1;
    if (!isBlinking) {
      q.px(...headTr.at(0.6, 0.1), colEyeRed, 2);
      q.px(...headTr.at(2.4, 0.1), colEyeRed, 2);
      q.px(...headTr.at(2.4 + 0.3 * headTr.f, 0.1), colEyeWhite, 2);
    }

    // Gothic Widow's Peak & Sharp Vampire Fangs
    C(q, headTr, ["###"], 1.6, -1.7, { "#": colHairBlack });
    q.px(...headTr.at(1.0, -2.4), colEyeWhite, 2);
    q.px(...headTr.at(2.2, -2.4), colEyeWhite, 2);
  },

  front(q) {
    let bat = q.data.bat;
    if (!bat) return;

    let bx = bat.x / O,
        by = bat.y / O,
        wingFlap = Math.sin(q.rig.now.t * 28) > 0,
        batWings = wingFlap ? ["#...#", "##.##", ".###."] : ["..#..", ".###.", "#####"];

    batWings.forEach((row, rIdx) => {
      [...row].forEach((ch, cIdx) => {
        if (ch === "#") q.px(bx + cIdx - 2, by + rIdx - 1, colBatDark, 2);
      });
    });

    // Glowing Red Eyes on Bat
    q.px(bx, by + (wingFlap ? 0 : 1), colBatEye, 2);

    // Cuffs on wrist
    let u = q.rig;
    q.disc(u.elbowN.x / O, u.elbowN.y / O, 1.3, q.near);
    q.disc(u.handN.x / O, u.handN.y / O, 1.1, q.near);
    q.px(u.handN.x / O, u.handN.y / O, colCapeGold, 2);
  },

  glow(q) {
    let headTr = v(q),
        t = q.rig.now.t,
        pulse = 0.2 + 0.12 * Math.max(0, Math.sin(t * 1.8));

    for (let ox of [0.6, 2.4]) {
      let [gx, gy] = headTr.at(ox, 0.1);
      q.glow(gx, gy, 3.5, colEyeRed, pulse);
    }

    // Ruby brooch chest glow
    let [cx, cy] = H(q.rig.chest);
    q.glow(cx, cy, 6, colCapeRuby, pulse * 0.8);
  }
};

export default y;
