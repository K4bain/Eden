---
name: threejs-shaders
description: Three.js shaders - GLSL, ShaderMaterial, uniforms, custom effects. Use when creating custom visual effects, modifying vertices, writing fragment shaders, or extending built-in materials.
license: MIT
---

# Three.js Shaders

## Quick Start

```javascript
import * as THREE from "three";

const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0xff0000) },
  },
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    void main() {
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

material.uniforms.time.value = clock.getElapsedTime();
```

## ShaderMaterial vs RawShaderMaterial

### ShaderMaterial — built-in uniforms

```glsl
// Available automatically:
// uniform mat4 modelMatrix;
// uniform mat4 modelViewMatrix;
// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;
// uniform mat3 normalMatrix;
// uniform vec3 cameraPosition;
// attribute vec3 position;
// attribute vec3 normal;
// attribute vec2 uv;
```

### RawShaderMaterial — full control, define everything

## Uniform Types

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    floatValue: { value: 1.5 },
    vec2Value: { value: new THREE.Vector2(1, 2) },
    vec3Value: { value: new THREE.Vector3(1, 2, 3) },
    colorValue: { value: new THREE.Color(0xff0000) },
    mat4Value: { value: new THREE.Matrix4() },
    textureValue: { value: texture },
  },
});
```

## Varyings

Pass data from vertex to fragment shader.

```glsl
// Vertex
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);
}
```

## Common Shader Patterns

### Texture Sampling

```glsl
uniform sampler2D map;
varying vec2 vUv;

void main() {
  vec4 texColor = texture2D(map, vUv);
  gl_FragColor = texColor;
}
```

### Vertex Displacement

```glsl
uniform float time;
uniform float amplitude;

void main() {
  vec3 pos = position;
  pos.z += sin(pos.x * 5.0 + time) * amplitude;
  pos.z += sin(pos.y * 5.0 + time) * amplitude;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

### Fresnel Effect

```glsl
// cameraPosition is auto-provided by ShaderMaterial
vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
vec3 fresnelColor = vec3(0.5, 0.8, 1.0);
gl_FragColor = vec4(mix(baseColor, fresnelColor, fresnel), 1.0);
```

### Noise

```glsl
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
```

### Gradient

```glsl
// Linear
vec3 color = mix(colorA, colorB, vUv.y);
// Radial
float dist = distance(vUv, vec2(0.5));
vec3 color = mix(centerColor, edgeColor, dist * 2.0);
```

### Rim Lighting

```glsl
float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
rim = pow(rim, 4.0);
gl_FragColor = vec4(baseColor + rimColor * rim, 1.0);
```

## Extending Built-in Materials — onBeforeCompile

```javascript
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

material.onBeforeCompile = (shader) => {
  shader.uniforms.time = { value: 0 };
  material.userData.shader = shader;

  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `#include <begin_vertex>
    transformed.y += sin(position.x * 10.0 + time) * 0.1;`
  );
  shader.vertexShader = "uniform float time;\n" + shader.vertexShader;
};

// Update in animation loop
if (material.userData.shader) {
  material.userData.shader.uniforms.time.value = clock.getElapsedTime();
}
```

### Common Injection Points

- Vertex: `#include <begin_vertex>`, `#include <project_vertex>`
- Fragment: `#include <color_fragment>`, `#include <output_fragment>`, `#include <fog_fragment>`

## GLSL Built-in Functions

```glsl
abs(x), sign(x), floor(x), ceil(x), fract(x)
mod(x, y), min(x, y), max(x, y), clamp(x, min, max)
mix(a, b, t), step(edge, x), smoothstep(edge0, edge1, x)
sin(x), cos(x), tan(x), asin(x), acos(x), atan(y, x)
pow(x, y), exp(x), log(x), sqrt(x), inversesqrt(x)
length(v), distance(p0, p1), dot(x, y), cross(x, y), normalize(v)
reflect(I, N), refract(I, N, eta)
texture2D(sampler, coord)
```

## Common Material Properties

```javascript
const material = new THREE.ShaderMaterial({
  transparent: true,
  opacity: 1.0,
  side: THREE.DoubleSide,
  depthTest: true,
  depthWrite: true,
  blending: THREE.NormalBlending,
  wireframe: false,
  extensions: {
    derivatives: true,
  },
  glslVersion: THREE.GLSL3,
});
```

## Debugging Shaders

```javascript
renderer.debug.checkShaderErrors = true;

// Visual debugging
// gl_FragColor = vec4(vUv, 0.0, 1.0);           // Debug UV
// gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0); // Debug normals
// gl_FragColor = vec4(vPosition * 0.1 + 0.5, 1.0); // Debug position
```

## Performance Tips

1. **Minimize uniforms**: Group related values into vectors
2. **Avoid conditionals**: Use mix/step instead of if/else
3. **Precalculate**: Move calculations to JS when possible
4. **Use textures**: For complex functions, use lookup tables
5. **Limit overdraw**: Avoid transparent objects when possible
