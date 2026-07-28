---
name: to-tickets
description: Break a plan, spec, or conversation into a set of tracer-bullet tickets, each declaring its blocking edges.
---

# To Tickets

Break work into **tracer bullet** tickets — vertical slices through every layer.

## Vertical Slice Rules

- Each slice cuts a narrow but COMPLETE path (schema, API, UI, tests)
- Completed slice is demoable/verifiable on its own
- Each slice fits in a single fresh context window
- Prefactoring should be done first

## Process

1. Gather context from conversation or spec
2. Explore codebase (optional)
3. Draft vertical slices with blocking edges
4. Quiz the user on granularity and blocking
5. Publish tickets

## Wide Refactors (Exception)

Use **expand–contract**: add new form beside old → migrate call sites in batches → delete old form.

## Ticket Format

Each ticket has:
- **Title** — short descriptive name
- **Blocked by** — which tickets must complete first
- **What it delivers** — end-to-end behavior this ticket makes work
- **Acceptance criteria** — checklist
