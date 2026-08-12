// Internet: light through glass.
// A fiber optic cable sweeps from the exchange building across the scene.
// Its core is a custom shader: light pulses race along the strand, and the
// lit portion fills with scroll progress. Near the end the cable fans out
// into thin branches that ignite the homes one by one.

import * as THREE from 'three';
import {
  applyGlowBlending,
  makeHouse,
  sampleCamera,
  smoothstep,
  wp,
  type HouseRefs,
  type Palette,
  type SceneContext,
  type SceneHandle,
  type Waypoint,
} from '../shared';

const WAYPOINTS: Waypoint[] = [
  wp(0.0, -80, 8, 14, -66, 6, -6),
  wp(0.25, -40, 15, 36, -28, 7, 4),
  wp(0.5, -2, 9, 32, 2, 8, -2),
  wp(0.75, 26, 8, 24, 40, 5, 0),
  wp(1.0, 46, 7, 25, 60, 2, 2),
];

const PACKETS = 16;
const DUST = 320;

const CORE_VERT = /* glsl */ `
  varying float vU;
  void main() {
    vU = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CORE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uFront;
  uniform vec3 uColor;
  varying float vU;
  void main() {
    float fill = smoothstep(uFront + 0.015, uFront - 0.015, vU);
    float pz = fract(vU * 7.0 - uTime * 0.9);
    float pulse = smoothstep(0.0, 0.12, pz) * smoothstep(0.4, 0.12, pz);
    float b = (0.45 + 0.9 * pulse) * fill + 0.05;
    gl_FragColor = vec4(uColor, clamp(b, 0.0, 1.0));
  }
`;

