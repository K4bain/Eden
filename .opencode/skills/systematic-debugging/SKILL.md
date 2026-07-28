---
name: systematic-debugging
description: Hypothesis-driven debugging. Observe → hypothesize → test → verify. Never random edits.
---

# Systematic Debugging

## Core Rules

1. **Never edit code randomly.** Every change must be backed by a hypothesis.
2. **Narrow scope first.** Determine the smallest possible reproduction case.
3. **One hypothesis at a time.** Test one theory before moving to the next.
4. **Document observations.** Write down what you see, not what you assume.

## Workflow

### 1. Observe
- Reproduce the bug. If you can't reproduce it, you can't verify the fix.
- Collect error messages, stack traces, logs.
- Note the exact steps to trigger the issue.

### 2. Hypothesize
- Form a specific, testable hypothesis: "The bug occurs because X causes Y."
- Rank hypotheses by likelihood.
- Start with the most likely cause.

### 3. Test
- Design the smallest possible experiment to confirm/deny the hypothesis.
- Use logging, breakpoints, or assertions to verify.
- Change ONE thing at a time.

### 4. Verify
- Confirm the fix resolves the original reproduction case.
- Check that no regressions were introduced.
- Test edge cases.

## Anti-patterns to Avoid

- Editing multiple files hoping something fixes it
- Skipping reproduction to jump to a "solution"
- Ignoring error messages that don't match your theory
- Declaring victory without running tests

## Decision Tree

```
Bug reported
  → Can reproduce? → No → Gather more info, stop editing
  → Yes → Identify minimal reproduction
    → Form hypothesis → Test hypothesis
      → Confirmed → Apply fix → Verify → Done
      → Denied → Next hypothesis → Repeat
```
