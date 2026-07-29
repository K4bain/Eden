/* ============================================================================
   EDEN — perf-probe.js  (DEV ONLY — do not ship)
   ----------------------------------------------------------------------------
   Writes live scene stats + frame timing to a #eden-perf overlay so they can
   be read via browser automation snapshot (IAB blocks evaluate()). Polls on
   a 250ms interval (not rAF) so it can't be starved by the render loop.
   ========================================================================== */
(() => {
  'use strict';
  if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;

  const overlay = document.createElement('div');
  overlay.id = 'eden-perf';
  overlay.style.cssText =
    'position:fixed;top:8px;left:8px;z-index:9999;background:rgba(0,0,0,0.85);' +
    'color:#0f0;font:11px/1.4 monospace;padding:8px 10px;border-radius:4px;' +
    'pointer-events:none;white-space:pre;max-width:380px;';
  overlay.textContent = 'probe: waiting for scene…';
  document.body.appendChild(overlay);

  // Frame-time sampler: track rAF dt over a rolling window.
  let last = performance.now();
  let acc = 0, n = 0, mx = 0;
  function frame() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (dt < 500) { acc += dt; n++; if (dt > mx) mx = dt; } // skip tab-hidden gaps
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const fmt = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

  setInterval(() => {
    const s = window.EDEN?._scene;
    const pc = window.EDEN?._paperCut;
    if (!s) { overlay.textContent = 'probe: waiting for scene…'; return; }

    // Reset the rolling window each read so each snapshot is ~recent.
    const avgFrame = n > 0 ? acc / n : 0;
    const fps = avgFrame > 0 ? 1000 / avgFrame : 0;

    // Reset window after read for the next interval.
    const outAvg = avgFrame, outMax = mx, outN = n;
    acc = 0; n = 0; mx = 0;

    const ri = s.renderer?.info?.render;
    const reliefMesh = pc?.group?.children?.find(c => c.geometry && c.geometry.attributes.position);

    overlay.textContent = [
      'avg frame: ' + fmt(outAvg) + 'ms  (' + Math.round(fps) + ' fps)',
      'max frame: ' + fmt(outMax) + 'ms   (samples: ' + outN + ')',
      'pixelRatio: ' + (s.renderer?.getPixelRatio?.() ?? '?'),
      'dpr: ' + window.devicePixelRatio + '  vp: ' + window.innerWidth + 'x' + window.innerHeight,
      'particles: ' + (s.particles?.points?.geometry?.attributes?.position?.count ?? '?'),
      'relief verts: ' + (reliefMesh?.geometry?.attributes?.position?.count ?? 'none'),
      'draw calls: ' + (ri?.calls ?? '?') + '   triangles: ' + (ri?.triangles ?? '?'),
      'postfx: ' + (window.EDEN?._postfx ? 'on' : 'off'),
      'smoother: ' + (window._edenSmoother ? 'on' : 'off'),
    ].join('\n');
    window.__EDEN_PERF__ = { avgFrame: fmt(outAvg), maxFrame: fmt(outMax), fps: Math.round(fps) };
  }, 750);
})();
