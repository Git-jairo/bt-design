// Story engine: owns the WebGL renderer, the per-product scene, the smoothed
// scroll progress / mouse parallax, and theme palette swaps. Plain three.js —
// no react-three-fiber — so the render loop is fully decoupled from React.

import * as THREE from 'three';
import {
  disposeScene,
  makeGlowTexture,
  resolvePalette,
  type Product,
  type SceneContext,
  type SceneHandle,
} from './shared';
import { buildEnergyScene } from './scenes/energy';
import { buildSimScene } from './scenes/sim';
import { buildFiberScene } from './scenes/fiber';

export type { Product } from './shared';

const BUILDERS: Record<Product, (ctx: SceneContext) => SceneHandle> = {
  energy: buildEnergyScene,
  sim: buildSimScene,
  fiber: buildFiberScene,
};

// ── HoverGrid shader ──────────────────────────────────────────────────────────
// A large flat plane at y=0.02 with a 1-unit grid that glows mint near the
// cursor. Ripple waves emanate from the mouse position.
const HOVER_VERT = /* glsl */`
  varying vec2 vWorldXZ;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldXZ = world.xz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const HOVER_FRAG = /* glsl */`
  uniform vec2  uMouse;
  uniform float uTime;
  uniform vec3  uAccent;
  varying vec2  vWorldXZ;

  float gridLine(vec2 coord) {
    vec2 g = abs(fract(coord - 0.5) - 0.5);
    return 1.0 - smoothstep(0.0, 0.022, min(g.x, g.y));
  }

  void main() {
    float dist = length(vWorldXZ - uMouse);
    float falloff = exp(-dist * 0.055);

    // Fine 1-unit grid, always faintly visible
    float grid = gridLine(vWorldXZ);
    float baseGrid = grid * 0.07;

    // Grid brightness near cursor
    float hotGrid = grid * falloff * 0.55;

    // Expanding ripple rings from mouse
    float ripple = sin(dist * 0.9 - uTime * 3.8) * 0.5 + 0.5;
    ripple *= smoothstep(22.0, 0.0, dist);
    ripple *= falloff * 0.30;

    float alpha = clamp(baseGrid + hotGrid + ripple, 0.0, 0.72);
    gl_FragColor = vec4(uAccent, alpha);
  }
`;

export interface EngineHandle {
  setProgress(p: number): void;
  setMouse(x: number, y: number): void;
  setPalette(el: HTMLElement, isDark: boolean): void;
  dispose(): void;
}

export function createStoryEngine(
  canvas: HTMLCanvasElement,
  product: Product,
  paletteEl: HTMLElement,
  isDark: boolean,
  caseId: string,
): EngineHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  let palette = resolvePalette(paletteEl, isDark);
  const scene = new THREE.Scene();
  scene.background = palette.bg.clone();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  const glow = makeGlowTexture();
  const handle = BUILDERS[product]({ scene, palette, glow, caseId });

  // ── HoverGrid ──
  const hoverUniforms = {
    uMouse:  { value: new THREE.Vector2(9999, 9999) },
    uTime:   { value: 0 },
    uAccent: { value: palette.accentDim.clone() },
  };
  const hoverMat = new THREE.ShaderMaterial({
    uniforms: hoverUniforms,
    vertexShader: HOVER_VERT,
    fragmentShader: HOVER_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  const hoverMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 260),
    hoverMat,
  );
  hoverMesh.rotation.x = -Math.PI / 2;
  hoverMesh.position.y = 0.02;
  hoverMesh.renderOrder = -1;
  scene.add(hoverMesh);

  // Raycaster for mouse → world XZ (ground plane y=0)
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const mouseWorld = new THREE.Vector3();
  // The pointer handler stores y as +1 at the bottom of the screen; Three.js
  // NDC expects +1 at the top, so flip y before raycasting onto the ground.
  const ndcMouse = new THREE.Vector2();

  let targetProgress = 0;
  let progress = 0;
  const mouseTarget = new THREE.Vector2();
  const mouse = new THREE.Vector2();
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const right = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);

  let w = 0;
  let h = 0;
  function resize() {
    const cw = canvas.clientWidth || 1;
    const ch = canvas.clientHeight || 1;
    if (cw === w && ch === h) return;
    w = cw;
    h = ch;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();
  let raf = 0;
  let disposed = false;

  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    resize();

    // Frame-rate-independent smoothing for buttery scroll + parallax.
    progress += (targetProgress - progress) * (1 - Math.exp(-dt * 4.5));
    mouse.lerp(mouseTarget, 1 - Math.exp(-dt * 5));

    handle.update(t, progress);
    handle.camera(progress, pos, look);

    dir.subVectors(look, pos).normalize();
    right.crossVectors(dir, UP).normalize();
    pos.addScaledVector(right, mouse.x * 1.7);
    pos.y += -mouse.y * 1.1;
    camera.position.copy(pos);
    camera.lookAt(look);

    // Project mouse to world ground plane for HoverGrid (flip y into NDC)
    ndcMouse.set(mouse.x, -mouse.y);
    raycaster.setFromCamera(ndcMouse, camera);
    if (raycaster.ray.intersectPlane(groundPlane, mouseWorld)) {
      hoverUniforms.uMouse.value.set(mouseWorld.x, mouseWorld.z);
    }
    hoverUniforms.uTime.value = t;

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    setProgress(p) {
      targetProgress = THREE.MathUtils.clamp(p, 0, 1);
    },
    setMouse(x, y) {
      mouseTarget.set(x, y);
    },
    setPalette(el, dark) {
      palette = resolvePalette(el, dark);
      (scene.background as THREE.Color).copy(palette.bg);
      hoverUniforms.uAccent.value.copy(palette.accentDim);
      handle.setPalette(palette);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      disposeScene(scene);
      glow.dispose();
      hoverMat.dispose();
      renderer.dispose();
    },
  };
}
