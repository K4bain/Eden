---
name: web-security
description: Practical web security checklist — CORS, CSP, XSS, CSRF, HTTPS, rate limiting, input sanitization, secrets management. Use when setting up a new web app, reviewing security posture, or implementing auth.
---

# Web Security Checklist

## HTTPS & Transport
- [ ] TLS 1.2+ on all external traffic
- [ ] HSTS header with long max-age (1 year+)
- [ ] Redirect HTTP → HTTPS
- [ ] Secure, HttpOnly, SameSite=Lax cookies

## Content Security Policy (CSP)
- [ ] Default-src 'self'
- [ ] Script-src with nonces or hashes (no eval, no inline)
- [ ] Connect-src restricted to known APIs
- [ ] Frame-ancestors 'none' (or specific origins)
- [ ] Report-uri configured for violations

## Cross-Site Scripting (XSS)
- [ ] Output encoding for HTML, URLs, JavaScript, JSON
- [ ] Use framework auto-escaping (React, Vue, Svelte)
- [ ] Sanitize HTML with DOMPurify if rich text needed
- [ ] No innerHTML with user data
- [ ] CSP blocks inline scripts

## Cross-Site Request Forgery (CSRF)
- [ ] SameSite cookie attribute set
- [ ] CSRF token for state-changing operations
- [ ] Origin/Referer header validation
- [ ] Custom headers for API requests (X-Requested-With)

## Authentication
- [ ] Passwords hashed with Argon2id or bcrypt (cost 12+)
- [ ] Rate limit login attempts (5 per 5 min per account)
- [ ] Account lockout after repeated failures
- [ ] MFA available (TOTP/FIDO2 preferred over SMS)
- [ ] Session tokens from CSPRNG, 128+ bits
- [ ] Session invalidated on logout
- [ ] Session timeout (15-30 min idle, 24h absolute)

## Authorization
- [ ] Deny by default
- [ ] Authorization checked on every request
- [ ] Server-side enforcement (not client-side checks)
- [ ] Object-level authorization (verify ownership)
- [ ] No IDOR — use indirect references or verify user

## Rate Limiting
- [ ] Global rate limit (100-1000 req/min per IP)
- [ ] Per-endpoint limits (stricter for auth endpoints)
- [ ] Rate limit headers returned (X-RateLimit-*)
- [ ] 429 Too Many Requests with Retry-After

## Input Validation
- [ ] Validate on server (never trust client)
- [ ] Allowlist over denylist
- [ ] Length limits on all inputs
- [ ] Type validation (string, number, enum)
- [ ] No SQL/NoSQL injection via parameterized queries
- [ ] No command injection (avoid shell exec)

## Secrets Management
- [ ] No secrets in code or version control
- [ ] Environment variables or vault (HashiCorp, AWS Secrets Manager)
- [ ] API keys rotated regularly
- [ ] .env in .gitignore
- [ ] No secrets in URLs, logs, or error messages

## Dependencies
- [ ] Lock file committed (package-lock.json, yarn.lock)
- [ ] Regular `npm audit` / `snyk test`
- [ ] SRI hashes for CDN resources
- [ ] Pin dependency versions

## Error Handling
- [ ] No stack traces to users
- [ ] Generic error messages (no enumeration)
- [ ] Fail-closed on errors
- [ ] Security events logged with context

## Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0 (CSP is the real protection)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
