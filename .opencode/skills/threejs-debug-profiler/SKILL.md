---
name: threejs-debug-profiler
description: "Debug and profile Three.js browser games. Combines scene debugging, render/runtime/loading/animation/resize/mobile input fixes, performance profiling, draw calls, triangles, textures, memory, shader/post-processing cost, bundle size, and mobile DPR/input issues."
---

# Three.js Debug Profiler

## Purpose

Find root causes and optimize measured bottlenecks without breaking playability.

## Debug Workflow

1. Reproduce locally.
2. Read console/page/network errors.
3. Check canvas display size and drawing-buffer size.
4. Check renderer/context/loop ownership.
5. Check camera, aspect, near/far, lights, materials, fog, scene contents, transforms.
6. Check asset paths/loaders/CORS/base path.
7. Check animation delta units, physics/update order, fixed timestep, collider/body ownership, input listeners, pointer/touch behavior, resize, and audio context unlock/decode errors when audio is involved.
8. Fix root cause in owning module.
9. Verify browser screenshot, nonblank canvas, console/page errors, and broken path.

## Performance Workflow

1. Reproduce in correct build mode.
2. Record baseline: FPS/frame time, draw calls, triangles, geometries, textures, memory, bundle.
3. Identify CPU/GPU/memory/network bottleneck.
4. Optimize one thing at a time: instancing, shared resources, culling, LOD, DPR cap, cheaper shadows/post, texture discipline.
5. Re-measure same scenario and verify visuals/playability.

## Common Three.js Performance Issues

### Draw Calls
- Each mesh = 1 draw call minimum. InstancedMesh shares one call for many copies.
- Use `renderer.info` to read draw call count: `renderer.info.render.calls`
- Target: < 100 draw calls for smooth 60fps on mid-range GPUs.

### Triangles
- Check with `renderer.info.render.triangles`
- High-poly models crush fill rate. Use LOD (Level of Detail) groups.
- Target: < 500K triangles for WebGL2 on mid-range devices.

### Textures
- Each texture = GPU memory + upload time. Use power-of-2 sizes for mipmaps.
- Compress with KTX2/Basis. Use `texture.minFilter = THREE.LinearMipmapLinearFilter`.
- Check with `renderer.info.memory.textures`

### geometries
- Check with `renderer.info.memory.geometries`
- Dispose unused: `geometry.dispose()`, `material.dispose()`, `texture.dispose()`

### Shader/Post-Processing Cost
- Each ShaderPass = full-screen quad render. Keep passes minimal.
- Bloom is expensive. Use threshold to limit which pixels glow.
- FilmPass adds noise overlay — cheap, but check on mobile.

### Mobile DPR
- Cap pixel ratio: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
- Mobile GPUs fill rate is 3-5x slower than desktop.

### Memory Leaks
- Check JS heap in Chrome DevTools Memory tab.
- Look for: undisposed geometries, materials, textures, event listeners.
- Use `renderer.dispose()` on teardown.

## Final Response

Lead with root cause or bottleneck. Report the checklist items used, files changed, baseline/post metrics, commands, screenshots/artifacts, broken paths retested, and residual risks.
