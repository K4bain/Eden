/* ============================================================================
   EDEN — paperCut.js  (White paper-cut3D relief)
   ----------------------------------------------------------------------------
   Recreates the Unicorn Studio "noisemask_hero_remix" effect natively in
   Three.js: a white/cream3D paper-cut relief with flowers and birds,
   revealed/concealed by a flowing noise mask.

   The effect:
   - White textured background plane
   - Relief image (flowers/birds) with displacement for depth
   - Noise-based alpha mask that flows across the surface
   - Soft directional lighting for shadow depth
   - Animated reveal on load, subtle breathing thereafter

   ========================================================================== */

import * as THREE from 'three';

// ── Simplex noise GLSL (for the reveal mask) ────────────────────────────────
// Optimized 2D/3D simplex noise in GLSL — runs on GPU, zero JS overhead.
const NOISE_GLSL = /* glsl */ `
  // Simplex 3D noise — Stefan Gustavson / Ian McEwan
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Fractal Brownian Motion — 3 octaves for organic flowing mask.
  float fbm(vec3 p) {
    float f = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 3; i++) {
      f += a * snoise(p);
      p = p * 2.0 + shift;
      a *= 0.5;
    }
    return f;
  }
`;

// ── Paper-cut relief material ────────────────────────────────────────────────
// The relief image is mapped onto a plane. A noise mask controls alpha,
// creating the organic reveal/conceal effect. Displacement adds depth.
const PAPER_CUT_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PAPER_CUT_FRAGMENT = /* glsl */ `
  uniform sampler2D uReliefMap;
  uniform sampler2D uNoiseMap;
  uniform float uTime;
  uniform float uRevealProgress;    // 0 = hidden, 1 = fully revealed
  uniform float uNoiseScale;
  uniform float uNoiseSpeed;
  uniform vec3 uLightDir;           // normalized light direction
  uniform vec3 uBaseColor;          // white/cream base
  uniform float uDisplacementStrength;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  ${NOISE_GLSL}

  void main() {
    // Sample the relief texture (white paper-cut flowers/birds).
    vec4 relief = texture2D(uReliefMap, vUv);

    // Generate noise mask — organic flowing shape.
    vec3 noisePos = vec3(vUv * uNoiseScale, uTime * uNoiseSpeed);
    float noise = fbm(noisePos);

    // Remap noise from [-1,1] to [0,1] for alpha mask.
    float mask = noise * 0.5 + 0.5;

    // Reveal progress controls the threshold.
    // As uRevealProgress goes 0→1, more of the relief is revealed.
    float threshold = mix(1.2, -0.2, uRevealProgress);
    float alpha = smoothstep(threshold - 0.15, threshold + 0.15, mask);

    // Soft edge — feather the mask for organic feel.
    alpha = pow(alpha, 0.8);

    // Lighting — directional light creates shadows on the relief.
    float NdotL = max(dot(vNormal, uLightDir), 0.0);
    float ambient = 0.6;
    float diffuse = NdotL * 0.4;

    // Rim light — subtle edge highlight for depth.
    vec3 viewDir = normalize(-vPosition);
    float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0) * 0.15;

    // Combine lighting.
    float lighting = ambient + diffuse + rim;

    // Final color — white/cream with relief texture modulated by lighting.
    vec3 color = uBaseColor * relief.rgb * lighting;

    // Subtle warm tint in shadows.
    color += vec3(0.02, 0.015, 0.01) * (1.0 - NdotL) * relief.rgb;

    gl_FragColor = vec4(color, alpha * relief.a);
  }
`;

