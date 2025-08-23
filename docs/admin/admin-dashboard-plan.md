# Admin → AdminDashboard — Implementation & Test Plan

Metadata
- Page: Admin → AdminDashboard
- Author: Cline (automated plan)
- Date created: 2025-08-23 (UTC+3)
- Files examined:
  - frontend/src/pages/admin/AdminDashboard.tsx
  - frontend/src/hooks/useAdminDashboard.ts
  - frontend/src/services/api.ts
  - frontend/src/components/ui/ToastContext.tsx (existing from previous work)
  - backend routes referenced: /dashboard/stats, /dashboard/activities, /dashboard/pending-actions (backend controllers not inspected here)

Summary / scope
This document inventories the Admin Dashboard UI, maps every UI element to its data and backend API endpoints, and defines a complete plan for implementation, error handling, testing, and recommended improvements. The plan will be stored in this file and a changelog entry appended whenever I implement or modify features and confirm tests pass.

1) Page overview (what we inspected)
- frontend/src/pages/admin/AdminDashboard.tsx — layout and UI components (cards, recent activities, pending actions)
- frontend/src/hooks/useAdminDashboard.ts — data fetching hook; calls 3 endpoints and provides state (stats, activities, pendingActions), loading & error per-section, and a refetch function
- frontend/src/services/api.ts — axios client (handles auth & response error behavior)

2) Data model (fields consumed by the page)
- Stats (from GET /dashboard/stats)
  - totalTeachers (number)
  - totalStudents (number)
  - monthlyRevenue (number)
  - monthlyHours (number)
  - lastUpdated (timestamp, optional)
- Activity (from GET /dashboard/activities) — array of:
  - id (string)
  - action (string)
  - timestamp (ISO string)
  - targetType (string e.g., 'user', 'expense', 'payment')
  - details (string)
  - user? (object { id, name, email, role })
- PendingActions (from GET /dashboard/pending-actions)
  - pendingTeacherApprovals: { count: number }
  - pendingExpenseApprovals: { count: number, totalAmount: number }

3) Element-by-element inventory (UI controls, buttons, click targets)
- Header
  - Title and subtitle — static
- Stats cards (4 cards)
  - Total Teachers — displays `totalTeachers` or loading skeleton
  - Total Students — displays `totalStudents` or loading skeleton
  - Monthly Revenue — displays `monthlyRevenue` formatted as currency or loading skeleton
  - Hours This Month — displays `monthlyHours` or loading skeleton
- Recent Activities card
  - Shows up to 5 activity rows with:
    - colored dot (based on activity.targetType)
    - activity.action text
    - time ago (formatDistanceToNow)
  - No explicit buttons; it's read-only
- Pending Actions card
  - If pendingTeacherApprovals.count > 0:
    - Card block shows count and "Review" button which navigates to /teachers
  - If pendingExpenseApprovals.count > 0:
    - Card block shows count, total amount, and "Review" button which navigates to /financial
  - If none: message "No pending actions found"

4) Mapping UI actions → frontend behavior → API → DB effects
- Initial data load (on mount + when refetch triggered)
  - useAdminDashboard executes:
    - GET /dashboard/stats → read-only (DB SELECT/aggregates)
    - GET /dashboard/activities → read-only (DB SELECT recent activity logs)
    - GET /dashboard/pending-actions → read-only (DB queries for pending approvals)
  - DB effect: reads; no writes
  - Errors: caught per-section and stored in error.stats / error.activities / error.pendingActions
- "Review" buttons
  - navigate('/teachers') and navigate('/financial') — no direct API calls; the target pages will perform their own fetches
- Manual refresh (via hook.refetch)
  - increments refresh trigger to re-run all three fetches

5) Observed implementation details / issues to address
- useAdminDashboard contains console.log and console.error calls in the activities and pendingActions fetches. These should be replaced with structured error handling and user-visible messages (toasts) or kept for debug only behind a flag.
- Stats, activities, and pendingActions each have independent loading and error states — good separation.
- No cancellation logic for requests. If dashboard components unmount quickly or multiple refetch calls are fired, requests can race. Add AbortController support to the hook's API calls (the axios instance already supports signal).
- No unit tests currently for the hook or for the dashboard page.
- No toasts are shown on error; the page shows inline error text for activities/pendingActions, but stats errors are set and not surfaced besides the error object — ensure page surfaces stats errors too (AdminDashboard currently uses isLoading.stats and displays values but doesn't render error banner for stats).

6) Edge cases & error scenarios
- Authentication failure (401): api interceptor in frontend/src/services/api.ts currently removes token and redirects to /login — acceptable. Ensure redirects are acceptable in the dashboard context.
- Partial failures: If activities fail but stats succeed, the UI should still show stats and show an inline message for activities (current hook already does per-section error state).
- Slow network / unmount: Add AbortController to avoid setting state on unmounted components.
- Large activity lists: AdminDashboard slices activities to first 5 in UI, but the hook may fetch many; consider server-side limit or pass a query param (limit=5). For now, use limit param if backend supports it: GET /dashboard/activities?limit=5.
- Monetized numbers (monthlyRevenue) formatting and currency assumptions: currently hard-coded to en-US + USD; consider using app locale.

7) Recommended improvements (prioritized)
- Replace console.log/debug lines in useAdminDashboard with:
  - in-development structured logging behind a DEBUG flag (optional)
  - user-visible toast on critical errors, and inline error messages for section-level errors (keep both)
