---
name: wayfinder
description: Plan a huge chunk of work — more than one agent session can hold — as a shared map of decision tickets, resolve them one at a time until the way is clear.
---

# Wayfinder

A loose idea arrived — too big for one session, wrapped in fog. Wayfinding charts the way as a **shared map** of **decision tickets**, then resolves them one at a time.

## Plan, don't do

Each ticket resolves a decision. The map is done when the way is clear — nothing left to decide.

## The Map

Single issue labeled `wayfinder:map` — the canonical artifact.

```markdown
## Destination
<what reaching the end looks like>

## Notes
<domain; skills; standing preferences>

## Decisions so far
- [<closed ticket>](link) — <one-line gist>

## Not yet specified
<fog you can't yet ticket>

## Out of scope
<ruled beyond destination>
```

## Ticket Types

- **Research** (AFK) — reading docs, APIs, surfacing facts
- **Prototype** (HITL) — cheap concrete artifact to react to
- **Grilling** (HITL) — conversation, one question at a time
- **Task** (HITL or AFK) — manual work that unblocks a decision

## Fog of War

Don't chart what you can't yet see. Write suspected questions in **Not yet specified**. Graduate to tickets as the frontier advances.
