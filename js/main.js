/* ============================================================================
   EDEN — main.js  (Phase 2/3 orchestrator — ES module)
   ----------------------------------------------------------------------------
   The conductor. Sequence:

     detect capabilities
        │
        ├─ reduced-motion? → skip everything; reveal shell, unlock, done.
        ├─ no WebGL?       → load fallback.css; run Phase 2 text arc only
        │
     load assets (loader.js: fonts.ready + textures + 1.2s min)
        │
     init Phase 3 scene (Three.js — particles, lights, background, cursor)
        │
     start timeline (timeline.js: GSAP master timeline)
        │
     (fallback) if GSAP unavailable → graceful static reveal so the visitor is
      never stuck on a black screen.

   Registers ScrollTrigger with GSAP. CRITICAL: a hard safety timeout removes
   the loading screen no matter what — the visitor is NEVER stuck.
   ========================================================================== */

import { initScene } from './three/scene.js';

(() => {
  'use strict';

  // §20 Session 4: reset scroll position before anything runs.
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ── Capability detection (Section 16) ─────────────────────────────────── */
  const mqMobile   = window.matchMedia('(max-width: 767px)');
  const mqReduced  = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isMobile   = mqMobile.matches;
  const isReducedMotion = mqReduced.matches;
  const hasWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch { return false; }
  })();

  window.__EDEN__ = { isMobile, isReducedMotion, hasWebGL, phase: 3 };

  // No-WebGL fallback atmosphere (Section 16). Phase 2 text arc still runs.
  if (!hasWebGL) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './fallback/fallback.css';
    document.head.appendChild(link);
  }

  /* ── Element refs ──────────────────────────────────────────────────────── */
  // The loading fill bar was removed in favor of the breathing orb. The orb
  // animates itself via CSS; main.js only needs to remove the screen.

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  const removeLoadingScreen = () => {
    const s = document.getElementById('loading-screen');
    s?.parentNode?.removeChild(s);
  };

  // HARD SAFETY: no matter what fails, the loading screen is gone after 6s.
  // The visitor is never stuck on a black screen. Idempotent.
  let safetyArmed = false;
  const armSafetyTimeout = () => {
    if (safetyArmed) return;
    safetyArmed = true;
    setTimeout(() => {
      const s = document.getElementById('loading-screen');
      if (!s) return;                       // already removed normally
      console.warn('[EDEN] safety timeout — forcing reveal');
      forceStaticReveal();
    }, 6000);
  };

  const hasGSAP = () =>
    !!(window.gsap && typeof window.gsap.timeline === 'function');

  // Make the resolved shell visible without GSAP. Used by every fallback path.
  const forceStaticReveal = () => {
    removeLoadingScreen();
    const name = document.querySelector('.eden-name');
    const hint = document.getElementById('scroll-hint');
    if (name) name.style.opacity = '1';
    if (hint) hint.style.transform = 'translateX(-50%) scaleY(1)';
    document.body.style.overflow = '';
  };

  // Graceful fallback if GSAP/Splitting CDN didn't load (file:// blocks them,
  // or the visitor is offline). Tell the story without choreographed motion.
  const staticFallback = () => {
    console.warn('[EDEN] GSAP unavailable — showing static reveal.');
    forceStaticReveal();
  };

  // Reduced-motion path: skip all ceremony, show the resolved shell.
  const reducedMotionPath = () => {
    const name = document.querySelector('.eden-name');
    if (name) name.style.opacity = '1';
    document.body.style.overflow = '';
    removeLoadingScreen();
  };

  /* ── Reduced motion short-circuit ──────────────────────────────────────── */
  if (isReducedMotion) {
    reducedMotionPath();
    return;
  }

  /* ── Normal path ───────────────────────────────────────────────────────── */
  // Arm the safety net before anything async — guarantees we never hang.
  armSafetyTimeout();

  const start = () => {
    const EDEN = window.EDEN ?? {};

    // Loader missing → degrade immediately.
    if (!EDEN.loadEden) { staticFallback(); return; }

    EDEN.loadEden().then(() => {

      // Register ScrollTrigger plugin if present.
      if (hasGSAP() && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
      }

      // PHASE 3: boot the Three.js scene + cursor light now (it listens for
      // the timeline's events). Skipped on no-WebGL — handled at top.
      if (hasWebGL) {
        try { initScene(); }
        catch (e) { console.error('[EDEN] scene init failed:', e); }
      }

      // Start the timeline if GSAP is present; otherwise static reveal.
      if (hasGSAP() && typeof EDEN.startTimeline === 'function') {
        EDEN.startTimeline();
      } else {
        staticFallback();
      }
    }).catch((err) => {
      console.error('[EDEN] load failed:', err);
      staticFallback();
    });
  };

  if (document.readyState === 'complete' ||
      document.readyState === 'interactive') {
    setTimeout(start, 0);
  } else {
    window.addEventListener('DOMContentLoaded', start);
  }
})();