- Add AbortController support to the three GET requests and cancel on cleanup to avoid race conditions and unwanted setState after unmount.
- Add an optional `limit` param to activities fetching to reduce payload size: call GET /dashboard/activities?limit=5 if backend supports it.
- Show inline error UI for stats errors (AdminDashboard currently handles activities/pendingActions errors visually; ensure stats errors are visible).
- Add unit tests:
  - Hook tests (mock api.get to return success/failure, assert state transitions)
  - Component tests for AdminDashboard rendering loading, error, empty, and normal states (use React Testing Library)
- Add an integration (E2E) test for the pending actions flows (create pending teacher in test backend, visit dashboard, click Review, assert navigation to teachers and presence)
- Add toasts on critical failures or on refetch success if desired (consistency with Teachers page toasts)

8) Test matrix / QA checklist
- Manual tests:
  - Normal load: backend returns data for all three endpoints — verify cards populated and lists shown
  - Activities empty: backend returns empty activities array — verify "No recent activities found"
  - PendingActions empty: both pending counts 0 — verify "No pending actions found"
  - Partial failure: activities endpoint returns 500, stats OK — verify stats show and activities shows inline error
  - Auth expired: simulate 401 — verify redirect to /login (api interceptor handles this)
  - Refetch: call refetch (via a test button or programmatically) and verify data updates
- Automated tests:
  - Unit (vitest): useAdminDashboard tests
    - success paths: stats/activities/pendingActions set correctly
    - failure paths: per-section error set correctly when api.get rejects
    - cancellation: when controller aborts, ensure the hook doesn't override state or throws uncaught
  - Component (React Testing Library): AdminDashboard
    - Loading skeletons appear when isLoading flags true
    - Render of activities and pending actions for different datasets and error states
  - E2E (Playwright): Dashboard sanity flow and navigation to review pages

9) Implementation plan — step-by-step (small commits)
Phase A — Safe improvements (low risk)
1. Remove console.log / console.error debugging lines in useAdminDashboard; surface errors via toasts for critical errors and inline messages for section-level errors. (Commit)
2. Add AbortController support to each fetch call in useAdminDashboard and pass controller.signal to axios; abort on cleanup. (Commit)
3. Optional: Add `limit=5` to activities API call to minimize data. If backend doesn't support it, fall back gracefully. (Commit)
4. Add unit tests for useAdminDashboard (mock api.get). Run vitest and ensure tests pass. (Commit)

Phase B — UX & robustness (medium)
5. Add a small "Refresh" button on AdminDashboard (optional) that calls hook.refetch and shows a toast on success/failure.
6. Add component tests for AdminDashboard (loading, success, partial failure).
7. Add E2E test to verify pending action "Review" navigates to the correct page and that target page loads.

Phase C — Performance & API improvements (optional)
8. If activity lists are large, implement server-side limit/offset or socket-driven updates for real-time activities.
9. Consider adding aggregated metrics caching or polling with backoff.

10) Files to change (concrete)
- frontend/src/hooks/useAdminDashboard.ts
  - Remove console logs
  - Add AbortController usage
  - Add optional ?limit=5 to activities request
  - Use toast.error/toast.info for critical errors (ToastProvider is available app-wide)
  - Add unit tests for this hook under frontend/src/tests/hooks/
- frontend/src/pages/admin/AdminDashboard.tsx
  - Ensure stats errors (error.stats) are displayed (e.g., inline banner similar to activities/pending)
  - Consider adding a Refresh button that calls refetch
- frontend/src/services/api.ts
  - Already supports AbortController via axios; no changes required unless we want standardized timeout or retry logic
- docs/admin/admin-dashboard-plan.md (this file)
- tests:
  - frontend/src/tests/hooks/useAdminDashboard.test.ts (new)
  - frontend/src/tests/pages/AdminDashboard.test.tsx (component tests)

11) Changelog entry template (for this page)
- Date: YYYY-MM-DD HH:MM (TZ)
- Commit: git commit hash
- Author: Cline (automated)
- Change Type: Added / Edited / Fixed
- Function(s) or UI element(s) affected: e.g., useAdminDashboard.fetchActivities
- Files changed: list of files
- Description: short summary of change
- DB effect: READ/none
- Tests executed: unit/integration/e2e results
- Notes

12) Example small commit sequence for Phase A
- Commit 1: chore(dashboard): remove debug logs and wire toast for fetch failures
  - Files: frontend/src/hooks/useAdminDashboard.ts
  - Tests: none
- Commit 2: feat(dashboard): cancel inflight requests with AbortController in useAdminDashboard
  - Files: frontend/src/hooks/useAdminDashboard.ts
  - Tests: unit tests added for cancellation behavior
- Commit 3: test(dashboard): add unit tests for useAdminDashboard success and failure paths
  - Files: frontend/src/tests/hooks/useAdminDashboard.test.ts
  - Tests: vitest run — all pass

13) Acceptance criteria before moving to next page
- useAdminDashboard has no stray console.log/debug statements and uses toast for critical error feedback
- All three endpoints use AbortController and are cancelled on cleanup
- AdminDashboard displays inline errors for stats/activities/pendingActions when present
- Unit tests for useAdminDashboard pass locally (vitest)
- A short changelog entry is appended to this file documenting the changes and test results

14) Next steps I can take now (requires Act mode)
- Implement Phase A changes:
  - Remove console.log statements and add toasts, add AbortController, add limit param to activities
  - Add unit tests for the hook
  - Run tests and update changelog
- If you approve, I will start implementing Phase A now and create commits for each step, run vitest, and append changelog entries to `docs/admin/admin-dashboard-plan.md`.

If you'd like me to start Phase A immediately, reply "Proceed with Phase A for Admin Dashboard" and I will begin (I will commit each small step and update the plan file with changelog entries as changes are made and verified).
