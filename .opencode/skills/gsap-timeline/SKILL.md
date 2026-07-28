---
name: gsap-timeline
description: Official GSAP skill for timelines — gsap.timeline(), position parameter, nesting, playback. Use when sequencing animations, choreographing keyframes, or when the user asks about animation sequencing, timelines, or animation order (in GSAP or when recommending a library that supports timelines).
license: MIT
---

# GSAP Timeline

## When to Use This Skill

Use when building sequences of GSAP animations with control over order, overlap, and timing. Timelines replace complex `delay` chains.

**Related skills:** For basics use **gsap-core**; for scroll-linked sequences use **gsap-scrolltrigger**; for performance use **gsap-performance**.

## Creating a Timeline

```javascript
const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "power2.out" } });
```

- `defaults` applies to every tween in the timeline (unless overridden per tween).
- Store the timeline reference to control it later.

## Position Parameter (the 3rd argument)

The position parameter controls when a tween starts relative to the timeline's progress:

```javascript
tl.to(".a", { x: 100 })          // starts at 0
  .to(".b", { x: 200 }, 0.5)     // starts at 0.5s
  .to(".c", { x: 300 }, "<")     // starts at same time as previous
  .to(".d", { x: 400 }, "<0.2")  // 0.2s after previous start
  .to(".e", { x: 500 }, "-=0.1") // 0.1s before previous ends
  .to(".f", { x: 600 }, ">");    // when previous ends
```

### Common position values

| Value | Meaning |
|-------|---------|
| `0.5` | Absolute time in seconds |
| `"<"` | Start at same time as previous |
| `"<0.2"` | 0.2s after previous start |
| `"<-0.5"` | 0.5s before previous start (negative overlap) |
| `"-=0.3"` | 0.3s before previous ends |
| `"+=1"` | 1s after previous ends |
| `">"` | When previous tween ends (alias for `"+=0"`) |

### Best practice

**Always use `<` or `-=x` for tight choreography.** Absolute numbers break when you reorder tweens.

## Duration

Set duration per tween or as a default:

```javascript
const tl = gsap.timeline({ defaults: { duration: 0.8 } });
tl.to(".a", { x: 100 })        // 0.8s
  .to(".b", { x: 200, duration: 1.2 }); // override to 1.2s
```

## Nesting

Nest child timelines inside a master timeline:

```javascript
const master = gsap.timeline();
const intro = gsap.timeline();
intro.to(".title", { opacity: 1, y: 0 })
     .to(".subtitle", { opacity: 1, y: 0 }, "-=0.3");

const main = gsap.timeline();
main.to(".content", { opacity: 1, y: 0 });

master.add(intro).add(main);
```

- Use `add()` or position parameter: `master.add(intro, 0.5)`.

## Labels

```javascript
const tl = gsap.timeline();
tl.to(".a", { x: 100 })
  .addLabel("phase2")
  .to(".b", { x: 200 }, "phase2")
  .addLabel("phase3", "+=0.2")
  .to(".c", { x: 300 }, "phase3");
```

## Playhead Control

```javascript
tl.play();
tl.pause();
tl.reverse();
tl.progress(0.5);
tl.seek("phase2");
tl.timeScale(0.5);  // half speed
tl.timeScale(2);    // double speed
tl.kill();
```

## Callbacks

```javascript
const tl = gsap.timeline({
  onStart: () => console.log("timeline started"),
  onUpdate: () => console.log("progress:", tl.progress()),
  onComplete: () => console.log("timeline complete"),
  paused: true
});
```

## Time

```javascript
tl.time();    // current position in seconds
tl.totalTime(); // total elapsed including repeats
tl.duration(); // total duration of all children
tl.kill();
```

## Loop

```javascript
const tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 1 } });
tl.to(".a", { x: 200 })
  .to(".b", { y: 200 })
  .to(".a", { x: 0 })
  .to(".b", { y: 0 });
```

## ScrollTrigger Integration

```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".section",
    start: "top 80%",
    end: "bottom 20%",
    scrub: true
  }
});
```

See **gsap-scrolltrigger** skill for details.

## Best Practices

- ✅ Use **defaults** for shared settings.
- ✅ Use **position parameter** instead of `delay` for sequencing.
- ✅ Use **labels** when you have complex multi-phase sequences.
- ✅ Store and control via the return value.
- ✅ Combine with **ScrollTrigger** for scroll-driven sequences.
- ✅ Use **yoyo** for seamless looping animations.
- ✅ Return function from GSAP context for cleanup.

## Do Not

- ❌ Forget the position parameter is the 3rd argument to `.to()`/`.from()`/`.fromTo()`.
- ❌ Use `delay` when position parameter works (position parameter is relative to sibling tweens).
- ❌ Overuse labels when simple position values work.
- ❌ Skip cleanup when component unmounts (use `context.add(() => { /* cleanup */ })`).
