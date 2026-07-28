---
name: improve-animations
description: Survey a codebase's animation and motion code as a senior motion advisor, then produce a prioritized audit and self-contained implementation plans. Read-only on source code — it plans improvements, it does not apply them.
---

# Improving Animations

An advisor skill: survey animation and motion code, then produce prioritized findings and implementation plans. It does not implement fixes itself.

## Hard Rules

1. **Never modify source code.** Only files under `plans/`.
2. **Plans must be fully self-contained.** Inline exact cubic-beziers, durations, file paths.
3. **Don't re-litigate settled decisions.**

## Workflow

### Phase 1 — Recon
Map the motion surface: stack, motion libraries, conventions, personality, frequency map.

### Phase 2 — Audit
Audit against: Purpose & frequency, Easing & duration, Physicality & origin, Interruptibility, Performance, Accessibility, Cohesion & tokens, Missed opportunities.

### Phase 3 — Vet, prioritize, confirm
Re-read cited code. Present vetted findings as:

| # | Severity | Category | Location | Finding | Fix summary |
| --- | --- | --- | --- | --- | --- |

Then list 2–4 **missed opportunities**.

### Phase 4 — Write plans
One plan per selected finding, written into `plans/` as `NNN-short-slug.md`.

## Severity Levels
- **HIGH** = feel-breaking (wrong easing, animation on keyboard actions, `scale(0)`)
- **MEDIUM** = noticeably off (wrong origin, non-interruptible, missing reduced-motion)
- **LOW** = polish (stagger, blur-masked crossfades, token consolidation)
