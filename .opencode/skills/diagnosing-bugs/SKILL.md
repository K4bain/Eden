---
name: diagnosing-bugs
description: Diagnosis loop for hard bugs. Reproduce → isolate root cause → fix → verify.
---

# Diagnosing Bugs

## Core Rules

1. **Reproduce first.** No reproduction = no diagnosis.
2. **Isolate relentlessly.** Binary search through possibilities.
3. **Root cause, not symptoms.** Fix the cause, not the effect.
4. **Verify the fix.** Confirm it actually resolves the issue.

## Diagnosis Loop

### 1. Reproduce
- Get exact steps to trigger the bug
- Determine if it's consistent or intermittent
- Note environment details (OS, browser, versions)

### 2. Gather Evidence
- Error messages and stack traces
- Console output and logs
- Network requests and responses
- State before and after the bug

### 3. Isolate Root Cause
- Narrow down the code path
- Use binary search: comment out half the code, does it still happen?
- Add logging at key points
- Check recent changes (git log)

### 4. Form Hypothesis
- "The bug happens because X causes Y under condition Z"
- Design experiment to test hypothesis

### 5. Test Hypothesis
- Make minimal change to test theory
- If confirmed: apply fix
- If denied: next hypothesis

### 6. Fix and Verify
- Apply minimal fix
- Verify original reproduction case is resolved
- Check for regressions
- Run full test suite

## Debugging Tools Checklist

- [ ] Logs and error messages reviewed?
- [ ] Git history checked for recent changes?
- [ ] Reproduction steps confirmed?
- [ ] Environment variables verified?
- [ ] Network traffic inspected?
- [ ] State inspected at failure point?

## Anti-patterns

- Fixing symptoms instead of root cause
- Adding try/catch to hide errors
- Not verifying the fix actually works
- Giving up after one failed hypothesis
- Editing multiple files at once during diagnosis
