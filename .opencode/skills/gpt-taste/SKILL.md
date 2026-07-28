---
name: gpt-taste
description: Elite UX/UI & Advanced GSAP Motion Engineer. Enforces Python-driven true randomization for layout variance, strict AIDA page structure, wide editorial typography, gapless bento grids, strict GSAP ScrollTriggers, inline micro-images, and massive section spacing.
license: MIT
---

# GPT Taste — Anti-Slop Frontend

> Awwwards-level GSAP-heavy frontend pages with AIDA structure, wide typography, and gapless grids.

## Core Directives

### 1. AIDA Page Structure

Every page follows Attention → Interest → Desire → Action:

- **Attention**: Hero section with massive typography, full-viewport, zero clutter
- **Interest**: Bento grid with varied card sizes, editorial photography, wide captions
- ** Desire**: Social proof, testimonials, or showcase with cinematic reveal
- **Action**: Single clear CTA, high contrast, no competing elements

### 2. Typography Rules

- Display font: 6-12vw for hero headlines
- Body: 16-20px, line-height 1.5-1.6
- NEVER use generic serif fonts (Playfair Display, Cormorant) — these are AI tells
- Prefer: Inter, Söhne, Satoshi, General Sans, Space Grotesk
- Maximum 2 font weights per project
- Letter-spacing: -0.02em to -0.04em for large display text

### 3. Layout Variance (True Randomization)

- NEVER use equal-width columns
- NEVER use centered hero with subtitle below
- NEVER use three equal feature cards in a row
- Use asymmetric grids: 60/40, 70/30, 55/45
- Vary section heights: 100vh, 80vh, 120vh, 60vh
- Gap between sections: minimum 8rem (128px)

### 4. GSAP Motion Rules

- Every scroll animation uses ScrollTrigger with `scrub: true`
- Use `gsap.quickTo()` for all cursor-following elements
- Stagger reveals: 0.08-0.12s between items
- Easing: `"power3.out"` for entrances, `"power3.inOut"` for transitions
- Pin hero section for the entire first scroll section
- Use `autoAlpha` instead of `opacity` always

### 5. Anti-Slop Checklist

- [ ] No em-dashes (—) in any visible text
- [ ] No beige + brass / beige + gold premium palettes
- [ ] No three equal feature cards
- [ ] No centered hero with "subtitle below"
- [ ] No generic stock photography
- [ ] No "Welcome to [Brand]" or "Where innovation meets excellence"
- [ ] No gradient text (unless deliberately editorial)
- [ ] No rounded corners > 12px on cards
- [ ] No drop shadows on cards (use border or background contrast)
- [ ] No icons in circles next to headings

### 6. Color

- Dark mode default: `#0a0a0a` background, `#fafafa` text
- Accent: single high-saturation color, used sparingly (< 15% of surface area)
- NEVER use multiple accent colors
- NEVER use pastel palettes for premium feel

### 7. Spacing

- Section padding: 8-16rem vertical
- Content max-width: 1200-1400px
- Card padding: 2-3rem
- Element spacing: use powers of 2 (8, 16, 32, 64, 128)

### 8. Motion Intensity Dial

Adjust based on project:

- **Low (3/10)**: Hover effects only, no scroll animation
- **Medium (6/10)**: Scroll reveals, subtle parallax, cursor follow
- **High (9/10)**: Full timeline choreography, pinned sections, morph transitions

## When to Use

- Landing pages that need to win design awards
- Portfolio sites with strong visual identity
- Product launches with cinematic feel
- Any project where "premium" and "intentional" are the goal
