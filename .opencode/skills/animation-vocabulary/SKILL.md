---
name: animation-vocabulary
description: Reverse-lookup glossary that turns a vague description of a web animation or motion effect into its exact term. Use when the user asks "what's it called when…", or describes a motion effect without knowing its name.
---

# Animation Vocabulary

Turn a vague description of a motion or effect into the precise term, so the user knows what to ask for.

## Quick Start

The user describes an effect loosely. You return the matching term(s) in this format:

```
**Stagger** — Animate several items one after another with a small delay between each, creating a cascade.
```

If several terms could fit, list the best match first, then 1–2 alternates with a one-line note on how they differ.

## Glossary

### Entrances & Exits
- **Fade in / Fade out** — Element appears or disappears by changing opacity.
- **Slide in** — Element enters by sliding in from off-screen.
- **Scale in** — Element grows from smaller to full size as it appears, often paired with a fade.
- **Pop in** — Element appears with a slight overshoot, like it bounces into place.
- **Reveal** — Content is uncovered gradually, often by animating a clip-path or mask.

### Sequencing & Timing
- **Keyframes** — Defined points in an animation that the browser fills the gaps between.
- **Interpolation / Tween** — Generating all the in-between frames between a start and end value.
- **Stagger** — Animate several items one after another with a small delay between each.
- **Orchestration** — Deliberately timing multiple animations so they feel like one coordinated motion.

### Movement & Transforms
- **Translate** — Move an element along the X or Y axis.
- **Scale** — Make an element bigger or smaller.
- **Rotate** — Spin an element around a point.
- **3D tilt / Flip** — Rotate in 3D space to add depth.
- **Transform origin** — The anchor point a scale or rotation grows or spins from.
- **Origin-aware animation** — An element animates out of its trigger, not from center.

### Transitions Between States
- **Crossfade** — One element fades out as another fades in, in the same spot.
- **Morph** — One shape smoothly turns into another shape.
- **Shared element transition** — An element travels and transforms from one position into another.
- **Layout animation** — When an element's size or position changes, it animates to the new spot.
- **Accordion / Collapse** — A section smoothly expands and collapses its height.

### Scroll
- **Scroll reveal** — Elements fade or slide into place as they enter the viewport.
- **Scroll-driven animation** — An animation whose progress is tied directly to scroll position.
- **Parallax** — Background and foreground move at different speeds while scrolling.

### Feedback & Interaction
- **Hover effect** — Visual change when the cursor moves over an element.
- **Press / Tap feedback** — A subtle scale-down when an element is clicked.
- **Hold to confirm** — A progress effect that fills up while the user holds a button.
- **Rubber-banding** — Resistance and snap-back when you drag past a boundary.
- **Ripple** — A circle expanding from the point of a tap.

### Easing
- **Ease-out** — Starts fast, ends slow. Default for most UI.
- **Ease-in** — Starts slow, ends fast. Usually avoided.
- **Ease-in-out** — Slow, fast, slow. Good for elements already on screen.
- **Linear** — Constant speed. Reserve for spinners or marquees.
- **Cubic-bezier** — A custom easing curve for precise control.

### Spring Animations
- **Spring** — Motion driven by physics rather than a set duration.
- **Stiffness / Tension** — How strongly the spring pulls toward its target.
- **Damping** — How quickly a spring settles.
- **Bounce** — A spring that overshoots and settles.
- **Interruptible animation** — An animation that can be smoothly redirected mid-flight.

### Looping & Ambient Motion
- **Marquee** — Text or content that scrolls continuously in a loop.
- **Float** — A gentle, continuous up-and-down drift.
- **Pulse** — A gentle repeating scale or opacity change.

### Polish & Effects
- **Clip-path** — Clipping an element to a shape, used for reveals and masks.
- **Skeleton / Shimmer** — A placeholder with a moving sheen shown while content loads.
- **Number ticker** — Digits rolling or counting up to a value.
- **Typewriter** — Text appearing one character at a time.

### Performance
- **Frame rate (FPS)** — Frames drawn per second. 60fps baseline.
- **Jank** — Visible stutter when the browser drops frames.
- **Compositing** — Letting the GPU move or fade an element on its own layer.
- **will-change** — A CSS hint that an element is about to animate.
- **Layout thrashing** — Animating properties that force the browser to recalculate layout every frame.

### Principles
- **Purposeful animation** — Motion should serve a function, not just decorate.
- **Spatial consistency** — Animating so an element keeps its identity and position across states.
- **Hardware acceleration** — Animating transform and opacity for smooth GPU-powered motion.
- **Reduced motion** — Respecting prefers-reduced-motion by toning down or removing motion.
