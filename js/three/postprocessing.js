/* ============================================================================
   EDEN — postprocessing.js  (Phase 4 — v2 cinematic pipeline)
   ----------------------------------------------------------------------------
   The EffectComposer pipeline. Upgraded from CSS grain/vignette to a single
   merged GPU shader pass. Adds OutputPass for correct tone mapping.

   Pipeline order (optimized):
      1. RenderPass              — renders the scene
      2. UnrealBloomPass         — glow on bioluminescent particles
      3. ShaderPass (sfumato)    — edges dissolve into shadow (§9 Shader 1)
      4. ShaderPass (colorgrade) — warm soil-green shadow lift (§9 Shader 3)
      5. ShaderPass (grainvig)   — merged film grain + vignette (replaces CSS)
      6. ShaderPass (chromatic)  — RGB split on EDEN reveal (§9 Shader 2)
      7. OutputPass              — tone mapping + sRGB conversion

   Perf budget: ~3-4ms total post-processing at 1080p on mid-range GPU.
   Each custom ShaderPass is ~0.1-0.3ms. Bloom is ~0.8-1.5ms.
   ========================================================================== */

import * as THREE from 'three';

export async function createPostProcessing(renderer, scene, camera) {
  const isMobile = window.__EDEN__?.isMobile ?? false;
  if (isMobile) return null;

  let EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass;
  try {
    const comp = await import('three/addons/postprocessing/EffectComposer.js');
    const rp = await import('three/addons/postprocessing/RenderPass.js');
    const sp = await import('three/addons/postprocessing/ShaderPass.js');
    const bloom = await import('three/addons/postprocessing/UnrealBloomPass.js');
    const out = await import('three/addons/postprocessing/OutputPass.js');
    EffectComposer = comp.EffectComposer;
    RenderPass = rp.RenderPass;
    ShaderPass = sp.ShaderPass;
    UnrealBloomPass = bloom.UnrealBloomPass;
    OutputPass = out.OutputPass;
  } catch (e) {
    console.warn('[EDEN] post-processing unavailable:', e.message);
    return null;
  }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // ── 1. UnrealBloomPass ──────────────────────────────────────────────────
  // Threshold 0.4: only the brightest particles + cursor light glow.
  // Strength 0.8: moderate glow.
  // Radius 0.8: wide soft halo around bright points.
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.8, 0.8, 0.4
  );
  composer.addPass(bloomPass);

  // ── 2. Sfumato (§9 — depth-based blur, edges dissolve) ──────────────────
  // "Bright areas stay sharp, shadow edges dissolve.
  //  This is what makes it look painted rather than rendered."
  // 3x3 kernel, 9 samples. Intensity 0.28 — subtle painterly edge.
  const sfumatoShader = {
    name: 'SfumatoShader',
    uniforms: {
      tDiffuse: { value: null },
      intensity: { value: 0.28 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform float intensity;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float blurAmt = (1.0 - lum) * intensity * 0.0022;
        vec4 blurred = vec4(0.0);
        for (int i = -1; i <= 1; i++) {
          for (int j = -1; j <= 1; j++) {
            vec2 offset = vec2(float(i), float(j)) * blurAmt;
            blurred += texture2D(tDiffuse, vUv + offset);
          }
        }
        blurred /= 9.0;
        gl_FragColor = mix(color, blurred, intensity);
      }
    `
  };
  composer.addPass(new ShaderPass(sfumatoShader));

  // ── 3. Warm Color Grade (§9 — lift shadows toward soil-green) ───────────
  // "Lift shadows toward warm soil-green, keep highlights amber"
  // Subtle midtone warmth added for that candlelight-through-bark feel.
  const gradeShader = {
    name: 'ColorGradeShader',
    uniforms: {
      tDiffuse: { value: null },
      intensity: { value: 0.95 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform float intensity;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        vec3 shadowLift = vec3(0.015, 0.015, 0.012);
        vec3 graded = color.rgb + shadowLift * (1.0 - color.rgb) * intensity;
        graded.r += 0.01 * (1.0 - abs(graded.r - 0.5) * 2.0);
        graded.g += 0.005 * (1.0 - abs(graded.g - 0.5) * 2.0);
        gl_FragColor = vec4(graded, color.a);
      }
    `
  };
  composer.addPass(new ShaderPass(gradeShader));

  // ── 4. Grain + Vignette (merged — replaces CSS #grain + #vignette) ──────
  // Single pass, ~0.1-0.2ms. Animated grain via uTime. Vignette via radial
  // distance. Both are pure UV functions — no extra texture samples needed.
  // Grain is stronger in dark areas (realistic film response).
  const grainVigShader = {
    name: 'GrainVignetteShader',
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uGrainAmount: { value: 0.04 },
      uVignetteStrength: { value: 0.4 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform float uGrainAmount;
      uniform float uVignetteStrength;
      varying vec2 vUv;

      // Hash function for procedural grain
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime) * 43758.5453);
      }

      void main() {
        vec3 col = texture2D(tDiffuse, vUv).rgb;

        // ── Vignette: darken toward corners ──
        // Asymmetric offset (48% x, 52% y) for organic feel
        vec2 uv2 = (vUv - vec2(0.48, 0.52)) * 1.1;
        float dist = length(uv2);
        float vig = 1.0 - smoothstep(0.35, 0.95, dist);
        col *= mix(1.0, vig, uVignetteStrength);

        // ── Film grain: procedural noise, stronger in shadows ──
        float grain = (hash(vUv * 500.0) - 0.5) * uGrainAmount;
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        float grainStrength = uGrainAmount * (1.0 - lum * 0.5);
        col += grain * grainStrength * 2.0;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  };
  const grainVigPass = new ShaderPass(grainVigShader);
  composer.addPass(grainVigPass);

  // ── 5. Chromatic Aberration (§9 — brief spike on EDEN reveal) ───────────
  // "amount: 0 normally, GSAP animates briefly to 0.005 then back"
  // Horizontal RGB split only — clean and controlled.
  const chromaticShader = {
    name: 'ChromaticShader',
    uniforms: {
      tDiffuse: { value: null },
      amount: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform float amount;
      varying vec2 vUv;

      void main() {
        float r = texture2D(tDiffuse, vUv + vec2(amount, 0.0)).r;
        float g = texture2D(tDiffuse, vUv).g;
        float b = texture2D(tDiffuse, vUv - vec2(amount, 0.0)).b;
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `
  };
  const chromaticPass = new ShaderPass(chromaticShader);
  composer.addPass(chromaticPass);

  // ── 6. OutputPass (tone mapping + sRGB) ─────────────────────────────────
  // Ensures correct color space after all post-processing.
  // Without this, colors can look washed out or over-saturated.
  composer.addPass(new OutputPass());

  // ── API for timeline events ──────────────────────────────────────────────
  // Chromatic spike: yoyo, amount 0 → 0.005 → 0, 0.15s each way (§7)
  const spike = (totalDuration = 300) => {
    const start = performance.now();
    const step = () => {
      const elapsed = performance.now() - start;
      const k = Math.min(elapsed / totalDuration, 1);
      const amount = k < 0.5
        ? (k / 0.5) * 0.005
        : ((1 - k) / 0.5) * 0.005;
      chromaticPass.uniforms.amount.value = amount;
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  };

  // Bloom: animate strength during revelation (0.55 → 1.2 → 0.65, 0.8s).
  const bloomSpike = (duration = 800) => {
    const start = performance.now();
    const from = 0.55, peak = 1.2, settle = 0.65;
    const step = () => {
      const k = Math.min((performance.now() - start) / duration, 1);
      const e = k < 0.5
        ? (k / 0.5)
        : 1 - ((k - 0.5) / 0.5) * 0.45;
      bloomPass.strength = from + (peak - from) * e;
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  };

  const resize = (w, h) => {
    composer.setSize(w, h);
    bloomPass.resolution.set(w, h);
  };

  // Update grain time each frame (called from render loop).
  const update = (time) => {
    grainVigPass.uniforms.uTime.value = time;
  };

  return { composer, spike, bloomSpike, resize, update };
}
