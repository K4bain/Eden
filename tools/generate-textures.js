/* ============================================================================
   EDEN — generate-textures.js
   ----------------------------------------------------------------------------
   Procedural PLACEHOLDER textures for Phase 1. Self-contained: uses only
   Node's built-in zlib to encode PNGs — no npm install.

   These exist so the shell is viewable the moment you open index.html. They
   are NOT the final art. The brief (EDEN_FULL_CONTEXT.md §10) assigns the
   real textures to Google ImageFX (Imagen 3), compressed to WebP at
   squoosh.app. When those land, drop them into assets/textures/ and update
   the two url() references in style.css from .png to .webp.

   Output (all into ../assets/textures/):
     bg-main.png        — dark Renaissance painting surface (green-black,
                          amber/ochre undertones, painterly value noise)
     bg-atmosphere.png  — near-black field with sparse bioluminescent points
                          (amber + green "fireflies")

   The grain layer is an inline SVG data URI in style.css (no file needed),
   and light-bloom is a Phase 3 asset (PointLight bloom) — neither is
   generated here.

   Run:  node tools/generate-textures.js
   ========================================================================== */

'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ── Minimal PNG encoder (RGB, 8-bit, filter type 0 per scanline) ─────────── */
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgb /* Uint8Array, length = w*h*3 */) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // color type: RGB
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  // Prepend filter byte (0 = None) to each scanline.
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgb.buffer, rgb.byteOffset + y * stride, stride).copy(
      raw, y * (stride + 1) + 1
    );
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ── Deterministic PRNG + value noise (so output is reproducible) ─────────── */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smooth(t) { return t * t * (3 - 2 * t); }

// 2D value noise on an integer lattice, bilinearly interpolated.
function makeValueNoise(seed) {
  const rnd = mulberry32(seed);
  const table = new Float32Array(256);
  for (let i = 0; i < 256; i++) table[i] = rnd();
  return function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const idx = (a, b) => (((a) & 255) * 7 + ((b) & 255) * 13) & 255;
    const v00 = table[idx(xi, yi)];
    const v10 = table[idx(xi + 1, yi)];
    const v01 = table[idx(xi, yi + 1)];
    const v11 = table[idx(xi + 1, yi + 1)];
    const u = smooth(xf), v = smooth(yf);
    return (v00 * (1 - u) + v10 * u) * (1 - v) + (v01 * (1 - u) + v11 * u) * v;
  };
}

// Fractal (fBm) value noise — sums octaves. This is what reads as "painterly".
function makeFbm(seed) {
  const noise = makeValueNoise(seed);
  return function (x, y, octaves) {
    let sum = 0, amp = 0.5, freq = 1, norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += noise(x * freq, y * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / norm;
  };
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/* ── bg-main: dark Renaissance painting surface ─────────────────────────── */
// Palette anchors (Eden §6):
//   void #060a08, shadow-green #0d1a12, amber #8B5E3C, ochre hint toward #D4A55A
// The cursor's PointLight will reveal this in Phase 3; here it sits dark and
// textural so the multiplied layer reads as aged, painted surface.
function generateBgMain(width, height) {
  const rnd = mulberry32(20260725);
  const fbm = makeFbm(20260725);
  const fbmFine = makeFbm(99);
  const rgb = new Uint8Array(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / width, ny = y / height;
      // Large slow structure (the "single warm light source implied from center")
      const macro = fbm(nx * 3, ny * 3, 4);
      // Finer painterly brushwork
      const fine = fbmFine(nx * 14, ny * 14, 5);
      // A soft warm bias toward center (chiaroscuro)
      const cx = nx - 0.5, cy = ny - 0.5;
      const radial = clamp(1 - Math.sqrt(cx * cx + cy * cy) * 1.4, 0, 1);

      // Base: very dark green-black (between void and shadow-green)
      let r = 8, g = 16, b = 11;

      // Lift shadows toward soil-green in the mid structure
      const greenLift = macro * 0.6 + fine * 0.4;
      r += greenLift * 6;
      g += greenLift * 14;
      b += greenLift * 9;

      // Amber/ochre warmth where structure + radial agree (the implied light)
      const warm = clamp((macro * 0.7 + radial * 0.5) * (0.6 + fine * 0.8), 0, 1.4);
      r += warm * warm * 26;
      g += warm * warm * 16;
      b += warm * warm * 6;

      // Faint ochre speckle so it isn't a flat gradient
      if (rnd() < 0.002) { r += 22; g += 14; b += 4; }

      const i = (y * width + x) * 3;
      rgb[i]     = clamp(r | 0, 0, 255);
      rgb[i + 1] = clamp(g | 0, 0, 255);
      rgb[i + 2] = clamp(b | 0, 0, 255);
    }
  }
  return rgb;
}

/* ── bg-atmosphere: sparse bioluminescent points on near-black ──────────── */
// Mostly void. Sparse amber + green points — fireflies in still air. Laid with
// screen blend at 0.08 opacity in style.css, so even "bright" points stay
// whisper-quiet.
function generateBgAtmosphere(width, height) {
  const rnd = mulberry32(424242);
  const fbm = makeFbm(7);
  const rgb = new Uint8Array(width * height * 3);

  // Start near-pure void.
  for (let i = 0; i < rgb.length; i += 3) {
    rgb[i] = 6; rgb[i + 1] = 10; rgb[i + 2] = 8;
  }

  // Scatter glowing points. Density tuned for "spores in a cathedral".
  const count = Math.floor(width * height * 0.0006);
  for (let p = 0; p < count; p++) {
    const px = Math.floor(rnd() * width);
    const py = Math.floor(rnd() * height);
    const green = rnd() < 0.5;                 // 50/50 amber vs bioluminescent
    const intensity = rnd() * 0.7 + 0.3;
    const cr = green ? 74  : 196;              // bio green / amber-gold
    const cg = green ? 158 : 148;
    const cb = green ? 122 : 58;
    const radius = Math.floor(rnd() * 3) + 1;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = px + dx, y = py + dy;
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const d = Math.sqrt(dx * dx + dy * dy) / radius;
        if (d > 1) continue;
        const falloff = (1 - d) * (1 - d) * intensity;
        const i = (y * width + x) * 3;
        rgb[i]     = Math.min(255, rgb[i]     + cr * falloff);
        rgb[i + 1] = Math.min(255, rgb[i + 1] + cg * falloff);
        rgb[i + 2] = Math.min(255, rgb[i + 2] + cb * falloff);
      }
    }
  }

  // A whisper of low-frequency haze so it isn't pure points on flat black.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const h = fbm(x / width * 4, y / height * 4, 4) * 6;
      const i = (y * width + x) * 3;
      rgb[i]     += h * 0.6;
      rgb[i + 1] += h * 0.9;
      rgb[i + 2] += h * 0.7;
    }
  }
  return rgb;
}

/* ── Run ─────────────────────────────────────────────────────────────────── */
const OUT = path.join(__dirname, '..', 'assets', 'textures');
fs.mkdirSync(OUT, { recursive: true });

// 1920x1080 backgrounds keep the §10 spec; the painterly noise scales fine.
const W = 1920, H = 1080;

console.log('Generating bg-main.png  (dark Renaissance surface)...');
fs.writeFileSync(path.join(OUT, 'bg-main.png'), encodePNG(W, H, generateBgMain(W, H)));

console.log('Generating bg-atmosphere.png (bioluminescent points)...');
fs.writeFileSync(path.join(OUT, 'bg-atmosphere.png'), encodePNG(W, H, generateBgAtmosphere(W, H)));

console.log('Done. Output:', OUT);
