---
name: design-taste-frontend
description: Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the right design direction, and ships interfaces that do not look templated. Real design systems when applicable, audit-first on redesigns, strict pre-flight check.
license: MIT
---

# Design Taste: Anti-Slop Frontend

> Concise, distinctive landing pages and portfolios that avoid templated AI aesthetics.

## 0. BRIEF INFERENCE (Read the Room Before Anything Else)

Before touching code, **infer what the user actually wants**:

1. **Page kind** - landing, portfolio, redesign, editorial
2. **Vibe words** - "minimalist", "Awwwards", "brutalist", "premium", "dark tech"
3. **Reference signals** - URLs, screenshots, brands they're competing with
4. **Audience** - B2B, design-conscious consumer, recruiter
5. **Brand assets** - logo, color, type, photography
6. **Quiet constraints** - accessibility-first, public-sector, regulated

## Design Variance Dial (1-10)

- **DESIGN_VARIANCE**: Layout experimentation (lower: centered/clean · higher: asymmetric/modern)
- **MOTION_INTENSITY**: Animation depth (lower: hover · higher: scroll/magnetic)
- **VISUAL_DENSITY**: Information per viewport (lower: spacious · higher: dense)

## Anti-Patterns (Never Do)

- Em-dashes (—) in visible text
- Generic serif fonts (Playfair, Cormorant, Lora)
- Beige + brass/gold "premium" palettes
- Three equal feature cards in a row
- Centered hero with subtitle below
- "Welcome to [Brand]" / "Where innovation meets excellence"
- Gradient text (unless deliberate editorial)
- Rounded corners > 12px on cards
- Drop shadows on cards
- Icons in circles next to headings
- Stock photography
- "Trusted by" logos that are clearly fake

## Design Systems (When Applicable)

If the project uses a design system, use it. Otherwise build with:

- Tailwind for utility-first CSS
- GSAP for animations
- Custom properties for theming

### Available systems to implement:
- Material Design (Google)
- Carbon (IBM)
- Fluent (Microsoft)
- Polaris (Shopify)
- Primer (GitHub)
- GOV.UK

## Pre-Flight Checklist

Before shipping, verify ALL:

- [ ] Contrast ratio ≥ 4.5:1 for text
- [ ] Buttons don't wrap awkwardly on mobile
- [ ] Hero fits in one viewport on all screen sizes
- [ ] Color palette is consistent (no random colors)
- [ ] Typography scale is consistent (max 2-3 sizes)
- [ ] Motion has purpose (not decorative noise)
- [ ] No placeholder/lorem ipsum text
- [ ] No broken images or missing assets
- [ ] No console errors
- [ ] Touch targets ≥ 44px on mobile
- [ ] Focus states visible for keyboard navigation
- [ ] Reduced motion respected
- [ ] Loading state handled

## Redesign Protocol

For existing projects:

1. **Audit first** — identify what's generic/templated
2. **Preserve functionality** — don't break what works
3. **Fix spacing** — usually the #1 issue
4. **Fix typography hierarchy** — establish clear levels
5. **Fix color** — reduce palette, increase contrast
6. **Fix motion** — add purpose, remove noise
