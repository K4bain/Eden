---
name: improve-codebase-architecture
description: Scan codebase for architectural improvements. Present candidates, grill through them, implement the chosen one.
---

# Improve Codebase Architecture

## Core Rules

1. **Audit first.** Understand what exists before proposing changes.
2. **Present candidates.** Offer options, not mandates.
3. **Grill each candidate.** Challenge assumptions, find weaknesses.
4. **Implement one improvement at a time.** Don't overhaul everything.

## Workflow

### 1. Audit the Codebase
- Identify architectural patterns in use
- Find pain points (duplication, coupling, complexity)
- Note what works well (don't break good things)
- Check for architectural decay

### 2. Generate Candidates
For each improvement opportunity:
```markdown
### Candidate: [Name]
- **Problem:** [what's wrong today]
- **Proposal:** [what to change]
- **Files affected:** [list]
- **Effort:** [S/M/L]
- **Risk:** [low/medium/high]
- **Benefit:** [what improves]
```

### 3. Grill Each Candidate
- Does this solve a real problem?
- What could go wrong?
- Is there a simpler alternative?
- Are we creating new problems?
- Is the timing right?

### 4. Select and Implement
- Choose the highest-value, lowest-risk candidate
- Write a detailed plan
- Implement with verification at each step
- Confirm the improvement actually helps

## Common Architecture Smells

- God modules (one file does everything)
- Circular dependencies
- Leaky abstractions
- Inconsistent patterns
- Missing boundaries between domains
- Premature abstraction

## Anti-patterns

- Refactoring for refactoring's sake
- Changing architecture without understanding the domain
- Big-bang rewrites
- Ignoring team familiarity with patterns
- Optimizing for theoretical future needs
