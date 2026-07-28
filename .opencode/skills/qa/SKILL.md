---
name: qa
description: Quality assurance. Test edge cases, verify behavior matches intent, check error handling.
---

# Quality Assurance

## Core Rules

1. **Test behavior, not implementation.** Tests should survive refactors.
2. **Cover the unhappy path.** Happy path tests are insufficient.
3. **Verify error handling.** What happens when things go wrong?
4. **Check boundaries.** Edge cases reveal real bugs.

## QA Checklist

### Functional Testing
- [ ] Happy path works
- [ ] Invalid input handled gracefully
- [ ] Empty/null values handled
- [ ] Boundary values tested (0, 1, max, negative)
- [ ] Concurrent access safe (if applicable)

### Error Handling
- [ ] Network failures handled
- [ ] Timeout behavior correct
- [ ] Error messages are helpful
- [ ] Errors don't leak sensitive info
- [ ] Recovery possible after errors

### Data Integrity
- [ ] Input validation correct
- [ ] Data persistence works
- [ ] Race conditions handled
- [ ] Partial failures handled

### User Experience
- [ ] Loading states shown
- [ ] Empty states handled
- [ ] Feedback on actions provided
- [ ] Keyboard accessible (if UI)

## Edge Cases to Always Test

| Category | Examples |
|----------|----------|
| Empty | Empty string, empty array, null, undefined |
| Boundary | Zero, one, max value, negative |
| Invalid | Wrong type, special characters, injection |
| Concurrent | Multiple simultaneous operations |
| Timeout | Slow network, long operations |
| Resource | Disk full, memory low, rate limited |

## Test Documentation

```markdown
### Test: [Description]
- **Preconditions:** [what must be true before]
- **Steps:** [what to do]
- **Expected:** [what should happen]
- **Edge cases:** [variations to test]
```

## Anti-patterns

- Testing only the happy path
- Skipping error handling tests
- Not testing with real data patterns
- Ignoring intermittent failures
- Testing implementation details instead of behavior
