---
name: verification-before-completion
description: Force verification pass before marking ANY task complete. Run tests, check types, verify edge cases.
---

# Verification Before Completion

## Core Rule

**Never claim a task is complete without running verification.** "I think it works" is not acceptable.

## Mandatory Checks

Before marking ANY task complete, run ALL that apply:

### 1. Type Check
```bash
npm run typecheck    # or tsc --noEmit
```

### 2. Lint
```bash
npm run lint         # or eslint .
```

### 3. Tests
```bash
npm test             # or the project's test command
```

### 4. Build
```bash
npm run build        # verify production build succeeds
```

### 5. Manual Verification
- Open the affected page/feature in a browser.
- Test the happy path.
- Test at least 2 edge cases.
- Check browser console for errors.

## Verification Report

After running checks, report:
- What was verified
- Results (pass/fail)
- Any edge cases tested
- Screenshots if UI was affected

## What to Do If Verification Fails

1. **Do not claim completion.**
2. Identify the failure.
3. Fix it.
4. Re-run the full verification.

## Anti-patterns

- Skipping tests because "the change is small"
- Running only one test instead of the full suite
- Not checking the build output
- Assuming types are correct without running typecheck
- Forgetting to verify in the target environment
