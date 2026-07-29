/* ============================================================================
   EDEN — paperCut.js  (perf-optimized paper-cut relief)
   ----------------------------------------------------------------------------
   White/cream paper-cut relief with flowers and birds, revealed/concealed by
   a flowing noise mask. The mask is ALWAYS active — it drifts across the
   surface creating organic shapes.

   PERF PROBLEM (was 25fps): the original ran 3-octave FBM (27 simplex noise
   calls) PER PIXEL PER FRAME in the fragment shader. At 1280×720 that's
   ~25M noise evaluations every frame — the dominant GPU cost.

   FIX: Pre-bake the noise mask to a small offscreen canvas (256×128) in JS
   and re-bake every ~200ms (5x/sec). The mask drift speed is 0.04 — at that
   rate 5 updates/sec is visually continuous. The fragment shader is now
   trivial: two texture samples (relief + pre-baked mask). Geometry reduced
   from 128×128 segments (32K tris for a flat plane) to 1×1.

   Bake cost: ~32K JS noise evals every 200ms ≈ 2ms — negligible. Was: ~25M
   GLSL noise evals every frame ≈ 40ms. Net: ~200x reduction in noise cost.
   ========================================================================== */

import * as THREE from 'three';

// ── JS Simplex noise (for pre-baking — never runs in the render loop) ───────
const SimplexNoise = (() => {
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const F3 = 1 / 3;
  const G3 = 1 / 6;
  const grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  class Simplex {
    constructor(seed = 1337) {
      const p = new Uint8Array(256);
      for (let i = 0; i < 256; i++) p[i] = i;
      let s = seed;
      for (let i = 255; i > 0; i--) {
        s = (s * 16807) % 2147483647;
        const j = s % (i + 1);
        const t = p[i]; p[i] = p[j]; p[j] = t;
      }
      this.perm = new Uint8Array(512);
      this.permMod12 = new Uint8Array(512);
      for (let i = 0; i < 512; i++) {
        this.perm[i] = p[i & 255];
        this.permMod12[i] = this.perm[i] % 12;
      }
    }
    noise3D(x, y, z) {
      const { perm, permMod12 } = this;
      const s = (x + y + z) * F3;
      const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
      const t = (i + j + k) * G3;
      const x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);
      let i1, j1, k1, i2, j2, k2;
      if (x0 >= y0) {
        if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; }
        else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; }
        else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; }
      } else {
        if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; }
        else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; }
        else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; }
      }
      const x1=x0-i1+G3, y1=y0-j1+G3, z1=z0-k1+G3;
      const x2=x0-i2+2*G3, y2=y0-j2+2*G3, z2=z0-k2+2*G3;
      const x3=x0-1+3*G3, y3=y0-1+3*G3, z3=z0-1+3*G3;
      const ii=i&255, jj=j&255, kk=k&255;
      let n0=0,n1=0,n2=0,n3=0;
      let t0=0.6-x0*x0-y0*y0-z0*z0;
      if(t0>0){t0*=t0;const g=grad3[permMod12[ii+perm[jj+perm[kk]]]];n0=t0*t0*(g[0]*x0+g[1]*y0+g[2]*z0);}
      let t1=0.6-x1*x1-y1*y1-z1*z1;
      if(t1>0){t1*=t1;const g=grad3[permMod12[ii+i1+perm[jj+j1+perm[kk+k1]]]];n1=t1*t1*(g[0]*x1+g[1]*y1+g[2]*z1);}
      let t2=0.6-x2*x2-y2*y2-z2*z2;
      if(t2>0){t2*=t2;const g=grad3[permMod12[ii+i2+perm[jj+j2+perm[kk+k2]]]];n2=t2*t2*(g[0]*x2+g[1]*y2+g[2]*z2);}
      let t3=0.6-x3*x3-y3*y3-z3*z3;
      if(t3>0){t3*=t3;const g=grad3[permMod12[ii+1+perm[jj+1+perm[kk+1]]]];n3=t3*t3*(g[0]*x3+g[1]*y3+g[2]*z3);}
      return 32*(n0+n1+n2+n3);
    }
  }
  return Simplex;
})();

// ── Pre-baked noise mask (low-res canvas, re-baked periodically) ────────────
const MASK_W = 256, MASK_H = 128;
const _noiseCanvas = document.createElement('canvas');
_noiseCanvas.width = MASK_W;
_noiseCanvas.height = MASK_H;
const _noiseCtx = _noiseCanvas.getContext('2d');
const _simplex = new SimplexNoise(42);
let _maskTexture = null;

function bakeNoiseMask(revealProgress, time) {
  const imgData = _noiseCtx.createImageData(MASK_W, MASK_H);
  const d = imgData.data;
  const scale = 2.5;
  const speed = 0.04;
  const threshold = 1.2 - 1.4 * revealProgress; // 1.2 (hidden) → -0.2 (revealed)

  for (let py = 0; py < MASK_H; py++) {
    const v = py / MASK_H;
    for (let px = 0; px < MASK_W; px++) {
      const u = px / MASK_W;
      // 3-octave FBM (cheap at 256×128 = 32K px, every 200ms).
      let n = 0, a = 0.5;
      let nx = u * scale, ny = v * scale, nz = time * speed;
      for (let o = 0; o < 3; o++) {
        n += a * _simplex.noise3D(nx, ny, nz);
        nx = nx * 2 + 100; ny = ny * 2 + 100; nz = nz * 2 + 100;
        a *= 0.5;
      }
      n = n * 0.5 + 0.5; // remap [-1,1] → [0,1]
      let alpha = (n - (threshold - 0.2)) / 0.4; // Wider smoothstep = softer edges
      alpha = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha;
      alpha = Math.pow(alpha, 0.6); // Softer falloff
      const idx = (py * MASK_W + px) * 4;
      d[idx] = d[idx + 1] = d[idx + 2] = 255;
      d[idx + 3] = (alpha * 255) | 0;
    }
  }
  _noiseCtx.putImageData(imgData, 0, 0);

  if (!_maskTexture) {
    _maskTexture = new THREE.CanvasTexture(_noiseCanvas);
    _maskTexture.minFilter = THREE.LinearFilter;
    _maskTexture.magFilter = THREE.LinearFilter;
  } else {
    _maskTexture.needsUpdate = true;
  }
  return _maskTexture;
}

