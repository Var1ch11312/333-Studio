---
name: incremental-implementation
description: Build in thin vertical slices. Every commit compiles and passes tests. Always rollback-safe.
---

# Incremental Implementation

Every step must leave the codebase in a working state. No "WIP" commits. No "half-done" features behind flags that nobody cleans up.

## The Core Rule

**At every commit, the app must:**
1. Compile (`tsc --noEmit` passes)
2. Pass all existing tests (`vitest run` green)
3. Deploy safely (no runtime errors on import)

If your change breaks any of these, it's not ready to commit.

## The Thin Slice Technique

For any feature, find the thinnest possible slice that delivers observable value, then layer on top:

```
Layer 1: Static — hardcoded data, no DB
  → "The page renders with fake data" ✓

Layer 2: Read — real DB data, no writes  
  → "The page shows real products from DB" ✓

Layer 3: Write — mutations work
  → "User can add to cart, state persists" ✓

Layer 4: Edge cases — validation, errors, empty states
  → "Empty catalog shows call-to-action" ✓

Layer 5: Polish — loading states, optimistic UI, animations
  → "Spinner shows while loading" ✓
```

Never skip layers. Never implement Layer 5 before Layer 1 is committed.

## Rollback Safety

Every change should be independently revertable:

```
✅ Safe: Add new column with DEFAULT (existing rows still valid)
❌ Unsafe: Add NOT NULL column without DEFAULT (breaks existing rows)

✅ Safe: Add new API route (doesn't affect existing routes)
❌ Unsafe: Rename existing API route (breaks callers)

✅ Safe: Add new component alongside existing one
❌ Unsafe: Rewrite existing component and existing tests
```

Before writing code, ask: "If I revert this single commit, does everything still work?"

## Implementation Order

```
1. Types and interfaces (TypeScript types first — no runtime impact)
2. Pure functions and utilities (lib/*.ts — testable in isolation)
3. DB layer (queries, mutations — testable with integration tests)
4. API routes (thin handlers that call lib functions)
5. UI components (consume API, handle states)
6. Integration (wire UI to API, test end-to-end)
```

## File Change Budget

Keep each commit under **~150 lines changed** across **≤5 files**. If you're changing more:
- You're probably doing two things at once — split the commit
- You're probably not slicing thin enough — find the thinner slice

## Handling Big Migrations

If you must change a fundamental piece (auth system, DB schema, routing):

```
Step 1: Add new alongside old
  (add new auth alongside old PIN auth)
  
Step 2: Migrate callers one by one
  (update routes to use new auth, one route per commit)
  
Step 3: Verify all callers migrated
  (grep for old pattern, confirm zero results)
  
Step 4: Remove old implementation
  (delete old code in final clean-up commit)
```

Never do "big bang" rewrites. Always migrate incrementally.

## Feature Flags vs. Always-On

Prefer **always-on** incremental slices over feature flags:
- Feature flags accumulate as technical debt
- They make testing harder (need to test both states)
- They're rarely cleaned up

Instead, slice features so that each deployed layer is immediately useful, even if incomplete.

## Commit Message Formula

```
<type>(<scope>): <what changed>

type: feat | fix | refactor | test | chore | docs
scope: component, route, lib function, or db

Examples:
  feat(catalog): add product card component with EUR/BGN pricing
  feat(api): POST /api/orders validates odd flower count
  fix(routing): hub timeout now fires at exactly 5 minutes
  test(geo): add haversine edge cases for zone boundary coords
```
