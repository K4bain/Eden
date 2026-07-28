---
name: subagent-driven-development
description: Orchestrate specialized subagents for different parts of a task. Each gets a focused prompt and clear output contract.
---

# Subagent-Driven Development

## Core Rules

1. **Each subagent gets ONE focused task.** No multi-responsibility agents.
2. **Define the output contract upfront.** Specify exactly what the subagent produces.
3. **Provide all necessary context.** Subagents can't browse your codebase freely.
4. **Verify subagent output.** Trust but verify.

## When to Use Subagents

- Independent tasks that can run in parallel
- Tasks requiring different expertise or context
- Large tasks that benefit from decomposition
- Tasks where you want isolated failure domains

## Subagent Prompt Template

```
## Task
[One sentence describing what to do]

## Context
- Project: [name and tech stack]
- Relevant files: [list specific files]
- Existing patterns: [describe conventions]

## Input
[What the subagent receives]

## Output Contract
- Create/modify: [specific files]
- Format: [how output should look]
- Constraints: [must not do X, must use Y]

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
```

## Orchestration Pattern

```
Main Agent
  ├→ Subagent A: [task] → output verified? → merge
  ├→ Subagent B: [task] → output verified? → merge
  └→ Subagent C: [task] → output verified? → merge
         ↓
    Integrate & verify holistically
```

## Anti-patterns

- Giving one subagent too many responsibilities
- Not providing enough context (subagent guesses)
- Accepting output without verification
- Using subagents for sequential tasks that need shared state
- Creating subagents for trivial tasks (overhead > benefit)
