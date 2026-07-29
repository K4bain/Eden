/* ============================================================================
   EDEN — perf-probe.js  (DEV ONLY — do not ship)
   ----------------------------------------------------------------------------
   Measures real frame times on the running page and writes results to a
   visible DOM overlay (#eden-perf) so they can be read via the browser
   automation snapshot (the IAB blocks evaluate(), so we need a DOM readout).
   Auto-removes itself after one measurement.
   ========================================================================== */
(() => {
  'use strict';
  const isDev = location.hostname === 'localhost' ||
                location.hostname === '127.0.0.1';
  if (!isDev) return;

  // Wait for the scene to boot.
  const tryStart = () => {
    if (!(window.EDEN && window.EDEN._scene)) {
      return setTimeout(tryStart, 200);
    }
    setTimeout(measure, 1500); // let it settle
  };

  const measure = () => {
    const frames = [];
    let last = performance.now();
    let count = 0;
    const SAMPLES = 90;

    const overlay = document.createElement('div');
    overlay.id = 'eden-perf';
    overlay.style.cssText =
      'position:fixed;top:8px;left:8px;z-index:9999;background:rgba(0,0,0,0.85);' +
      'color:#0f0;font:11px/1.4 monospace;padding:8px 10px;border-radius:4px;' +
      'pointer-events:none;white-space:pre;max-width:360px;';
    overlay.textContent = 'measuring…';
    document.body.appendChild(overlay);

    const tick = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      if (count > 3) frames.push(dt);   // skip warmup
      count++;
      if (count < SAMPLES) return requestAnimationFrame(tick);

      frames.sort((a, b) => a - b);
      const avg = frames.reduce((s, v) => s + v, 0) / frames.length;
      const median = frames[Math.floor(frames.length / 2)];
      const p95 = frames[Math.floor(frames.length * 0.95)];
      const max = frames[frames.length - 1];

      const s = window.EDEN?._scene;
      const pc = window.EDEN?._paperCut;
      const reliefMesh = pc?.group?.children?.find(c => c.geometry && c.geometry.attributes.position);
      const out = {
        avgFrame_ms: Math.round(avg * 100) / 100,
        medianFrame_ms: Math.round(median * 100) / 100,
        p95Frame_ms: Math.round(p95 * 100) / 100,
        maxFrame_ms: Math.round(max * 100) / 100,
        avgFPS: Math.round(1000 / avg),
        pixelRatio: s?.renderer?.getPixelRatio?.() ?? null,
        particleCount: s?.particles?.points?.geometry?.attributes?.position?.count ?? null,
        reliefVerts: reliefMesh?.geometry?.attributes?.position?.count ?? null,
        reliefSegments:
          reliefMesh?.geometry?.attributes?.position?.count
            ? Math.round(reliefMesh.geometry.attributes.position.count / 6) + 'x' +
              Math.round(reliefMesh.geometry.attributes.position.count / 6)
            : null,
        drawCalls: s?.renderer?.info?.render?.calls ?? null,
        triangles: s?.renderer?.info?.render?.triangles ?? null,
        viewport: window.innerWidth + 'x' + window.innerHeight,
        dpr: window.devicePixelRatio,
        hasPostfx: !!window.EDEN?._postfx,
        smootherActive: !!window._edenSmoother,
      };
      overlay.textContent = JSON.stringify(out, null, 1)
        .replace(/[{}"]/g, '').replace(/,\n/g, '\n').replace(/^\n/, '');
      window.__EDEN_PERF__ = out;
    };
    requestAnimationFrame(tick);
  };

  tryStart();
})();
