---
name: gsap-performance
description: Official GSAP skill for performance — prefer transforms, avoid layout thrashing, will-change, batching. Use when optimizing GSAP animations, reducing jank, or when the user asks about animation performance, FPS, or smooth 60fps.
license: MIT
---

# GSAP Performance

## When to Use This Skill

Apply when animations feel janky, when optimizing for 60fps, or when building performance-sensitive GSAP animations.

**Related skills:** For core API use **gsap-core**; for timelines use **gsap-timeline**; for ScrollTrigger use **gsap-scrolltrigger**.

## Key Principle: Transform Everything

**Always animate transforms instead of layout properties.**

| ❌ Avoid | ✅ Prefer |
|----------|----------|
| `width`, `height` | `scaleX`, `scaleY`, `scale` |
| `top`, `left`, `right`, `bottom` | `x`, `y` |
| `margin`, `padding` | `x`, `y` |
| `opacity` | `autoAlpha` (also toggles visibility) |

- **`autoAlpha`** — handles both opacity and visibility. When 0, sets `visibility: hidden`.

## Layout Thrashing

Layout thrashing happens when you:
1. **Read** a layout property (e.g. `offsetWidth`, `getBoundingClientRect()`)
2. **Write** a layout property (e.g. set `width`)
3. **Read** again before the browser paints

**Prevention:**
- Batch reads before writes.
- Avoid reading layout properties in `onUpdate` callbacks.
- Use **gsap.quickTo()** for frequent mouse-follow animations.

```javascript
// BAD — reads layout every frame
document.addEventListener("mousemove", (e) => {
  gsap.to(".box", { left: e.clientX, top: e.clientY });
});

// GOOD — uses transform, no layout
document.addEventListener("mousemove", (e) => {
  gsap.quickTo(".box", "x", { duration: 0.5 })(e.clientX);
});
```

## quickTo

For rapid, repeated animations (mouse follow, parallax):

```javascript
const xTo = gsap.quickTo(".box", "x", { duration: 0.5, ease: "power2.out" });
const yTo = gsap.quickTo(".box", "y", { duration: 0.5, ease: "power2.out" });

document.addEventListener("mousemove", (e) => {
  xTo(e.clientX);
  yTo(e.clientY);
});
```

- Uses `will-change: transform` automatically.
- Bypasses the timeline/tween creation overhead.

## Batching

Batch similar animations to reduce overhead:

```javascript
ScrollTrigger.batch(".fade-in", {
  onEnter: (elements) => {
    gsap.to(elements, {
      opacity: 1,
      y: 0,
      stagger: 0.1,
      overwrite: true  // kill previous tweens on same targets
    });
  },
  start: "top 85%"
});
```

## will-change

GSAP automatically adds `will-change` to animated properties. You can override:

```javascript
gsap.to(".box", {
  x: 100,
  willChange: "transform"
});
```

**Only use `will-change` when you know the property will animate.** Excessive `will-change` causes GPU memory overhead.

## Force 3D

GSAP automatically uses `translateZ(0)` for GPU acceleration when needed:

```javascript
gsap.to(".box", {
  x: 100,
  force3D: true  // default for DOM elements
});
```

- `force3D: false` — disables forced 3D (for when you want 2D compositing).

## overwrite

Prevent competing tweens:

```javascript
gsap.to(".box", { x: 100, duration: 2 });
gsap.to(".box", { x: 200, duration: 1, overwrite: "auto" });
// or
gsap.to(".box", { x: 200, duration: 1, overwrite: true });
```

- `true` — immediately kills all active tweens on the same targets.
- `"auto"` — only kills overlapping properties.

## Reduce Motion

Respect user preference:

```javascript
let mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: reduce)", () => {
  gsap.set(".box", { opacity: 1 }); // instant, no animation
  return () => {};
});
```

## Mobile Considerations

- **Disable heavy post-processing** on mobile.
- **Reduce particle counts** on mobile.
- **Simplify easing** — avoid elastic/back on mobile.
- **Use simpler timelines** — fewer nested tweens.

```javascript
const isMobile = window.innerWidth <= 768;
const duration = isMobile ? 0.3 : 0.8;
```

## Profiling

```javascript
// Measure duration
console.time("animation");
gsap.to(".box", {
  x: 100,
  onComplete: () => console.timeEnd("animation")
});
```

Use Chrome DevTools Performance tab to find:
- Long frames (>16ms)
- Forced reflows
- GPU memory usage
- Scripting time

## Best Practices

- ✅ Use **transforms** and **autoAlpha** instead of layout properties.
- ✅ Use **quickTo** for mouse/touch-driven animations.
- ✅ Use **overwrite: true or "auto"** for competing tweens.
- ✅ Use **batch** for many similar elements.
- ✅ Use **gsap.matchMedia()** for reduced motion.
- ✅ Use **Timeline.kill()** and **ScrollTrigger.kill()** for cleanup.
- ✅ Profile with Chrome DevTools before optimizing.

## Do Not

- ❌ Animate layout properties (`width`, `height`, `margin`, `top`, `left`).
- ❌ Forget `overwrite` when animating the same targets rapidly.
- ❌ Overuse `will-change`.
- ❌ Forget to clean up ScrollTrigger on component unmount.
- ❌ Animate with `style.transform =` directly — GSAP manages the transform string.
