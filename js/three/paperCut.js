/* ============================================================================
   EDEN — paperCut.js  (White paper-cut3D relief)
   ----------------------------------------------------------------------------
   Recreates the Unicorn Studio "noisemask_hero_remix" effect natively in
   Three.js: a white/cream3D paper-cut relief with flowers and birds,
   continuously revealed/concealed by a flowing noise mask.

   The noise mask is ALWAYS active — it flows across the surface creating
   organic shapes that reveal/hide the relief. Not a one-time reveal.

   ========================================================================== */

import * as THREE from 'three';

// ── Simplex noise GLSL ──────────────────────────────────────────────────────
const NOISE_GLSL = /* glsl */ `
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

  float fbm(vec3 p) {
    float f = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 4; i++) {
      f += a * snoise(p);
      p = p * 2.0 + shift;
      a *= 0.5;
    }
    return f;
  }
`;

// ── Relief material ─────────────────────────────────────────────────────────
// The relief image with a flowing noise mask that's always active.
// Two noise layers at different speeds create organic flowing shapes.
const RELIEF_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vViewPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RELIEF_FRAG = /* glsl */ `
  uniform sampler2D uReliefMap;
  uniform float uTime;
  uniform float uReveal;             // 0..1 overall visibility amount
  uniform float uNoiseScale;
  uniform vec3 uLightDir;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;

  ${NOISE_GLSL}

  void main() {
    vec4 relief = texture2D(uReliefMap, vUv);

    // Two-layer noise mask — different scales and speeds for organic flow.
    vec3 np1 = vec3(vUv * uNoiseScale, uTime * 0.03);
    vec3 np2 = vec3(vUv * uNoiseScale * 0.7 + 3.14, uTime * 0.02 + 50.0);
    float n1 = fbm(np1);
    float n2 = fbm(np2);
    float noise = n1 * 0.6 + n2 * 0.4;

    // Remap to 0..1
    float mask = noise * 0.5 + 0.5;

    // uReveal controls how much is visible (threshold).
    // Low reveal = only peaks visible. High reveal = most visible.
    float threshold = mix(0.7, 0.15, uReveal);
    float edge = 0.12;
    float alpha = smoothstep(threshold - edge, threshold + edge, mask);

    // Soft feather
    alpha = pow(alpha, 0.7);

    // Directional lighting for depth on the relief.
    float NdotL = max(dot(vNormal, uLightDir), 0.0);
    float lighting = 0.65 + NdotL * 0.35;

    // Subtle rim for 3D feel.
    vec3 viewDir = normalize(-vViewPos);
    float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0) * 0.1;
    lighting += rim;

    vec3 color = relief.rgb * lighting;

    gl_FragColor = vec4(color, alpha * relief.a);
  }
`;

// ── Background — textured paper surface ─────────────────────────────────────
const BG_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BG_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  ${NOISE_GLSL}

  void main() {
    vec3 np = vec3(vUv * 6.0, uTime * 0.015);
    float grain = fbm(np) * 0.025;
    vec3 color = vec3(0.94, 0.92, 0.89) + grain;

    // Soft vignette.
    float vig = 1.0 - length(vUv - 0.5) * 0.25;
    color *= vig;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createPaperCut(opts = {}) {
  const { reliefTexture, isMobile = false } = opts;
  const group = new THREE.Group();

  // ── Background plane ────────────────────────────────────────────────────
  const bgGeo = new THREE.PlaneGeometry(16, 10);
  const bgMat = new THREE.ShaderMaterial({
    vertexShader: BG_VERT,
    fragmentShader: BG_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: false,
    depthWrite: true,
  });
  const bgMesh = new THREE.Mesh(bgGeo, bgMat);
  bgMesh.position.z = -1;
  group.add(bgMesh);

  // ── Relief plane ────────────────────────────────────────────────────────
  const reliefGeo = new THREE.PlaneGeometry(14, 8);
  const reliefMat = new THREE.ShaderMaterial({
    vertexShader: RELIEF_VERT,
    fragmentShader: RELIEF_FRAG,
    uniforms: {
      uReliefMap: { value: reliefTexture },
      uTime: { value: 0 },
      uReveal: { value: 0.6 },         // start partially visible
      uNoiseScale: { value: isMobile ? 1.8 : 2.2 },
      uLightDir: { value: new THREE.Vector3(0.4, 0.7, 1.0).normalize() },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const reliefMesh = new THREE.Mesh(reliefGeo, reliefMat);
  group.add(reliefMesh);

  // ── Floating particles ──────────────────────────────────────────────────
  const pCount = isMobile ? 60 : 150;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  const pPhases = new Float32Array(pCount);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 14;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pPos[i * 3 + 2] = Math.random() * 2 - 0.5;
    pPhases[i] = Math.random() * Math.PI * 2;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.012,
    sizeAttenuation: true,
    color: 0xd0c8b8,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    map: makeDot(),
  });
  const particles = new THREE.Points(pGeo, pMat);
  group.add(particles);

  // ── State ───────────────────────────────────────────────────────────────
  let currentReveal = 0.6;
  let targetReveal = 0.6;

  const update = (time) => {
    bgMat.uniforms.uTime.value = time;
    reliefMat.uniforms.uTime.value = time;

    // Smoothly lerp reveal toward target.
    currentReveal += (targetReveal - currentReveal) * 0.02;
    reliefMat.uniforms.uReveal.value = currentReveal;

    // Drift particles.
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < pCount; i++) {
      const i3 = i * 3;
      arr[i3 + 1] += Math.sin(time * 0.25 + pPhases[i]) * 0.0002;
      arr[i3]     += Math.cos(time * 0.18 + pPhases[i] * 0.7) * 0.00015;
    }
    pGeo.attributes.position.needsUpdate = true;

    // Subtle breathing.
    const b = Math.sin(time * 0.35) * 0.002;
    reliefMesh.scale.set(1 + b, 1 + b, 1);
  };

  // Called at revelation — temporarily opens the mask more, then settles.
  const reveal = (duration = 2500) => {
    targetReveal = 1.0;
    setTimeout(() => { targetReveal = 0.75; }, duration);
  };

  const resize = (w, h) => {
    const aspect = w / h;
    const base = 16 / 9;
    const s = aspect > base ? aspect / base : 1;
    bgMesh.scale.set(s, s, 1);
    reliefMesh.scale.set(s, s, 1);
  };

  return { group, update, reveal, resize };
}

let _dot = null;
function makeDot() {
  if (_dot) return _dot;
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  _dot = new THREE.CanvasTexture(c);
  return _dot;
}
