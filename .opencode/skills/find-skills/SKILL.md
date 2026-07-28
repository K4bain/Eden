---
name: find-skills
description: Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities.
---

# Find Skills

Discover and install skills from the open agent skills ecosystem.

## When to Use

- User asks "how do I do X" where X might have an existing skill
- "Find a skill for X" or "is there a skill for X"
- "Can you do X" where X is a specialized capability
- Wants to search for tools, templates, or workflows

## Skills CLI

```bash
npx skills find [query] [--owner <owner>]   # Search for skills
npx skills add <package>                     # Install a skill
npx skills update                            # Update all installed skills
```

**Browse:** https://skills.sh/

## Workflow

### Step 1: Understand What They Need
- Domain (React, testing, design, deployment)
- Specific task (writing tests, creating animations, reviewing PRs)
- Whether a skill likely exists

### Step 2: Check the Leaderboard
Top skills for web development:
- `vercel-labs/agent-skills` — React, Next.js, web design
- `anthropics/skills` — Frontend design, document processing
- `mattpocock/skills` — Workflow, debugging, architecture
- `obra/superpowers` — TDD, debugging, agent workflows
- `emilkowalski/skills` — Animation, design engineering
- `pbakaus/impeccable` — Design commands, anti-pattern detection

### Step 3: Search
```bash
npx skills find react performance
npx skills find pr review
npx skills find changelog
```

### Step 4: Verify Quality
- **Install count** — Prefer 1K+ installs
- **Source reputation** — Official sources more trustworthy
- **GitHub stars** — Check the source repository

### Step 5: Present Options
```
I found "react-best-practices" — React performance optimization from Vercel Engineering.
Install: npx skills add vercel-labs/agent-skills@react-best-practices
Learn more: https://skills.sh/vercel-labs/agent-skills/react-best-practices
```

### Step 6: Offer to Install
```bash
npx skills add <owner/repo@skill> -g -y
```

## Common Skill Categories

| Category | Example Queries |
|----------|----------------|
| Web Dev | react, nextjs, typescript, css, tailwind |
| Testing | testing, jest, playwright, e2e |
| DevOps | deploy, docker, kubernetes, ci-cd |
| Docs | docs, readme, changelog, api-docs |
| Code Quality | review, lint, refactor, best-practices |
| Design | ui, ux, design-system, accessibility |
| Productivity | workflow, automation, git |

## When No Skills Found

1. Acknowledge no existing skill found
2. Offer to help directly
3. Suggest creating a custom skill: `npx skills init my-xyz-skill`
