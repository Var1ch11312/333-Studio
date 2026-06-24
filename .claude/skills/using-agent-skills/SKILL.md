---
name: using-agent-skills
description: Meta-skill for understanding and effectively using agent skills
---

# Using Agent Skills

Agent skills are reusable behavioral modules that extend Claude's capabilities in a project. This skill explains how to use them effectively.

## What Skills Are

A skill is a SKILL.md file in `.claude/skills/<name>/` that Claude reads when triggered. Skills provide:
- Domain expertise (security, performance, testing patterns)
- Checklists and workflows to follow
- Anti-patterns to avoid
- Project-specific conventions

## 6 Operating Principles

1. **Skills are additive** — they extend, not replace, Claude's judgment. Apply skill guidance in context.
2. **Trigger explicitly** — invoke a skill by mentioning its name or asking Claude to use it (`/security-and-hardening`, "review this using the code-review skill").
3. **One skill at a time** — compound skills (e.g., "do a security review of this new feature") work best by applying one skill's lens first, then the next.
4. **Skills are not constraints** — if a skill's guidance conflicts with a clear user instruction, the user instruction wins.
5. **Read before acting** — for implementation tasks, consult the relevant skill before writing code, not after.
6. **Skills compound** — the real value is in consistently applying them across every PR, every feature, every deploy.

## Available Skills in This Project

| Skill | When to Use |
|---|---|
| `spec-driven-development` | Starting any new feature |
| `planning-and-task-breakdown` | Decomposing large tasks |
| `incremental-implementation` | Writing code in safe slices |
| `test-driven-development` | Writing tests alongside code |
| `code-review-and-quality` | Reviewing PRs and changes |
| `security-and-hardening` | Any auth, API, or data change |
| `performance-optimization` | Any rendering or query change |
| `frontend-ui-engineering` | Any UI component work |
| `debugging-and-error-recovery` | Diagnosing failures |
| `git-workflow-and-versioning` | Commits, branches, PRs |
| `ci-cd-and-automation` | Pipeline and deploy changes |
| `shipping-and-launch` | Pre-launch checklist |

## How Claude Loads Skills

1. **Metadata always loaded** — name + description from YAML frontmatter (~100 tokens, always in context)
2. **Body loaded on trigger** — full SKILL.md content loaded when user invokes the skill
3. **Resources loaded on demand** — any referenced files fetched when needed

## Workflow Integration

```
New feature request
  → /spec-driven-development    (write spec first)
  → /planning-and-task-breakdown (decompose into tasks)
  → /incremental-implementation  (build in slices)
  → /test-driven-development     (test as you go)
  → /code-review-and-quality     (review before merge)
  → /security-and-hardening      (security pass)
  → /git-workflow-and-versioning (clean commit history)
  → /shipping-and-launch         (pre-deploy checklist)
```
