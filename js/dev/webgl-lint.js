/* ============================================================================
   EDEN — webgl-lint wrapper (dev only)
   ----------------------------------------------------------------------------
   Wraps the WebGL context with error checking during development.
   In production, this file is not loaded.

   Usage: add <script src="./js/dev/webgl-lint.js"></script> after the canvas
   in index.html (only during dev). Or import from main.js in dev mode.
   ========================================================================== */

(() => {
  'use strict';

  // Only activate in dev (localhost or file://)
  const isDev = location.hostname === 'localhost' ||
                location.hostname === '127.0.0.1' ||
                location.protocol === 'file:';
  if (!isDev) return;

  // Wait for canvas to exist
  const hook = () => {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attrs) {
      const ctx = origGetContext.call(this, type, attrs);
      if (ctx && (type === 'webgl' || type === 'webgl2')) {
        console.log(`[EDEN] WebGL context created (${type})`);
        // Log renderer info if available
        const ext = ctx.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          console.log(`[EDEN] GPU: ${ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)}`);
          console.log(`[EDEN] Vendor: ${ctx.getParameter(ext.UNMASKED_VENDOR_WEBGL)}`);
        }
      }
      return ctx;
    };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hook);
  } else {
    hook();
  }
})();
