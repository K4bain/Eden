---
name: firebase-basics
description: Firebase setup, Firestore queries, security rules, project configuration.
---

# Firebase Basics

## Core Rules

1. **Security rules first.** Never leave rules open in production.
2. **Design for queries.** Firestore is query-oriented, not document-oriented.
3. **Minimize reads.** Each read costs money and bandwidth.
4. **Use indexes.** Composite indexes for compound queries.

## Project Setup

### Initialize Firebase
```bash
npm install firebase
npx firebase init
```

### Config Pattern
```typescript
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
```

## Firestore Data Model

### Design Principles
- Denormalize for read performance
- Keep documents under 1MB
- Design around your queries, not your data
- Use subcollections for one-to-many relationships

### Common Patterns
```
users/{userId}
  - name, email, createdAt

users/{userId}/posts/{postId}
  - title, content, publishedAt

posts/{postId}
  - Denormalized author info for feed queries
```

## Firestore Queries

### Basic Queries
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';

// Simple where clause
const q = query(
  collection(db, 'posts'),
  where('published', '==', true),
  where('authorId', '==', userId)
);

// Pagination
import { orderBy, limit, startAfter } from 'firebase/firestore';
const q = query(
  collection(db, 'posts'),
  orderBy('createdAt', 'desc'),
  limit(10),
  startAfter(lastDoc)
);
```

### Compound Queries
- Require composite index
- Firebase console shows missing indexes
- Create index from the link in error message

## Security Rules

### Basic Structure
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
  }
}
```

### Testing Rules
```bash
firebase emulators:start
# Use Firebase Emulator UI to test rules
```

## Anti-patterns

- Fetching entire collection when you need 5 documents
- Not using composite indexes
- Storing sensitive data in client-side code
- Ignoring security rules in development
- Not using Firebase Emulator for local testing
