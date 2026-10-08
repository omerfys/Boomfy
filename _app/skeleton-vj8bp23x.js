import{O as A,P as V,Q as L,T as U,d as J,s as z}from"/_app/index-evjrd1zv.js";
var boneNear=J("#d8e2ec"),boneFar=J("#6b7d93"),outlineCol=J("#0b0e14"),
    neonGreen=J("#00ff9d"),brightGreen=J("#b3ffd9"),darkGreen=J("#004d2a"),
    coreWhite=J("#ffffff"),darkChrome=J("#1f2530"),armorPlate=J("#333d4d");

// Pixel patterns for cyber skull:
// Horns & cranium crest
var skullPattern = [
  " #...# ",
  "##...##",
  "#######",
  "#.#.#.#",
  "#######",
  " # # # "
];

var skullEyeActive = [
  "##.##",
  "##.##"
];

var j = {
  kind: "character",
  id: "skeleton",
  name: "Cyber Reaper",
  near: boneNear,
  far: boneFar,
  outline: outlineCol,
  hide: { torso: true },

  step(q) {
    let rig = q.rig, now = rig.now, u = q.data.reaper ??= { due: 0, pulse: 0 };
    u.pulse += q.dt * 4;
    u.due += q.dt * (4 + Math.min(10, Math.hypot(now.vx, now.vy) / 40));
    if (u.due < 1) return;
    let headTr = V(q);
    for (; u.due >= 1; u.due--) {
      // Emit cyber green souls & motes from chest and skull
      let [hx, hy] = headTr.at(-1 + (q.rand() - 0.5) * 3, 2.5 + q.rand() * 2);
      q.emit("mote", hx * z, hy * z, now.vx * 0.15 + (q.rand() - 0.5) * 25, now.vy * 0.15 - 20 - q.rand() * 30, 0.5 + q.rand() * 0.6, brightGreen);
    }
  },

  back(q) {
    let u = q.rig;
    // Back limb joints with cybernetic discs
    for (let v of [u.elbowF, u.kneeF]) {
      q.disc(v.x / z, v.y / z, 1.4, q.far);
      q.disc(v.x / z, v.y / z, 0.6, darkGreen);
    }
    q.disc(u.handF.x / z, u.handF.y / z, 1.2, q.far);
  },

  body(q) {
    let u = q.rig, v = L(q);
    // Spinal cyber column
    q.cap(u.pelvis, u.spine, 0.65, q.near);
    q.cap(u.spine, u.chest, 0.65, q.near);

    // Glowing green spinal energy nodes
    for (let f of [0.35, 0.7]) {
      let nx = u.pelvis.x + v.ux * v.len * z * f;
      let ny = u.pelvis.y + v.uy * v.len * z * f;
      q.disc(nx / z, ny / z, 0.7, neonGreen);
    }

    // 3 Curved Cyber-Ribs with glowing neon tips
    for (let [D, I] of [[0.95, 2.6], [0.76, 3.0], [0.57, 2.4]]) {
      let W = u.pelvis.x + v.ux * v.len * z * D,
          X = u.pelvis.y + v.uy * v.len * z * D,
          Y = ($) => ({
            x: W + v.nx * I * z * $ - v.ux * 0.9 * z,
            y: X + v.ny * I * z * $ - v.uy * 0.9 * z
          }),
          Z = { x: W, y: X };
      q.cap(Y(-1), Z, 0.55, q.near);
      q.cap(Z, Y(1), 0.55, q.near);
      // Neon tip on front rib
      let tip = Y(1);
      q.disc(tip.x / z, tip.y / z, 0.5, neonGreen);
    }

    // Pelvic Armor & Knee Joints
    let M = (D) => ({ x: u.pelvis.x + v.nx * 1.9 * z * D, y: u.pelvis.y + v.ny * 1.9 * z * D });
    q.cap(M(-1), M(1), 0.9, q.near);
    q.disc(u.kneeN.x / z, u.kneeN.y / z, 1.4, q.near);
    q.disc(u.kneeN.x / z, u.kneeN.y / z, 0.7, neonGreen);

    // Reinforced cyber boots with neon heel sparks
    let H = u.now.facing;
    for (let [D, I] of [[u.footF, q.far], [u.footN, q.near]]) {
      q.cap(D, { x: D.x + H * 2.6 * z, y: D.y }, 0.7, I);
      q.px(D.x / z - H * 0.8, D.y / z, neonGreen, 2);
    }

    // Pulsating Cyber Reactor in Chest Center
    let cx = u.chest.x / z, cy = u.chest.y / z;
    q.disc(cx, cy, 1.5, darkChrome);
    q.disc(cx, cy, 1.0, darkGreen);
    q.disc(cx, cy, 0.5, neonGreen);
  },

  head(q) {
    let u = V(q), v = q.rig.now.t,
        jawDrop = v % 3.2 < 0.4 && Math.sin(v * 40) > 0 ? 1 : 0;

    // Main cranium sphere & jaw base
    q.disc(...u.at(0, 0.4), 4.2, q.near);
    q.disc(...u.at(1.5, -2.1 - jawDrop), 2.0, q.near);

    // Cyber skull forehead plate
    for (let ox = -2; ox <= 2; ox++) {
      q.px(...u.at(ox * 0.8, 2.2), armorPlate, 2);
    }

    // Horns / Cranium Crest spikes pointing backward
    q.px(...u.at(-2.8, 3.2), boneNear, 2);
    q.px(...u.at(-3.6, 4.4), neonGreen, 2);
    q.px(...u.at(0.4, 3.8), neonGreen, 2);

    // Eye sockets (Dark Chrome background)
    U(q, u, ["##.##", "#####"], 1.5, 0.5, { "#": darkChrome, ".": darkGreen });

    // Glowing Neon Cyber Eyes (Pulsating & Blinking)
    let eyeOn = Math.sin(v * 2.5) > -0.7;
    if (eyeOn) {
      for (let I of [-0.6, 2.4]) {
        q.px(...u.at(I, 0.1), brightGreen, 2);
        q.px(...u.at(I + 0.3 * u.f, 0.1), coreWhite, 2);
      }
    }

    // Nose cavity
    q.px(...u.at(1.6, -1.0), darkChrome, 2);

    // Teeth & jaw synthesizer vents
    U(q, u, ["#.#.#"], 1.4, -2.0 - jawDrop, { "#": darkChrome, ".": neonGreen });
    if (jawDrop) {
      U(q, u, ["#####"], 1.6, -1.6, { "#": darkChrome });
    }
  },

  front(q) {
    let u = q.rig;
    q.disc(u.elbowN.x / z, u.elbowN.y / z, 1.4, q.near);
    q.disc(u.elbowN.x / z, u.elbowN.y / z, 0.6, neonGreen);
    q.disc(u.handN.x / z, u.handN.y / z, 1.2, q.near);
    q.px(u.handN.x / z, u.handN.y / z, neonGreen, 2);
  },

  glow(q) {
    let u = V(q), v = q.rig.now.t,
        pulse = 0.22 + 0.08 * A(v * 1.8, 1);
    // Skull cyber eye glow
    let [hx, hy] = u.at(1.4, 0.2);
    q.glow(hx, hy, 8, neonGreen, pulse);
    q.glow(hx, hy, 3, coreWhite, pulse * 0.8);

    // Chest core glow
    let cx = q.rig.chest.x / z, cy = q.rig.chest.y / z;
    q.glow(cx, cy, 6, neonGreen, pulse * 0.9);
  }
};

export default j;
