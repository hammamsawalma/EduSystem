# Admin → Teachers Page — Implementation & Test Plan

Metadata
- Page: Admin → Teachers
- Author: Cline (automated plan)
- Date created: 2025-08-23 (UTC+3)
- Repo commit (context at plan time): 415377a25a3b339f66331da871a75e34ce4a5874
- Files examined:
  - frontend/src/pages/admin/TeachersPage.tsx
  - frontend/src/components/features/teachers/TeacherActionsMenu.tsx
  - frontend/src/components/features/teachers/TeacherFormModal.tsx
  - frontend/src/components/features/teachers/ConfirmationModal.tsx
  - frontend/src/services/teacherService.ts
  - backend/routes/users.js
  - backend/controllers/userController.js (referenced; not fully read in-plan)

Summary / scope
This document catalogs every UI element on the Admin → Teachers page, maps each UI interaction to frontend handlers and the backend API endpoints (DB effects), defines edge cases, test cases (manual + automated), and prescribes an iterative implementation plan. The file will be updated with a changelog entry every time a function is added/edited and successfully tested.

Data model (fields referenced by the UI)
- id (number)
- firstName (string)
- lastName (string)
- email (string)
- phone (string)
- subject (string)
- status (string) — expected values used in UI: "Pending", "Active", "Blocked"
- joinDate (timestamp string or null)
- role (string) — frontend uses role='teacher' when creating

Element-by-element inventory (UI elements and their behavior)
- Top bar
  - "Export CSV" button
    - Behavior: builds CSV from client-side filteredTeachers and triggers browser download.
    - No backend call; CSV content is derived from current client state.
  - "Add Teacher" button
    - Behavior: opens TeacherFormModal in Add mode. While creating, shows loader (isAddingTeacher) and disables button.

- Error banner
  - Renders when `error` state is non-null.

- Search & Filter
  - Search input (controlled; 500ms debounce)
    - Behavior: on change, after debounce, the page calls teacherService.searchTeachers(searchQuery, statusFilter) if there's search or a non-All status; otherwise teacherService.getTeachers().
    - Search should accept name, email, phone fragments.
  - Status select (All / Active / Pending / Blocked)
    - Behavior: changes trigger the same search endpoint.

- Bulk Actions bar (visible when any row selected)
  - Shows selected count, and 3 buttons:
    - Approve All -> calls handleBulkApprove
    - Block All -> handleBulkBlock
    - Delete All -> handleBulkDelete

- Teachers table
  - Header checkbox: select/deselect current page teachers
  - Columns:
    - Teacher (avatar placeholder + name)
    - Contact (email + phone)
    - Subject
    - Join Date (formatted)
    - Status badge (visual styles based on status)
    - Actions (TeacherActionsMenu component)

- Row-level actions (TeacherActionsMenu)
  - Toggle menu (MoreVertical icon). Closes on outside click.
  - View Details -> onView callback (currently logs only; will be enhanced)
  - Edit -> opens TeacherFormModal in Edit mode (initialData set)
  - Approve -> visible if status === 'Pending' -> triggers approve confirmation flow
  - Block -> visible if status === 'Active' -> triggers block confirmation flow
  - Delete -> triggers delete confirmation flow

- Pagination
  - Prev/Next for narrow screens
  - Page number buttons + Prev/Next for wide screens
  - Showing X to Y of Z results label

- Modals
  - TeacherFormModal (Add/Edit)
    - Fields: firstName, lastName, email, phone, subject. If editing, a `status` select is shown.
    - Validation: required fields + valid email format.
    - Buttons: Cancel (onClose) and Save (onSave -> calls API)
  - ConfirmationModal (used for delete/approve/block)
    - onConfirm invoked to perform action. Confirm button text uses loading flags when processing.

Mapping: UI action -> frontend handler -> API endpoint -> DB effect -> tests
- Fetch teachers (initial load + search/filter)
  - Frontend: teacherService.getTeachers() or teacherService.searchTeachers()
  - API: GET /api/users?role=teacher[&search=...][&status=...]
  - DB: SELECT users WHERE role='teacher' [AND search conditions] [AND status=...]
  - Test cases: empty dataset, matching search fragments, status filters.

- Add teacher
  - Frontend handler: handleAddTeacher(TeacherFormData)
  - API: POST /api/users with payload including role='teacher', status='Pending'
  - DB: INSERT into users
  - UI state update: append returned teacher to `teachers` array
  - Tests:
    - Valid submission -> teacher appears in UI & DB
    - Invalid fields -> client validation blocks submit
    - Duplicate email -> backend error surfaced in UI

