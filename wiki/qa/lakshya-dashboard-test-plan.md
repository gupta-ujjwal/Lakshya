# Lakshya Dashboard v1 — QA Test Plan

**Issue:** [LLM-112](/LLM/issues/LLM-112)
**Parent:** [LLM-108](/LLM/issues/LLM-108)
**Status:** In Progress
**Stack:** Next.js 14 + App Router, Tailwind, Prisma, PostgreSQL
**QA Lead:** 5ce8343b-7ee9-4925-b638-4bd595c5ece5

---

## 1. Overview

Comprehensive testing plan for Lakshya Dashboard v1 — a mobile-first NEET PG study tracker with schedule management, task tracking, and progress monitoring.

## 2. Test Strategy

### 2.1 Test Levels

| Level | Coverage | Status |
|---|---|---|
| **Unit** | Zod schemas, API utils, business logic | **183 tests passing** (10 files) ✅ |
| **Integration** | API routes (users, schedules, tasks, progress) | **57 integration tests passing** ✅ |
| **E2E** | Full user flows | **85 tests passing** ✅ |
| **Manual** | UI/UX, Telegram WebApp integration | **BLOCKED** — No live Telegram bot/environment |

### 2.2 Environment Setup

```bash
# Install deps
pnpm install

# Run unit tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Start dev server for E2E
pnpm dev

# Push DB schema
pnpm db:push
```

### 2.3 Test File Structure

```
tests/
├── setup.ts                         # Global test setup
├── mocks/
│   └── prisma.ts                    # Mock Prisma client
├── lib/
│   └── api/
│       ├── utils.test.ts            # API utility tests
│       ├── users/schemas.test.ts    # User schema tests
│       ├── schedules/schemas.test.ts # Schedule schema tests
│       ├── tasks/schemas.test.ts    # Task schema tests
│       └── progress/schemas.test.ts # Progress schema tests
└── helpers/
    └── integration.ts              # Integration test helpers
```

---

## 3. Test Cases

### 3.1 API Schema Validation

#### Users API
- [x] Create user: valid email + name
- [x] Create user: email only
- [x] Create user: name only
- [x] Create user: empty (all optional)
- [x] Create user: invalid email → 400
- [x] Create user: empty name → 400
- [x] Update user: partial updates
- [x] Query users: filters, pagination

#### Schedules API
- [x] Create schedule: all required fields
- [x] Create schedule: with optional data JSON
- [x] Create schedule: with Date object
- [x] Create schedule: missing userId → 400
- [x] Create schedule: missing title → 400
- [x] Create schedule: empty userId → 400
- [x] Create schedule: title exceeds 255 chars → 400
- [x] Create schedule: invalid date format → 400
- [x] Update schedule: partial updates
- [x] Query schedules: userId filter, pagination

#### Tasks API
- [x] Create task: all required fields
- [x] Create task: with priority (0-10 range)
- [x] Create task: priority defaults to 0
- [x] Create task: missing required fields → 400
- [x] Create task: priority out of range → 400
- [x] Create task: subject exceeds 100 chars → 400
- [x] Update task: partial updates
- [x] Query tasks: scheduleId, subject filters

#### Progress API
- [x] Create progress: required fields
- [x] Create progress: with optional notes/date
- [x] Create progress: empty taskId/status → 400
- [x] Create progress: various status values
- [x] Update progress: partial updates
- [x] Query progress: filters, pagination

#### Error Handling
- [x] ValidationError → 400 response
- [x] Generic Error → 500 response
- [x] Unknown error → 500 response
- [x] Prisma P2002 (duplicate email) → 409
- [x] Prisma P2003 ( FK violation) → 400
- [x] Prisma P2025 (not found) → 404

### 3.2 Functional Testing (Pending Frontend)

| Feature | Test Scenario | Priority | Status |
|---|---|---|---|
| **Schedule Creation** | Upload JSON schedule file | High | Blocked |
| **Schedule View** | Display schedule with tasks | High | Blocked |
| **Task Progress** | Mark task complete/incomplete | High | Blocked |
| **Dashboard Stats** | View completion %, days remaining | High | Blocked |
| **Today View** | Show today's tasks | High | Blocked |
| **Subject Filter** | Filter tasks by subject | Medium | Blocked |

### 3.3 UI/UX Testing

| Check | Desktop | Mobile | Status |
|---|---|---|---|
| Responsive layout | 1280px, 768px | 375px | Cannot verify (E2E blocked) |
| Touch targets ≥44px | N/A | 375px | Cannot verify (E2E blocked) |
| No horizontal scroll | All viewports | Cannot verify (E2E blocked) |
| Font readability | All viewports | Cannot verify (E2E blocked) |
| Color contrast | WCAG AA | Cannot verify (E2E blocked) |

### 3.4 Telegram WebApp Integration

| Check | Status |
|---|---|
| WebApp.initData validation | Blocked |
| Theme adapts to Telegram | Blocked |
| Back button works correctly | Blocked |
| Data persists across sessions | Blocked |

### 3.5 Performance Testing

| Metric | Target | Status |
|---|---|---|
| First Contentful Paint | <1.5s | Blocked |
| Time to Interactive | <3s | Blocked |
| Lighthouse Score | >80 | Blocked |
| API response time | <200ms | Pending |

### 3.6 Cross-Browser Testing

| Browser | Version | Status |
|---|---|---|
| Chrome | Latest | Blocked |
| Firefox | Latest | Blocked |
| Safari | Latest | Blocked |
| Edge | Latest | Blocked |

---

## 4. Test Execution Schedule

1. **✅ Done:** Schema validation tests — 183 unit tests pass
2. **✅ Done:** Integration tests — 57 tests pass (workflows for tasks/schedules/progress)
3. **✅ Done:** Test infrastructure — E2E test files written (85 tests), test helpers created
4. **✅ Done:** E2E test execution — 85/85 pass
5. **✅ Done:** Production build — all 8 pages pass static prerendering
6. **🔴 BLOCKED:** Telegram WebApp integration — requires live Telegram environment
7. **🔴 BLOCKED:** Cross-browser/performance testing — requires dedicated testing infrastructure

---

## 5. Known Issues / Blockers (Updated 2026-04-24)

- ~~**Build FAILS (HIGH):** `pnpm build` crashes during static prerendering.~~ — **RESOLVED**: Stale `.next` cache was the cause. Clean build succeeds.
- ~~**E2E tests CANNOT RUN (CRITICAL):** Playwright GLIBC mismatch.~~ — **RESOLVED**: Current environment runs Chromium successfully. 85/85 E2E tests pass.
- **Telegram WebApp integration:** Requires live Telegram bot + WebApp URL. Cannot test in sandbox environment.

---

## 6. Bug Report Template

```markdown
## Bug: [Title]

**Severity:** [Critical / High / Medium / Low]
**Priority:** [P0 / P1 / P2 / P3]

### Steps to Reproduce
1. ...
2. ...
3. ...

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- Browser: ...
- OS: ...
- Viewport: ...

### Screenshot/Console Logs
[Attach if available]

### Related Issues
- Parent: LLM-112
```

---

## 7. Test Artifacts

| Artifact | Location | Updated |
|---|---|---|
| Test plan | `wiki/qa/lakshya-dashboard-test-plan.md` | 2026-04-24 |
| Bug reports | Child issues of LLM-112 | As found |
| Test coverage | `coverage/` (after `pnpm test -- --coverage`) | Per run |