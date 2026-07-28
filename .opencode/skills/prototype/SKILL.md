---
name: prototype
description: Build multiple genuinely different versions of a UI piece, rendered behind a visual picker so you can flip through them live and promote the one that feels right.
disable-model-invocation: true
---

# Prototyping Variants

A divergence skill. Build several genuinely different versions of a UI piece, put them behind a visual picker, let the user choose a winner.

## Hard Rules

1. **Never touch production code during exploration.** Everything in an isolated prototype surface.
2. **Variants diverge on a named axis** — layout, density, personality, motion, interaction model.
3. **Every variant fully works.** Real interactions, real content. No lorem ipsum.
4. **Clean up after the choice.** Delete the prototype surface unless the user asks to keep it.

## Workflow

### Phase 1 — Scope
One thing per run. Restate the brief in one sentence.

### Phase 2 — Recon
Map stack, tokens, personality, context.

### Phase 3 — Choose directions
Default 3 variants. Each has a name and a stated axis. No two share an axis.

### Phase 4 — Build the picker harness
One variant at a time, full size, in realistic context. Switching is instant.

### Phase 5 — Verify and hand off

| # | Variant | Axis | When it's the right choice | Its cost |
| --- | --- | --- | --- | --- |

### Phase 6 — Promote on selection
Integrate the winner, delete the prototype surface.
