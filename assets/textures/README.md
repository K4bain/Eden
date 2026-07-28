# Eden Textures

## Status — Phase 1 (PLACEHOLDER)

The two textures here (`bg-main.png`, `bg-atmosphere.png`) are **procedural
placeholders**, generated locally by:

```
node tools/generate-textures.js
```

They use deterministic value-noise to evoke Eden's palette (soil-at-night
void, amber warmth, bioluminescent green) so the Phase 1 shell is viewable
immediately. They are good enough to *develop against* and read as atmospheric,
but they are **not the final art**.

## The real textures (human step)

The brief (`EDEN_FULL_CONTEXT.md`, Section 10) assigns the real textures to
**Google ImageFX** (Imagen 3) at `https://imagesfx.withgoogle.com`, then
compressed to **WebP** at `https://squoosh.app`.

### Prompts (from Section 10)

**bg-main** — the painting surface:
```
dark Renaissance oil painting texture, deep warm blacks with green-black
undertones, amber and ochre undertones in shadows, ancient cracked canvas,
no subjects no figures, pure abstract, extreme chiaroscuro, single warm
light source implied from center, ultra detailed painterly brushwork,
aged, museum quality, seamless
```

**bg-atmosphere** — secondary atmosphere layer:
```
dark garden at night, bioluminescent particles suspended in still air,
deep shadow, warm amber light barely visible through dense darkness,
ancient overgrown garden, no figures, pure atmosphere, oil painting style,
extremely dark, microscopic light points, botanical
```

**grain** — film grain tile (512×512):
```
analog 35mm film grain texture, extremely dark base, barely visible
grain pattern, tileable seamless, monochrome, photographic noise,
slight green tint in the blacks
```

**light-bloom** — PointLight bloom (a Phase 3 asset):
```
warm amber candlelight bloom, single point of light, dark background,
soft edges dissolving to black, painterly, no subjects, pure light study
```

### How to swap in the real art

1. Generate 5+ of each on ImageFX, pick the best 2.
2. Compress at squoosh.app → **WebP**, quality 75%.
3. Backgrounds: resize to 1920×1080; grain tile: 512×512.
4. Every file under 200KB.
5. Export them into this folder **as `.webp`**.
6. In `style.css`, change the two `url('./assets/textures/*.png')` references
   to `.webp`. (The grain layer is an inline SVG data URI for now — when the
   real `grain.webp` arrives, swap the `#grain` background-image too.)

### Files this brief expects (Section 11)

```
assets/textures/
├── bg-main.webp            ← Renaissance painting texture   (final art)
├── bg-atmosphere.webp      ← secondary atmosphere layer     (final art)
├── grain.webp              ← film grain tile                (final art)
└── light-bloom.webp        ← light source texture           (Phase 3)
```

Until the real WebPs land, `bg-main.png` and `bg-atmosphere.png` carry the
shell. `grain` is inline SVG (no file), and `light-bloom` is not needed until
Phase 3.
