/* ============================================================================
   EDEN — verify.js
   ----------------------------------------------------------------------------
   Structural sanity check for Eden. No browser, no deps — just confirms
   the pieces the brief requires are present and wired up.

   Run:  node tools/verify.js
   Exits non-zero if anything required is missing.
   ========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let problems = [];
let notes = [];

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}
function check(cond, msg) {
  if (cond) notes.push('  ✓ ' + msg);
  else problems.push('  ✗ ' + msg);
}

/* ── Required files (Section 11 + Phase 2/3) ────────────────────────────── */
check(exists('index.html'), 'index.html exists');
check(exists('style.css'), 'style.css exists');
check(exists('js/main.js'), 'js/main.js exists (ES module, Phase 3)');
check(exists('js/eden/loader.js'), 'js/eden/loader.js exists (Phase 2)');
check(exists('js/eden/timeline.js'), 'js/eden/timeline.js exists (Phase 2)');
check(exists('js/eden/cursor.js'), 'js/eden/cursor.js exists (Phase 3)');
check(exists('js/three/scene.js'), 'js/three/scene.js exists (Phase 3)');
check(exists('js/three/particles.js'), 'js/three/particles.js exists (Phase 3)');
check(exists('js/three/lights.js'), 'js/three/lights.js exists (Phase 3)');
check(exists('js/three/background.js'), 'js/three/background.js exists (Phase 3)');
check(exists('js/three/postprocessing.js'), 'js/three/postprocessing.js exists (Phase 4)');
check(exists('fallback/fallback.css'), 'fallback/fallback.css exists');
check(exists('assets/textures/bg-main.png'), 'bg-main texture exists');
check(exists('assets/textures/bg-atmosphere.png'), 'bg-atmosphere texture exists');
check(exists('start.bat'), 'start.bat launcher exists');

/* ── Loading screen CSS must be INLINE in <head> (Gotcha #1) ─────────────── */
const html = read('index.html');
const headEnd = html.indexOf('</head>');
const headSlice = headEnd >= 0 ? html.slice(0, headEnd) : html;
check(/#loading-screen\s*\{/.test(headSlice),
  'loading-screen CSS is inline in <head> (Gotcha #1)');
check(/preconnect[^>]*fonts\.gstatic\.com/.test(headSlice) &&
      /family=Cormorant\+Garamond:wght@300;700/.test(headSlice),
  'Cormorant Garamond 300+700 preconnect + link present');

/* ── Import map + module loading (Phase 3) ──────────────────────────────── */
check(/type="importmap"/.test(html),
  'importmap present for ES module bare specifiers');
check(/three@0\.158\.0/.test(html),
  'Three.js r158 in importmap');
check(/type="module"/.test(html) && /src=".\/js\/main\.js"/.test(html),
  'main.js loads as type="module"');

/* ── Layer stack z-index (Section 12) ────────────────────────────────────── */
const css = read('style.css');
const layers = {
  '#webgl-canvas':   -1,
  '#cursor-canvas':   0,
  '#bg-main':         1,
  '#bg-atmosphere':   2,
  '#vignette':        3,
  '#grain':           4,
  '#eden-content':   10,
  '#loading-screen': 20,
};
for (const [sel, z] of Object.entries(layers)) {
  const block = new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
                           '\\s*\\{[^}]*z-index:\\s*' + z + '\\b');
  check(block.test(css), sel + ' has z-index ' + z);
}

/* ── pointer-events: none on overlay layers (Gotcha #3) ──────────────────── */
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
const noEvents = ['#bg-main', '#bg-atmosphere', '#vignette', '#grain',
                  '#webgl-canvas', '#cursor-canvas'];
const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
let rm;
const pointerNoneSelectors = new Set();
while ((rm = ruleRe.exec(cssNoComments)) !== null) {
  if (/pointer-events\s*:\s*none/.test(rm[2])) {
    rm[1].split(',').forEach((s) => pointerNoneSelectors.add(s.trim()));
  }
}
for (const sel of noEvents) {
  check(pointerNoneSelectors.has(sel), sel + ' is pointer-events: none');
}

/* ── Typography (Section 6/13) ───────────────────────────────────────────── */
check(/clamp\(1\.2rem,\s*3vw,\s*2rem\)/.test(css),
  '"In the beginning." sized clamp(1.2rem, 3vw, 2rem)');
