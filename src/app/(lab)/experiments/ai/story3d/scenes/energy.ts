// Energy: from source to socket.
// Deterministic layout seeded from the case ID so every viewer sees the same
// scene, but rotations, pylon offsets and house angles all vary by case.
//
// Flow:  Turbines ──┐
//                   ▼ 90° ground cables
//             Source Transformer
//                   │ high-voltage cable (gray→teal)
//       Pylon·Pylon·Pylon·Pylon·Pylon
//                   │
//             Village Transformer
//                   ▼ mini-metro ground cables
//              Houses (BT logo style, glow on power)

import * as THREE from 'three';
import {
  applyGlowBlending,
  hashString,
  makeHouse,
  sampleCamera,
  seededRng,
  smoothstep,
  wp,
  type HouseRefs,
  type Palette,
  type SceneContext,
  type SceneHandle,
  type Waypoint,
} from '../shared';

// Camera rail — dwells on each stage of the flow: turbines, source
// transformer, the pylon line, the village transformer, then the houses.
const WAYPOINTS: Waypoint[] = [
  wp(0.00, -78, 13, 24, -56, 11,  4),  // wind farm
  wp(0.14, -58,  8, 17, -50,  3,  2),  // turbines → source transformer
  wp(0.30, -38, 16, 28, -22,  9,  0),  // first pylons
  wp(0.50,   0, 21, 35,   0,  9,  0),  // pylon line spread
  wp(0.68,  34, 13, 27,  46,  5,  3),  // approach to village
  wp(0.82,  52,  9, 19,  47,  3,  3),  // village transformer
  wp(1.00,  56,  7, 18,  61,  2,  3),  // houses light up
];

const PULSES  = 20;
const AMBIENT = 280;

// ── Shared cable shader: #3c3c3c → teal, driven by uFront ──────────────────
const CABLE_VERT = /* glsl */ `
  varying float vU;
  void main() {
    vU = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const CABLE_FRAG = /* glsl */ `
  uniform float uFront;
  uniform vec3  uTeal;
  varying float vU;
  void main() {
    float lit = smoothstep(uFront + 0.015, uFront - 0.015, vU);
    vec3 base = vec3(0.235, 0.235, 0.235);
    gl_FragColor = vec4(mix(base, uTeal, lit), 1.0);
  }
`;

// Ground cable shader (same style; uFront = 0 grey, 1 teal)
const GROUND_VERT = /* glsl */ `
  varying float vU;
  void main() {
    vU = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const GROUND_FRAG = /* glsl */ `
  uniform float uFront;
  uniform vec3  uTeal;
  varying float vU;
  void main() {
    float lit = smoothstep(uFront + 0.02, uFront - 0.02, vU);
    vec3 base = vec3(0.235, 0.235, 0.235);
    gl_FragColor = vec4(mix(base, uTeal, lit), 1.0);
  }
`;

function makeCableShader(teal: THREE.Color): { mat: THREE.ShaderMaterial; front: { value: number }; tealU: THREE.Color } {
  const tealU = teal.clone();
  const front = { value: 0 };
  const mat = new THREE.ShaderMaterial({
    uniforms: { uFront: front, uTeal: { value: tealU } },
    vertexShader: CABLE_VERT,
    fragmentShader: CABLE_FRAG,
    side: THREE.FrontSide,
  });
  return { mat, front, tealU };
}

function makeGroundShader(teal: THREE.Color): { mat: THREE.ShaderMaterial; front: { value: number }; tealU: THREE.Color } {
  const tealU = teal.clone();
  const front = { value: 0 };
  const mat = new THREE.ShaderMaterial({
    uniforms: { uFront: front, uTeal: { value: tealU } },
    vertexShader: GROUND_VERT,
    fragmentShader: GROUND_FRAG,
    side: THREE.FrontSide,
  });
  return { mat, front, tealU };
}

// ── Ground cable builder — single continuous L-route in XZ at y=0.13 ──────────
// Built as one tube along [from → corner → to] so the shader fill (uv.x) sweeps
// smoothly along the whole route rather than from each segment's own corner.
function makeGroundRoute(
  parent: THREE.Object3D,
  from: [number, number],
  to: [number, number],
  mat: THREE.ShaderMaterial,
  xFirst: boolean,
  lift = 0, // tiny per-route height offset so converging routes don't z-fight
): void {
  const y = 0.13 + lift;
  const mid: [number, number] = xFirst ? [to[0], from[1]] : [from[0], to[1]];
  const raw: [number, number][] = [from, mid, to];
  // Drop near-duplicate points (straight routes have no corner)
  const pts: THREE.Vector3[] = [];
  for (const [px, pz] of raw) {
    const v = new THREE.Vector3(px, y, pz);
    if (pts.length === 0 || pts[pts.length - 1].distanceTo(v) > 0.1) pts.push(v);
  }
  if (pts.length < 2) return;
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < pts.length - 1; i++) {
    path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  }
  const tube = new THREE.Mesh(new THREE.TubeGeometry(path, 24, 0.09, 6), mat);
  parent.add(tube);
}

