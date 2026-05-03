# Project Learnings

## Project: Lakshya

### 2026-04-27: Paperclip API Server — Local vs Cloud

**Discovery:**
- External API (`api.paperclip.ai`) returns Cloudflare block pages
- Local Paperclip server runs on `http://127.0.0.1:3100` (auto-injected via `PAPERCLIP_API_URL`)
- All API calls must use the local endpoint in development

**Pattern:**
- Heartbeat runs inject local API URL and short-lived JWT via env vars
- External network access goes through Cloudflare and is blocked
- Always check `PAPERCLIP_API_URL` env var to determine which endpoint to use

---

### 2026-04-27: LLM-124 Completion

**What worked:**
- `issue_children_completed` wake reason correctly resumed parent when children done
- Status was reported as `blocked` but children were already complete — wake resolved it
- LLM-124 closed successfully via `PATCH /api/issues/LLM-124` with `{ status: "done" }`

**Key pattern:** Always verify actual file state vs session context claims. Files were missing but issues were complete.

### 2026-04-24: LLM-126 Schedule Import Planning

**Data Import Workflow Design**
- Import features require both UI/UX design AND backend data transformation logic
- Use parent/child issue structure: Planning → Design (for UI) → Development (backend + frontend) → QA
- Zod schemas should be defined early—they're the contract between frontend and backend

**N-Day Repeating Timetable Pattern**
- Flexible cycle length (user-defined, e.g., 7-day week) better than fixed structures
- Store: cycle length + timetable array → expand to dates at import time
- Formula: calendar_day maps to cycle_day via `(dayIndex % cycleLength) + 1`
- Generating thousands of tasks requires transaction safety and performance limits

**Import UX Considerations**
- Always provide: schema reference + sample file (reduces user errors)
- Client-side validation before upload improves perceived performance
- Graceful degradation: malformed JSON shouldn't crash app, show helpful messages
- Empty-state redirect: auto-redirect to import when no data creates clear onboarding path

**JSON Import Risk Areas**
- File size limits needed (recommend ~1MB max)
- Task explosion: long schedules (365+ days) × many slots = thousands of records
- Transaction handling: atomic all-or-nothing prevents partial data corruption
- Schema versioning: embed version in imported JSON for future migrations

---

### 2026-04-24: LLM-128 Import Screen Design

**Design Deliverables**
- Comprehensive design spec: `design/import-screen.md`
- Covers all states: empty, file ready, uploading, error, success
- Tokens extend existing design system (drop zone colors)
- Full accessibility checklist included

**Design System Extension**
- Added upload zone color tokens (light/dark mode)
- Drag-over state changes background and border color
- Error state uses red tint background, success uses green
- File size limit enforced at 5MB

**Component Breakdown**
1. Drop Zone (5 states with distinct visual treatment)
2. Download Buttons (Schema + Sample)
3. Import Button (primary CTA with loading state)
4. Validation Error List (line-specific errors)
5. Success State Card

**Paperclip API Bug Workaround**
- POST /comments requires `body` field, not `comment`
- jq -n with heredoc fails with newline characters; use escaped JSON directly

**Design Review Process**
- Issue: Validate Dashboard v1 (LLM-108) against design system (LLM-109)
- Result: 92% compliance, approved for release
- Full report: `wiki/projects/llm-120-design-review.md`

**Key Design System Findings**
- CSS variables for light/dark mode: correctly implemented
- Tailwind spacing scale (4px base): properly applied
- Bottom navigation touch targets: 44x44px ✅
- Custom fonts (DM Sans, Plus Jakarta Sans): correctly loaded via Google Fonts CDN
- Three change requests filed: CR-001 (focus styles), CR-002 (fonts), CR-003 (reduced motion)

**Design Discrepancy Accepted**
- Nav shows: Home, Tasks, Notes, Settings
- Design spec (LLM-109) listed: Home, Tasks, Notes, Reminders, Settings
- Reminders accessible via Quick Actions — acceptable deviation

**Board Feedback: Subtasks Must Have Assigns**
- Board flagged: subtasks created with no assignees
- Lesson: Always assign subtasks to the responsible agent when creating them

**Paperclip API Server**
- When API server unresponsive, cannot fetch issue details or update status
- Workaround: document findings in wiki, proceed with available context

### 2026-04-27: LLM-101 ESLint Configuration

**ESLint 10 vs 9 Compatibility**
- `eslint-config-next` v16 requires ESLint 9 (peer dep: `eslint@>=9.0.0`)
- ESLint 10 has breaking changes; type-aware linting requires ESLint 9
- Solution: Downgrade to ESLint 9 with `eslint@^9.0.0`

**Flat Config + eslint-config-next v16**
- `eslint-config-next` v16 exports flat config directly (no compat needed)
- Import and spread: `...nextConfig`
- Works with `typescript-eslint` v8 and flat config format
- Install: `pnpm add -D eslint-config-next`

**ESLint Rule Exclusions**
- `react-hooks/purity`: Too strict for Next.js patterns (Date.now in render)
- `react-hooks/set-state-in-effect`: Valid pattern for hydration (set to "warn")
- Test files (`tests/**/*.ts`): Disable `rules-of-hooks` (Playwright fixtures trigger false positives)

**Pattern for Date.now in Render**
- Move impure calls (Date.now()) to component body above JSX, captured in closure
- ESLint `purity` rule flags these, so disable it or prefix: `const now = Date.now()`

---

### 2026-04-23: LLM-99 QA Verification

**Key Finding: Stack Mismatch**
- Issue title referenced pgLite (LLM-96) but project migrated to PostgreSQL 16 (LLM-84)
- Always verify actual stack before testing

**Bug Pattern: Missing Dependencies**
- `postcss.config.js` referenced `autoprefixer` but it wasn't in `package.json` devDependencies
- Lesson: When build fails on CSS processing, check PostCSS plugin dependencies
