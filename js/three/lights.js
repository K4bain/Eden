/* ============================================================================
   EDEN — lights.js  (Phase 3)
   ----------------------------------------------------------------------------
   The lighting setup. Two lights, both deliberate (§8):

     1. AmbientLight — Pascal's Void made literal. Almost nothing. #0d1a12 at
        intensity 0.1. The scene would disappear without the cursor — because
        it would (§3 "Pascal's Void": "the scene must feel like it would
        disappear without the cursor. Because it would.")

     2. PointLight at the cursor — warm gold-amber #C4943A. The visitor IS the
        light source (§3 "The Gaze", §4 PRESENCE). Intensity starts at 0 and
        rises during the exploration window.

   Exposes { ambientLight, pointLight }.
   ========================================================================== */

import * as THREE from 'three';

export function createLights() {
  const ambient = new THREE.AmbientLight(0x050505, 0.05);

  // Cursor light. distance/decay tuned so it illuminates a local pool, not
  // the whole scene — the painting reveals only where the visitor looks.
  const point = new THREE.PointLight(0xC4943A, 0, 12, 1.0);
  point.position.set(0, 0, 2);

  return { ambientLight: ambient, pointLight: point };
}
