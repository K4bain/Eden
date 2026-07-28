---
name: code-review
description: Review code changes for correctness, security, performance, and maintainability. Be specific with file:line references.
---

# Code Review

## Core Rules

1. **Be specific.** Reference file:line for every comment.
2. **Explain the why.** Don't just say "bad" — explain the risk.
3. **Suggest alternatives.** Criticism without solutions is noise.
4. **Prioritize.** Distinguish blocking issues from suggestions.

## Review Checklist

### Correctness
- Does the code do what it claims?
- Are edge cases handled?
- Are error conditions handled?
- Is the logic sound?

### Security
- User input sanitized?
- SQL injection prevented?
- Secrets not exposed?
- Auth/authorization checked?
- XSS vectors addressed?

### Performance
- N+1 queries?
- Unnecessary re-renders?
- Missing indexes?
- Large payloads?
- Memory leaks?

### Maintainability
- Clear naming?
- Functions do one thing?
- No code duplication?
- Tests included?
- Comments where needed?

### Architecture
- Follows existing patterns?
- Dependencies make sense?
- Module boundaries respected?
- API contracts clear?

## Comment Format

```
**[severity: blocking|suggestion|nit]** file:line
Issue: [what's wrong]
Risk: [why it matters]
Fix: [how to fix it]
```

## Severity Levels

- **blocking:** Must fix before merge. Security holes, data loss, broken functionality.
- **suggestion:** Should fix. Improves quality but not critical.
- **nit:** Nice to have. Style, naming, minor improvements.

## Anti-patterns

- Reviewing only the diff without understanding context
- Nitpicking style when logic is broken
- Approving without actually reading the code
- Not testing the changes locally
