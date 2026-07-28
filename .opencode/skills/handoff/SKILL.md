---
name: handoff
description: Hand off context between sessions/agents. Capture what was done, what's next, what's blocked.
---

# Handoff

## Core Rules

1. **Never assume continuity.** The next session starts fresh.
2. **Be specific.** File paths, line numbers, exact state.
3. **Include blockers.** Don't hide problems.
4. **Keep it scannable.** Use structured format.

## Handoff Template

```markdown
# Handoff: [Date/Session]

## What Was Done
- [ ] [Task 1] — completed
- [ ] [Task 2] — completed
- [ ] [Task 3] — in progress (50%)

## Current State
- **Branch:** [name]
- **Last commit:** [hash and message]
- **Tests:** [passing/failing]
- **Build:** [status]

## In Progress
- [Task description]
- **Files being edited:**
  - `path/to/file.ts` — line 42: [what's there]
  - `path/to/other.ts` — line 18: [what's there]

## Next Steps
1. [Immediate next action]
2. [Following action]
3. [Future consideration]

## Blockers
- [Blocker 1]: [why it's blocked, what's needed]
- [Blocker 2]: [why it's blocked]

## Context Notes
- [Any non-obvious decisions made]
- [Why certain approaches were chosen]
- [Links to relevant docs/issues]
```

## When to Hand Off

- End of a work session
- Switching to a different task
- Hitting a blocker that requires input
- Before a long-running operation
- When context is getting too large

## Anti-patterns

- Vague status: "mostly done" (what specifically remains?)
- Forgetting to mention failed attempts
- Not noting which tests are failing
- Omitting environment setup requirements
- Leaving dirty working state without note
