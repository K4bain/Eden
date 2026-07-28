---
name: threejs-webgl
description: Comprehensive skill for Three.js 3D web development. Use when building interactive 3D scenes, WebGL/WebGPU applications, product configurators, 3D visualizations, or immersive web experiences.
license: MIT
---

# Three.js WebGL/WebGPU Development

## Scene Graph Architecture

Three.js uses a hierarchical scene graph where all 3D objects are organized in a tree structure.

## Core Objects

### Scene

```javascript
import * as THREE from "three";
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);
```

### Camera

```javascript
// Perspective (most common for 3D)
const camera = new THREE.PerspectiveCamera(
  75,                                    // FOV
  window.innerWidth / window.innerHeight, // Aspect
  0.1,                                   // Near
  1000                                   // Far
);
camera.position.set(0, 0, 5);

// Orthographic (for 2D-like views)
const camera = new THREE.OrthographicCamera(
  -width/2, width/2, height/2, -height/2, 0.1, 1000
);
```

### Renderer

```javascript
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
```

## Geometry

```javascript
// Built-in geometries
const box = new THREE.BoxGeometry(1, 1, 1);
const sphere = new THREE.SphereGeometry(0.5, 32, 32);
const plane = new THREE.PlaneGeometry(10, 10);
const torus = new THREE.TorusGeometry(0.5, 0.2, 16, 100);

// Custom geometry
const geometry = new THREE.BufferGeometry();
const vertices = new Float32Array([...]);
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
```

## Materials

```javascript
// Standard (PBR)
const material = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  metalness: 0.5,
  roughness: 0.5,
  map: texture,
  normalMap: normalTexture,
  emissive: 0x000000,
  emissiveIntensity: 0,
});

// Physical (more features)
const material = new THREE.MeshPhysicalMaterial({
  color: 0xff0000,
  metalness: 0.5,
  roughness: 0.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  transmission: 0.9, // glass
  thickness: 0.5,
});

// Basic (no lighting)
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

// Shader (custom GLSL)
const material = new THREE.ShaderMaterial({ ... });
```

## Lighting

```javascript
// Ambient
const ambient = new THREE.AmbientLight(0xffffff, 0.5);

// Directional (sun-like)
const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(5, 10, 5);
directional.castShadow = true;

// Point (light bulb)
const point = new THREE.PointLight(0xff0000, 1, 100);
point.position.set(0, 2, 0);

// Spot
const spot = new THREE.SpotLight(0xffffff, 1);
spot.position.set(0, 10, 0);
spot.angle = Math.PI / 6;
spot.penumbra = 0.3;

// Hemisphere
const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x362412, 0.5);
```

## Textures

```javascript
const textureLoader = new THREE.TextureLoader();

// Regular texture
const texture = textureLoader.load('path/to/image.jpg');
texture.colorSpace = THREE.SRGBColorSpace;

// HDRI environment
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
const rgbeLoader = new RGBELoader();
rgbeLoader.load('path/to/env.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
});

// Load GLTF models
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const gltfLoader = new GLTFLoader();
gltfLoader.load('model.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

## Animation Loop

```javascript
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  const delta = clock.getDelta();

  // Update objects
  mesh.rotation.y += delta * 0.5;
  mesh.position.y = Math.sin(elapsed) * 0.5;

  // Update uniforms
  material.uniforms.time.value = elapsed;

  renderer.render(scene, camera);
}
animate();
```

## Resize Handling

```javascript
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update post-processing
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);
```

## Performance Best Practices

1. **Pixel ratio**: Cap at 2 (`Math.min(devicePixelRatio, 2)`)
2. **Geometry**: Use `BufferGeometry`, reuse geometries
3. **Materials**: Reuse materials across meshes
4. **Textures**: Use power-of-2 sizes, generate mipmaps
5. **Shadows**: Use `shadow.mapSize` wisely (1024 default, 2048 max)
6. **Frustum culling**: Enabled by default, don't disable unless needed
7. **Draw calls**: Merge static geometry, use InstancedMesh
8. **Post-processing**: Each pass costs performance; limit passes
9. **Dispose**: Call `.dispose()` on geometries, materials, textures when done

## Debugging

```javascript
// Stats
import Stats from 'three/addons/libs/stats.module.js';
const stats = new Stats();
document.body.appendChild(stats.dom);

// Wireframe
material.wireframe = true;

// Axes helper
const axes = new THREE.AxesHelper(5);
scene.add(axes);

// Grid helper
const grid = new THREE.GridHelper(10, 10);
scene.add(grid);

// Bounding box
const box = new THREE.BoxHelper(mesh, 0xff0000);
scene.add(box);
```