// ── Trivial fragment shader — just samples pre-baked mask + relief texture ──
const RELIEF_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RELIEF_FRAGMENT = /* glsl */ `
  uniform sampler2D uReliefMap;
  uniform sampler2D uMaskMap;
  uniform vec3 uBaseColor;
  varying vec2 vUv;

  void main() {
    vec4 relief = texture2D(uReliefMap, vUv);
    float mask = texture2D(uMaskMap, vUv).a;
    vec3 color = uBaseColor * relief.rgb;
    // Subtle warm tint in darker areas.
    color += vec3(0.02, 0.015, 0.01) * (1.0 - relief.r) * relief.rgb;
    gl_FragColor = vec4(color, mask * relief.a);
  }
`;

/**
 * Creates the paper-cut relief scene (perf-optimized).
 * @returns {{ group, update, reveal, resize }}
 */
export function createPaperCut(opts = {}) {
  const { reliefTexture, isMobile = false } = opts;
  const group = new THREE.Group();

  // ── Background: flat cream plane — NO shader, NO per-pixel noise ─────────
  const bgGeo = new THREE.PlaneGeometry(16, 10);
  const bgMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.95, 0.93, 0.90),
  });
  const bgMesh = new THREE.Mesh(bgGeo, bgMat);
  bgMesh.position.z = -1;
  group.add(bgMesh);

  // ── Relief plane: 1×1 segments (flat — detail is in the texture, not geo) ─
  const reliefGeo = new THREE.PlaneGeometry(14, 8, 1, 1);
  const reliefMat = new THREE.ShaderMaterial({
    vertexShader: RELIEF_VERTEX,
    fragmentShader: RELIEF_FRAGMENT,
    uniforms: {
      uReliefMap: { value: reliefTexture },
      uMaskMap: { value: null },
      uBaseColor: { value: new THREE.Color(0.95, 0.93, 0.90) },
    },
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
  const reliefMesh = new THREE.Mesh(reliefGeo, reliefMat);
  reliefMesh.position.z = 0;
  group.add(reliefMesh);

  // ── Floating confetti particles (lightweight) ───────────────────────────
  const particleCount = isMobile ? 40 : 100;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(particleCount * 3);
  const pPhases = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 14;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pPositions[i * 3 + 2] = Math.random() * 2 - 0.5;
    pPhases[i] = Math.random() * Math.PI * 2;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.015,
    sizeAttenuation: true,
    color: 0xe8e0d4,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.NormalBlending,
    map: makeSoftDot(),
  });
  const particles = new THREE.Points(pGeo, pMat);
  group.add(particles);

  // ── Reveal + mask-bake state ────────────────────────────────────────────
  let revealProgress = 0.7;     // Start partially visible — relief shows immediately
  let revealTarget = 0.7;       // Lerps toward this
  let lastBakeTime = -1;
  const BAKE_INTERVAL = 0.2;

  const update = (time) => {
    // Smoothly lerp reveal toward target.
    revealProgress += (revealTarget - revealProgress) * 0.03;

    // Re-bake noise mask periodically — preserves the flowing drift without
    // the per-frame GPU cost.
    if (lastBakeTime < 0 || (time - lastBakeTime) >= BAKE_INTERVAL) {
      lastBakeTime = time;
      reliefMat.uniforms.uMaskMap.value = bakeNoiseMask(revealProgress, time);
    }

    // Float particles (cheap — 100 points).
    const pPos = pGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      pPos[i3 + 1] += Math.sin(time * 0.3 + pPhases[i]) * 0.0003;
      pPos[i3]     += Math.cos(time * 0.2 + pPhases[i] * 0.7) * 0.0002;
    }
    pGeo.attributes.position.needsUpdate = true;
    pMat.opacity = revealProgress * 0.3;

    // Subtle breathing.
    const breathe = Math.sin(time * 0.4) * 0.003;
    reliefMesh.scale.set(1 + breathe, 1 + breathe, 1);
  };

  const reveal = (duration = 2500) => {
    // Revelation opens the mask fully, then settles back after duration.
    revealTarget = 1.0;
    setTimeout(() => { revealTarget = 0.8; }, duration);
    lastBakeTime = -1;
    pMat.opacity = 0;
  };

  const resize = (w, h) => {
    const aspect = w / h;
    const scale = aspect > (16 / 9) ? aspect / (16 / 9) : 1;
    bgMesh.scale.set(scale, scale, 1);
    reliefMesh.scale.set(scale, scale, 1);
  };

  return { group, update, reveal, resize };
}

let _dotTex = null;
function makeSoftDot() {
  if (_dotTex) return _dotTex;
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  _dotTex = new THREE.CanvasTexture(c);
  return _dotTex;
}
