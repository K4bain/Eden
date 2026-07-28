---
name: find-animation-opportunities
description: Search a codebase or UI for places that don't animate but should, and reject everything that shouldn't. Read-only; proposes motion with exact values, does not implement.
---

# Finding Animation Opportunities

A search skill. Sweep an interface for moments that would genuinely benefit from motion, and propose a precise recipe for each.

## The Gate

Every candidate must survive all four questions:

1. **Frequency** — 100+/day = Reject. Tens/day = Reject or near-imperceptible. Occasional = Eligible. Rare/first-time = Eligible.
2. **Purpose** — Must be: Feedback, Spatial consistency, State indication, Preventing a jarring change, Explanation, or Delight (rare only).
3. **Speed** — Must work within UI budgets (under 300ms).
4. **Function** — Does motion help or hinder here?

## Where to Hunt

- **Feedback gaps** — Pressable elements with no `:active` state
- **Teleporting state** — Content that swaps instantly with no bridge
- **Missing spatial story** — Panels with no connection to their trigger
- **Group entrances** — Grids that pop in all at once
- **Gesture seams** — Draggable elements with no physics
- **The delight budget** — Rare, high-emotion moments rendered flat

## Required Output Format

### Part 1 — Opportunities table

| # | Location | Today | Purpose | Frequency | Suggested motion |
| --- | --- | --- | --- | --- | --- |

### Part 2 — Rejected candidates

List 2–5 places deliberately NOT suggested, with the gate question that killed them.

### Part 3 — Verdict

One paragraph: how much motion this interface needs, which single suggestion has the highest leverage.
