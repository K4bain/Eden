/* ============================================================================
   EDEN — background.js  (Phase 3)
   ----------------------------------------------------------------------------
   The painted surface behind the particles — Option A from §8 (build the
   simpler plane first; organic forms are a later phase). The cursor's
   PointLight reveals it: you literally see the painting emerge from darkness
   as the cursor moves (§4 AWAKENING, §4 PRESENCE).

   A large plane at z:-2, MeshStandardMaterial with bg-main as map and grain
   as a normal map for craquelure micro-texture (§8 "Surface Texture").
   Starts at opacity 0 — blooms to 0.7 at revelation (§13).

   The procedural textures from Phase 1 (assets/textures/*.png) work here;
   when real ImageFX WebPs land, swap the urls in style.css AND here.
   ========================================================================== */

import * as THREE from 'three';

export function createBackground(textures) {
  // PlaneGeometry sized to fill the camera view at z:-2 (fov 60, dist 7).
  const geo = new THREE.PlaneGeometry(16, 9);
  const mat = new THREE.MeshStandardMaterial({
    map: textures.bgMain ?? null,
    normalMap: textures.grain ?? null,
    normalScale: new THREE.Vector2(0.3, 0.3),
    color: 0x010101,
    transparent: true,
    opacity: 0.0,                  // blooms 0 → 0.7 at revelation
    roughness: 1.0,
    metalness: 0.0
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = -2;

  // Revelation: background blooms fully (§13). GSAP would be ideal but we
  // keep Three.js free of the GSAP global — a short rAF tween instead.
  const bloom = (targetOpacity = 0.8) => {
    const from = mat.opacity;
    const start = performance.now();
    const step = () => {
      const k = Math.min((performance.now() - start) / 2000, 1);
      // easeOutCubic for a "sun breaking from behind a cloud" feel (§13).
      const e = 1 - (1 - k) ** 3;
      mat.opacity = from + (targetOpacity - from) * e;
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  };

  return { mesh, material: mat, bloom, update: (t) => {
    // Ambient breathing — subtle opacity + scale pulse so the background
    // feels alive, not a static image. Two sine waves at different speeds.
    const breathe = Math.sin(t * 0.3) * 0.015 + Math.sin(t * 0.7) * 0.008;
    mat.opacity = Math.max(0, mat.opacity + breathe * (mat.opacity > 0.01 ? 1 : 0));
    const s = 1 + Math.sin(t * 0.2) * 0.005;
    mesh.scale.set(s, s, 1);
  }};
}
