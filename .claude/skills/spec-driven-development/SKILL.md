---
name: spec-driven-development
description: Write a complete spec before any implementation. Gate each phase with explicit approval.
---

# Spec-Driven Development

Write the spec first. Get approval. Then implement. Never write code before the spec is agreed upon.

## The Gated Workflow

```
SPECIFY → PLAN → TASKS → IMPLEMENT
   ↓         ↓       ↓        ↓
 (stop)   (stop)  (stop)   (go)
```

Each phase **stops and waits for explicit approval** before moving to the next. Do not proceed on assumed approval.

---

## Phase 1: SPECIFY

Write a specification document that answers:

**What problem does this solve?**
- User story: "As a [role], I want [action] so that [outcome]"
- Current pain point with evidence
- Scope boundary: what is explicitly NOT included

**How will it work?**
- User-facing behavior (what the user sees and does)
- System behavior (what happens behind the scenes)
- Edge cases and error states
- Data model changes (new tables, columns, indexes)
- API contract (endpoint, request shape, response shape)

**How do we know it works?**
- Acceptance criteria (numbered, testable)
- Performance targets (if relevant)
- Security requirements

**Stop. Present the spec. Ask: "Does this spec look correct? Should I proceed to planning?"**

---

## Phase 2: PLAN

Break the spec into an implementation plan:

- List every file that needs to change
- For each file: what changes and why
- Identify shared dependencies (lib files used by multiple routes)
- Flag risks: "This touches auth — needs security review"
- Estimate: story points or rough hours

**Stop. Present the plan. Ask: "Does this plan look correct? Should I proceed to task breakdown?"**

---

## Phase 3: TASKS

Convert the plan into a checklist of concrete tasks. Each task must be:

- **Completable in one sitting** (≤2 hours of focused work)
- **Independently testable** (has a clear done condition)
- **Ordered** (dependencies listed)

```markdown
## Tasks

- [ ] 1. Add `delivery_zone` column to `orders` table (migration)
- [ ] 2. Update `lib/geo.ts` — `getDeliveryZone(lat, lng)` function
- [ ] 3. Unit test: `getDeliveryZone` for all 3 Burgas zones
- [ ] 4. Update `POST /api/orders` — calculate and store zone on creation
- [ ] 5. Integration test: POST /api/orders with zone validation
- [ ] 6. Update checkout UI — show delivery zone to user
- [ ] 7. Update admin dashboard — show zone column in orders table
```

**Stop. Present the task list. Ask: "Should I start implementing?"**

---

## Phase 4: IMPLEMENT

Only now write code. Follow the task list in order. After each task:

1. Mark it complete `[x]`
2. Run relevant tests
3. Note any deviations from the spec (and why)

If you discover the spec was wrong, **stop and re-specify** before continuing.

---

## Anti-Patterns to Avoid

| Anti-pattern | Why it fails |
|---|---|
| Code first, spec later | Spec ends up describing what was built, not what was needed |
| Spec so detailed it's already code | Over-specification prevents good implementation judgment |
| Skipping approval gates | One misunderstood requirement invalidates hours of work |
| Implementing "while you're in there" extras | Scope creep kills deadlines and adds untested surface area |
| Spec without acceptance criteria | No way to know when you're done |

---

## Spec Template

```markdown
## Feature: [Name]

### Problem
[1-2 sentences on what's broken or missing]

### Solution
[1-2 sentences on the approach]

### User Stories
- As a [role], I want [action] so that [outcome]

### Acceptance Criteria
1. [ ] [Testable criterion]
2. [ ] [Testable criterion]
3. [ ] [Testable criterion]

### Out of Scope
- [What this explicitly does NOT do]

### API Changes
- `POST /api/[resource]` — [what changes]

### DB Changes
- [Table: column type (reason)]

### Risks
- [Risk: mitigation]
```
