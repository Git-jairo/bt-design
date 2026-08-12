// Shared types + helpers for the 3D product story scenes.
// Colors are never hardcoded for theming; the palette is resolved at runtime
// from the Helix AI CSS custom properties on the .ai-root element.

import * as THREE from 'three';

export type Product = 'energy' | 'sim' | 'fiber';

export interface Palette {
  bg: THREE.Color;
  surface: THREE.Color;
  fg: THREE.Color;
  accent: THREE.Color;
  accentDim: THREE.Color;
  isDark: boolean;
}

export function resolvePalette(el: HTMLElement, isDark: boolean): Palette {
  const cs = getComputedStyle(el);
  const read = (name: string, fallback: string) => {
    const v = cs.getPropertyValue(name).trim();
    const c = new THREE.Color();
    try { c.set(v || fallback); } catch { c.set(fallback); }
    return c;
  };
  return {
    bg: read('--ai-bg', '#F9FBF8'),
    surface: read('--ai-surface', '#FFFFFF'),
    fg: read('--ai-fg', '#141515'),
    accent: read('--ai-accent', '#00D780'),
    accentDim: read('--ai-accent-dim', '#029B77'),
    isDark,
  };
}

// Soft radial sprite texture for glow/pulse/particle.
export function makeGlowTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// ── Deterministic per-case randomisation ──────────────────────────────────────
// Same case ID always produces the same layout; different cases diverge.
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export function seededRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// ── Camera rail ───────────────────────────────────────────────────────────────
export interface Waypoint {
  at: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

export function wp(
  at: number,
  px: number, py: number, pz: number,
  lx: number, ly: number, lz: number,
): Waypoint {
  return { at, pos: new THREE.Vector3(px, py, pz), look: new THREE.Vector3(lx, ly, lz) };
}

export function sampleCamera(
  points: Waypoint[],
  progress: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
): void {
  const p = Math.min(1, Math.max(0, progress));
  let a = points[0];
  let b = points[points.length - 1];
  for (let i = 0; i < points.length - 1; i++) {
    if (p >= points[i].at && p <= points[i + 1].at) { a = points[i]; b = points[i + 1]; break; }
  }
  const span = Math.max(1e-6, b.at - a.at);
  const t = smoothstep(0, 1, (p - a.at) / span);
  outPos.lerpVectors(a.pos, b.pos, t);
  outLook.lerpVectors(a.look, b.look, t);
}

// ── Scene contract ────────────────────────────────────────────────────────────
export interface SceneContext {
  scene: THREE.Scene;
  palette: Palette;
  glow: THREE.Texture;
  caseId: string;
}

export interface SceneHandle {
  update(time: number, progress: number): void;
  camera(progress: number, outPos: THREE.Vector3, outLook: THREE.Vector3): void;
  setPalette(p: Palette): void;
}

// Additive glow on dark, normal on light (prevents wash-out).
export function applyGlowBlending(
  mats: (THREE.PointsMaterial | THREE.SpriteMaterial | THREE.MeshBasicMaterial)[],
  isDark: boolean,
): void {
  for (const m of mats) {
    m.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;
    m.needsUpdate = true;
  }
}

// ── BudgetThuis logo–inspired house ───────────────────────────────────────────
// Two horizontal layers: a gray600 body and a wider gray850 floating roof slab.
// Inspired by the two-rectangle BudgetThuis.svg logo mark.
// No window — only a mint glow sprite that activates when power arrives.
// depthTest: false on the glow prevents sprite clipping through geometry.
export interface HouseRefs {
  glow: THREE.SpriteMaterial;
}

// House body (gray-600 in Helix ramp, #EBF2E8 at 100, white at 0, black at 1000)
const HOUSE_BODY_COLOR = new THREE.Color(0x686b67);
// Roof slab (gray-850)
const HOUSE_ROOF_COLOR = new THREE.Color(0x272827);

// ── Rounded-corner 2D shape helpers ───────────────────────────────────────────
// A rounded rectangle, centered on the origin in the XY plane.
function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const hw = w / 2;
  const hh = h / 3;
  const s = new THREE.Shape();
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

// An arbitrary polygon with every corner rounded by radius r.
function roundedPolyShape(pts: THREE.Vector2[], r: number): THREE.Shape {
  const s = new THREE.Shape();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const v1 = curr.clone().sub(prev);
    const l1 = v1.length();
    v1.divideScalar(l1 || 1);
    const v2 = next.clone().sub(curr);
    const l2 = v2.length();
    v2.divideScalar(l2 || 1);
    const r1 = Math.min(r, l1 * 0.5);
    const r2 = Math.min(r, l2 * 0.5);
    const start = curr.clone().addScaledVector(v1, -r1);
    const end = curr.clone().addScaledVector(v2, r2);
    if (i === 0) s.moveTo(start.x, start.y);
    else s.lineTo(start.x, start.y);
    s.quadraticCurveTo(curr.x, curr.y, end.x, end.y);
  }
  s.closePath();
  return s;
}

