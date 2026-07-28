/* ============================================================================
   EDEN — particles.js  (Phase 3)
   ----------------------------------------------------------------------------
   The particle field — Pascal's stars drifting in the void (§3 "The Void",
   §3 "Eternal Return"). 1400 desktop / 250 mobile. Seeded fresh every visit
   from Date.now() so no two gardens are identical.

   Behavior (§8):
     - Colors: 60% amber, 30% bioluminescent green, 10% near-invisible
     - Slow upward Y drift + sine X oscillation
     - Cursor pull within radius (the "things come alive when you look" effect)
     - Respawn at top when Y > 5

   Exposes a Particles object with .points, .update(time, cursorWorld), and
   .surge()/settle() for the revelation moment.
   ========================================================================== */

import * as THREE from 'three';

export function createParticles(opts = {}) {
  const { count = 1400, isMobile = false } = opts;

  // Seeded PRNG (mulberry32) — fresh garden every visit (Eternal Return).
  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const seed = (Date.now() ^ (isMobile ? 0xabc : 0)) >>> 0;
  const rnd = mulberry32(seed);

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);
  const sizes     = new Float32Array(count);
  // Per-particle phase + velocity, kept in JS arrays (not uploaded).
  const phase  = new Float32Array(count);
  const vy     = new Float32Array(count);
  const targetOpacity = new Float32Array(count);

  // Eden palette (§6) — vivid, saturated colors visible with normal blending.
  const C_AMBER_LO = new THREE.Color('#c49030');
  const C_AMBER_HI = new THREE.Color('#f0d880');
  const C_BIO_LO   = new THREE.Color('#30b878');
  const C_BIO_HI   = new THREE.Color('#80e8b0');
  const C_FAINT    = new THREE.Color('#407058');
  const tmp = new THREE.Color();

  const sizeMin = isMobile ? 0.015 : 0.010;
  const sizeMax = isMobile ? 0.050 : 0.040;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    // Spread in a tighter volume around the camera (z: 0..3).
    positions[i3]     = (rnd() - 0.5) * 8;       // x
    positions[i3 + 1] = (rnd() - 0.5) * 6;       // y
    positions[i3 + 2] = (rnd() * 3) - 0.5;       // z

    vy[i]    = 0.00008 + rnd() * 0.00032;          // §8: 0.00008–0.0004
    phase[i] = rnd() * Math.PI * 2;

    // Color distribution: 60 / 30 / 10.
    const roll = rnd();
    if (roll < 0.60) {
      tmp.copy(C_AMBER_LO).lerp(C_AMBER_HI, rnd());
    } else if (roll < 0.90) {
      tmp.copy(C_BIO_LO).lerp(C_BIO_HI, rnd());
    } else {
      tmp.copy(C_FAINT);
    }
    colors[i3]     = tmp.r;
    colors[i3 + 1] = tmp.g;
    colors[i3 + 2] = tmp.b;

    sizes[i] = sizeMin + rnd() * (sizeMax - sizeMin);
    targetOpacity[i] = 0.25 + rnd() * 0.65;        // 0.25–0.9 (brighter field)
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  // Vertex colors + round soft points. NormalBlending — bloom handles the glow.
  const material = new THREE.PointsMaterial({
    size: isMobile ? 0.035 : 0.028,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.0,                       // builds 0 → target over 1.5s
    depthWrite: false,
    blending: THREE.NormalBlending,
    map: makeSoftDotTexture()
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;         // they fill the volume

  // ── Animation state ───────────────────────────────────────────────────────
  let age = 0;
  let surgeFactor = 0;                  // 0..0.4, set by revelation surge
  const PULL_RADIUS = 1.5;
  const PULL_RADIUS_SQ = PULL_RADIUS * PULL_RADIUS;
  const PULL_STRENGTH = 0.0008;

  // Curl noise helpers — creates organic, fluid particle motion.
  // Simple 3D noise via hashing (no texture lookup needed).
  const noise3D = (x, y, z) => {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 45.164) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;  // -1 to 1
  };
  const curlNoise = (x, y, z, t) => {
    const e = 0.1;
    const nt = t * 0.08;  // slow time evolution
    // Partial derivatives via finite differences
    const dx = (noise3D(x + e, y, z + nt) - noise3D(x - e, y, z + nt)) / (2 * e);
    const dy = (noise3D(x, y + e, z + nt) - noise3D(x, y - e, z + nt)) / (2 * e);
    const dz = (noise3D(x, y, z + e + nt) - noise3D(x, y, z - e + nt)) / (2 * e);
    return { x: dy - dz, y: dz - dx, z: dx - dy };
  };

  // Reusable vec for cursor pull math (no allocation in hot loop).
  let dx = 0, dy = 0, dist = 0, pull = 0;

  const update = (time /*s*/, cursorWorld) => {
    age += 1 / 60;                      // approximate; fine for fades
    const pos = geometry.attributes.position.array;

    // Fade-in over 1.5s (fast reveal of the field).
    const fadeIn = Math.min(age / 1.5, 1);
    material.opacity = (1.0 + surgeFactor) * fadeIn;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Curl noise — organic flow field, not linear drift.
      const cn = curlNoise(pos[i3] * 0.3, pos[i3 + 1] * 0.3, pos[i3 + 2] * 0.3, time);
      const noiseForce = 0.00012 * (1 + surgeFactor * 3);
      pos[i3]     += cn.x * noiseForce;
      pos[i3 + 1] += cn.y * noiseForce + vy[i] * (1 + surgeFactor * 4);
      pos[i3]     += Math.sin(time * 0.6 + phase[i]) * 0.0001;

      // Cursor pull (§8: inverse-falloff drift toward warmth).
      if (cursorWorld) {
        dx = cursorWorld.x - pos[i3];
        dy = cursorWorld.y - pos[i3 + 1];
        const distSq = dx * dx + dy * dy;
        if (distSq < PULL_RADIUS_SQ) {
          dist = Math.sqrt(distSq);
          pull = PULL_STRENGTH * (1 - dist / PULL_RADIUS);
          pos[i3]     += dx * pull;
          pos[i3 + 1] += dy * pull;
        }
      }

      // Respawn at top (§8).
      if (pos[i3 + 1] > 5) {
        pos[i3 + 1] = -5;
        pos[i3]     = (rnd() - 0.5) * 12;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  };

  // Revelation surge: opacity jumps +40%, motion quickens, then settles (§13).
  const surge = () => {
    surgeFactor = 0.4;
    // Settle back over ~3.5s.
    const start = performance.now();
    const ease = () => {
      const k = Math.min((performance.now() - start) / 3500, 1);
      surgeFactor = 0.4 * (1 - k);
      if (k < 1) requestAnimationFrame(ease);
    };
    ease();
  };

  return { points, update, surge };
}

// Build a soft radial dot texture in-memory so points look like light, not
// squares. Cached on the module so we only build it once.
// Larger texture (128px) = smoother gradient = more visible glow at distance.
let _dotTex = null;
function makeSoftDotTexture() {
  if (_dotTex) return _dotTex;
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0,   'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.6)');
  g.addColorStop(0.85,'rgba(255,255,255,0.2)');
  g.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  _dotTex = new THREE.CanvasTexture(c);
  return _dotTex;
}