export function buildFiberScene(ctx: SceneContext): SceneHandle {
  const { scene, glow } = ctx;
  let pal = ctx.palette;

  const root = new THREE.Group();
  scene.add(root);
  const fog = new THREE.FogExp2(pal.bg.getHex(), 0.012);
  scene.fog = fog;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(-20, 45, 30);
  root.add(hemi, sun);

  const structMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const jacketMat = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.14, depthWrite: false });

  // ── Ground + grid ──
  const ground = new THREE.Mesh(new THREE.CircleGeometry(240, 48), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  root.add(ground);
  const grid = new THREE.GridHelper(260, 52, pal.accentDim.getHex(), pal.accentDim.getHex());
  const gridMat = grid.material as THREE.LineBasicMaterial;
  gridMat.transparent = true;
  gridMat.opacity = 0.14;
  root.add(grid);

  // ── Exchange building at the source ──
  const exchange = new THREE.Group();
  const hall = new THREE.Mesh(new THREE.BoxGeometry(9, 6.5, 9), structMat);
  hall.position.y = 3.25;
  const stripMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9 });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(9.1, 0.35, 9.1), stripMat);
  strip.position.y = 5.6;
  exchange.add(hall, strip);
  exchange.position.set(-72, 0, -8);
  root.add(exchange);

  // ── Main fiber strand ──
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-68, 5.5, -8),
    new THREE.Vector3(-44, 10, 16),
    new THREE.Vector3(-16, 4, -14),
    new THREE.Vector3(8, 11, 10),
    new THREE.Vector3(28, 6, -6),
    new THREE.Vector3(44, 5, 2),
  ]);
  const jacket = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, 0.8, 14), jacketMat);
  root.add(jacket);

  const coreUniforms = {
    uTime: { value: 0 },
    uFront: { value: 0 },
    uColor: { value: pal.accent.clone() },
  };
  const coreMat = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    vertexShader: CORE_VERT,
    fragmentShader: CORE_FRAG,
    transparent: true,
    depthWrite: false,
  });
  const core = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, 0.2, 8), coreMat);
  root.add(core);

  // Light front sprite riding the strand.
  const frontMat = new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false });
  const frontGlow = new THREE.Sprite(frontMat);
  frontGlow.scale.setScalar(8);
  root.add(frontGlow);

  // ── Packets racing through the core ──
  const packetGeo = new THREE.BufferGeometry();
  packetGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PACKETS * 3), 3));
  const packetMat = new THREE.PointsMaterial({
    size: 2.0,
    map: glow,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const packets = new THREE.Points(packetGeo, packetMat);
  packets.frustumCulled = false;
  root.add(packets);

  // ── Branch-out to the homes ──
  const splitPoint = curve.getPoint(1);
  const housePos: [number, number][] = [[56, -11], [62, 2], [58, 13], [68, -3], [66, 15]];
  const branches: { mat: THREE.MeshBasicMaterial; house: HouseRefs; litAt: number }[] = housePos.map(
    ([x, z], i) => {
      const mid = new THREE.Vector3(50, 6.5, z * 0.4);
      const bCurve = new THREE.QuadraticBezierCurve3(splitPoint.clone(), mid, new THREE.Vector3(x, 1.4, z));
      const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      root.add(new THREE.Mesh(new THREE.TubeGeometry(bCurve, 50, 0.05, 6), mat));
      const house = makeHouse(root, x, z, bodyMat, roofMat, pal.accent, glow, 0.85);
      return { mat, house, litAt: 0.78 + i * 0.035 };
    },
  );

  // ── Ambient dust ──
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 160;
    dustPos[i * 3 + 1] = 0.5 + Math.random() * 24;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    size: 0.7,
    map: glow,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  root.add(dust);

  function applyPalette(p: Palette) {
    pal = p;
    fog.color.copy(p.bg);
    structMat.color.copy(p.fg.clone().lerp(p.bg, 0.4));
    bodyMat.color.copy(p.surface.clone().lerp(p.fg, 0.1));
    roofMat.color.copy(p.fg.clone().lerp(p.bg, 0.3));
    groundMat.color.copy(p.bg); // floor = screen color
    jacketMat.color.copy(p.accentDim.clone().lerp(p.bg, 0.3));
    gridMat.color.copy(p.accentDim);
    stripMat.color.copy(p.accent);
    coreUniforms.uColor.value.copy(p.isDark ? p.accent : p.accentDim);
    frontMat.color.copy(p.accent);
    packetMat.color.copy(p.accent);
    dustMat.color.copy(p.accentDim);
    for (const b of branches) {
      b.mat.color.copy(p.accent);
      b.house.glow.color.copy(p.accent);
    }
    hemi.color.copy(p.bg.clone().lerp(new THREE.Color(0xffffff), 0.6));
    hemi.groundColor.copy(p.bg);
    hemi.intensity = p.isDark ? 0.55 : 1.0;
    sun.intensity = p.isDark ? 0.7 : 1.1;
    applyGlowBlending([frontMat, packetMat, dustMat], p.isDark);
    for (const b of branches) applyGlowBlending([b.house.glow], p.isDark);
  }
  applyPalette(pal);

  const tmp = new THREE.Vector3();

  return {
    update(t, progress) {
      coreUniforms.uTime.value = t;
      // Light fills the strand and reaches the split point at ~78% scroll.
      const front = Math.min(1, Math.max(0, progress / 0.78));
      coreUniforms.uFront.value = front;

      curve.getPoint(Math.min(front, 0.999), tmp);
      frontGlow.position.copy(tmp);
      frontGlow.material.opacity = front <= 0.001 || front >= 0.999 ? 0 : 0.6 + 0.3 * Math.sin(t * 6);
      frontGlow.scale.setScalar(7 + Math.sin(t * 6) * 1.4);

      const attr = packetGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < PACKETS; i++) {
        const u = (i / PACKETS + t * 0.06) % 1;
        if (u <= front) {
          curve.getPoint(u, tmp);
          attr.setXYZ(i, tmp.x, tmp.y, tmp.z);
        } else {
          attr.setXYZ(i, 0, -999, 0);
        }
      }
      attr.needsUpdate = true;

      for (const b of branches) {
        const lit = smoothstep(b.litAt, b.litAt + 0.06, progress);
        b.mat.opacity = lit * 0.8;
        b.house.glow.opacity = lit * 0.5;
      }

      stripMat.opacity = 0.6 + 0.35 * Math.sin(t * 3);
      dust.position.y = Math.sin(t * 0.18) * 0.6;
    },
    camera(progress, outPos, outLook) {
      sampleCamera(WAYPOINTS, progress, outPos, outLook);
    },
    setPalette: applyPalette,
  };
}
