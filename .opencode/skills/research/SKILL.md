---
name: research
description: Investigate questions against high-trust primary sources. Capture findings as markdown.
---

# Research

## Core Rules

1. **Primary sources first.** Official docs > blog posts > Stack Overflow.
2. **Verify claims.** Don't repeat unverified information.
3. **Capture sources.** Always cite where information came from.
4. **Summarize, don't dump.** Distill findings into actionable knowledge.

## Workflow

### 1. Define the Question
- What exactly do you need to know?
- What would a good answer look like?
- What are the constraints?

### 2. Search Primary Sources
Priority order:
1. Official documentation
2. GitHub repos / source code
3. RFCs and specs
4. Official blog posts / changelogs
5. High-reputation community sources

### 3. Cross-Reference
- Check multiple sources for consistency
- Note version-specific information
- Verify code examples actually work

### 4. Capture Findings

```markdown
## Research: [Question]

### Summary
[2-3 sentence answer]

### Key Findings
1. [Finding 1] — Source: [link]
2. [Finding 2] — Source: [link]

### Code Example
[Working example if applicable]

### Caveats
- [Version-specific notes]
- [Known limitations]

### Sources
- [Source 1]: [link]
- [Source 2]: [link]
```

## Source Trust Levels

| Level | Sources |
|-------|---------|
| High | Official docs, source code, RFCs |
| Medium | Authoritative blogs, conference talks |
| Low | Stack Overflow, random blogs, AI outputs |

## Anti-patterns

- Relying on AI-generated code without verifying against docs
- Using outdated information without checking versions
- Not citing sources
- Copying code without understanding it
- Accepting the first answer without cross-referencing
