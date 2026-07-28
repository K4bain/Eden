# Eden — ImageFX Prompts

Go to https://imagesfx.withgoogle.com (Google ImageFX — Imagen 3, free)
Generate 5+ of each. Pick the best 2. Compress ALL at squoosh.app to WebP under 200KB.

---

## Prompt 1 — Main Background (the painting surface)

```
dark Renaissance oil painting texture, deep warm blacks with green-black
undertones, amber and ochre undertones in shadows, ancient cracked canvas,
no subjects no figures, pure abstract, extreme chiaroscuro, single warm
light source implied from center, ultra detailed painterly brushwork,
aged, museum quality, seamless
```

After generating:
- Resize to 1920x1080
- Format: WebP, Quality: 75%
- Rename to `bg-main.webp`
- Must be under 200KB

---

## Prompt 2 — Secondary Atmosphere Layer

```
dark garden at night, bioluminescent particles suspended in still air,
deep shadow, warm amber light barely visible through dense darkness,
ancient overgrown garden, no figures, pure atmosphere, oil painting style,
extremely dark, microscopic light points, botanical
```

After generating:
- Resize to 1920x1080
- Format: WebP, Quality: 75%
- Rename to `bg-atmosphere.webp`
- Must be under 200KB

---

## Prompt 3 — Grain/Noise Tile

```
analog 35mm film grain texture, extremely dark base, barely visible
grain pattern, tileable seamless, monochrome, photographic noise,
slight green tint in the blacks
```

After generating:
- Resize to 512x512
- Format: WebP, Quality: 75%
- Rename to `grain.webp`
- Must be under 200KB

---

## Prompt 4 — Light Source Texture (for PointLight bloom)

```
warm amber candlelight bloom, single point of light, dark background,
soft edges dissolving to black, painterly, no subjects, pure light study
```

After generating:
- Resize to 512x512
- Format: WebP, Quality: 75%
- Rename to `light-bloom.webp`
- Must be under 200KB

---

## After Downloading All 4

1. Go to https://squoosh.app
2. Upload each file
3. Set format to WebP, quality 75%
4. Resize backgrounds to 1920x1080, tiles to 512x512
5. Download compressed versions
6. Place in `eden/assets/textures/`
7. Update `style.css` to reference `.webp` instead of `.png`:
   - `bg-main.png` → `bg-main.webp`
   - `bg-atmosphere.png` → `bg-atmosphere.webp`
8. Update `js/three/scene.js` `loadTexturesAsync()` to load `.webp`
9. Update `js/eden/loader.js` `preloadCssImages()` to load `.webp`

---

## File Size Targets

| File | Max Size | Why |
|------|----------|-----|
| bg-main.webp | 200KB | Large texture, needs fast load |
| bg-atmosphere.webp | 200KB | Secondary layer, low opacity anyway |
| grain.webp | 50KB | Small tile, repeats |
| light-bloom.webp | 30KB | Small, used rarely |

---

## Verification After Swap

1. `node tools/verify.js` — texture paths still resolve
2. Open in browser — dark Renaissance painting visible when cursor moves
3. Particles still drift over the texture
4. Bloom shader picks up the texture detail
5. No broken images in Network tab
