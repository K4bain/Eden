---
name: supabase-postgres-best-practices
description: Postgres patterns. Schema design, RLS, indexing, query performance. Applies to any Postgres.
---

# Supabase/Postgres Best Practices

## Core Rules

1. **Schema first.** Design schema before writing queries.
2. **RLS always on.** Never skip row-level security.
3. **Index strategically.** Index columns used in WHERE, JOIN, ORDER BY.
4. **Use migrations.** Never manually alter production schema.

## Schema Design

### Naming Conventions
- Tables: `plural, snake_case` (e.g., `user_profiles`)
- Columns: `snake_case` (e.g., `created_at`)
- Primary keys: `id` (auto-generated UUID or bigint)
- Foreign keys: `singular_table_id` (e.g., `user_id`)

### Standard Columns
```sql
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
```

### Timestamps Trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Row-Level Security (RLS)

### Always Enable
```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### Policy Pattern
```sql
-- Users can read their own data
CREATE POLICY "Users read own data" ON your_table
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own data
CREATE POLICY "Users insert own data" ON your_table
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Indexing

### When to Index
- Columns in WHERE clauses
- Columns in JOIN conditions
- Columns in ORDER BY
- Columns with high cardinality

### Index Types
```sql
-- B-tree (default, most common)
CREATE INDEX idx_table_column ON table(column);

-- Partial index (smaller, faster)
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- Composite index (multi-column)
CREATE INDEX idx_lookup ON orders(user_id, created_at);
```

## Query Performance

### Use EXPLAIN
```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = '123';
```

### Common Fixes
- Add missing indexes
- Avoid SELECT * (fetch only needed columns)
- Use LIMIT for large result sets
- Avoid N+1 queries (use JOINs or subqueries)
- Use connection pooling (Supabase handles this)

## Anti-patterns

- Disabling RLS for convenience
- Not using migrations
- Over-indexing (slows writes)
- Using UUID v1 (poor performance)
- Not setting NOT NULL on required columns
