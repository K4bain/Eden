---
name: auth-implementation
description: Implement secure authentication and authorization — session tokens, JWT, OAuth 2.1, passkeys, MFA, RBAC. Use when building login, signup, auth middleware, or API authentication.
---

# Authentication & Authorization Implementation

## Method Selection

| Method | Security | UX | Best For |
|--------|----------|-----|----------|
| Session tokens (cookie) | High | Excellent | Server-rendered web apps |
| JWT (stateless) | Medium-High | Good | APIs, microservices |
| OAuth 2.1 + OIDC | High | Good | Third-party login, SSO |
| Passkeys (WebAuthn) | Highest | Excellent | Consumer apps, replacing passwords |
| Magic Links | Medium | Good | Low-security, quick onboarding |

**Rule:** Use session tokens for web apps, JWT for APIs. Never use JWT for web app sessions.

## Session Token Implementation

```
Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400
```

- Store session data in Redis (fast lookup, revocation)
- Rotate session ID on login (prevent session fixation)
- Invalidate on logout (delete from store)
- Idle timeout: 15-30 min, Absolute timeout: 24h

## Password Hashing

```python
# Use Argon2id (preferred) or bcrypt
from argon2 import PasswordHasher
ph = PasswordHasher(
    time_cost=3,        # iterations
    memory_cost=65536,  # 64MB
    parallelism=4
)
hashed = ph.hash(password)
verify = ph.verify(hashed, password)  # raises on mismatch
```

- Never MD5, SHA1, SHA256 for passwords
- No custom crypto
- Check against breached password sets (HaveIBeenPwned API)

## OAuth 2.1 with PKCE

```
1. Generate code_verifier (43-128 chars) and code_challenge (SHA256(verifier))
2. Redirect to /authorize?response_type=code&code_challenge=...&code_challenge_method=S256
3. Exchange code + code_verifier for tokens
4. Validate ID token (iss, aud, exp, nonce)
5. Store refresh token securely (httpOnly cookie)
```

- Always use PKCE for SPAs and mobile apps
- Validate state parameter (CSRF protection)
- Whitelist redirect URIs explicitly
- Never expose client secrets in frontend

## MFA Implementation

### TOTP (Google Authenticator, Authy)
```
1. Generate secret (160 bits, CSPRNG)
2. Show QR code (otpauth:// URI)
3. Verify first code before enabling
4. Store secret encrypted, provide backup codes
5. Rate limit verification attempts (3 per 5 min)
```

### FIDO2/WebAuthn (Passkeys)
```
1. Register: challenge → user authenticates → public key stored
2. Authenticate: challenge → user authenticates → server verifies signature
3. Phishing-resistant (origin-bound)
4. Best UX (biometric)
```

## RBAC Implementation

```python
# Role hierarchy: owner > admin > member > viewer
ROLES = {
    'owner': ['*'],
    'admin': ['read', 'write', 'delete', 'manage_members'],
    'member': ['read', 'write'],
    'viewer': ['read']
}

def require_permission(permission):
    def decorator(f):
        @wraps(f)
        def wrapper(request, *args, **kwargs):
            user_role = get_user_role(request.user, request.resource)
            if permission not in ROLES.get(user_role, []):
                abort(403)
            return f(request, *args, **kwargs)
        return wrapper
    return decorator

@require_permission('delete')
def delete_item(request, item_id):
    ...
```

## API Authentication

### JWT Validation Checklist
- [ ] Verify signature (HS256 for internal, RS256 for public)
- [ ] Check `exp` claim
- [ ] Validate `iss` and `aud`
- [ ] Use short-lived access tokens (15 min)
- [ ] Implement refresh token rotation
- [ ] Revoke tokens on logout

### API Key Best Practices
- [ ] Generate with CSPRNG (256+ bits)
- [ ] Hash before storage (like passwords)
- [ ] Scope to specific permissions
- [ ] Rotate regularly
- [ ] Rate limit per key
- [ ] Never expose in URLs or logs

## Common Vulnerabilities

| Vulnerability | Prevention |
|---------------|------------|
| Session fixation | Rotate session ID on login |
| Credential stuffing | Rate limit + MFA + breached password check |
| JWT none algorithm | Reject alg=none, validate algorithm explicitly |
| Token leakage | HttpOnly, Secure cookies; no tokens in URLs |
| IDOR | Verify object ownership on every request |
| Privilege escalation | Server-side role check, deny by default |
