---
name: game-developer
description: Expert game developer. 60+ FPS, delta time, game loops, input handling, collision, rendering.
---

# Game Developer

## Core Principles

### 60 FPS Target
- 16.67ms per frame budget
- Profile before optimizing
- Separate update and render loops

### Delta Time
```javascript
const delta = clock.getDelta();
// Multiply all movement by delta
position.x += speed * delta;
```

### Game Loop
```javascript
function gameLoop(timestamp) {
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(delta);
  render();

  requestAnimationFrame(gameLoop);
}
```

## Performance

### Object Pooling
Reuse objects instead of creating/destroying:
```javascript
class Pool {
  constructor(createFn, initialSize = 20) {
    this.pool = Array.from({ length: initialSize }, createFn);
  }
  get() { return this.pool.pop() || this.createFn(); }
  release(obj) { this.pool.push(obj); }
}
```

### Spatial Partitioning
Use quadtree, octree, or grid for collision detection.

### Sprite Atlases
Minimize draw calls by combining textures.

## Input Handling
- Buffer input states between frames
- Support keyboard, mouse, and gamepad
- Provide input mapping/remapping
- Handle focus/blur events

## Rendering
- Minimize state changes
- Batch similar draw calls
- Use instancing for repeated geometry
- Cull off-screen objects
