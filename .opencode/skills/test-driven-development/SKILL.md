---
name: test-driven-development
description: Red-green-refactor. Write failing test first, implement minimal fix, verify, refactor.
---

# Test-Driven Development

## Core Rules

1. **Test must fail before implementation.** A passing test proves nothing new.
2. **Write the minimal test** that captures the requirement.
3. **Write the minimal code** that makes the test pass.
4. **Refactor only after green.** Never refactor with failing tests.

## Workflow: Red-Green-Refactor

### Red
- Write a test that describes the desired behavior.
- Run the test. It MUST fail.
- If it passes, your test is wrong or the feature already exists.

### Green
- Write the simplest code that makes the test pass.
- No extra features, no premature optimization.
- Run all tests. All must pass.

### Refactor
- Clean up the code. Remove duplication.
- Improve naming. Extract methods.
- Run tests again to confirm nothing broke.

## Practical Guidelines

- **Test behavior, not implementation.** Tests should survive refactors.
- **One assert per test** when possible. Each test verifies one thing.
- **Name tests descriptively:** `test_<unit>_<condition>_<expected>()`
- **Use real dependencies** where practical. Mock only external boundaries.

## When TDD is Less Applicable

- UI layout and visual design (use visual regression instead)
- Exploratory prototyping (throwaway code)
- Third-party integration verification (start with integration test)

## Quick Checklist

- [ ] Test written and failing?
- [ ] Test captures the requirement clearly?
- [ ] Implementation is minimal?
- [ ] All tests pass?
- [ ] Code is clean and readable?