// ── Background plane material (textured white surface) ──────────────────────
// The white/cream background behind the relief — like textured paper.
const BG_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BG_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  ${NOISE_GLSL}

  void main() {
    // Subtle paper texture via noise.
    vec3 noisePos = vec3(vUv * 8.0, uTime * 0.02);
    float grain = fbm(noisePos) * 0.03;

    // Base cream color with subtle variation.
    vec3 color = vec3(0.95, 0.93, 0.90) + grain;

    // Very subtle vignette — darker at edges.
    float vignette = 1.0 - length(vUv - 0.5) * 0.3;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

/**
 * Creates the paper-cut3D relief scene.
 * @param {object} opts
 * @param {THREE.Texture} opts.reliefTexture — the white paper-cut image
 * @param {boolean} opts.isMobile — mobile performance mode
 * @returns {object} { group, update(time), reveal(duration), resize() }
 */
export function createPaperCut(opts = {}) {
  const { reliefTexture, isMobile = false } = opts;

  const group = new THREE.Group();

  // ── Background plane ──────────────────────────────────────────────────────
  // Large white/cream textured surface behind the relief.
  const bgGeo = new THREE.PlaneGeometry(16, 10, 1, 1);
  const bgMat = new THREE.ShaderMaterial({
    vertexShader: BG_VERTEX,
    fragmentShader: BG_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
    },
    transparent: false,
    depthWrite: true,
  });
  const bgMesh = new THREE.Mesh(bgGeo, bgMat);
  bgMesh.position.z = -1;
  group.add(bgMesh);

  // ── Relief plane ──────────────────────────────────────────────────────────
  // The paper-cut image with noise-masked reveal.
  const reliefGeo = new THREE.PlaneGeometry(14, 8, isMobile ? 64 : 128, isMobile ? 64 : 128);
  const reliefMat = new THREE.ShaderMaterial({
    vertexShader: PAPER_CUT_VERTEX,
    fragmentShader: PAPER_CUT_FRAGMENT,
    uniforms: {
      uReliefMap: { value: reliefTexture },
      uNoiseMap: { value: null },
      uTime: { value: 0 },
      uRevealProgress: { value: 0 },
      uNoiseScale: { value: isMobile ? 2.0 : 2.5 },
      uNoiseSpeed: { value: 0.04 },
      uLightDir: { value: new THREE.Vector3(0.5, 0.8, 1.0).normalize() },
      uBaseColor: { value: new THREE.Color(0.95, 0.93, 0.90) },
      uDisplacementStrength: { value: 0.02 },
    },
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
  const reliefMesh = new THREE.Mesh(reliefGeo, reliefMat);
  reliefMesh.position.z = 0;
  group.add(reliefMesh);

  // ── Floating particles (paper confetti) ───────────────────────────────────
  // Tiny white fragments that drift during the reveal — like paper scraps.
  const particleCount = isMobile ? 80 : 200;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(particleCount * 3);
  const pSizes = new Float32Array(particleCount);
  const pPhases = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 14;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pPositions[i * 3 + 2] = Math.random() * 2 - 0.5;
    pSizes[i] = Math.random() * 0.02 + 0.005;
    pPhases[i] = Math.random() * Math.PI * 2;
  }

  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));

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

  // ── Animation state ───────────────────────────────────────────────────────
  let revealProgress = 0;
  let revealTarget = 0;
  let revealStartTime = 0;
  let revealDuration = 2000;
  let isRevealing = false;

  // ── Public API ────────────────────────────────────────────────────────────
  const update = (time) => {
    bgMat.uniforms.uTime.value = time;
    reliefMat.uniforms.uTime.value = time;
    reliefMat.uniforms.uRevealProgress.value = revealProgress;

    // Animate reveal.
    if (isRevealing) {
      const elapsed = performance.now() - revealStartTime;
      const t = Math.min(elapsed / revealDuration, 1);
      // Ease out cubic — fast start, gentle finish.
      revealProgress = 1 - Math.pow(1 - t, 3);
      if (t >= 1) {
        isRevealing = false;
        revealProgress = 1;
      }
    }

    // Subtle floating particles.
    const pPos = pGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      pPos[i3 + 1] += Math.sin(time * 0.3 + pPhases[i]) * 0.0003;
      pPos[i3] += Math.cos(time * 0.2 + pPhases[i] * 0.7) * 0.0002;
    }
    pGeo.attributes.position.needsUpdate = true;

    // Particle opacity follows reveal.
    pMat.opacity = revealProgress * 0.3;

    // Subtle breathing of the relief.
    const breathe = Math.sin(time * 0.4) * 0.003;
    reliefMesh.scale.set(1 + breathe, 1 + breathe, 1);
  };

  const reveal = (duration = 2000) => {
    revealStartTime = performance.now();
    revealDuration = duration;
    isRevealing = true;
    revealProgress = 0;
    pMat.opacity = 0;
  };

  const resize = (w, h) => {
    const aspect = w / h;
    const baseAspect = 16 / 9;
    let scale;
    if (aspect > baseAspect) {
      scale = aspect / baseAspect;
    } else {
      scale = 1;
    }
    bgMesh.scale.set(scale, scale, 1);
    reliefMesh.scale.set(scale, scale, 1);
  };

  return { group, update, reveal, resize };
}

// ── Soft dot texture for particles ──────────────────────────────────────────
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
