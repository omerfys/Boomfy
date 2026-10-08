import{N as J,O as w,P as v,R as H,T as K,d as q,e as o,s as G}from"/_app/index-evjrd1zv.js";

var basaltNear = q("#2c1e36"),
    basaltFar = q("#180f20"),
    basaltOutline = q("#0c0710"),
    magmaBright = q("#fff7cc"),
    magmaGold = q("#ffc300"),
    magmaOrange = q("#ff5400"),
    magmaRed = q("#d00000"),
    magmaDark = q("#540b0e"),
    hornStone = q("#3d274c"),
    hornTip = q("#ff7b00"),
    fireGlowCol = q("#ff4800");

// Fiery Oni Demonic Face Pattern
var oniMouth = [
  "#.#.#.#",
  "#######",
  " # # # "
];

var oniFaceMarking = [
  " #...# ",
  "##...##",
  "#.#.#.#"
];

var l = {
  kind: "character",
  id: "pumpkin",
  name: "Inferno Oni",
  near: basaltNear,
  far: basaltFar,
  outline: basaltOutline,

  step(g) {
    let rig = g.rig.now,
        u = g.data.inferno ??= { due: 0, flameT: 0 };
    u.flameT += g.dt * 6;
    u.due += g.dt * (6 + Math.min(12, Math.hypot(rig.vx, rig.vy) / 35));
    if (u.due < 1) return;
    let headTr = v(g);
    for (; u.due >= 1; u.due--) {
      // Spawn magma embers & flames from horns and head
      let [qx, qy] = headTr.at(-0.8 + (g.rand() - 0.5) * 3.5, 4.5 + g.rand() * 2);
      let emberCol = g.rand() > 0.4 ? magmaOrange : magmaGold;
      g.emit("ember", qx * G, qy * G, rig.vx * 0.12 + (g.rand() - 0.5) * 35, rig.vy * 0.12 - 30 - g.rand() * 40, 0.7 + g.rand() * 0.9, emberCol);
    }
  },

  back(g) {
    let u = g.rig;
    // Glowing magma joints on back limbs
    for (let j of [u.elbowF, u.kneeF]) {
      g.disc(j.x / G, j.y / G, 1.4, g.far);
      g.disc(j.x / G, j.y / G, 0.6, magmaOrange);
    }
  },

  body(g) {
    let u = g.rig, H_facing = u.now.facing;
    // Magma chest cracks
    let cx = u.chest.x / G, cy = u.chest.y / G;
    let sx = u.spine.x / G, sy = u.spine.y / G;
    let px = u.pelvis.x / G, py = u.pelvis.y / G;

    // Glowing molten core inside basalt ribcage
    g.disc(cx, cy, 1.6, magmaDark);
    g.disc(cx, cy, 1.1, magmaRed);
    g.disc(cx, cy, 0.6, magmaGold);

    // Molten veins down spine to pelvis
    g.line(cx, cy, sx, sy, magmaOrange, 2);
    g.line(sx, sy, px, py, magmaRed, 2);

    // Magma knees and boots
    g.disc(u.kneeN.x / G, u.kneeN.y / G, 1.4, g.near);
    g.disc(u.kneeN.x / G, u.kneeN.y / G, 0.7, magmaGold);

    for (let [D, I] of [[u.footF, g.far], [u.footN, g.near]]) {
      g.cap(D, { x: D.x + H_facing * 2.6 * G, y: D.y }, 0.7, I);
      g.px(D.x / G + H_facing * 0.8, D.y / G, magmaOrange, 2);
    }
  },

  head(g) {
    let j = v(g),
        u = g.rig.now.t,
        [zx, zy] = j.at(0, 0.8),
        W = 5.2,
        r = 4.4;

    // Sculpted Volcanic Head shape with carved magma fissures
    H(zx, zy, 6.4, (X, Y) => {
      let Z = X + 0.5 - zx,
          D = Y + 0.5 - zy,
          fwd = Z * j.fx + D * j.fy,
          up = Z * j.ux + D * j.uy,
          B = (fwd / 5.2) ** 2 + (up / 4.4) ** 2;

      if (B > 1) return;

      // Magma crack lines along the skull
      let isRidge = Math.abs(Math.abs(fwd) - 2.5) < 0.55 || B > 0.82;
      let isMagmaVein = (Math.abs(up - 0.8) < 0.45 && fwd > -2 && fwd < 3) || (Math.abs(fwd + 1.2) < 0.4 && up > -2 && up < 2);
      let isHighlight = up > 1.8 && fwd > 0.3 && fwd < 2.5 && B < 0.6;

      g.px(X, Y, isMagmaVein ? magmaRed : isRidge ? magmaDark : isHighlight ? basaltNear : basaltNear, 1);
    });

    // Twin Blazing Demon Oni Horns curving up and back
    // Horn 1 (Front horn)
    let [h1x, h1y] = j.at(1.8, 4.2);
    g.px(h1x, h1y, hornStone, 2);
    let [h1tx, h1ty] = j.at(2.8, 5.8);
    g.px(h1tx, h1ty, hornTip, 2);
    let [h1fx, h1fy] = j.at(3.6, 7.2);
    g.px(h1fx, h1fy, magmaBright, 2);

    // Horn 2 (Back horn)
    let [h2x, h2y] = j.at(-1.4, 4.0);
    g.px(h2x, h2y, hornStone, 2);
    let [h2tx, h2ty] = j.at(-2.4, 5.4);
    g.px(h2tx, h2ty, hornTip, 2);
    let [h2fx, h2fy] = j.at(-3.0, 6.6);
    g.px(h2fx, h2fy, magmaOrange, 2);

    // Magma Brow Horn Crest
    for (let [ox, oy, col] of [[0.2, 4.2, magmaDark], [0.8, 4.6, magmaOrange], [1.4, 4.8, magmaGold]]) {
      g.px(...j.at(ox, oy), col, 2);
    }

    // Glowing Molten Eyes (Piercing Oni gaze)
    let pulse = J(0.6 + 0.4 * w(u * 3.5, 3), 0, 1);
    let eyeColor = o(magmaOrange, magmaBright, pulse);

    // Eye sockets
    g.px(...j.at(-0.4, 0.8), magmaDark, 2);
    g.px(...j.at(2.2, 0.8), magmaDark, 2);
    g.px(...j.at(-0.2, 0.8), eyeColor, 2);
    g.px(...j.at(2.4, 0.8), eyeColor, 2);
    g.px(...j.at(2.4 + 0.3 * j.f, 0.8), magmaBright, 2);

    // Demon Oni Fangs / Molten Grill Mouth
    K(g, j, ["#.#.#", "#####"], 1.3, -1.8, { "#": magmaDark, ".": magmaGold });
  },

  front(g) {
    let u = g.rig;
    g.disc(u.elbowN.x / G, u.elbowN.y / G, 1.4, g.near);
    g.disc(u.elbowN.x / G, u.elbowN.y / G, 0.7, magmaGold);
    g.disc(u.handN.x / G, u.handN.y / G, 1.2, g.near);
    g.px(u.handN.x / G, u.handN.y / G, magmaBright, 2);
  },

  glow(g) {
    let j = v(g),
        u = g.rig.now.t,
        pulse = J(0.6 + 0.4 * w(u * 2.8, 2), 0, 1),
        [qx, qy] = j.at(1.4, 0.8);

    // Radiant amber & gold fire illumination
    g.glow(qx, qy, 14, fireGlowCol, 0.36 + 0.22 * pulse);
    g.glow(qx, qy, 6, magmaBright, 0.28 + 0.22 * pulse);

    // Chest magma glow
    let cx = g.rig.chest.x / G, cy = g.rig.chest.y / G;
    g.glow(cx, cy, 8, magmaOrange, 0.25 + 0.15 * pulse);
  }
};

export default l;
