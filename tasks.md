# ClassCompass — Jira Task Cards

> Structured tasks derived from `observations.md`. Format is copy-paste ready for Jira.
> Each card: **Type** · **Priority** · **Summary** · **Description** · **Acceptance Criteria**.
> Epics group related work; labels link back to the corresponding `observations.md` finding.

---

## Epic 1 — Auth & Session Security
**Label:** `security` · **Linked findings:** §1.1, 1.6, 1.9, 1.10, 1.11, 1.14

---

### CARD-101 · Bug · P0 · Remove spoofable `x-phone-number` authentication

**Summary:** Replace client-supplied `x-phone-number` identity with the signed session JWT.

**Description:**
Several routes trust `request.headers.get('x-phone-number')` as the caller's identity with no verification. Because `middleware.ts:31` skips `/api` and `lib/phone-auth.ts` is an empty stub, any client can impersonate any user (including admins) by supplying their phone number. Combined with `Access-Control-Allow-Origin: *`, this is a full account-takeover vector.

Affected routes:
- `app/api/teachers/schedules/route.ts:21-29`
- `app/api/representative/schedules/route.ts:15-26, 62-73, 133-144, 210-221`
- `app/api/representative/sections/route.ts:8-20, 56-68, 123-135`
- `app/api/representative/teachers/route.ts:19-30, 87-98, 152-163`

**Acceptance Criteria:**
- [ ] All affected routes resolve identity via `getSession(request)` / `getRequestUser(request)` instead of the raw header.
- [ ] Requests without a valid session return `401` (not `200` with spoofed data).
- [ ] `lib/phone-auth.ts` is implemented or deleted.
- [ ] Regression test: a request with an arbitrary `x-phone-number` header and no session cookie is rejected.

---

### CARD-102 · Bug · P0 · Validate `JWT_SECRET` at startup

**Summary:** Fail fast if `JWT_SECRET` is missing or too short.

**Description:**
`utils/session.ts:7` encodes `process.env.JWT_SECRET` without checking presence/length. An unset var coerces to the string `"undefined"` (9 bytes), which `jose` HS256 rejects (needs ≥32 bytes), causing runtime 500s on login with no readable error.

**Acceptance Criteria:**
- [ ] `JWT_SECRET` is checked for presence and minimum 32-byte length at module load.
- [ ] Missing/invalid secret produces a clear, actionable error at boot (not a login-time 500).
- [ ] No unset-secret path can silently reach `SignJWT`.

---

### CARD-103 · Bug · P1 · Harden session cookie flags

**Summary:** Add `sameSite`, `secure`, and `path` to the session cookie.

**Description:**
The cookie is set with only `{ expires, httpOnly: true }` in `app/api/auth/route.ts:64-65` and re-set with `{ name, value, httpOnly, expires }` in `utils/session.ts:36-41`. Missing `secure` (app is HTTPS in prod) and `sameSite` (mitigates CSRF).

**Acceptance Criteria:**
- [ ] Cookie set with `httpOnly: true, secure: true, sameSite: 'Lax', path: '/'`.
- [ ] Login, session refresh, and logout continue to work in dev (non-HTTPS) and prod (HTTPS).

---

### CARD-104 · Bug · P1 · Make `getSession` resilient to invalid tokens

**Summary:** Return `null` (not throw) on tampered/expired session cookies.

**Description:**
`utils/session.ts:15-26` has no try/catch; `jwtVerify` rejects on invalid/expired cookies and the error propagates. `middleware.ts:35` and API routes then return 500 instead of redirecting to login / returning 401. A malformed cookie is a trivial DoS.

**Acceptance Criteria:**
- [ ] `getSession`/`decrypt` catch verify errors and return `null`.
- [ ] Invalid cookie → middleware redirects to login (no 500).
- [ ] Invalid cookie → API routes return `401` (no 500).

---

### CARD-105 · Bug · P1 · Change `tg_id` from `Float` to `String`/`BigInt`

**Summary:** Prevent Telegram ID precision loss for large accounts.

**Description:**
`prisma/schema.prisma:27` stores `tg_id` as `Float`. Telegram IDs can exceed `Number.MAX_SAFE_INTEGER` (2^53); `Number(...)` conversions in `utils/request-auth.ts:20` and `app/api/auth/route.ts:41` corrupt large IDs.

