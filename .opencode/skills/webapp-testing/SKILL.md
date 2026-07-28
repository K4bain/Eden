---
name: webapp-testing
description: Testing patterns for web apps. Unit, integration, E2E. Mock boundaries, test behavior not implementation.
---

# Web App Testing

## Core Rules

1. **Test pyramid.** Many unit tests, fewer integration tests, minimal E2E.
2. **Mock at boundaries.** Mock external services, not internal modules.
3. **Test user-visible behavior.** Not internal implementation details.
4. **Isolate tests.** Each test should be independent and repeatable.

## Test Types

### Unit Tests
- Test individual functions/components in isolation
- Fast, many of them
- Mock external dependencies
- Example: testing a date formatter, a utility function

### Integration Tests
- Test how modules work together
- Use real dependencies where practical
- Fewer than unit tests
- Example: API endpoint with database

### End-to-End (E2E) Tests
- Test complete user flows
- Use real browser/app
- Slow, expensive, fragile
- Example: user login flow, checkout process

## Mocking Rules

### What to Mock
- External APIs
- Authentication services
- File system (for unit tests)
- Time-dependent functions
- Random generators

### What NOT to Mock
- Internal business logic
- Data transformations
- Database (for integration tests)
- Your own modules

## Web App Test Patterns

```javascript
// Unit: Pure function
test('formats currency correctly', () => {
  expect(formatCurrency(1234.56)).toBe('$1,234.56');
});

// Integration: API endpoint
test('GET /users returns user list', async () => {
  const res = await request(app).get('/users');
  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(3);
});

// E2E: User flow
test('user can log in and see dashboard', async () => {
  await page.fill('#email', 'user@example.com');
  await page.fill('#password', 'password');
  await page.click('#login');
  await expect(page.locator('.dashboard')).toBeVisible();
});
```

## Anti-patterns

- Testing implementation details instead of behavior
- Mocking everything (unrealistic tests)
- E2E tests for simple unit-testable logic
- Flaky tests (time-dependent, order-dependent)
- Not cleaning up test data between runs
