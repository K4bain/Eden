/* ============================================================================
   EDEN — scene.js  (Phase 3/4 orchestrator)
   ----------------------------------------------------------------------------
   Boots the Three.js scene and the render loop. Wires the timeline's events
   to the scene's behavior:

     'eden:exploration-start' → PointLight intensity 0 → 0.8 (cursor becomes
                                the light — §4 PRESENCE)
     'eden:revelation'        → paper-cut reveal + particle surge (§13)

   Also owns the resize handler (debounced 150ms — Gotcha #6) and the mobile
   skips (no cursor canvas / PointLight follow on touch).

   Phase 4: post-processing pipeline (EffectComposer) loads asynchronously.
   If unavailable, falls back to Phase 2 CSS chromatic aberration.
   ========================================================================== */

import * as THREE from 'three';
import { createPaperCut } from './paperCut.js';
import { createParticles } from './particles.js';
import { createLights } from './lights.js';
import { createCursor } from '../eden/cursor.js';

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
  renderer.setClearColor(0x000000, 0);  // transparent — paper-cut bg shows through
  renderer.toneMapping = THREE.NoToneMapping;

  // ── Camera ────────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight, 0.1, 100
  );
  camera.position.z = 5;

  // ── Scene (no fog — would darken the paper-cut background) ────────────────
  const scene = new THREE.Scene();
  scene.background = null;

  // ── Lights ────────────────────────────────────────────────────────────────
  const lights = createLights();
  scene.add(lights.ambientLight);
  scene.add(lights.pointLight);

  // ── Paper-cut relief background ──────────────────────────────────────────
  // Load the white paper-cut texture and create the relief scene.
  const textureLoader = new THREE.TextureLoader();
  let paperCut = null;

  const initPaperCut = (texture) => {
    paperCut = createPaperCut({ reliefTexture: texture, isMobile });
    scene.add(paperCut.group);
    paperCut.resize(window.innerWidth, window.innerHeight);
    return paperCut;
  };

  // Try to load the paper-cut texture.
  textureLoader.load(
    './assets/textures/paper-cut-relief.jpg',
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      initPaperCut(texture);
      // Expose for debug.
      EDEN._paperCut = paperCut;
    },
    undefined,
    (err) => {
      console.warn('[EDEN] paper-cut texture not found, using procedural fallback');
      // Create a procedural white texture as fallback.
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#f0ece4';
      ctx.fillRect(0, 0, 256, 256);
      // Add subtle texture.
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const a = Math.random() * 0.05;
        ctx.fillStyle = `rgba(0,0,0,${a})`;
        ctx.fillRect(x, y, 1, 1);
      }
      const fallbackTex = new THREE.CanvasTexture(c);
      initPaperCut(fallbackTex);
      EDEN._paperCut = paperCut;
    }
  );

  // ── Particles (floating confetti over the relief) ─────────────────────────
  const particles = createParticles({ count: isMobile ? 250 : 1200, isMobile });
  scene.add(particles.points);

  // ── Cursor light (skipped on touch) ──────────────────────────────────────
  const cursorCanvas = document.getElementById('cursor-canvas');
  let cursor = null;
  if (!isMobile && cursorCanvas) {
    cursor = createCursor({ canvas: cursorCanvas, pointLight: lights.pointLight, camera });
    cursor.attach();
  }

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

  // Revelation → paper-cut reveal + particle surge (§13).
  window.addEventListener('eden:revelation', () => {
    // Reveal the paper-cut relief with a 2.5s animation.
    if (paperCut) {
      paperCut.reveal(2500);
    }

    particles.surge();

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
    if (paperCut) paperCut.resize(w, h);
    if (cursorCanvas) { cursorCanvas.width = w; cursorCanvas.height = h; }
  };

  // ── Render loop ──────────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  const loop = () => {
    const t = clock.getElapsedTime();
    const cursorWorld = cursor?.getWorldPosition() ?? null;

    // Update paper-cut relief.
    if (paperCut) paperCut.update(t);

    // Update particles.
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

    // Direct render — transparent canvas, paper-cut bg shows through.
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  loop();

  // Expose for debug.
  EDEN._scene = { renderer, scene, camera, particles, lights };
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