**Acceptance Criteria:**
- [ ] Schema migrated to `BigInt` (or `String`).
- [ ] All `Number(...)`/`parseFloat` conversions updated to use `BigInt`/`toString()`.
- [ ] Migration written and run; existing data preserved.

---

### CARD-106 · Bug · P1 · Re-validate role against DB on each request

**Summary:** Close the stale-role privilege window after demotion.

**Description:**
`getRequestUser` (`utils/request-auth.ts:6-8`) returns the JWT's `fetched_user` without a DB re-check. Most routes authorize off this stale `user_role`, so a demoted user keeps privileges for up to the 1h session TTL.

**Acceptance Criteria:**
- [ ] `getRequestUser` (or a shared guard) re-reads `user_role` from the DB on each authenticated request.
- [ ] A demoted user's privileges are revoked immediately (next request).
- [ ] No measurable perf regression (single indexed lookup by `user_id`).

---

## Epic 2 — Authorization & Data Isolation (IDOR)
**Label:** `security` · **Linked findings:** §1.2, 1.7, 1.8, 1.15, 1.18

---

### CARD-201 · Bug · P0 · Add auth to anonymous data endpoints

**Summary:** Require authentication on `user/create-users`, `sections`, `managers` POST, `courses` GET, `get-teachers`.

**Description:**
Several endpoints are reachable without authentication and leak PII or allow privilege escalation:
- `app/api/user/create-users/route.ts:5-27` — anonymous role escalation to `ADMIN`; returns raw error object (`:26`).
- `app/api/sections/route.ts:5-32` (GET) / `:35-71` (POST) — no auth; GET leaks manager `phone_number`/`tg_username` (`:12-20`); POST persists unsanitized `section_name` (`:62`).
- `app/api/managers/route.ts:5-112` (POST) — no auth; anyone can create a MANAGER.
- `app/api/courses/route.ts:72-124` (GET) — `user` never null-checked; anonymous callers get all courses.
- `app/api/user/get-teachers/route.ts:34-105` — no 401; anonymous callers get all teachers incl. PII.

**Acceptance Criteria:**
- [ ] Each endpoint returns `401` for unauthenticated requests.
- [ ] Role checks applied where appropriate (e.g. `create-users` and `managers` POST are ADMIN-only).
- [ ] GET endpoints scope results to the caller's role/sections.
- [ ] Raw error objects are never returned to the client.

---

### CARD-202 · Bug · P0 · Enforce section-scope on course CRUD (IDOR)

**Summary:** Managers can only read/edit/delete courses in their own sections.

**Description:**
`app/api/courses/[id]/route.ts` GET/PUT/DELETE only check `['ADMIN','MANAGER']` (`:9, :32, :69`) with no ownership check on the course's section — a manager can modify or delete any course by ID.

**Acceptance Criteria:**
- [ ] Manager requests verify the course's `section_id` is within their scope (`managerSection` or direct `section.manager_id`).
- [ ] Out-of-scope access returns `403`.
- [ ] ADMIN retains full access.

---

### CARD-203 · Bug · P0 · Enforce section-scope on schedule & teacher reads

**Summary:** Managers can only list schedules and teachers in their own sections.

**Description:**
- `app/api/schedules/route.ts:51-62` — MANAGER/ADMIN branch returns all schedules with no section filter.
- `app/api/teachers/route.ts:6-57` — GET returns all teachers; `sectionId` filter is client-supplied (`:26-28`).

**Acceptance Criteria:**
- [ ] Manager schedule/teacher listings are filtered to their sections server-side.
- [ ] `403` or empty result for out-of-scope `sectionId`.
- [ ] ADMIN retains full access.

---

### CARD-204 · Bug · P0 · Whitelist fields in `PATCH /api/user/[id]`

**Summary:** Prevent mass assignment in user PATCH.

**Description:**
`app/api/user/[id]/route.ts:82-85` spreads the entire request body into `prisma.user.update` (`data: body`). The sibling `PUT` (`:180-190`) whitelists correctly; PATCH does not, allowing overwrite of `user_role`, `tg_id`, `tg_username`, etc.

