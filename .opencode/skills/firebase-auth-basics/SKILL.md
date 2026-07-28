---
name: firebase-auth-basics
description: Firebase Auth flows, providers, custom claims, session management.
---

# Firebase Auth Basics

## Core Rules

1. **Never trust client claims.** Verify on server.
2. **Use emulators for testing.** Don't test auth against production.
3. **Handle auth state changes.** Subscribe to auth state, don't poll.
4. **Secure tokens.** Don't expose refresh tokens in client code.

## Setup

### Initialize Auth
```typescript
import { getAuth } from 'firebase/auth';

const auth = getAuth(app);
```

### Auth State Observer
```typescript
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
  } else {
    // User is signed out
  }
});
```

## Sign-In Methods

### Email/Password
```typescript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Sign in
await signInWithEmailAndPassword(auth, email, password);

// Create account
await createUserWithEmailAndPassword(auth, email, password);
```

### Google Sign-In
```typescript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const provider = new GoogleAuthProvider();
await signInWithPopup(auth, provider);
```

### Session Persistence
```typescript
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

// Default is LOCAL (persists across sessions)
await setPersistence(auth, browserLocalPersistence);
```

## Custom Claims

### Set Claims (Server-Side)
```javascript
// Admin SDK (server only)
admin.auth().setCustomUserClaims(uid, { admin: true, role: 'editor' });
```

### Read Claims (Client-Side)
```typescript
const user = auth.currentUser;
const tokenResult = await user.getIdTokenResult();
console.log(tokenResult.claims); // { admin: true, role: 'editor' }
```

### Use Claims in Security Rules
```javascript
match /admin/{doc} {
  allow read, write: if request.auth.token.admin == true;
}
```

## Token Management

### Get ID Token
```typescript
const token = await user.getIdToken();
// Send to backend
```

### Refresh Token
```typescript
const token = await user.getIdToken(true); // Force refresh
```

### Verify on Server (Node.js)
```typescript
import { getAuth } from 'firebase-admin/auth';

const decodedToken = await getAuth().verifyIdToken(token);
console.log(decodedToken.uid);
```

## Protecting Routes

### Client-Side
```typescript
import { onAuthStateChanged } from 'firebase/auth';

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
  return children;
}
```

### Server-Side (API Routes)
```typescript
// Express middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

## Anti-patterns

- Storing sensitive data in custom claims (they're visible to client)
- Not handling auth state changes properly
- Testing auth against production Firebase project
- Not refreshing tokens before they expire
- Hardcoding admin privileges in client code