- Edit teacher
  - Frontend handler: handleEditTeacher(formData)
  - API: PUT /api/users/:id
  - DB: UPDATE user row
  - UI update: replace teacher in `teachers` with updatedTeacher returned from API
  - Tests: update fields, conflict handling, race conditions

- Delete teacher (single)
  - Frontend handler: handleDeleteTeacher()
  - API: DELETE /api/users/:id
  - DB effect: DELETE row or soft-delete (depends on backend)
  - UI update: remove teacher from local `teachers`
  - Tests: successful removal, backend missing id -> graceful error

- Delete teacher (bulk)
  - Frontend handler: handleBulkDelete() (batch)
  - API: DELETE /api/users/:id (per id) — currently a series of calls
  - DB effect: multiple deletes
  - Improvement: consider server bulk delete endpoint or Promise.allSettled for partial failure reporting
  - Tests: partial failures, performance for many items

- Approve teacher (single)
  - Frontend handler: handleApproveTeacher()
  - API: PATCH /api/users/:id/status { status: 'Active' }
  - DB effect: UPDATE users.status
  - UI update: replace teacher in local `teachers` with updatedTeacher
  - Tests: confirm status change in DB & UI

- Approve teacher (bulk)
  - handleBulkApprove loops updateTeacherStatus per id (now uses per-promise handling) and re-fetches list
  - Improvement: server bulk-status endpoint recommended
  - Tests: partial failure handling

- Block teacher (single/bulk)
  - Similar to approve, setting status to 'Blocked'

- Export CSV
  - Client-only CSV generation from `filteredTeachers` and download via Blob + link click
  - Tests: content of CSV reflects filters and formatting of joinDate

State variables & interactions
- teachers: Teacher[] (page data)
- isLoading, error: generic list loading and error reporting
- isAddingTeacher, isDeletingTeacher, isApprovingTeacher, isBlockingTeacher: per-operation loading states
- selectedTeacher: Teacher | null for single-item modal flows
- selectedTeachers: number[] for bulk selections
- showBulkActions: boolean controlled by selectedTeachers.length
- searchQuery, statusFilter: controlled inputs driving search calls
- pagination: currentPage, itemsPerPage, derived indices for display

Edge cases & error scenarios
- Authorization errors (401/403) — API routes are protected. Frontend must include auth token and handle 401 by redirecting to login or showing appropriate message.
- Network failures and partial bulk failures — use Promise.allSettled or report per-id failures instead of failing silently.
- Race conditions: consider re-fetch after mutations or use operation-specific returned data to update state.
- Large datasets: current approach fetches full filtered set and paginates client-side. For scale, implement server-side pagination.
- Input validation: Add server-side validation awareness (unique email, etc.) and surface backend errors in UI.

Recommended improvements (prioritized)
1. Replace console.log success messages with a toast/notification mechanism.
2. Add AbortController support to cancel stale search requests.
3. Use Promise.allSettled with clear UI feedback for bulk operations; optionally implement server bulk endpoints.
4. Add server-side pagination and update frontend to request pages (avoid fetching whole dataset).
5. Improve accessibility (aria attributes and keyboard support), and add tests.

Test matrix
- Manual tests:
  - Empty list: verify empty state appears
  - Load and display teachers
  - Search by name/email/phone; combine with status filter
  - Add teacher: client validation, backend errors, UI list update
  - Edit teacher and verify DB & UI
  - Delete & bulk delete
  - Approve & block (single and bulk)
  - Export CSV matches filtered list
  - Pagination correctness after mutations
  - Unauthorized requests handling
- Automated tests:
  - Unit: teacherService methods (mock api)
  - Component: TeacherFormModal (validation), TeacherActionsMenu (visibility)
  - Integration/E2E: add -> edit -> approve -> block -> delete flow

Implementation plan (iterative)
Phase A — Stabilize (low risk)
- Add toast notifications for success/error.
- Add request cancellation for search (AbortController).
- Improve bulk handlers to use Promise.allSettled and show partial results.
- Add unit tests for teacherService.

Phase B — Hardening (medium)
- Consistent toasts & error handling across page.
- Disable buttons during operations to prevent duplicate requests.
- Accessibility improvements and keyboard support.
- Component/integration tests for flows.

Phase C — Performance / Scale (optional)
- Server-side pagination (GET /api/users?page=..&limit=..).
- Server-side bulk endpoints (status change, delete).
- Server streaming CSV export endpoint for large datasets.

