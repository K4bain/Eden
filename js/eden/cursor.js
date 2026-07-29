/* ============================================================================
   EDEN — cursor.js  (Phase 3)
   ----------------------------------------------------------------------------
   The custom cursor light. Two jobs on mousemove (§17):
     1. Draw a warm amber light on the 2D #cursor-canvas (lerped follow so it
        feels like light, not a pointer).
     2. Move the THREE.PointLight to the cursor's world position so the 3D
        scene is illuminated where the visitor looks.

   Exposes createCursor({ canvas, pointLight, camera }) returning
   { setLightIntensity, getWorldPosition, attach, update }.

   Mobile / touch: do not call attach() — there is no real cursor. The system
   cursor is hidden via CSS (html { cursor: none }) on hover-capable devices.
   ========================================================================== */

import * as THREE from 'three';

export function createCursor(opts) {
  const { canvas, pointLight, camera } = opts;
  const ctx = canvas.getContext('2d');

  // Two smoothing targets — the 2D draw uses screen space, the light uses NDC.
  const mouse  = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const target = { x: mouse.x, y: mouse.y };

  // Trail afterglow — a short ring buffer of recent positions. Kept short
  // (was 12) because each trail node is a gradient fill per frame; 6 is
  // visually identical and halves the draw cost.
  const TRAIL_LEN = 6;
  const trail = [];
  for (let i = 0; i < TRAIL_LEN; i++) trail.push({ x: mouse.x, y: mouse.y });

  // Reusable raycaster + plane to convert NDC → world at a fixed depth.
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // z = 0 plane
  const worldPos = new THREE.Vector3();
  const ndc = new THREE.Vector2();

  const onMove = (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
  };
  const onResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Clear the last-draw tracker on resize so we don't leave stale pixels.
    lastDrawX = null; lastDrawY = null;
  };

  // Cached gradients — created once at (0,0), repositioned via translate each frame.
  let outerGrad = null;
  let innerGrad = null;
  let midGrad = null;

  // Localized clear: track the bounding box of the last frame's draw so we
  // can clear only that region instead of the full viewport. The largest
  // drawable element is the outer glow (90px radius) + trail, so clear a
  // generous box. Saves ~990×720px of clearRect work every frame.
  const GLOW_R = 90;
  const TRAIL_SPREAD = 80;          // max distance a trail node can be behind
  const CLEAR_BOX = GLOW_R + TRAIL_SPREAD + 10;
  let lastDrawX = null, lastDrawY = null;

  const rebuildGradients = () => {
    outerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, GLOW_R);
    outerGrad.addColorStop(0, 'rgba(196, 148, 58, 0.08)');
    outerGrad.addColorStop(0.5, 'rgba(139, 94, 60, 0.03)');
    outerGrad.addColorStop(1, 'rgba(196, 148, 58, 0)');
    midGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    midGrad.addColorStop(0,   'rgba(212, 165, 90, 0.25)');
    midGrad.addColorStop(0.6, 'rgba(196, 148, 58, 0.08)');
    midGrad.addColorStop(1,   'rgba(196, 148, 58, 0)');
    innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
    innerGrad.addColorStop(0,   'rgba(232, 195, 130, 0.9)');
    innerGrad.addColorStop(0.4, 'rgba(212, 165, 90, 0.4)');
    innerGrad.addColorStop(1,   'rgba(196, 148, 58, 0)');
  };

  const attach = () => {
    window.addEventListener('mousemove', onMove, { passive: true });
    onResize();
    rebuildGradients();
    window.addEventListener('resize', () => { onResize(); rebuildGradients(); });
  };

  // Convert current lerped mouse to a world position on the z=0 plane.
  const getWorldPosition = () => {
    ndc.x =  (mouse.x / window.innerWidth)  * 2 - 1;
    ndc.y = -(mouse.y / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(plane, worldPos);
    return worldPos;
  };

  const setLightIntensity = (v) => {
    if (pointLight) pointLight.intensity = v;
  };

  // Called every frame from the scene render loop.
  const update = () => {
    // Lerp — cursor lags slightly, feels like light drifting (§17).
    mouse.x += (target.x - mouse.x) * 0.12;
    mouse.y += (target.y - mouse.y) * 0.12;

    if (!outerGrad || !innerGrad || !midGrad) return;

    // Shift trail positions — newest at index 0.
    trail.unshift({ x: mouse.x, y: mouse.y });
    if (trail.length > TRAIL_LEN) trail.pop();

    // Localized clear: wipe the union of last + current draw regions. Much
    // cheaper than clearing the whole viewport when the cursor is small.
    if (lastDrawX !== null) {
      ctx.clearRect(lastDrawX - CLEAR_BOX, lastDrawY - CLEAR_BOX,
                    CLEAR_BOX * 2, CLEAR_BOX * 2);
    }
    ctx.clearRect(mouse.x - CLEAR_BOX, mouse.y - CLEAR_BOX,
                  CLEAR_BOX * 2, CLEAR_BOX * 2);

    // Draw trail afterglow — fading copies behind the cursor.
    for (let i = TRAIL_LEN - 1; i >= 1; i--) {
      const t = trail[i];
      const alpha = (1 - i / TRAIL_LEN) * 0.12;
      const radius = 6 + (i / TRAIL_LEN) * 10;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(t.x, t.y);
      ctx.fillStyle = outerGrad;
      ctx.fillRect(-radius * 2, -radius * 2, radius * 4, radius * 4);
      ctx.restore();
    }

    // Reposition cached gradients via translate — no new objects created.
    ctx.save();
    ctx.translate(mouse.x, mouse.y);

    // Outer glow — large, very soft.
    ctx.fillStyle = outerGrad;
    ctx.fillRect(-GLOW_R, -GLOW_R, GLOW_R * 2, GLOW_R * 2);

    // Mid glow — warm transition layer.
    ctx.fillStyle = midGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

    // Inner point — small, warm.
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    lastDrawX = mouse.x;
    lastDrawY = mouse.y;

    // Move the 3D PointLight to match (screen → world).
    const wp = getWorldPosition();
    if (pointLight && wp) {
      pointLight.position.set(wp.x, wp.y, 2);
    }
  };

  return { attach, update, setLightIntensity, getWorldPosition };
}