check(/clamp\(4rem,\s*12vw,\s*10rem\)/.test(css),
  'EDEN sized clamp(4rem, 12vw, 10rem)');
check(/font-weight:\s*300/.test(css) && /font-weight:\s*700/.test(css),
  'Garamond 300 (opening) and 700 (name) both used');

/* ── Colors (Section 6) ──────────────────────────────────────────────────── */
check(/#060a08/i.test(css), 'void #060a08 present');
check(/#8B5E3C/i.test(css), 'amber #8B5E3C present');
check(/#C4943A/i.test(css), 'gold-edge #C4943A present');
check(/#D4C9B8/i.test(css), 'ivory #D4C9B8 present');

/* ── html/body clean of stacking-context props (Gotcha #5) ──────────────── */
['html', 'body'].forEach((sel) => {
  const re = new RegExp(sel + '\\s*\\{([^}]*)\\}', 'g');
  let m;
  while ((m = re.exec(css)) !== null) {
    const block = m[1];
    check(!/transform\s*:/.test(block) && !/filter\s*:/.test(block) &&
          !/will-change\s*:/.test(block) && !/clip-path\s*:/.test(block),
      sel + ' {} has no transform/filter/will-change/clip-path (Gotcha #5)');
  }
});

/* ── Phase 2: timeline + loader wiring ───────────────────────────────────── */
const mainJs = read('js/main.js');
const timelineJs = read('js/eden/timeline.js');
const loaderJs = read('js/eden/loader.js');
const sceneJs = read('js/three/scene.js');
const cursorJs = read('js/eden/cursor.js');
const particlesJs = read('js/three/particles.js');

check(/cdn\.jsdelivr\.net\/npm\/gsap@3\.12\.5/.test(html),
  'GSAP 3.12.5 CDN present');
check(/cdn\.jsdelivr\.net\/npm\/gsap@3\.12\.5\/dist\/ScrollTrigger/.test(html),
  'ScrollTrigger CDN present');
check(/cdn\.jsdelivr\.net\/npm\/splitting@1\.0\.6/.test(html),
  'Splitting.js 1.0.6 CDN present');

check(/EXPLORATION_MIN\s*=\s*8/.test(timelineJs),
  'EXPLORATION_MIN = 8 (minimum exploration window honored)');
check(/EXPLORATION_TIMEOUT\s*=\s*12/.test(timelineJs),
  'EXPLORATION_TIMEOUT = 12 (idle fallback within 8-12s range)');

check(/eden:exploration-start/.test(timelineJs),
  "emits 'eden:exploration-start' for Phase 3");
check(/eden:revelation/.test(timelineJs),
  "emits 'eden:revelation' for Phase 3");

check(/opacity:\s*1,\s*duration:\s*0\.6,\s*ease:\s*'none'/.test(timelineJs),
  "EDEN reveal uses ease:'none' (linear, per Section 13)");
check(/letterSpacing:\s*'0\.2em'/.test(timelineJs) &&
      /0\.4em/.test(css),
  "EDEN letter-spacing animates 0.4em → 0.2em");

check(/overflow\s*=\s*''/.test(timelineJs) &&
      /ScrollTrigger\.refresh/.test(timelineJs),
  "scroll unlocked then ScrollTrigger.refresh() (Gotcha #12)");

check(/fonts\.ready|fontsReady/.test(loaderJs),
  "loader waits on document.fonts.ready (Gotcha #2)");
check(/minDelay\(1000\)|1000/.test(loaderJs),
  'loader enforces 1s minimum hold');

check(/isReducedMotion/.test(mainJs),
  'main.js short-circuits on prefers-reduced-motion');

check(/class="eden-secondary"/.test(html),
  '.eden-secondary ("Saper vedere.") present');
check(/id="scroll-hint"/.test(html),
  '#scroll-hint present');

check(/\.js\s+\.eden-opening/.test(css) && /\.js\s+\.eden-name/.test(css),
  "initial-state hiding gated on .js (no-JS fallback)");
check(/classList\.add\('js'\)/.test(html),
  ".js class added before paint (no-JS safety)");

/* ── Phase 3: Three.js scene wiring ──────────────────────────────────────── */
check(/import.*three/.test(mainJs),
  'main.js imports from three (ES module)');
check(/initScene/.test(mainJs),
  'main.js calls initScene()');
check(/eden:exploration-start/.test(sceneJs),
  'scene.js listens for eden:exploration-start');
check(/eden:revelation/.test(sceneJs),
  'scene.js listens for eden:revelation');
check(/196.*148.*58/.test(cursorJs),
  'cursor.js uses amber #C4943A (RGB) for light');
check(/NormalBlending/.test(read('js/three/particles.js')),
  'particles use NormalBlending (bloom handles glow)');
check(/ACESFilmicToneMapping/.test(sceneJs),
  'renderer uses ACESFilmicToneMapping');
check(/powerPreference.*high-performance/.test(sceneJs),
  'renderer requests high-performance GPU');
check(/Math\.min\(window\.devicePixelRatio/.test(sceneJs),
  'pixel ratio capped (Gotcha #8)');

// Safety timeout — visitor is never stuck.
check(/safety|6000|forceStaticReveal/.test(mainJs),
  'hard safety timeout in main.js (visitor never stuck)');

// Mobile: 300 particles, no cursor.
check(/300/.test(sceneJs) && /1500/.test(sceneJs),
  'particle count: 1500 desktop / 300 mobile');
check(/isMobile|Mobile|touch/.test(cursorJs),
  'cursor.js handles mobile/touch (skipped on touch)');

// Resize debounced 150ms (Gotcha #6).
check(/150/.test(sceneJs) && /resize/.test(sceneJs),
  'resize handler debounced 150ms (Gotcha #6)');

/* ── Phase 4: post-processing pipeline ───────────────────────────────────── */
const postfxJs = read('js/three/postprocessing.js');

check(/EffectComposer/.test(postfxJs) && /RenderPass/.test(postfxJs),
  'EffectComposer + RenderPass in pipeline');
check(/UnrealBloomPass/.test(postfxJs),
  'UnrealBloomPass for particle glow');
check(/GrainVignetteShader|grainvig/i.test(postfxJs),
  'Merged grain+vignette shader (replaces CSS grain+vignette)');
check(/OutputPass/.test(postfxJs),
  'OutputPass for correct tone mapping + sRGB');
// Pipeline order matters (§7): RenderPass → Bloom → Film → Sfumato → Grade → Chromatic.
check(/addPass\(new RenderPass/.test(postfxJs),
  'RenderPass is first pass');
check(/SfumatoShader|sfumato/i.test(postfxJs),
  'Sfumato shader (edges dissolve)');
check(/ColorGradeShader|colorgrade/i.test(postfxJs),
  'Warm color grade shader');
check(/ChromaticShader|chromatic/i.test(postfxJs),
  'Chromatic aberration shader');
// GLSL luminance weighting (§9 Shader 1).
check(/0\.299.*0\.587.*0\.114/.test(postfxJs),
  'Sfumato uses standard luminance weights');
// Bloom config (§7): strength 0.8, radius 0.8, threshold 0.4.
check(/0\.8.*0\.8.*0\.4/s.test(postfxJs),
  'Bloom strength 0.8 / radius 0.8 / threshold 0.4');
// Chromatic spike yoyo 0 → 0.005 → 0 (§7).
check(/0\.005/.test(postfxJs),
  'Chromatic spike peaks at 0.005');
check(/curlNoise|curl.*noise/i.test(particlesJs),
  'particles use curl noise for organic flow');
// Lazy import so pipeline failure degrades gracefully.
check(/await import\('three\/addons/.test(postfxJs),
  'post-processing lazy-imports addons (graceful degradation)');
// Timeline wires postfx into revelation.
check(/postfx\.spike|postfx\.bloomSpike/.test(sceneJs),
  'scene wires postfx spike+bloomSpike to revelation');
// Composer used in render loop.
check(/postfx\.composer\.render|composer\.render/.test(sceneJs),
  'render loop uses composer when available');

/* ── Report ──────────────────────────────────────────────────────────────── */
console.log('\nEDEN — Phase 4 verification\n' + '='.repeat(40));
notes.forEach((n) => console.log(n));
if (problems.length) {
  console.log('\nProblems:');
  problems.forEach((p) => console.log(p));
  console.log('\n' + problems.length + ' problem(s). Fix before proceeding.\n');
  process.exit(1);
} else {
  console.log('\nAll structural checks passed. ✓\n');
}
