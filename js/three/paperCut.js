/* ============================================================================
   EDEN — paperCut.js  (White paper-cut relief — simple, visible, beautiful)
   ----------------------------------------------------------------------------
   Shows the paper-cut relief texture at full visibility with subtle animated
   depth. No complex noise masks — the texture IS the visual. Instead:
   - Soft breathing animation on scale
   - Subtle light/dark wave that drifts across (like light through paper)
   - Cursor-reveal: moving the mouse reveals warmer light on the relief
   ========================================================================== */

import * as THREE from 'three';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform vec2 uCursor;

  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uTexture, vUv);
    if (tex.a < 0.01) discard;

    // Subtle warm wave that drifts across the surface — like light through paper.
    float wave = sin(vUv.x * 3.0 + uTime * 0.15) * 0.04
               + cos(vUv.y * 4.0 + uTime * 0.1) * 0.03
               + sin((vUv.x + vUv.y) * 5.0 + uTime * 0.08) * 0.02;
    wave = wave * 0.5 + 0.5;

    // Cursor proximity — warmer, brighter where you look.
    float dist = distance(vUv, uCursor);
    float cursorGlow = exp(-dist * 3.0) * 0.15;

    // Soft vignette
    float vig = 1.0 - length(vUv - 0.5) * 0.3;

    vec3 color = tex.rgb;
    color += vec3(0.06, 0.04, 0.02) * wave;  // warm pulse
    color += vec3(0.1, 0.07, 0.04) * cursorGlow;
    color *= vig;

    gl_FragColor = vec4(color, tex.a);
  }
`;

export function createPaperCut(opts = {}) {
  const { reliefTexture, isMobile = false } = opts;
  const group = new THREE.Group();

  // ── Background plane ────────────────────────────────────────────────────
  const bgMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.94, 0.92, 0.89),
  });
  const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), bgMat);
  bgMesh.position.z = -1;
  group.add(bgMesh);

  // ── Relief plane ────────────────────────────────────────────────────────
  const cursor = { x: 0.5, y: 0.5 };
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTexture: { value: reliefTexture },
      uTime: { value: 0 },
      uCursor: { value: new THREE.Vector2(0.5, 0.5) },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), mat);
  group.add(mesh);

  // ── Floating particles ──────────────────────────────────────────────────
  const pCount = isMobile ? 40 : 80;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  const pPhase = new Float32Array(pCount);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 14;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pPos[i * 3 + 2] = Math.random() * 2 - 0.5;
    pPhase[i] = Math.random() * 6.28;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.01,
    sizeAttenuation: true,
    color: 0xd4c8b8,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  const particles = new THREE.Points(pGeo, pMat);
  group.add(particles);

  // ── Cursor tracking ────────────────────────────────────────────────────
  const onMove = (e) => {
    const x = e.clientX / window.innerWidth;
    const y = 1 - e.clientY / window.innerHeight;
    cursor.x += (x - cursor.x) * 0.05;
    cursor.y += (y - cursor.y) * 0.05;
  };
  window.addEventListener('mousemove', onMove);

  // ── API ─────────────────────────────────────────────────────────────────
  const update = (time) => {
    mat.uniforms.uTime.value = time;
    mat.uniforms.uCursor.value.set(cursor.x, cursor.y);

    // Float particles
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < pCount; i++) {
      arr[i * 3 + 1] += Math.sin(time * 0.2 + pPhase[i]) * 0.0003;
    }
    pGeo.attributes.position.needsUpdate = true;

    // Gentle breathing
    const b = Math.sin(time * 0.35) * 0.002;
    mesh.scale.set(1 + b, 1 + b, 1);
  };

  const reveal = () => {};

  const resize = (w, h) => {
    const s = (w / h) > (16 / 9) ? (w / h) / (16 / 9) : 1;
    bgMesh.scale.set(s, s, 1);
    mesh.scale.set(s, s, 1);
  };

  const dispose = () => {
    window.removeEventListener('mousemove', onMove);
  };

  return { group, update, reveal, resize, dispose };
}
