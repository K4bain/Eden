/* ============================================================================
   EDEN — scene.js  (Phase 3/4 orchestrator)
   ----------------------------------------------------------------------------
   Boots the Three.js scene and the render loop. Wires the timeline's events
   to the scene's behavior:

     'eden:exploration-start' → PointLight intensity 0 → 0.8 (cursor becomes
                                the light — §4 PRESENCE)
     'eden:revelation'        → particle surge + background bloom (§13)
                                  + chromatic spike + bloom (Phase 4)

   Also owns the resize handler (debounced 150ms — Gotcha #6) and the mobile
   skips (no cursor canvas / PointLight follow on touch).

   Phase 4: post-processing pipeline (EffectComposer) loads asynchronously.
   If unavailable, falls back to Phase 2 CSS chromatic aberration.
   ========================================================================== */

import * as THREE from 'three';
import { createParticles } from './particles.js';
import { createLights } from './lights.js';
import { createBackground } from './background.js';
import { createCursor } from '../eden/cursor.js';
import { createPostProcessing } from './postprocessing.js';

export function initScene() {
  const EDEN = window.EDEN = window.EDEN || {};
  const caps = window.__EDEN__ ?? {};
  const isMobile = !!caps.isMobile;

  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  // ── GSAP breathing state ──────────────────────────────────────────────────
  // Shared breathing driver — GSAP animates this, the render loop reads it.
  // breath.particle: opacity multiplier (1.0 = baseline, pulses ±0.15)
  // breath.light: intensity offset (0 = baseline, pulses ±0.4)
  const breath = { particle: 0, light: 0 };
  let gsapReady = !!(window.gsap && typeof window.gsap.to === 'function');

  // ── Renderer ──────────────────────────────────────────────────────────────
  // Perf: antialias OFF — the bloom + sfumato pipeline already softens edges,
  // and MSAA on top of 5 full-screen passes was the dominant fill-rate cost.
  // Pixel ratio capped at 1.5 on ALL devices (was 2 on desktop). At 2x a 1080p
  // canvas runs the bloom at 4K; 1.5 halves that work for negligible visual loss.
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  // ── Camera ────────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight, 0.1, 100
  );
  camera.position.z = 5;

  // ── Scene + fog (depth, "edges dissolve" feel — Phase 4 sfumato shader) ───
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030303, 0.02);

  // ── Lights ────────────────────────────────────────────────────────────────
  const lights = createLights();
  scene.add(lights.ambientLight);
  scene.add(lights.pointLight);

  // ── Particles ─────────────────────────────────────────────────────────────
  // Perf: desktop count lowered 1400 → 800. The field still reads as full at
  // this density, and it cuts the per-frame CPU loop + buffer upload by ~43%.
  const particles = createParticles({ count: isMobile ? 300 : 1500, isMobile });
  scene.add(particles.points);

  // ── Background (painted surface) ─────────────────────────────────────────
  const bg = createBackground({ bgMain: null, grain: null });
  scene.add(bg.mesh);
  loadTexturesAsync().then((tex) => {
    if (tex.bgMain) bg.material.map = tex.bgMain;
    if (tex.grain)  bg.material.normalMap = tex.grain;
    bg.material.needsUpdate = true;
  });

  // ── Cursor light (skipped on touch) ──────────────────────────────────────
  const cursorCanvas = document.getElementById('cursor-canvas');
  let cursor = null;
  if (!isMobile && cursorCanvas) {
    cursor = createCursor({ canvas: cursorCanvas, pointLight: lights.pointLight, camera });
    cursor.attach();
  }

  // ── Post-processing (Phase 4 — lazy-loaded) ──────────────────────────────
  let postfx = null;
  createPostProcessing(renderer, scene, camera).then((pp) => {
    postfx = pp;
    EDEN._postfx = pp;
    // Hide CSS grain + vignette — the GPU shader handles both now.
    document.body.classList.add('gpu-postfx');
  }).catch(() => {
    // Fallback: CSS .chromatic-active class handles the spike (Phase 2 style).
  });

  // ── Event wiring (timeline → scene) ──────────────────────────────────────
  // Exploration begins → cursor light rises 0 → 3.0 over 1.5s (§13).
  window.addEventListener('eden:exploration-start', () => {
    if (cursor) animateLightIntensity(0, 3.0, 1500);

    // GSAP: particle field breathing — slow sinusoidal opacity pulse (8s cycle).
    // Synced with the background's dual sine but at its own rhythm.
    if (gsapReady) {
      gsap.to(breath, {
        particle: 0.15,
        duration: 4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }
  });

  // Revelation → particle surge + background bloom + Phase 4 effects (§13).
  window.addEventListener('eden:revelation', () => {
    particles.surge();
    bg.bloom(0.85);
    if (postfx) {
      postfx.spike(300);
      postfx.bloomSpike(800);
    }

    // GSAP: cursor light living pulse — breathes like a flame after reveal.
    // Starts after the initial ramp completes (~1.5s), subtle ±0.4 oscillation.
    if (gsapReady && window.gsap) {
      gsap.to(breath, {
        light: 0.4,
        duration: 6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1.5,
      });

      // GSAP: scroll-driven camera drift — subtle Z shift as visitor scrolls.
      // Creates depth without breaking the contemplative stillness.
      const scrollTarget = { y: 0 };
      gsap.to(scrollTarget, {
        y: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
          onUpdate: (self) => {
            // Camera drifts from z:5 to z:4.2 over full scroll range.
            camera.position.z = 5 - self.progress * 0.8;
          },
        },
      });
    }
  });

  // ── Resize (debounced 150ms — Gotcha #6) ─────────────────────────────────
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onResize, 150);
  });
  const onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    postfx?.resize(w, h);
    if (cursorCanvas) { cursorCanvas.width = w; cursorCanvas.height = h; }
  };

  // ── Render loop ──────────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  const loop = () => {
    const t = clock.getElapsedTime();
    const cursorWorld = cursor?.getWorldPosition() ?? null;
    particles.update(t, cursorWorld);

    // GSAP breathing: modulate particle opacity by the shared breath state.
    // breath.particle oscillates ±0.15 — applied as a ratio around 1.0.
    particles.points.material.opacity *= (1 + breath.particle);

    // GSAP breathing: modulate cursor light intensity by breath state.
    // breath.light oscillates ±0.4 — applied additively around the tracked value.
    if (_lightTrack.intensity > 0) {
      lights.pointLight.intensity = _lightTrack.intensity + breath.light;
    }

    cursor?.update();
    // Subtle ambient rotation — the field breathes even when still.
    particles.points.rotation.y = Math.sin(t * 0.05) * 0.02;
    particles.points.rotation.x = Math.cos(t * 0.03) * 0.01;
    // Update post-processing grain time.
    postfx?.update(t);
    // Background ambient breathing.
    bg.update(t);
    // Use composer when available, direct render otherwise.
    if (postfx) {
      postfx.composer.render();
    } else {
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
  };
  loop();

  // Expose for debug / Phase 4 wiring.
  EDEN._scene = { renderer, scene, camera, particles, background: bg, lights };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
// Module-level light tracker shared between initScene and animateLightIntensity.
const _lightTrack = { intensity: 0 };

// Animate PointLight intensity with rAF, tracking the value for breath modulation.
function animateLightIntensity(from, to, duration) {
  const start = performance.now();
  const light = window.EDEN?._scene?.lights?.pointLight;
  if (!light) return;
  const step = () => {
    const k = Math.min((performance.now() - start) / duration, 1);
    const v = from + (to - from) * k;
    light.intensity = v;
    _lightTrack.intensity = v;
    if (k < 1) requestAnimationFrame(step);
  };
  step();
}

// Load the procedural textures as THREE textures (Phase 1 assets).
const loadTexturesAsync = () => {
  const loader = new THREE.TextureLoader();
  const load = (url) =>
    new Promise((resolve) => {
      loader.load(url, resolve, undefined, () => resolve(null));
    });
  return Promise.all([load('./assets/textures/bg-main.jpg')]).then((r) => {
    const bgMain = r[0];
    if (bgMain) bgMain.colorSpace = THREE.SRGBColorSpace;
    return { bgMain, grain: null };
  });
};