**Acceptance Criteria:**
- [ ] PATCH explicitly allowlists updatable fields (matching PUT's whitelist).
- [ ] Attempting to set `user_role`/`tg_id`/`tg_username`/`photo_url` via PATCH is ignored or rejected.
- [ ] Unique-constraint conflicts return `409`, not `500`.

---

### CARD-205 · Bug · P1 · Validate sectionIds on manager teacher reassignment

**Summary:** A manager cannot move a teacher into sections outside their scope.

**Description:**
`app/api/user/[id]/route.ts:207-218` replaces a teacher's `sectionIds` without verifying the new sections are within the manager's scope.

**Acceptance Criteria:**
- [ ] New `sectionIds` validated against manager scope before assignment.
- [ ] Out-of-scope section → `403`.

---

### CARD-206 · Bug · P1 · Fix arbitrary section selection in schedule creation

**Summary:** Determine the schedule's section deterministically and validate course membership.

**Description:**
`app/api/schedules/route.ts:88-101` uses `teacherSection.findFirst({ where: { teacher_id } })`, which returns an arbitrary section for multi-section teachers — driving both auth and `section_id` (`:130`). The course is never verified to belong to that section, and `schedule_date` is unvalidated.

**Acceptance Criteria:**
- [ ] If `section_id` is provided, use and validate it.
- [ ] If omitted and the teacher has multiple sections, require `section_id` instead of guessing.
- [ ] Verify the course belongs to the target section.
- [ ] Validate `schedule_date` format.

---

### CARD-207 · Bug · P1 · Unify manager section-access checks

**Summary:** Make all routes treat direct `section.manager_id` and `managerSection` consistently.

**Description:**
`managerCanAccessSection`/`managerCanAccessTeacher` union both relations (`app/api/schedules/route.ts:8-26`, `app/api/user/[id]/route.ts:6-19`), but `app/api/teachers/route.ts:84-97, 189-204, 256-271` and `app/api/courses/route.ts:25-38` only check `managerSection`.

**Acceptance Criteria:**
- [ ] A single shared helper is used for manager scope checks everywhere.
- [ ] Direct `section.manager_id` assignments are honored across all routes.

---

## Epic 3 — Notification & Cron Pipeline
**Label:** `notifications` · **Linked findings:** §1.3, 1.4, 1.5, 1.20, P2 cron items

---

### CARD-301 · Bug · P0 · Protect cron endpoints with a secret

**Summary:** Add `CRON_SECRET` (or `x-vercel-cron`) verification to all cron routes.

**Description:**
All four `/api/cron/*` routes run with no auth, and three honor `?force=true` to bypass weekday gating — enabling public mass notification blasts.

**Acceptance Criteria:**
- [ ] All cron routes verify `Authorization: Bearer ${CRON_SECRET}` (and/or `x-vercel-cron`).
- [ ] `force` bypass is removed or restricted to authenticated callers.
- [ ] `CRON_SECRET` documented in `.env.example`.

---

### CARD-302 · Bug · P0 · Fix cron scheduling config

**Summary:** Ensure every intended reminder job actually runs.

**Description:**
`vercel.json:2-11` schedules only 2 of 4 jobs, both Wednesday 09:00 UTC. `runSundayReminder` (`utils/sunday-reminder.ts`) — the only function that notifies **managers** about missing schedules and supports the **Friday** path — is never scheduled.

**Acceptance Criteria:**
- [ ] `vercel.json` lists the correct cron entries for each intended job (including a Friday schedule if Friday reminders are wanted).
- [ ] `runSundayReminder` is reachable by an actually-scheduled endpoint.
- [ ] Duplicate `schedule-notification`/`sunday-reminder` routes are consolidated (see CARD-304).

---

### CARD-303 · Bug · P0 · Reconcile Telegram bot token env vars

**Summary:** Fix silent notification failure from mismatched token variables.

**Description:**
Notifications read `BOT_TOKEN` (`utils/notifications.ts:4`), auth reads `TELEGRAM_API_KEY` (`app/api/auth/route.ts:16`), and `docker-compose.yml:10` sets `NEXT_PUBLIC_TELEGRAM_BOT_TOKEN`. If only `TELEGRAM_API_KEY` is set, `bot` is `null` and every send silently returns `false` (`utils/notifications.ts:45-48`) while DB rows are still created.

**Acceptance Criteria:**
- [ ] Single canonical token variable used everywhere (document decision in `.env.example`).
- [ ] Missing token produces a visible startup warning.
- [ ] End-to-end test confirms a Telegram message is actually delivered.

---

### CARD-304 · Bug · P1 · Remove duplicate schedule-notification route

**Summary:** Consolidate the copy-paste `schedule-notification` and `sunday-reminder` routes.

**Description:**
`app/api/cron/schedule-notification/route.ts:2` imports and calls `runSundayReminder` — identical to `app/api/cron/sunday-reminder/route.ts`. There is no dedicated schedule-notification utility.

**Acceptance Criteria:**
- [ ] One route remains for `runSundayReminder`; the other is removed (or given its own, distinct behavior).
- [ ] No dead route references in `vercel.json`.

---

### CARD-305 · Bug · P1 · Fix timezone rendering in notifications

**Summary:** Render reminder times in Addis Ababa time, not UTC.

**Description:**
`utils/notifications.ts` formats without `timeZone`: `:295` (`toLocaleTimeString`), `:314/:336/:354` (`toLocaleDateString`), `:126/:191` (`toLocaleString`). On Vercel (UTC) a 09:00 Addis class shows as "06:00".

**Acceptance Criteria:**
- [ ] All date/time formatting passes `timeZone: 'Africa/Addis_Ababa'` (or `APP_TIMEZONE`).
- [ ] Reminder messages display correct local class times.

---

### CARD-306 · Bug · P1 · Fix cron UTC offset

**Summary:** Align Vercel cron time with intended Addis business hour.

**Description:**
`vercel.json` fires `0 9 * * 3` = 09:00 UTC = noon Addis, while code computes weekday in Addis time. If 9:00 AM Addis was intended, schedule `0 6 * * 3`.

**Acceptance Criteria:**
- [ ] Cron schedule matches the intended local time (documented).
- [ ] Day-of-week logic and trigger time use consistent timezone assumptions.

---

### CARD-307 · Bug · P2 · Scope weekly empty-schedule report per manager

**Summary:** Don't send every manager a report of sections they don't manage.

**Description:**
`utils/empty-schedule-alert.ts:187-190` and `notifyWeeklyEmptyScheduleReport` (`utils/notifications.ts:404-439`) send all empty sections to every manager — a cross-section info leak. Managers also get both a per-section alert and a global report (double notification).

**Acceptance Criteria:**
- [ ] Weekly report is filtered to each manager's own sections.
- [ ] Redundant per-section + report duplicate is removed or made opt-in.

---

### CARD-308 · Task · P2 · Wire up or remove unused notification helpers

**Summary:** Use `notifySectionChange` and `notifyUnavailability` or delete them.

**Description:**
`utils/notifications.ts:89` (`notifySectionChange`) and `:208` (`notifyUnavailability`) are exported but never invoked. Designed in `NOTIFICATION_SYSTEM.md` but never wired to endpoints.

**Acceptance Criteria:**
- [ ] Each helper is either called from its intended feature, or removed along with its documentation references.

---

## Epic 4 — Data Integrity & Backend Correctness
**Label:** `backend` · **Linked findings:** §1.12, 1.13, 1.16, 1.17, P2 misc

---

### CARD-401 · Bug · P1 · Remove `$disconnect()` on shared Prisma singleton

**Summary:** Stop breaking the shared Prisma client after requests.

**Description:**
Multiple routes call `prisma.$disconnect()` in `finally`, but every Prisma alias resolves to the same global singleton (`lib/prisma.ts:11-13`), breaking subsequent requests. Affected: `teachers/schedules/route.ts:61-63`, `managers/route.ts:110-112`, `managers/teachers/route.ts:92-94`, `representative/schedules/route.ts:55-57, 126-128, 203-205, 244-246`, `representative/teachers/route.ts:80-82, 145-147, 190-192`.

**Acceptance Criteria:**
- [ ] All `$disconnect()` calls removed.
- [ ] No "already disconnected" runtime errors under concurrent load.

---

### CARD-402 · Bug · P1 · Fix `get-managers` missing `telegram_id`

**Summary:** Return the actual `tg_id` for managers.

**Description:**
`app/api/user/get-managers/route.ts:15` maps `telegram_id: user.tg_id` but the `select` (`:47-72`) never includes `tg_id`, so the field is always `undefined`.

**Acceptance Criteria:**
- [ ] `tg_id` included in the Prisma `select`.
- [ ] Response contains a real `telegram_id` (or the field is removed from the contract).

---

### CARD-403 · Bug · P1 · Respect `section_id` in schedule update

**Summary:** Stop silently ignoring `section_id` on schedule PUT.

**Description:**
`app/api/schedules/[id]/route.ts:93-124` accepts `section_id` but overwrites it with `teacherSection.section_id` (`:122`).

**Acceptance Criteria:**
- [ ] Supplied `section_id` is validated and honored, or rejected with an explanatory error.

---

### CARD-404 · Bug · P1 · Add required-field validation to prevent 500s

**Summary:** Validate inputs instead of relying on Prisma constraint errors.

**Description:**
Multiple endpoints surface unhandled Prisma errors as 500s:
- `representative/schedules/route.ts:75-78, 146-149` — `course_id` optional at validation but required by schema (`prisma/schema.prisma:90`).
- `user/route.ts:22` — no `user_role`/`tg_username`/`sectionIds` validation.
- `user/route.ts:60` — `where: { user_role: query as any }` → invalid enum → 500.
- `courses/route.ts:45-56` — `section_id` existence not validated.
- `admin/bulk-upload/route.ts:63-69` — `normalizeUserRole` silently coerces unknown roles to `TEACHER`.

**Acceptance Criteria:**
- [ ] Missing/invalid required fields return `400` with a clear message.
- [ ] Invalid enum/role values are flagged (not silently coerced) in bulk upload.
- [ ] No unhandled Prisma errors surface as raw 500s.

---

### CARD-405 · Task · P2 · Standardize API response envelopes & status codes

**Summary:** Consistent success/error shapes and status codes across routes.

**Description:**
Routes currently return inconsistent shapes (`{ users }`, `{ teacher }`, `{ error }`, `{ error, details }`, `{ message, error }`) and mixed status codes (200 vs 201 on create).

**Acceptance Criteria:**
- [ ] Shared response helpers (e.g. `ok()`, `created()`, `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`).
- [ ] Internal `error.message`/`details` never returned to clients.
- [ ] Create endpoints consistently return `201`.

---

### CARD-406 · Task · P2 · Use transactions & `createMany` for bulk operations

**Summary:** Eliminate N+1 and partial-apply in bulk/user-creation endpoints.

**Description:**
`app/api/user/create-users/route.ts:10-22` creates sequentially; `app/api/admin/bulk-upload/route.ts` performs per-row round trips with no transaction, so a mid-file failure leaves partial state.

**Acceptance Criteria:**
- [ ] `createMany`/batched writes used where applicable.
- [ ] Bulk upload wrapped in a transaction so it is atomic.

---

## Epic 5 — Dead Code & Cleanup
**Label:** `cleanup` · **Linked findings:** §3

---

### CARD-501 · Task · P2 · Remove the abandoned "representative" role

**Summary:** Delete `components/representative/*` and the dead `/api/representative/*` surface.

**Description:**
The "representative" concept was renamed to MANAGER but never cleaned up. Prisma only defines `MANAGER | ADMIN | TEACHER` (`prisma/schema.prisma:17-21`). Dead files include `components/representative/*` (self-import only) and the phone-header-based `app/api/representative/*` routes. `telegram-login-screen.tsx:35-36` still routes `is_class_rep` users to a non-existent `/representative`.

**Acceptance Criteria:**
- [ ] All `representative` components and routes removed.
- [ ] No references to `/representative` remain.
- [ ] No orphaned "class rep" logic in login screens.

---

### CARD-502 · Task · P2 · Remove orphaned components & duplicate files

**Summary:** Delete unused components, duplicate Prisma aliases, and copy-pasted pages.

**Description:**
- `components/sidebar.tsx` (imported but never rendered; links to non-existent routes).
- `components/manager/add-course-form.tsx`, `add-section-form.tsx`, `add-teacher-form.tsx`, `data-entry-form.tsx`, `manage-reminders.tsx`, `schedule-calendar.tsx`.
- `components/teacher/teacher-schedule.tsx` & `lesson-details.tsx` (both export `LessonDetails`).
- `app/[locale]/(protected)/.../EditTeacherForm.tsx`, `EditManagerForm.tsx` (3 files, never imported).
- `teacher/my-schedules/columns.tsx` & `data-table.tsx` (never imported).
- `components/telegram-login-screen.tsx`, `lib/phone-auth.ts`, `lib/telegram-auth.ts`.
- Duplicate Prisma aliases `models/client.ts` and `prisma/client.ts` (keep `lib/prisma.ts`).

**Acceptance Criteria:**
- [ ] Dead files removed; build/lint still passes.
- [ ] Single Prisma client import path used everywhere.
- [ ] No export-name collisions remain.

---

### CARD-503 · Task · P2 · Consolidate duplicated DataTable/columns & notifications pages

**Summary:** Extract shared tables/columns and a single notifications page.

**Description:**
Near-identical `DataTable`+`columns` are copied across `admin/teachers`, `manager/teachers`, `admin/courses`, `manager/courses`, `admin/schedules`, `manager/schedules`, `admin/managers`. Three notifications pages are byte-identical.

**Acceptance Criteria:**
- [ ] Shared, parameterized table/columns components replace the copies.
- [ ] Single notifications page reused across roles (role-aware links only).

---

### CARD-504 · Task · P2 · Fix latent crashes in dead code (before deletion/reuse)

**Summary:** Resolve undefined `handleSubmit`/`handleDelete` and bad field references.

**Description:**
- `components/representative/schedule-management.tsx` references `handleSubmit` (`:271`) / `handleDelete` (`:479`) that are never defined (`:189, :191`) → `ReferenceError`.
- `components/teacher/lesson-details.tsx:211` `lesson.materials.map(...)` and `:184` `lesson.topic.toLowerCase()` reference non-existent fields.

**Acceptance Criteria:**
- [ ] If files are kept/rebuilt, handlers are defined and fields match the Prisma shape.
- [ ] If deleted (per CARD-501/502), no broken references remain.

---

## Epic 6 — Missing Features
**Label:** `feature` · **Linked findings:** §2

---

### CARD-601 · Feature · P1 · Teacher lesson-details view

**Summary:** Show a teacher the full lesson (course, verse, objectives, section, date).

**Description:**
No page currently shows full lesson details. `components/teacher/lesson-details.tsx` references non-existent fields (`lesson.topic`, `lesson.materials`, `lesson.date`, `lesson.time`). Build a real view using `schedule_date`, `course.course_name/verse/course_description/objectives`, and `section.section_name`.

**Acceptance Criteria:**
- [ ] Teacher can open a schedule and see course description, verse, objectives, section, and date/time.
- [ ] Data mapped from actual Prisma relations (not `lesson.*` placeholders).
- [ ] Responsive on mobile (Telegram Mini App).

---

### CARD-602 · Feature · P1 · Functional manager reminders

**Summary:** Replace the static reminders mock with real schedule data and send actions.

**Description:**
`components/manager/manage-reminders.tsx` is fully static: hardcoded teacher names (`:80`), hardcoded dates (`:40, :53`), and no-op buttons ("Send Now" `:43`, "Edit" `:56`, "Save Templates" `:157`, "View Details" `:183`).

**Acceptance Criteria:**
- [ ] Reminders list derived from real schedule data via API.
- [ ] "Send Now" triggers actual Telegram/notification delivery.
- [ ] Editing a reminder persists changes.

---

### CARD-603 · Feature · P1 · Functional manager schedule calendar

**Summary:** Render actual schedules in the manager calendar.

**Description:**
`components/manager/schedule-calendar.tsx` always renders "No Schedules Yet" (`:30`) and never fetches data.

**Acceptance Criteria:**
- [ ] Calendar fetches and renders the manager's sections' schedules.
- [ ] Empty state only when there is genuinely no data.

---

### CARD-604 · Feature · P1 · Teacher unavailability submission

**Summary:** Let teachers report unavailability, notify admin/manager.

**Description:**
`notifyUnavailability` (`utils/notifications.ts:208`) exists but has no UI/endpoint. Design in `NOTIFICATION_SYSTEM.md` is unfulfilled.

**Acceptance Criteria:**
- [ ] Teacher can submit unavailability (date + reason).
- [ ] Admin and manager receive a notification.
- [ ] Unavailability is stored and visible.

---

### CARD-605 · Feature · P2 · Admin sections listing page

**Summary:** Add `/admin/sections` list/edit page.

**Description:**
There is no `admin/sections/page.tsx`. `admin/sections/new/page.tsx:8` points `cancelHref`/`onSuccessHref` to `/admin/teachers`, and there is nowhere to list existing sections.

**Acceptance Criteria:**
- [ ] Admin can list, edit, and delete sections.
- [ ] Section creation redirects to the listing page.

---

### CARD-606 · Feature · P2 · Self-registration / invite flow

**Summary:** Let new teachers onboard without a pre-seeded account.

**Description:**
`app/api/auth/route.ts:36-50` only *updates* existing users and returns 404 "ask admin to add you" for new ones. There is no registration path.

**Acceptance Criteria:**
- [ ] New Telegram users can request access or be invited via a link.
- [ ] Admin/manager approves the request (or the invite auto-registers with correct role).
- [ ] Login no longer hard-404s for unseeded users.

---

### CARD-607 · Feature · P2 · Report generation & template download

**Summary:** Implement "who teaches what, when" report and Excel template download.

**Description:**
`notes.txt:3` lists a report of who teaches what topics/when; `notes.txt:29` lists pre-organized Excel template download. Templates exist under `public/templates/` but aren't exposed.

**Acceptance Criteria:**
- [ ] Admin/manager can generate/export a schedule report (CSV/XLSX).
- [ ] Template files are downloadable via a documented endpoint/button.

---

## Epic 7 — UI/UX Polish
**Label:** `ui-ux` · **Linked findings:** §5

---

### CARD-701 · Task · P2 · Fix hardcoded locale in navigation

**Summary:** Use the active locale instead of hardcoded `/am`.

**Description:**
`components/app-layout.tsx:141-166` hardcodes `/am/...` while a `locale` variable exists (`:63`) and is ignored. Breaks if a second locale is added.

**Acceptance Criteria:**
- [ ] All nav hrefs use the current locale variable.
- [ ] Works with multiple locales.

---

### CARD-702 · Task · P2 · Complete & unify translations

**Summary:** Consistent language across admin and manager UIs.

**Description:**
Admin columns use Amharic (`admin/courses/columns.tsx:73-95`) while manager columns use English (`manager/courses/columns.tsx`, `manager/teachers/columns.tsx`).

**Acceptance Criteria:**
- [ ] All roles use the same translation strategy for equivalent UI.
- [ ] No hardcoded strings that bypass the i18n layer.

---

### CARD-703 · Bug · P2 · Fix admin dashboard "all" filter

**Summary:** Correct the `section_id=all` bug in the admin dashboard.

**Description:**
`admin/dashboard.tsx:127-139` sends literal `?section_id=all` (`:67-72`) to `get-teachers`/`get-managers`/`schedules`/`notifications`, none of which handle `"all"` (only `/api/courses:89` does). `components/filter.tsx:19-21` correctly deletes the param.

**Acceptance Criteria:**
- [ ] Selecting "all" omits `section_id` rather than sending `"all"`.
- [ ] Dashboard filters behave consistently with `components/filter.tsx`.

---

### CARD-704 · Task · P2 · Accessibility & empty/loading states

**Summary:** Add `sr-only` labels, spinners/skeletons, and reduce layout flash.

**Description:**
- Icon-only buttons lack `sr-only` labels (`admin/teachers/columns.tsx:26-27`, `admin/courses/columns.tsx:42-43`, `admin/schedules/columns.tsx:38-39`, `admin/managers/columns.tsx:21-22`).
- Dashboards use bare `'...'` (`manager/dashboard.tsx:142`, `admin/dashboard.tsx:153`); edit pages show bare `"Loading..."` (`admin/teachers/[id]/edit/page.tsx:36`).
- `app-layout.tsx:123-125` returns `null` until mounted (CLS).

**Acceptance Criteria:**
- [ ] All icon-only controls have accessible labels.
- [ ] Consistent `Loader2`/skeleton loading states.
- [ ] Layout does not flash empty on mount.

---

### CARD-705 · Task · P2 · Wire up Profile & Settings menu

**Summary:** Make the header Profile/Settings dropdown items functional.

**Description:**
`components/app-layout.tsx:251-258` Profile and Settings items have no `href`/`onClick`.

**Acceptance Criteria:**
- [ ] Each item navigates to a real destination or is removed.
- [ ] No dead menu items remain.

---

## Appendix — Suggested Jira setup

**Epics:** 7 (as above)
**Issue types:** Bug (P0/P1 correctness/security), Feature (new capability), Task (cleanup/refactor)
**Labels:** `security`, `backend`, `notifications`, `cleanup`, `feature`, `ui-ux`
**Sprint buckets:**
- Sprint 1 (P0): CARD-101–102, 201–204, 301–303
- Sprint 2 (P1): CARD-103–106, 205–207, 304–306, 401–404, 601–603
- Sprint 3 (P2): remaining cleanup, features, and UX polish