Files likely to change
- frontend/src/pages/admin/TeachersPage.tsx
- frontend/src/components/features/teachers/TeacherFormModal.tsx
- frontend/src/components/features/teachers/TeacherActionsMenu.tsx
- frontend/src/components/features/teachers/ConfirmationModal.tsx
- frontend/src/services/api.ts (for AbortController & axios config)
- frontend/src/services/teacherService.ts (optional bulk endpoints)
- docs/teachers/teachers-page-plan.md (this file will be updated)
- tests/* (add unit & e2e tests)

Acceptance criteria
- All page functions read/write to DB via API and show accurate UI state after operations.
- Success and error conditions show user-visible messages (toasts).
- Bulk operations report partial failures and do not silently lose errors.
- Search/filter/pagination behave and are covered by tests.
- Tests: unit tests for service methods and at least one E2E coverage for primary flow.

Changelog (will be appended after each successful edit & test)
- Template for each entry:
  - Date: YYYY-MM-DD HH:MM (TZ)
  - Commit: <git commit hash>
  - Author: Cline (automated)
  - Change Type: Added / Edited / Fixed / Removed
  - Function(s) or UI element(s) affected:
  - Files changed:
  - Description:
  - DB effect: INSERT / UPDATE / DELETE / READ
  - Tests executed:
    - Unit: pass/fail
    - Integration: pass/fail
    - E2E: pass/fail
  - Notes:

Initial changelog (empty)
- No changes yet. The first real changelog entry will be created after the first implementation commit and successful tests.

Changelog
- Date: 2025-08-23 10:29 (UTC+3)
- Commit: (local change, not yet pushed)
- Author: Cline (automated)
- Change Type: Added / Edited
- Function(s) or UI element(s) affected:
  - Toast notifications (ToastProvider, ToastContext)
  - TeachersPage UI messaging (replaced console.log with toasts)
  - teacherService.searchTeachers: added AbortSignal param and cancellation support
  - TeachersPage: debounced search now uses AbortController to cancel stale requests
  - TeachersPage: bulk handlers updated to use per-promise handling (reports per-id results)
  - Unit tests added for teacherService.searchTeachers
- Files changed:
  - frontend/src/components/ui/ToastContext.tsx (NEW)
  - frontend/src/App.tsx (wrapped AppContent with ToastProvider)
  - frontend/src/pages/admin/TeachersPage.tsx (integrated toasts; added cancellation; bulk handlers updated)
  - frontend/src/services/teacherService.ts (searchTeachers now accepts AbortSignal)
  - frontend/src/tests/services/teacherService.test.ts (NEW)
- Description:
  Implemented user-visible toast notifications, added request cancellation for search to avoid race conditions, updated bulk handlers to perform per-item promises and show a summary of successes/failures, and added unit tests for `teacherService.searchTeachers`.
- DB effect:
  - No DB schema changes. Frontend behavior and API usage unchanged except for search request cancellation support and improved bulk handling.
- Tests executed:
  - Unit: teacherService.searchTeachers tests added and passed (vitest) — 4/4 tests passing
  - Integration: manual verification during development — toasts appear on success/error; search cancellation tested locally
  - E2E: pending
- Notes:
  - Commits are local; will push and update commit hashes when ready.
  - Next tasks: push changes, replace remaining console.log calls across the frontend, add component/integration tests, and consider server-side bulk/pagination endpoints for scale.

How to run & verify locally (developer notes)
- Frontend (development):
  - cd frontend
  - npm install
  - npm run dev
  - Open the app (typically http://localhost:5173 or printed by vite)
- Backend (development):
  - cd backend
  - npm install
  - npm run dev
  - Ensure .env has DB configuration and server starts (default: http://localhost:5000)
- Tests:
  - Run vitest:
    - cd frontend && npx vitest run
  - For E2E: run Playwright/Cypress if configured

Notes & references
- Frontend service mapping: frontend/src/services/teacherService.ts uses `BASE_URL = '/users'` and maps to backend `backend/routes/users.js`.
- Backend routes are protected with `authenticate` and `isAdmin`/`isOwnerOrAdmin` middleware — ensure frontend requests include the auth token (api client configured in frontend/src/services/api.ts).
- Audit middleware on backend (backend/middleware/audit.js) should capture create/update/delete/status changes.

Next steps (require Act mode)
- I implemented Phase A changes described in the changelog (toasts, cancellation, bulk-per-promise handling) and added unit tests that passed locally.
- Recommended immediate next steps:
  1. Commit & push local changes (I can do this if you want me to push; otherwise you can push).
  2. Replace other remaining console.log calls across the frontend with toasts (low-risk incremental).
  3. Add component/integration tests (TeacherFormModal, TeachersPage flows).
  4. Plan server-side bulk & pagination endpoints if expecting large datasets.

If you want me to push the local commits and open a PR, say "Please push and create a PR" and I'll proceed.
