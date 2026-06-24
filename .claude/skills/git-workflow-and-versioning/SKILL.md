---
name: git-workflow-and-versioning
description: Trunk-based development, atomic commits ~100 lines, clean PR hygiene, semantic versioning.
---

# Git Workflow and Versioning

Clean git history is not vanity — it's how you debug production incidents, understand why decisions were made, and safely revert changes.

## Trunk-Based Development

```
main (always deployable)
  └─ feature/[name]  (short-lived, ≤3 days)
       └─ merge via PR (never force-push to main)
```

- **main is always green** — CI must pass before merge
- **No long-lived feature branches** — if a branch lives > 3 days, it needs to be broken into smaller pieces
- **No direct commits to main** — always go through a PR (except solo projects where you own the review)

## Branch Naming

```
feature/catalog-filter-by-tag
fix/courier-dispatch-race-condition
chore/update-stripe-sdk
test/hub-routing-integration-tests
docs/add-deployment-guide
```

## Commit Size and Atomicity

Target **~100 lines changed per commit**, hard limit ~200 (excluding generated files).

Each commit should be **atomic** — one logical change that can be independently:
- Reviewed
- Tested  
- Reverted

```
✅ Atomic commits:
  feat(geo): add haversine distance function
  test(geo): unit tests for haversine + zone boundary cases
  feat(routing): use haversine to select nearest hub
  
❌ Non-atomic (one giant commit):
  feat: add hub routing with haversine distance and tests and fix the geo types
```

## Commit Message Format

```
<type>(<scope>): <imperative description>

Types:
  feat     — new feature visible to users
  fix      — bug fix
  refactor — code change with no behavior change
  test     — add/update tests
  chore    — dependency update, config change, CI
  docs     — documentation only
  perf     — performance improvement

Scope: the module or area affected
  catalog, checkout, routing, hub, courier, admin, auth, db, ci

Examples:
  feat(checkout): add 5-minute cancellation window
  fix(routing): prevent duplicate hub assignments under concurrent requests
  refactor(whatsapp): extract message builders to lib/whatsapp-templates.ts
  test(stripe): add idempotency test for duplicate webhook delivery
  chore(deps): upgrade stripe from 14.x to 17.x
```

**Never use:**
- "WIP" commits on main (use a branch)
- "fix stuff", "changes", "updates" (meaningless)
- Past tense ("added feature") — use imperative ("add feature")

## PR Hygiene

A good PR description:
```markdown
## What
Add Haversine-based hub routing to replace the previous round-robin assignment.

## Why
Round-robin was assigning orders to hubs 15km away while a hub 2km away was idle.
This caused SLA breaches on 8% of orders in Meden Rudnik zone.

## How
- Added `haversine(lat1, lng1, lat2, lng2)` to `lib/geo.ts`
- Updated `routeOrderToHub()` to sort hubs by distance before selecting
- Kept fallback to round-robin if no hub within 10km

## Testing
- Unit tests: 6 new cases in `lib/geo.test.ts`
- Manual: tested with Meden Rudnik orders in staging
```

## Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR — breaking change (API contract changed, DB incompatible migration)
MINOR — new feature, backwards compatible
PATCH — bug fix, backwards compatible

Examples:
  1.0.0 → 1.0.1  Bug fix: florist timeout fires at 5min not 6min
  1.0.1 → 1.1.0  New feature: PWA install banner
  1.1.0 → 2.0.0  Breaking: renamed /api/orders endpoint to /api/shop/orders
```

## Revert Strategy

When something breaks in production:

```bash
# Option 1: Revert the specific commit (keeps history clean)
git revert <commit-hash> --no-edit
git push

# Option 2: For a whole feature (multiple commits)
git revert <oldest-hash>..<newest-hash>
git push
```

**Never force-push to main to "undo" a bad commit.** Revert creates a new commit that undoes the changes — this is safe and auditable.

## Tags for Releases

```bash
# Tag production releases
git tag -a v1.2.0 -m "Release v1.2.0: Add Hub dashboard + photo delivery confirmation"
git push origin v1.2.0
```

## .gitignore Must-Haves

```
.env.local           # Never commit secrets
.env.production      # Never commit secrets
node_modules/
.next/
*.log
.DS_Store
```
