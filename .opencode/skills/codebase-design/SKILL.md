---
name: codebase-design
description: Shared vocabulary for designing deep modules. Use when designing or improving a module's interface, finding deepening opportunities, deciding where a seam goes, or making code more testable.
---

# Codebase Design

Design **deep modules**: a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface.

## Glossary

- **Module** — anything with an interface and implementation
- **Interface** — everything a caller must know: type signature, invariants, ordering constraints, error modes, performance
- **Implementation** — what's inside
- **Depth** — leverage at the interface (behavior per unit of interface)
- **Seam** — place where you can alter behaviour without editing there
- **Adapter** — concrete thing satisfying an interface at a seam
- **Leverage** — what callers get from depth
- **Locality** — what maintainers get from depth

## Deep vs Shallow

**Deep** = small interface + lots of implementation
**Shallow** = large interface + little implementation

## Principles

- **Depth is a property of the interface, not the implementation**
- **The deletion test** — if deleting it concentrates complexity, it's earning its keep
- **The interface is the test surface** — callers and tests cross the same seam
- **One adapter = hypothetical seam. Two = real.**

## Designing for testability

1. Accept dependencies, don't create them
2. Return results, don't produce side effects
3. Small surface area
