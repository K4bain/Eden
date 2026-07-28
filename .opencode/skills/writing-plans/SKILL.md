---
name: writing-plans
description: Write structured implementation plans before complex tasks. Break into steps with clear acceptance criteria.
---

# Writing Plans

## Core Rules

1. **Plan before implementing.** Complex tasks need structured approaches.
2. **Each step must have clear acceptance criteria.** No ambiguous steps.
3. **Steps should be independently verifiable.** You know when each is done.
4. **Keep steps small.** If a step takes >30 min, break it down further.

## Plan Template

```markdown
# [Task Name]

## Context
- What problem does this solve?
- What are the constraints?
- What exists today?

## Approach
[High-level strategy in 2-3 sentences]

## Steps

### Step 1: [Name]
**Goal:** [What this step achieves]
**Files:** [Files to create/modify]
**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### Step 2: [Name]
...

## Risks & Mitigations
- Risk: [description] → Mitigation: [action]

## Verification
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Manual verification complete
```

## When to Write a Plan

- More than 3 files affected
- Touching critical infrastructure
- Multiple people will review
- Changes span multiple domains (frontend + backend)
- You're unsure about the approach

## When NOT to Plan

- Trivial bug fixes
- Formatting/style changes
- Exploratory prototypes

## Quality Checklist

- [ ] Each step has measurable acceptance criteria?
- [ ] Dependencies between steps are clear?
- [ ] Risks are identified?
- [ ] Verification steps are defined?
- [ ] Plan can be followed by someone else?
