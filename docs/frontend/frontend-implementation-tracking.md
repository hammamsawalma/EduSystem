# Frontend Implementation & Tracking Plan

Overview
This document is the single-source tracking sheet for frontend implementation progress, goals, and test status. It links page-level plans and records status for Phase A (stabilize), Phase B (harden), and Phase C (scale). Each page has its own plan file (docs/.../...-plan.md) and changelog entries are appended there after each successful commit + tests.

How to use this document
- Each page section lists current status, recent commits (local branch names), next tasks, and test status.
- After I implement a change and tests pass, I will append a changelog entry to the page's plan and update this tracking file.

Pages / Components (high level)
1. Admin → Teachers
   - Plan: docs/teachers/teachers-page-plan.md
   - Status: Phase A completed (toasts, search cancellation, bulk per-item handling, unit tests)
   - Branch: feat/teachers-toasts-abort-bulk-tests (pushed)
   - Next: Replace remaining console.log across app; add integration & E2E tests

2. Admin → AdminDashboard
   - Plan: docs/admin/admin-dashboard-plan.md
   - Status: Phase A implemented (request cancellation, toasts, unit tests for hook)
   - Branch: feat/admin-dashboard-phase-a (pushed)
   - Next: Add visible stats error banner (done), Refresh button (done), add component tests and push PR

3. Teacher → StudentList
   - Plan: docs/teacher/student-list-plan.md
   - Status: Phase A started — studentService created; StudentList wired to GET /api/students with debounce, cancellation, CSV export; basic UI wired (open modals not yet implemented)
   - Branch: feat/studentlist-phase-a (local changes committed; branch created as part of Phase)
   - Next: Implement Add/Edit modal (StudentFormModal), Delete confirmation, unit tests for service and component tests

4. Teacher → TimeTracking
   - Plan: (pending) docs/teacher/time-tracking-plan.md
   - Status: Not started
   - Next: Read and plan

5. Global UI & Utility Work
   - Toast system added (frontend/src/components/ui/ToastContext.tsx)
   - API client supports AbortController
   - Test harness uses vitest + @testing-library; some test environment shims added for hooks tests

Testing Strategy & Runner
- Unit tests: Vitest
  - Run: cd frontend && npx vitest run
  - Focus: services, hooks, small pure components
- Component tests: React Testing Library (vitest environment)
  - Focus: rendering, behavior under loading/error states
- Integration tests: combination of RTL and mocked services or lightweight backends
- E2E: Playwright (configured as devDependency)
  - Scripts: use Playwright test runner or `npx playwright test` (if Playwright tests added)

Up-to-date Test Results (latest local run)
- teacherService tests: passing
- studentService tests: passing
- useAdminDashboard hook tests: passing (some test output produced during initial runs; fixed)
- Notes: A few test runs produced console error logs due to intentional failure mocks — handled and assertions added. There were also environment shims to provide a JSDOM window for hook tests.

Phase A checklist for all core pages (summary)
- Teachers: toasts, search cancellation, bulk handlers, unit tests — complete
- Admin Dashboard: cancellation, toasts, stats error banner, Refresh button, unit tests — complete
- StudentList: service & list wiring, debounce + cancellation, CSV export — implemented; modals + unit/component tests pending
- TimeTracking: plan pending
- System Settings / other admin pages: plan pending

Next steps (recommended order)
1. Finish StudentList Phase A (Add/Edit modal, Delete, tests).
2. Replace remaining console.log instances across the frontend with toasts and update changelogs.
3. Add component/integration tests for Teachers and Admin Dashboard.
4. Create Playwright E2E specs for main flows (add/edit/approve/delete for teachers & students).
5. Add server-side pagination & server bulk endpoints if dataset size requires.

How I will report progress
- For each commit that implements a Phase A/B change:
  1. Run unit tests locally (vitest)
  2. Append a changelog entry to the page plan (docs/...-plan.md) with commit info and test results
  3. Push branch, open PR, and include the changelog entry in PR description
  4. Mark status here (this tracking file) as updated

If you confirm, I will:
- Complete StudentList Phase A (create StudentFormModal, Delete flow, tests) and push to a branch, then update this tracking doc and its changelog entry.
- After that, prepare a runnable test plan (step-by-step checklist) you can follow locally to verify all pages end-to-end — I will create docs/tests/frontend-test-plan.md and populate it with commands and expected results.

Reply "Proceed with StudentList Phase A implementation" to start the StudentList Phase A work and I will implement, test, and push changes with changelog entries.
