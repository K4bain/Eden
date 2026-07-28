---
name: owasp-security
description: Use when reviewing code for security vulnerabilities, implementing authentication/authorization, handling user input, or discussing web application security. Covers OWASP Top 10:2025, ASVS 5.0, LLM Top 10 (2025), and Agentic AI security (2026).
---

# OWASP Security Best Practices

Apply these security standards when writing or reviewing code.

## OWASP Top 10:2025

| # | Vulnerability | Key Prevention |
|---|---------------|----------------|
| A01 | Broken Access Control | Deny by default, enforce server-side, verify ownership |
| A02 | Security Misconfiguration | Harden configs, disable defaults, minimize features |
| A03 | Software Supply Chain Failures | Lock versions, verify integrity, audit dependencies |
| A04 | Cryptographic Failures | TLS 1.2+, AES-256-GCM, Argon2/bcrypt for passwords |
| A05 | Injection | Parameterized queries, input validation, safe APIs |
| A06 | Insecure Design | Threat model, rate limit, design security controls |
| A07 | Authentication Failures | MFA, check breached passwords, secure sessions |
| A08 | Software or Data Integrity Failures | Sign packages, SRI for CDN, safe serialization |
| A09 | Security Logging and Alerting Failures | Log security events, structured format, alerting |
| A10 | Mishandling of Exceptional Conditions | Fail-closed, hide internals, log with context |

## Before Reporting a Finding

Confirm all three before reporting:

1. **Is the input actually attacker-controlled?** Trace it to a real entry point.
2. **Is the sink reachable with that input?** Check if validation/ORM/middleware already sits between.
3. **What is the blast radius?** Who can trigger it, what do they get, does it cross a trust boundary?

## Security Code Review Checklist

### Input Handling
- All user input validated server-side
- Parameterized queries (not string concatenation)
- Input length limits enforced
- Allowlist validation preferred over denylist

### Authentication & Sessions
- Passwords hashed with Argon2/bcrypt (not MD5/SHA1)
- Session tokens have 128+ bits entropy
- Sessions invalidated on logout
- MFA available for sensitive operations

### Access Control
- Authorization checked on every request
- Object references user cannot manipulate
- Deny by default policy
- Privilege escalation paths reviewed

### Data Protection
- Sensitive data encrypted at rest
- TLS for all data in transit
- No sensitive data in URLs/logs
- Secrets in environment/vault (not code)

### Error Handling
- No stack traces exposed to users
- Fail-closed on errors (deny, not allow)
- All exceptions logged with context
- Consistent error responses (no enumeration)

## Secure Code Patterns

### SQL Injection Prevention
```python
# UNSAFE
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
# SAFE
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
```

### Password Storage
```python
# UNSAFE
hashlib.md5(password.encode()).hexdigest()
# SAFE
from argon2 import PasswordHasher
PasswordHasher().hash(password)
```

### Access Control
```python
# UNSAFE - No authorization check
@app.route('/api/user/<user_id>')
def get_user(user_id):
    return db.get_user(user_id)

# SAFE - Authorization enforced
@app.route('/api/user/<user_id>')
@login_required
def get_user(user_id):
    if current_user.id != user_id and not current_user.is_admin:
        abort(403)
    return db.get_user(user_id)
```

### Fail-Closed Pattern
```python
# UNSAFE - Fail-open
def check_permission(user, resource):
    try:
        return auth_service.check(user, resource)
    except Exception:
        return True  # DANGEROUS!

# SAFE - Fail-closed
def check_permission(user, resource):
    try:
        return auth_service.check(user, resource)
    except Exception as e:
        logger.error(f"Auth check failed: {e}")
        return False  # Deny on error
```

## ASVS 5.0 Key Requirements

### Level 1 — minimum bar
- Passwords at least 8 characters (15+ recommended)
- Block top 3000 common passwords
- Session tokens from CSPRNG with 128+ bits entropy
- Authorization enforced at trusted service layer
- Parameterized queries / ORM for all data access
- TLS 1.2+ on all external traffic
- No sensitive data in URLs or query strings

### Level 2 — what most apps should target
- MFA available
- Passwords checked against breached-password set
- All security logging (authentication attempts, failed auth, security events)
- Logs protected from modification, shipped off-box

## Agentic AI Security (OWASP 2026)

| Risk | Mitigation |
|------|------------|
| Agent Goal Hijacking | Input sanitization, goal boundaries, behavioral monitoring |
| Tool Misuse | Least privilege, fine-grained permissions, validate I/O |
| Identity & Privilege Abuse | Short-lived scoped tokens, identity verification |
| Memory & Context Poisoning | Validate stored content, segment by trust level |
| Cascading Failures | Circuit breakers, graceful degradation, isolation |
