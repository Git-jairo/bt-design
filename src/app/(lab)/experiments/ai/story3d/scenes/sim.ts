// Sim Only: a signal through the air.
// A cell mast at the origin emits expanding signal rings. As you scroll,
// packet streams arc through the air to phones at customer homes around the
// mast, and each screen lights up the moment its signal lands.

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
  wp(0.0, 7, 26, 9, 0, 22.5, 0),
  wp(0.22, 17, 21, 23, 0, 18, 0),
  wp(0.48, 34, 15, 39, 0, 12, 0),
  wp(0.74, 41, 5, 8, 34, 2.6, -2),
  wp(1.0, 30, 13, 48, 6, 10, 0),
];

const RINGS = 6;
const PACKETS_PER_ARC = 3;

interface Site {
  x: number;
  z: number;
  curve: THREE.QuadraticBezierCurve3;
  screen: THREE.MeshBasicMaterial;
  screenGlow: THREE.SpriteMaterial;
  arcMat: THREE.MeshBasicMaterial;
  house: HouseRefs;
  activateAt: number;
}

export function buildSimScene(ctx: SceneContext): SceneHandle {
  const { scene, glow } = ctx;
  let pal = ctx.palette;

  const root = new THREE.Group();
  scene.add(root);
  const fog = new THREE.FogExp2(pal.bg.getHex(), 0.011);
  scene.fog = fog;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(25, 45, 20);
  root.add(hemi, sun);

  const structMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const phoneMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

  // ── Ground + grid ──
  const ground = new THREE.Mesh(new THREE.CircleGeometry(220, 48), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  root.add(ground);
  const grid = new THREE.GridHelper(240, 48, pal.accentDim.getHex(), pal.accentDim.getHex());
  const gridMat = grid.material as THREE.LineBasicMaterial;
  gridMat.transparent = true;
  gridMat.opacity = 0.14;
  root.add(grid);

  // ── Mast ──
  const mast = new THREE.Group();
  const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.85, 9, 10), structMat);
  seg1.position.y = 4.5;
  const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.5, 8, 10), structMat);
  seg2.position.y = 13;
  const seg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 7, 10), structMat);
  seg3.position.y = 20.5;
  mast.add(seg1, seg2, seg3);
  for (const [y, r] of [[9, 1.1], [17, 0.9]] as const) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 8, 32), structMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    mast.add(ring);
  }
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group();
    arm.rotation.y = (i * Math.PI * 2) / 3;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.7, 0.18), structMat);
    panel.position.set(0, 22.4, 1.1);
    arm.add(panel);
    mast.add(arm);
  }
  root.add(mast);

  const beaconMat = new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false });
  const beacon = new THREE.Sprite(beaconMat);
  beacon.position.y = 24.6;
  beacon.scale.setScalar(4);
  root.add(beacon);

  // ── Expanding signal rings ──
  const ringMats: THREE.MeshBasicMaterial[] = [];
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < RINGS; i++) {
    const m = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 8, 80), m);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 22.4;
    ringMats.push(m);
    rings.push(ring);
    root.add(ring);
  }

  // ── Customer sites: house + phone, fed by a packet arc ──
  const towerTop = new THREE.Vector3(0, 22.8, 0);
  const sitePos: [number, number][] = [[24, -16], [34, -2], [28, 15], [44, 9], [37, 25], [17, 28]];
  const sites: Site[] = sitePos.map(([x, z], i) => {
    const house = makeHouse(root, x, z + 3.6, bodyMat, roofMat, pal.accent, glow, 0.8);

    const phone = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.16), phoneMat);
    body.position.y = 1.4;
    const screenMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.7), screenMat);
    screen.position.set(0, 1.4, 0.1);
    const screenGlow = new THREE.SpriteMaterial({ map: glow, transparent: true, opacity: 0, depthWrite: false });
    const gs = new THREE.Sprite(screenGlow);
    gs.scale.setScalar(4);
    gs.position.y = 1.6;
    phone.add(body, screen, gs);
    phone.position.set(x, 0, z);
    phone.rotation.y = Math.atan2(-x, -z);
    root.add(phone);

    const dist = Math.hypot(x, z);
    const mid = new THREE.Vector3(x * 0.45, 22 + dist * 0.28, z * 0.45);
    const end = new THREE.Vector3(x, 2.4, z);
    const curve = new THREE.QuadraticBezierCurve3(towerTop.clone(), mid, end);
    const arcMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const arc = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.035, 6), arcMat);
    root.add(arc);

    return { x, z, curve, screen: screenMat, screenGlow, arcMat, house, activateAt: 0.2 + i * 0.09 };
  });

  // ── Packets flying along the arcs ──
  const packetCount = sites.length * PACKETS_PER_ARC;
  const packetGeo = new THREE.BufferGeometry();
  packetGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(packetCount * 3), 3));
  const packetMat = new THREE.PointsMaterial({
    size: 1.8,
    map: glow,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const packets = new THREE.Points(packetGeo, packetMat);
  packets.frustumCulled = false;
  root.add(packets);

  function applyPalette(p: Palette) {
    pal = p;
    fog.color.copy(p.bg);
    structMat.color.copy(p.fg.clone().lerp(p.bg, 0.45));
    phoneMat.color.copy(p.fg.clone().lerp(p.bg, 0.2));
    bodyMat.color.copy(p.surface.clone().lerp(p.fg, 0.1));
    roofMat.color.copy(p.fg.clone().lerp(p.bg, 0.3));
    groundMat.color.copy(p.bg); // floor = screen color
    gridMat.color.copy(p.accentDim);
    beaconMat.color.copy(p.accent);
    packetMat.color.copy(p.accent);
    for (const m of ringMats) m.color.copy(p.accent);
    for (const s of sites) {
      s.screen.color.copy(p.accent);
      s.screenGlow.color.copy(p.accent);
      s.arcMat.color.copy(p.accentDim);
      s.house.glow.color.copy(p.accent);
    }
    hemi.color.copy(p.bg.clone().lerp(new THREE.Color(0xffffff), 0.6));
    hemi.groundColor.copy(p.bg);
    hemi.intensity = p.isDark ? 0.55 : 1.0;
    sun.intensity = p.isDark ? 0.7 : 1.1;
    applyGlowBlending([beaconMat, packetMat, ...ringMats], p.isDark);
    for (const s of sites) applyGlowBlending([s.screenGlow, s.house.glow], p.isDark);
  }
  applyPalette(pal);

  const tmp = new THREE.Vector3();

  return {
    update(t, progress) {
      beacon.material.opacity = 0.55 + 0.35 * Math.sin(t * 4);

      // Coverage rings ramp in during the opening chapter.
      const act = smoothstep(0.03, 0.18, progress);
      for (let i = 0; i < RINGS; i++) {
        const u = (t * 0.16 + i / RINGS) % 1;
        const s = 1 + u * 42;
        rings[i].scale.set(s, s, s);
        ringMats[i].opacity = (1 - u) * (1 - u) * 0.45 * act;
      }

      // Arcs activate one by one with scroll; packets stream while active.
      const attr = packetGeo.getAttribute('position') as THREE.BufferAttribute;
      let k = 0;
      for (let i = 0; i < sites.length; i++) {
        const s = sites[i];
        const lit = smoothstep(s.activateAt, s.activateAt + 0.08, progress);
        s.arcMat.opacity = lit * 0.3;
        s.screen.opacity = lit;
        s.screenGlow.opacity = lit * 0.55;
        s.house.glow.opacity = lit * 0.4;
        for (let j = 0; j < PACKETS_PER_ARC; j++, k++) {
          if (lit > 0.05) {
            const u = (t * 0.3 + j / PACKETS_PER_ARC + i * 0.17) % 1;
            s.curve.getPoint(u, tmp);
            attr.setXYZ(k, tmp.x, tmp.y, tmp.z);
          } else {
            attr.setXYZ(k, 0, -999, 0);
          }
        }
      }
      attr.needsUpdate = true;
    },
    camera(progress, outPos, outLook) {
      sampleCamera(WAYPOINTS, progress, outPos, outLook);
    },
    setPalette: applyPalette,
  };
}
