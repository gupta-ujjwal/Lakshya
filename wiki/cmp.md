# Change Management Process (CMP) — Lakshya

> Effective Date: 2026-04-24
> Owner: CEO
> Version: 1.1

## Overview

All changes to the Lakshya codebase follow this four-stage process. No change is merged or deployed until it completes all applicable stages.

---

## Stage 1: Planning

**Owner:** CTO or delegate

### Steps

1. **Create an issue** describing the change with:
   - Clear title and problem statement
   - Acceptance criteria (what "done" looks like)
   - Priority label (critical / high / medium / low)
   - Affected components
   - Indicate if **Design is required** (any UI/UX change)

2. **Create a plan document** attached to the issue (key: `plan`) that covers:
   - What is changing and why
   - Technical approach (high-level)
   - Risks and mitigations
   - Dependencies (blocked-by issues)
   - Testing strategy
   - Design involvement required? (yes/no)

3. **Request board approval** via `request_board_approval` API, or get explicit sign-off in the issue thread.

4. **Plan is approved** — the issue moves from `backlog`/`todo` to `in_progress`. Implementation begins.

### Exit Criteria

- Plan document exists on the issue
- Approval confirmed in the issue thread or via approval API
- Issue is `in_progress`

---

## Stage 2: Design

**Owner:** Designer

**Triggered:** Only for issues involving UI/UX changes.

### Steps

1. **Designer receives task** — CTO assigns design subtask to Designer
2. **Design exploration** — create mockups, wireframes, or hi-fi designs
3. **Design review** — share with CTO and/or board for feedback
4. **Finalize design** — get explicit approval
5. **Handoff** — provide specs/assets to Engineer for implementation

### Exit Criteria

- [ ] Design artifacts complete (mockups, specs, or "no design needed" confirmation)
- [ ] Design approved by CTO/board
- [ ] Handoff complete to Engineer

### When Design Is Not Required

For backend-only changes, technical refactoring, or bug fixes with no UI impact, skip this stage. Document "Design: N/A" in the plan.

---

## Stage 3: Development

**Owner:** CTO or delegate (Engineer agent)

### Steps

1. **Follow TDD workflow:**
   - Write failing tests that describe the desired behavior
   - Implement the minimum code to pass the tests
   - Refactor

2. **Build must pass:**
   - `pnpm build` completes without errors
   - All unit/integration tests pass (`pnpm test`)

3. **Update issue with:**
   - What was implemented
   - Test coverage summary
   - Any new issues discovered (create child issues)

4. **Mark issue `in_review`** — ready for QA

### Exit Criteria

- [ ] `pnpm build` succeeds
- [ ] All unit/integration tests pass
- [ ] New tests written for new behavior
- [ ] Issue status set to `in_review`

### TDD Convention

- Tests live in `__tests__/` (unit/schema) or `tests/` (integration/E2E)
- Use Vitest for unit tests
- E2E tests use Playwright (when environment supports it)
- **Task is not done until build AND tests pass**

---

## Stage 4: QA Verification

**Owner:** QA Lead

### Scope

QA verifies **behavioral and functional flow** — not code review. The two are separate concerns.

### Steps

1. **Read the issue** — understand what was built and the acceptance criteria

2. **Run the application:**
   ```bash
   pnpm dev
   ```
   Navigate to the relevant pages in the browser.

3. **Verify functional behavior:**
   - Does the feature work as specified?
   - Do the acceptance criteria pass?
   - Are edge cases handled?
   - Is the UI/UX correct?

4. **If verification fails:**
   - Create a child bug issue with clear reproduction steps
   - Comment on the original issue with findings
   - Reassign to the Engineer with `status: in_progress`
   - QA is **not** responsible for code-level fixes

5. **If verification passes:**
   - Comment on the issue confirming pass
   - Mark issue `done`

### Exit Criteria

- [ ] Feature verified working in running application
- [ ] Acceptance criteria met
- [ ] No regressions in existing functionality
- [ ] Issue marked `done` by QA

### What QA Does NOT Do

- Code review (that's a separate concern handled by the CTO)
- Performance benchmarking (unless specified in the issue)
- Security audits (unless scoped)

---

## Roles and Responsibilities

| Stage | Owner | Trigger |
|-------|-------|---------|
| Planning | CTO | Always |
| Design | Designer | UI/UX changes only |
| Development | CTO / Engineer | Always |
| QA Verification | QA Lead | Always |

---

## Workflow Diagram

```
[Issue Created]
      │
      ▼
[Plan Written] ────► [Board Approval]
      │                    │
      │                    ▼
      │   [Status: in_progress]
      │         │
      │   Design needed? ──yes──► [Stage 2: Design]
      │         │                       │
      │         no                      ▼
      │         │              [Design Approved + Handoff]
      │         │                       │
      ▼         ▼                       ▼
[Stage 3: Development + TDD]
      │
      ├── Build fails? → Fix → Repeat
      │
      ▼
[All tests pass + Build OK]
      │
      ▼
[Status: in_review] ──► [Stage 4: QA]
      │
      ├── Fail → Create bug → Reassign to Engineer
      │
      ▼
[Status: done]
```

---

## Agent Instructions

Each agent must update their instructions to reference this CMP:

- **CTO**: Update AGENTS.md to include CMP reference and Design stage coordination
- **Engineer**: Follow TDD workflow; don't mark done until build + tests pass
- **QA Lead**: Verify behavior only, not code review; run `pnpm dev` for testing
- **Designer**: Respond to design requests from CTO; provide specs before dev begins

---

## Exceptions

**Hotfixes:** For critical production bugs, the Planning and Design stages may be abbreviated. Document the rationale in the issue thread and notify the board within 24 hours.

---

## Related Documents

- [QA Test Plan](./qa/lakshya-dashboard-test-plan.md)
- [QA Learnings](./qa/learnings.md)
- [Project Status](./projects/lakshya.md)