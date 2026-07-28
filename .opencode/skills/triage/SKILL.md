---
name: triage
description: Move issues through triage: categorize, verify, prioritize, write agent-ready briefs.
---

# Triage

## Core Rules

1. **Verify before prioritizing.** Can you reproduce it?
2. **Categorize precisely.** Bug, feature, refactor, docs, infra.
3. **Write briefs, not tickets.** Agent-ready means specific and actionable.
4. **Time-box triage.** Don't spend more time triaging than the issue deserves.

## Workflow

### 1. Receive Issue
- Read the full description
- Check for duplicates
- Note any reproduction steps

### 2. Verify
- Can you reproduce the issue?
- Is it actually a bug or expected behavior?
- What's the impact? (blocks work / annoying / cosmetic)

### 3. Categorize

| Category | Description |
|----------|-------------|
| bug | Something is broken |
| feature | New functionality needed |
| refactor | Code improvement, no behavior change |
| docs | Documentation update |
| infra | Infrastructure/tooling |
| security | Security concern |
| performance | Speed/efficiency issue |

### 4. Prioritize

- **P0 (Critical):** Data loss, security breach, production down
- **P1 (High):** Major feature broken, blocks other work
- **P2 (Medium):** Important but not urgent
- **P3 (Low):** Nice to have, cosmetic

### 5. Write Agent-Ready Brief

```markdown
## Brief: [Title]

**Category:** [type]
**Priority:** [P0-P3]
**Status:** [verified/unverified/blocked]

### Problem
[What's wrong, specific and factual]

### Reproduction
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Impact
[Who/what is affected]

### Suggested Approach
[If you have ideas, include them]
```

## Anti-patterns

- Triaging without reproducing
- Writing vague briefs: "X is broken"
- Skipping priority assignment
- Not checking for duplicates
- Spending hours on a P3 issue
