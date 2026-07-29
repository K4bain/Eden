/* ============================================================================
   EDEN — loader.js  (Phase 2)
   ----------------------------------------------------------------------------
   Loads everything Eden needs before the timeline begins. The loading screen
   is now a self-contained breathing orb (no progress bar) — this module just
   waits for the real prerequisites and resolves. A single "settle" beat can
   be signalled via the optional onProgress so the orb can ease out, but the
   orb breathes on its own regardless.

   Phase 2 loads:
     - document.fonts.ready          (Cormorant Garamond must be present before
                                      any text animation — Gotcha #2)
     - a minimum 1.0s hold           (instant feels broken; Section 15)

   Exposed on window.EDEN as a classic script (no ES modules yet) so the
   desktop file:// shortcut keeps working.
   ========================================================================== */

(function () {
  'use strict';

  const minDelay = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Wrap document.fonts.ready defensively — some environments lack it.
  const fontsReady = () =>
    document.fonts?.ready ?? Promise.resolve();

  // Resolve the Phase 2 textures as already-loaded <img> elements. They're
  // referenced by CSS, so the browser has likely fetched them already; this
  // just guarantees decode is done before the curtain lifts. Errors resolve
  // so a missing texture never blocks the reveal.
  const preloadCssImages = (urls) =>
    Promise.all(urls.map((url) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => resolve(img);
        img.src = url;
      })
    ));

  /**
   * Load Eden's pre-timeline assets.
   * @param {function(number, number)} [onProgress]  (loaded, total) — optional,
   *        kept for compatibility; the orb no longer needs a fill bar.
   * @returns {Promise<{textures: Object}>}  reserved shape for Phase 3
   */
  const loadEden = (onProgress) => {
    const total = 3;
    const loaded = { n: 0 };
    const tick = () => onProgress?.(loaded.n, total);

    return Promise.all([
      fontsReady().then(() => { loaded.n++; tick(); }),
      preloadCssImages(
        ['./assets/textures/bg-main.jpg',
         './assets/textures/bg-atmosphere.jpg']
      ).then(() => { loaded.n++; tick(); }),
      minDelay(1000).then(() => { loaded.n++; tick(); })
    ]).then(() => {
      loaded.n = total;
      tick();
      return { textures: null };
    });
  };

  window.EDEN = window.EDEN || {};
  window.EDEN.loadEden = loadEden;
})();