// Soft-cornered, beveled house geometry — built once and shared by all houses.
// Two stacked layers, like the BudgetThuis logo mark:
//   • lower block: a rounded rectangle (the body)
//   • upper block: a rounded "house" pentagon (base + gable roof)
const HOUSE_W = 3.5;
const HOUSE_D = 3.5;
const BODY_H = 2.0;
const ROOF_BASE_H = 0.7;
const ROOF_PEAK_H = 0.9;
const HOUSE_GAP = 0.4;

const EXTRUDE_OPTS: THREE.ExtrudeGeometryOptions = {
  depth: HOUSE_D - 0.4,
  bevelEnabled: true,
  bevelThickness: 0.2,
  bevelSize: 0.2,
  bevelSegments: 3,
  curveSegments: 10,
};

function centeredExtrude(shape: THREE.Shape): THREE.BufferGeometry {
  const geo = new THREE.ExtrudeGeometry(shape, EXTRUDE_OPTS);
  geo.translate(0, 0, -HOUSE_D / 2); // center the depth on z
  return geo;
}

const BODY_GEO = centeredExtrude(roundedRectShape(HOUSE_W, BODY_H, 0.45));
const ROOF_GEO = centeredExtrude(
  roundedPolyShape(
    [
      new THREE.Vector2(-HOUSE_W / 2, 0),
      new THREE.Vector2(HOUSE_W / 2, 0),
      new THREE.Vector2(HOUSE_W / 2, ROOF_BASE_H),
      new THREE.Vector2(0, ROOF_BASE_H + ROOF_PEAK_H),
      new THREE.Vector2(-HOUSE_W / 2, ROOF_BASE_H),
    ],
    0.38,
  ),
);

export function makeHouse(
  parent: THREE.Object3D,
  x: number,
  z: number,
  _bodyMat: THREE.Material, // kept for call-site compat, ignored internally
  _roofMat: THREE.Material,
  accent: THREE.Color,
  glowTex: THREE.Texture,
  scale = 1,
): HouseRefs {
  const g = new THREE.Group();

  // Lower body — rounded rectangle, gray600
  const bodyMat = new THREE.MeshLambertMaterial({ color: HOUSE_BODY_COLOR.clone() });
  const body = new THREE.Mesh(BODY_GEO, bodyMat);
  body.position.y = BODY_H / 2; // shape centered on origin → lift so base sits at 0

  // Floating house-shaped roof slab — gray850, hovering above the body
  const roofMat = new THREE.MeshLambertMaterial({ color: HOUSE_ROOF_COLOR.clone() });
  const roof = new THREE.Mesh(ROOF_GEO, roofMat);
  roof.position.y = BODY_H + HOUSE_GAP; // shape base sits at this height

  // Glow sprite — depthTest: false prevents clipping through geometry
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: accent.clone(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
  });
  const glowSprite = new THREE.Sprite(glowMat);
  glowSprite.scale.setScalar(11);
  glowSprite.position.set(0, 2.4, 0);

  g.add(body, roof, glowSprite);
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  g.rotation.y = (((x * 13 + z * 7) % 10) / 10 - 0.5) * 1.1;
  parent.add(g);
  return { glow: glowMat };
}

export function disposeScene(scene: THREE.Scene): void {
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose();
  });
}
