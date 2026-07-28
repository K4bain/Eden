---
name: domain-modeling
description: Build and sharpen a project's domain model. Pin down terminology, ubiquitous language, and relationships.
---

# Domain Modeling

## Core Rules

1. **One name per concept.** No synonyms. No ambiguity.
2. **Domain terms are everywhere.** Code, comments, docs, conversations.
3. **Relationships are explicit.** Define how entities connect.
4. **Invariants are documented.** What must always be true?

## Workflow

### 1. Extract Terminology
- Scan existing code for entity names
- List all nouns used in the domain
- Identify synonyms and conflicts

### 2. Define Entities
```markdown
### [Entity Name]
- **Definition:** [one sentence]
- **Key Attributes:** [list essential properties]
- **Invariants:** [rules that must always hold]
- **Relationships:** [connections to other entities]
```

### 3. Map Relationships
```
User ──has many──→ Project
Project ──contains──→ Task
Task ──assigned to──→ User
```

### 4. Validate with Code
- Do variable names match domain terms?
- Do function names use domain language?
- Are invariants enforced in code?

## Ubiquitous Language Rules

| Do | Don't |
|----|-------|
| Use `User` everywhere | Mix `User`, `Account`, `Person`, `Member` |
| Call it `Order` in code and docs | Code says `Order`, docs say `Purchase` |
| Name methods with domain verbs | Use generic names like `process` or `handle` |

## Deliverable

Create `DOMAIN.md` at project root with:
- Entity definitions
- Relationship diagram (text or Mermaid)
- Key invariants
- Glossary of terms

## Anti-patterns

- Multiple names for the same concept
- Domain model only in documentation, not in code
- Anemic model (entities with no behavior)
- Ignoring existing domain terms in favor of technical names
