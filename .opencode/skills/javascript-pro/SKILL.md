---
name: javascript-pro
description: Expert JavaScript/TypeScript developer. ES2023+, modern patterns, performance, security.
---

# JavaScript Pro

## ES2023+ Features

- `const` / `let` only (no `var`)
- Optional chaining `?.`
- Nullish coalescing `??`
- Array methods: `findLast`, `findLastIndex`, `at()`, `toSorted`, `toReversed`, `toSpliced`
- `structuredClone` for deep copy
- `Promise.allSettled`, `Promise.any`
- Top-level await in ESM
- `Array.fromAsync`
- `Object.groupBy`, `Map.groupBy`
- `Set` methods: `union`, `intersection`, `difference`, `symmetricDifference`

## Patterns

- Prefer ESM (`import`/`export`) over CommonJS
- Use `async`/`await` over `.then()` chains
- Destructure in parameters
- Template literals over string concatenation
- Spread/rest over `arguments`
- `Map`/`Set` over plain objects for collections
- Optional chaining + nullish coalescing over ternary checks

## Performance

- Avoid memory leaks: clean up event listeners, intervals, observers
- Use `WeakRef` and `FinalizationRegistry` for caching
- Prefer `queueMicrotask` over `Promise.resolve().then()`
- Use `AbortController` for cancellable fetches

## Security

- Never use `eval()` or `Function()` constructor
- Sanitize user input for XSS
- Use `Content-Security-Policy` headers
- Never commit secrets or keys
