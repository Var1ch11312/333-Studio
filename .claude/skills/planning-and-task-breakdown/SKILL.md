---
name: planning-and-task-breakdown
description: Decompose features into vertically-sliced, independently-deployable tasks of 1-5 files each.
---

# Planning and Task Breakdown

Good task decomposition is the difference between a feature that ships in a day and one that drags for a week.

## Core Principle: Vertical Slices

Cut vertically through the stack, not horizontally. A vertical slice delivers end-to-end value (UI + API + DB) in one task. Horizontal slices ("do all DB work first, then all API work, then all UI work") create integration hell at the end.

```
❌ Horizontal (bad):
  Task 1: All DB migrations
  Task 2: All API routes
  Task 3: All UI components
  Task 4: Integration (explodes here)

✅ Vertical (good):
  Task 1: Read-only catalog page (DB query + API route + UI list)
  Task 2: Add to cart (DB insert + API POST + UI button)
  Task 3: Checkout (DB transaction + API flow + multi-step UI)
```

## Task Sizing Rules

- **1-5 files per task** — more than 5 files = split the task
- **1-2 hours per task** — longer = split the task
- **One clear done condition** — "the test passes" or "the page renders with real data"
- **Independently testable** — you can verify it works without the next task being complete

## Dependency Mapping

Before listing tasks, draw the dependency graph:

```
migration → lib function → API route → UI component → E2E test
     ↑             ↑
  always       unit test here
  first
```

Rules:
- DB migrations always first (no rollback risk if schema is locked)
- Shared lib functions before the routes that call them
- UI components after the API they fetch from
- Tests immediately after the code they test (not at the end)

## Breaking Down a Feature: Example

**Feature:** Admin can upload product images

```
❌ Wrong breakdown:
  1. Set up Supabase Storage bucket
  2. Build upload API endpoint
  3. Build upload UI
  4. Wire everything together

✅ Right breakdown:
  1. Create Supabase Storage bucket `product-images` (public read, authenticated write)
     Done: bucket exists, manual upload via dashboard works
     Files: supabase migration SQL

  2. POST /api/admin/products/[id]/image — accepts multipart, validates MIME + size, uploads to Storage
     Done: curl test returns signed URL
     Files: app/api/admin/products/[id]/image/route.ts, lib/storage.ts

  3. Unit test: validateImageFile() (MIME types, 5MB limit, rejects SVG)
     Done: vitest passes
     Files: lib/storage.test.ts

  4. Admin product form — add image upload field with preview + progress
     Done: can upload from admin UI, image appears in catalog
     Files: app/admin/products/[id]/page.tsx, components/ImageUpload.tsx
```

## Checklist Format

Always output tasks as a markdown checklist:

```markdown
## [Feature Name] — Task Breakdown

**Depends on:** [other feature or nothing]
**Blocks:** [what can't start until this is done]

- [ ] 1. [Task name] — [1-line description of done condition]
  - Files: `path/to/file.ts`, `path/to/other.ts`
  - Tests: [what to run]
  
- [ ] 2. [Task name] — [done condition]
  - Files: `...`
  - Tests: `...`
```

## Common Mistakes

| Mistake | Fix |
|---|---|
| "Set up all the infrastructure first" | Start with the simplest vertical slice that returns real data |
| "I'll write tests at the end" | Write the test immediately after the code it tests |
| Tasks with AND in the name | Split at the AND |
| Tasks without a done condition | Add "Done: [observable outcome]" |
| Depending on unbuilt code | Stub the dependency, build the real thing in the next task |

## Size Reference

| Task scope | Appropriate size |
|---|---|
| DB migration only | 1 point |
| Library function + unit test | 2 points |
| API route + integration test | 3 points |
| Full vertical slice (DB+API+UI) | 5 points |
| Multi-step UI flow | 8 points (split if possible) |
