---
name: threejs-postprocessing
description: Three.js post-processing - EffectComposer, bloom, DOF, screen effects. Use when adding visual effects, color grading, blur, glow, or creating custom screen-space shaders.
license: MIT
---

# Three.js Post-Processing

## Quick Start

```javascript
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, 0.4, 0.85
));

function animate() {
  requestAnimationFrame(animate);
  composer.render(); // NOT renderer.render()
}
```

## EffectComposer Setup

```javascript
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(effectPass);

// Handle resize
function onResize() {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width, height);
}
```

## Common Effects

### Bloom (Glow)

```javascript
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, // strength
  0.4, // radius
  0.85 // threshold
);
bloomPass.strength = 2.0;
bloomPass.threshold = 0.5;
bloomPass.radius = 0.8;
```

### FXAA (Anti-Aliasing)

```javascript
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms["resolution"].value.set(
  1 / window.innerWidth, 1 / window.innerHeight
);
```

### SMAA (Better Anti-Aliasing)

```javascript
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
const smaaPass = new SMAAPass(
  window.innerWidth * renderer.getPixelRatio(),
  window.innerHeight * renderer.getPixelRatio()
);
```

### SSAO (Ambient Occlusion)

```javascript
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
ssaoPass.kernelRadius = 16;
ssaoPass.minDistance = 0.005;
ssaoPass.maxDistance = 0.1;
```

### Depth of Field (DOF)

```javascript
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
const bokehPass = new BokehPass(scene, camera, {
  focus: 10.0,
  aperture: 0.025,
  maxblur: 0.01,
});
```

### Film Grain

```javascript
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";
const filmPass = new FilmPass(0.35, 0.5, 648, false);
```

### Vignette

```javascript
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { VignetteShader } from "three/addons/shaders/VignetteShader.js";
const vignettePass = new ShaderPass(VignetteShader);
vignettePass.uniforms["offset"].value = 1.0;
vignettePass.uniforms["darkness"].value = 1.0;
```

### Color Correction

```javascript
import { ColorCorrectionShader } from "three/addons/shaders/ColorCorrectionShader.js";
const colorPass = new ShaderPass(ColorCorrectionShader);
colorPass.uniforms["powRGB"].value = new THREE.Vector3(1.2, 1.2, 1.2);
colorPass.uniforms["mulRGB"].value = new THREE.Vector3(1.0, 1.0, 1.0);
```

### Gamma Correction

```javascript
import { GammaCorrectionShader } from "three/addons/shaders/GammaCorrectionShader.js";
composer.addPass(new ShaderPass(GammaCorrectionShader));
```

### Glitch Effect

```javascript
import { GlitchPass } from "three/addons/postprocessing/GlitchPass.js";
const glitchPass = new GlitchPass();
glitchPass.goWild = false;
```

### Halftone

```javascript
import { HalftonePass } from "three/addons/postprocessing/HalftonePass.js";
const halftonePass = new HalftonePass(window.innerWidth, window.innerHeight, {
  shape: 1, radius: 4
});
```

### Outline

```javascript
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene, camera
);
outlinePass.selectedObjects = [mesh1, mesh2];
```

## Custom ShaderPass

```javascript
const CustomShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    intensity: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float intensity;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      uv.x += sin(uv.y * 10.0 + time) * 0.01 * intensity;
      vec4 color = texture2D(tDiffuse, uv);
      gl_FragColor = color;
    }
  `,
};

const customPass = new ShaderPass(CustomShader);
composer.addPass(customPass);
customPass.uniforms.time.value = clock.getElapsedTime();
```

### Chromatic Aberration

```javascript
const ChromaticAberrationShader = {
  uniforms: { tDiffuse: { value: null }, amount: { value: 0.005 } },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec2 dir = vUv - 0.5;
      float dist = length(dir);
      float r = texture2D(tDiffuse, vUv - dir * amount * dist).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv + dir * amount * dist).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};
```

## Combining Multiple Effects

```javascript
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);
composer.addPass(vignettePass);
composer.addPass(new ShaderPass(GammaCorrectionShader));
composer.addPass(fxaaPass); // Anti-aliasing always last before output
```

## Render to Texture

```javascript
const renderTarget = new THREE.WebGLRenderTarget(512, 512);
renderer.setRenderTarget(renderTarget);
renderer.render(scene, camera);
renderer.setRenderTarget(null);
// use renderTarget.texture
```

## Handle Resize

```javascript
function onWindowResize() {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width, height);

  if (fxaaPass) {
    fxaaPass.material.uniforms["resolution"].value.set(
      1 / (width * pixelRatio), 1 / (height * pixelRatio)
    );
  }
  if (bloomPass) {
    bloomPass.resolution.set(width, height);
  }
}
```

## Performance Tips

1. **Limit passes**: Each pass adds a full-screen render
2. **Lower resolution**: Use smaller render targets for blur passes
3. **Disable unused effects**: Toggle passes on/off
4. **Use FXAA over MSAA**: Less expensive anti-aliasing
5. **Profile with DevTools**: Check GPU usage
