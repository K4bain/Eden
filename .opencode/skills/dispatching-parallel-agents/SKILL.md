---
name: dispatching-parallel-agents
description: Split independent work across parallel subagents. Identify which tasks can run concurrently vs sequentially.
---

# Dispatching Parallel Agents

## Core Rules

1. **Identify true independence.** Tasks are parallel only if they share no state.
2. **Define clear boundaries.** Each agent writes to different files.
3. **Plan integration.** Know how outputs combine before starting.
4. **Handle conflicts.** If agents might conflict, sequence them instead.

## Dependency Analysis

### Can Run in Parallel
- Different files, no shared dependencies
- Read-only operations on shared data
- Independent features with separate modules
- Tests for unrelated components

### Must Run Sequentially
- Same file modifications
- Output of Agent A is input for Agent B
- Shared state that both modify
- Database migrations (order matters)

## Dispatch Workflow

### 1. Map the Task Graph
```
Task A ──┐
Task B ──┼──→ Integration ──→ Final Verification
Task C ──┘
```

### 2. Assign Agents
- Agent A → Task A (files: [list])
- Agent B → Task B (files: [list])
- Agent C → Task C (files: [list])

### 3. Provide Each Agent With
- Their specific task and files
- A lock on their files (no overlap)
- Integration point details
- Output format specification

### 4. Collect and Integrate
- Verify each agent's output independently
- Check for integration conflicts
- Run combined tests

## Conflict Prevention

| Scenario | Solution |
|----------|----------|
| Two agents edit same file | Sequence them |
| Agents need same dependency | Provide dependency context to both |
| Output must merge | Define merge strategy upfront |

## Anti-patterns

- Parallelizing for the sake of it when sequential is simpler
- Not checking for file conflicts before dispatching
- Assuming agents will coordinate (they won't)
- Running 10 agents when 2-3 would suffice