// ── Transformer box ───────────────────────────────────────────────────────────
function makeTransformer(
  parent: THREE.Group,
  x: number, z: number,
  mat: THREE.MeshLambertMaterial,
  ry = 0,
): void {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.2, 2.2), mat);
  body.position.y = 2.1;
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.3, 2.8), mat);
  base.position.y = 0.15;
  const topPlate = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 2.2), mat);
  topPlate.position.y = 4.4;
  for (let i = 0; i < 3; i++) {
    const bushing = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.75, 8), mat);
    bushing.position.set((i - 1) * 0.85, 4.9, 0);
    g.add(bushing);
  }
  g.add(body, base, topPlate);
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
}

// ── Scene builder ─────────────────────────────────────────────────────────────
export function buildEnergyScene(ctx: SceneContext): SceneHandle {
  const { scene, glow } = ctx;
  let pal = ctx.palette;
  const rng = seededRng(hashString(ctx.caseId));

  const root = new THREE.Group();
  scene.add(root);
  const fog = new THREE.FogExp2(pal.bg.getHex(), 0.009);
  scene.fog = fog;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1);
  const sun  = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(-30, 45, 25);
  root.add(hemi, sun);

  // ── Shared lit-geometry material ──
  const structMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const bladeMat  = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const txMat     = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

  // ── Ground ──
  const ground = new THREE.Mesh(new THREE.CircleGeometry(250, 52), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  root.add(ground);
  const grid = new THREE.GridHelper(270, 54, pal.accentDim.getHex(), pal.accentDim.getHex());
  const gridMat = grid.material as THREE.LineBasicMaterial;
  gridMat.transparent = true;
  gridMat.opacity = 0.14;
  root.add(grid);

  // ── Cable shaders ──
  const mainCS    = makeCableShader(pal.accentDim);
  const turbineGS = makeGroundShader(pal.accentDim);
  const villageGS = makeGroundShader(pal.accentDim);

  // ── Turbines (3, seeded rotations) ──
  const turbineConfigs: [number, number, number][] = [
    [-58, -5,  1.00],
    [-48,  10, 0.88],
    [-64,  14, 0.76],
  ];
  const rotors: THREE.Group[] = [];

  function makeTurbine(x: number, z: number, s: number) {
    const g = new THREE.Group();
    const tower   = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.75, 16, 10), structMat);
    tower.position.y = 8;
    const nacelle = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 2.2), structMat);
    nacelle.position.set(0, 16.2, 0.2);
    const rotor = new THREE.Group();
    rotor.position.set(0, 16.2, 1.5);
    for (let i = 0; i < 3; i++) {
      const wrap = new THREE.Group();
      wrap.rotation.z = (i * Math.PI * 2) / 3;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.8, 0.14), bladeMat);
      blade.position.y = 3.6;
      wrap.add(blade);
      rotor.add(wrap);
    }
    rotor.add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), structMat));
    g.add(tower, nacelle, rotor);
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    g.rotation.y = rng() * Math.PI * 2;
    rotors.push(rotor);
    root.add(g);
    return g;
  }

  turbineConfigs.forEach(([x, z, s]) => makeTurbine(x, z, s));

  // ── Source transformer ──
  const TX_SRC: [number, number] = [-50, 2];
  makeTransformer(root, TX_SRC[0], TX_SRC[1], txMat, rng() * Math.PI * 2);

  // ── Turbine → source transformer cables (90° routes) ──
  const turbineCableXFirst = [true, false, true];
  turbineConfigs.forEach(([x, z], i) =>
    makeGroundRoute(root, [x, z], TX_SRC, turbineGS.mat, turbineCableXFirst[i], i * 0.02),
  );

  // ── Pylons (5, z-jittered from seed) ──
  const pylonBaseX = [-32, -16, 0, 16, 33];
  const pylonPositions: [number, number][] = pylonBaseX.map((x) => [
    x + (rng() - 0.5) * 4,
    (rng() - 0.5) * 10,
  ]);

  pylonPositions.forEach(([px, pz]) => {
    const g = new THREE.Group();
    for (const side of [-1, 1] as const) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 14, 8), structMat);
      leg.position.set(0, 7, side * 1.3);
      leg.rotation.x = -side * 0.085;
      g.add(leg);
    }
    const armTop = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 5.2), structMat);
    armTop.position.y = 13.1;
    const armMid = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 3.6), structMat);
    armMid.position.y = 11.2;
    g.add(armTop, armMid);
    g.position.set(px, 0, pz);
    g.rotation.y = rng() * 0.4 - 0.2;
    root.add(g);
  });

  // ── Village transformer ──
  const TX_VIL: [number, number] = [47, 3];
  makeTransformer(root, TX_VIL[0], TX_VIL[1], txMat, rng() * Math.PI * 2);

  // ── High-voltage cable: source TX → pylons → village TX ──
  // The aerial span runs along the bushing tops (y≈5.3) and pylon arms (y≈13.2).
  // Short vertical stubs drop the cable ends down into each transformer body so
  // they physically connect instead of hovering above.
  const TX_TOP = 4.4;        // transformer body top
  const BUSHING = 5.3;       // bushing tip — where the aerial cable terminates
  const aerial: THREE.Vector3[] = [
    new THREE.Vector3(TX_SRC[0], BUSHING, TX_SRC[1]),
    ...pylonPositions.map(([px, pz]) => new THREE.Vector3(px, 13.2, pz)),
    new THREE.Vector3(TX_VIL[0], BUSHING, TX_VIL[1]),
  ];
  const cablePts: THREE.Vector3[] = [
    new THREE.Vector3(TX_SRC[0], TX_TOP, TX_SRC[1]), // into source transformer
  ];
  for (let i = 0; i < aerial.length; i++) {
    cablePts.push(aerial[i]);
    if (i < aerial.length - 1) {
      const mid = aerial[i].clone().lerp(aerial[i + 1], 0.5);
      mid.y = Math.min(aerial[i].y, aerial[i + 1].y) - 1.8; // gravity sag
      cablePts.push(mid);
    }
  }
  cablePts.push(new THREE.Vector3(TX_VIL[0], TX_TOP, TX_VIL[1])); // into village transformer
  const mainCurve = new THREE.CatmullRomCurve3(cablePts);
  const mainCable = new THREE.Mesh(new THREE.TubeGeometry(mainCurve, 240, 0.065, 6), mainCS.mat);
  root.add(mainCable);

  // ── Pulses ──
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PULSES * 3), 3));
  const pulseMat = new THREE.PointsMaterial({
    size: 2.4, map: glow, transparent: true, depthWrite: false, depthTest: false, sizeAttenuation: true,
  });
  const pulses = new THREE.Points(pulseGeo, pulseMat);
  pulses.frustumCulled = false;
  pulses.renderOrder = 10;
  root.add(pulses);

  // Lead glow rides the energy front — depthTest off + high renderOrder so it
  // always sits in the foreground instead of clipping into the transformer.
  const leadMat = new THREE.SpriteMaterial({
    map: glow, transparent: true, depthWrite: false, depthTest: false,
  });
  const lead = new THREE.Sprite(leadMat);
  lead.scale.setScalar(7);
  lead.renderOrder = 11;
  root.add(lead);

  // ── Houses (BT logo style, seeded rotation offsets) ──
  const houseBasePos: [number, number][] = [
    [54, -4], [59, 8], [63, -11], [52, -15], [67, 4], [57, 15],
  ];
  const housePos: [number, number][] = houseBasePos.map(
    ([x, z]) => [x + (rng() - 0.5) * 2, z + (rng() - 0.5) * 2],
  );
  // makeHouse ignores bodyMat/roofMat — it uses the BT fixed Helix grays
  const houses: HouseRefs[] = housePos.map(([x, z], i) =>
    makeHouse(root, x, z, structMat, structMat, pal.accent, glow, 0.82 + (i % 3) * 0.10),
  );

  // ── Village TX → houses (mini-metro L-routes, alternating x/z first) ──
  housePos.forEach(([hx, hz], i) =>
    makeGroundRoute(root, TX_VIL, [hx, hz], villageGS.mat, i % 2 === 0, i * 0.015),
  );

  // ── Ambient particles ──
  const ambPos = new Float32Array(AMBIENT * 3);
  for (let i = 0; i < AMBIENT; i++) {
    ambPos[i * 3]     = (Math.random() - 0.5) * 160;
    ambPos[i * 3 + 1] = 0.5 + Math.random() * 26;
    ambPos[i * 3 + 2] = (Math.random() - 0.5) * 100;
  }
  const ambGeo = new THREE.BufferGeometry();
  ambGeo.setAttribute('position', new THREE.BufferAttribute(ambPos, 3));
  const ambMat = new THREE.PointsMaterial({
    size: 0.7, map: glow, transparent: true, opacity: 0.35, depthWrite: false, sizeAttenuation: true,
  });
  const ambient = new THREE.Points(ambGeo, ambMat);
  ambient.frustumCulled = false;
  root.add(ambient);

  // ── Palette wiring ──
  function applyPalette(p: Palette) {
    pal = p;
    fog.color.copy(p.bg);
    structMat.color.copy(p.fg.clone().lerp(p.bg, 0.45));
    bladeMat.color.copy(p.fg.clone().lerp(p.bg, 0.25));
    txMat.color.copy(p.fg.clone().lerp(p.bg, 0.38));
    groundMat.color.copy(p.bg); // floor = screen color
    gridMat.color.copy(p.accentDim);
    pulseMat.color.copy(p.accent);
    leadMat.color.copy(p.accent);
    ambMat.color.copy(p.accentDim);
    // Energised cable is always mint (accent), in light and dark mode alike
    mainCS.tealU.copy(p.accent);
    turbineGS.tealU.copy(p.accent);
    villageGS.tealU.copy(p.accent);
    for (const h of houses) h.glow.color.copy(p.accent);
    hemi.color.copy(p.bg.clone().lerp(new THREE.Color(0xffffff), 0.6));
    hemi.groundColor.copy(p.bg);
    hemi.intensity = p.isDark ? 0.55 : 1.0;
    sun.intensity  = p.isDark ? 0.70 : 1.1;
    applyGlowBlending([pulseMat, leadMat, ambMat], p.isDark);
    for (const h of houses) applyGlowBlending([h.glow], p.isDark);
  }
  applyPalette(pal);

  const tmp = new THREE.Vector3();

  return {
    update(t, progress) {
      // Turbine rotors spin
      for (let i = 0; i < rotors.length; i++) {
        rotors[i].rotation.z = t * (1.0 + i * 0.28);
      }

      // Turbine ground cables: light up first (0 → 0.12)
      turbineGS.front.value = smoothstep(0.0, 0.12, progress);

      // Main cable front: grey→teal wave travels [0.10 → 0.84]
      const mainFront = smoothstep(0.10, 0.84, progress);
      mainCS.front.value = mainFront;

      // Pulses race along the lit portion
      const attr = pulseGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < PULSES; i++) {
        const u = (i / PULSES + t * 0.05) % 1;
        if (u <= mainFront) {
          mainCurve.getPoint(u, tmp);
          attr.setXYZ(i, tmp.x, tmp.y, tmp.z);
        } else {
          attr.setXYZ(i, 0, -999, 0);
        }
      }
      attr.needsUpdate = true;

      // Lead glow rides the front
      mainCurve.getPoint(Math.min(mainFront, 0.999), tmp);
      lead.position.copy(tmp);
      lead.material.opacity = mainFront <= 0.001 ? 0 : 0.55 + 0.3 * Math.sin(t * 5);
      lead.scale.setScalar(7 + Math.sin(t * 5) * 1.3);

      // Village ground cables: [0.82 → 0.95]
      villageGS.front.value = smoothstep(0.82, 0.95, progress);

      // Houses glow in one by one
      for (let i = 0; i < houses.length; i++) {
        const lit = smoothstep(0.86 + i * 0.022, 0.94 + i * 0.015, progress);
        houses[i].glow.opacity = lit * 0.48;
      }

      ambient.position.y = Math.sin(t * 0.18) * 0.6;
    },
    camera(progress, outPos, outLook) {
      sampleCamera(WAYPOINTS, progress, outPos, outLook);
    },
    setPalette: applyPalette,
  };
}
