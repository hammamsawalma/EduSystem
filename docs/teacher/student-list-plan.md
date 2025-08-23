# Teacher → StudentList — Implementation & Test Plan

Metadata
- Page: Teacher → StudentList
- Author: Cline (automated plan)
- Date created: 2025-08-23 (UTC+3)
- Files examined:
  - frontend/src/pages/teacher/StudentList.tsx
  - backend/routes/students.js
  - frontend/src/services/api.ts

Summary / scope
This document catalogs the StudentList page UI, maps each UI action to backend endpoints and DB effects, and provides a phased implementation plan (Phase A = low-risk changes; Phase B = hardening). After the plan is accepted, Phase A implementation can begin (implement data fetching, search, add/edit flows, export, tests).

1) Data model (fields used on UI)
- student.id (number|string)
- student.firstName, student.lastName
- student.email
- student.grade (string)
- student.subjects (string or array)
- student.status (e.g., "Active", "Inactive", "Alumni")
- student.balance (number)
- student.avatar initials or image url
- role relations (teacher -> students) are handled by backend authorization

2) Backend endpoints (from backend/routes/students.js)
- GET /api/students
  - Query params expected/possible: search, grade, status, teacherId, page, limit
  - DB effect: SELECT
- GET /api/students/:id
  - DB: SELECT specific student
- POST /api/students
  - DB: INSERT new student
- PUT /api/students/:id
  - DB: UPDATE student
- DELETE /api/students/:id
  - DB: DELETE (or soft-delete)
- PUT /api/students/bulk-update
  - DB: Bulk update (useful for bulk status/grade changes)

3) Element-by-element inventory (from StudentList.tsx)
- Page Header
  - Title: "My Students"
  - Add Student button — opens add form/modal
- Filters card
  - Search input (text)
  - Filter button (opens filter panel) — grade, status, subject
  - Export button — Export current filtered list (CSV)
- Students Table
  - Columns: Student (name + email), Grade, Subject(s), Status, Balance, Actions
  - Actions per-row: View (navigates or opens modal), Edit (opens modal), possibly Payments / Details
- No pagination or bulk selection visible in current UI — plan to add server-side pagination (page & limit) and optional bulk select/Export

4) Desired frontend behavior (mapping to API)
- Initial load: GET /api/students?teacherId=<currentTeacher>&page=1&limit=20
- Search: debounce input (300-500ms) -> GET /api/students?search=...&teacherId=...
- Filter (grade/status/subject): included as query params on GET
- Add student:
  - Open modal -> POST /api/students (body contains fields)
  - On success: close modal, toast success, re-fetch current page or append returned student
- Edit student:
  - Open modal with data -> PUT /api/students/:id
  - On success: update row and toast
- Delete student:
  - Confirm -> DELETE /api/students/:id
  - On success: remove from list and toast
- Export:
  - Client-side CSV for current filtered page OR backend endpoint for large exports (optional)
- Bulk-update:
  - Use PUT /api/students/bulk-update for status/grade changes (better than many DELETE/PUT requests)
  - If backend not available, implement Promise.allSettled per-item with summary toasts
- Pagination:
  - Use server-side pagination (page & limit)
  - UI: page numbers + prev/next + items per page

5) UX / Accessibility / Edge cases
- Debounce and Cancel (AbortController) for search requests
- Show loading skeletons while fetching
- Show inline section errors and global toast for critical failures
- Handle 401/403 globally (api interceptor already redirects)
- Handle empty states (no students) with helpful CTA to Add Student
- Validate add/edit form at client-side (required fields, email format) and surface server validation errors
- Avoid optimistic deletion: wait for server success before removing UI row

6) Tests (manual + automated)
- Manual:
  - Load page with no students -> empty state shown
  - Load page with students -> table populated (verify for several pages)
  - Search -> returns filtered results
  - Filter -> returns filtered results
  - Add student -> appears in list, DB has record
  - Edit student -> changes reflected in UI & DB
  - Delete student -> removed from UI & DB
  - Export -> CSV contents match filtered rows
  - Bulk-update -> successful status/grade changes and summary of failures
- Automated:
  - Unit: studentService methods (mock api.get/post/put/delete)
  - Hook tests for any student-list specific hooks (if created)
  - Component tests (React Testing Library) for StudentList:
    - renders loading, empty, populated states
    - search debounce behavior (mock api)
  - E2E (Playwright):
    - Add -> Edit -> Delete student flow
    - Pagination and search flows

7) Phase A — Implementation (low-risk, small commits)
1. Wire StudentList to API (GET /api/students) with server-side pagination, search & filter:
   - Create frontend service `studentService` (if not present) or use existing endpoints.
   - Add AbortController for search cancellation.
   - Render real data in table.
2. Add Add/Edit modal component (reuse TeacherFormModal pattern):
   - fields: firstName, lastName, email, phone (optional), grade, subjects, status, balance
   - client validation + server error handling
3. Add Delete confirmation modal (reuse existing ConfirmationModal)
4. Replace static export with CSV generation from fetched data (client-side) and add hint to implement server export for large data in future
5. Add toasts for success/failure and disable buttons during requests
6. Add unit tests for studentService (Vitest) and component test for StudentList basic behavior

8) Phase B — Hardening (medium)
1. Implement bulk-update endpoint usage (PUT /api/students/bulk-update) or per-item Promise.allSettled
2. Add component integration tests and E2E workflows
3. Add advanced filters, server-side sorting, and infinite scroll (as option)
4. Performance: lazy-load avatars, server-side search & indexing

9) Files to create/modify (concrete)
- frontend/src/pages/teacher/StudentList.tsx (modify to fetch real data + add modal triggers)
- frontend/src/services/studentService.ts (new) — methods: getStudents, getStudentById, createStudent, updateStudent, deleteStudent, bulkUpdate
- frontend/src/components/features/students/StudentFormModal.tsx (new)
- frontend/src/components/features/students/StudentActionsMenu.tsx (optional mirror of TeacherActionsMenu)
- frontend/src/components/features/students/ConfirmationModal.tsx (reuse existing)
- tests:
  - frontend/src/tests/services/studentService.test.ts
  - frontend/src/tests/pages/StudentList.test.tsx
- docs/teacher/student-list-plan.md (this file)

10) Acceptance criteria
- StudentList fetches real data (GET /api/students), shows loading states and errors
- Add/Edit/Delete call respective endpoints and persist changes to DB
- Search and filters work with debounce and cancellation
- Export produces correct CSV for current dataset
- Unit & component tests added and pass locally

Changelog strategy
- Add entry to docs/teachers/teachers-page-plan.md or new docs/teacher/student-list-plan.md when each Phase A commit and tests pass.

Ready to proceed
If you approve, I will:
- Implement Phase A step 1: create studentService and connect StudentList to GET /api/students with pagination, search, filters and AbortController. I will add small commits, run unit tests for studentService, and update the plan changelog.

Reply "Proceed with StudentList Phase A" to start implementing.
