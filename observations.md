# ClassCompass — LMS Review & Implementation Plan

> Review of the Sunday School LMS (Telegram Mini App + Next.js backend).
> Measures applied: **completeness**, **functionality**, **correctness**, **UI/UX**.
> Findings are grouped by severity (P0 / P1 / P2) and each item carries exact `file:line` references.

---

## Executive Summary

ClassCompass is a **functionally solid prototype** with the core loop in place: Telegram Mini App login → role-based dashboards (ADMIN / MANAGER / TEACHER) → course/section/teacher/schedule CRUD → bulk Excel upload → in-app + Telegram notifications → Vercel cron reminders.

However, it is **not production-ready**. The most serious problems are security and correctness:

- **Authentication is spoofable.** Several API routes trust a client-supplied `x-phone-number` header as the caller's identity with no signature, and CORS is wide open (`*`). Anyone can impersonate any user, including admins, by guessing a phone number.
- **Authorization is inconsistent.** Many routes (including admin/mass-creation and cron endpoints) have no auth check at all; managers can read/edit/delete resources outside their assigned sections (IDOR).
- **The notification/cron pipeline is partially broken.** Only 2 of 4 cron jobs are scheduled in `vercel.json`, the wrong function is wired to two routes (copy-paste), the Telegram token env var is mismatched (so messages silently fail), and times are rendered in UTC while business hours are Addis Ababa.
- **A large amount of dead code** — most notably an entire abandoned "representative" role (renamed to MANAGER but never cleaned up), orphaned `components/manager/*` and `components/teacher/*` files, and a stubbed phone-login path — creates a misleading picture of completeness and carries latent runtime crashes.

UI/UX is generally clean (Tailwind + shadcn, responsive card/table layouts) but suffers from inconsistency: hardcoded `am` locale, mixed Amharic/English labels, duplicate copy-pasted pages, and non-functional mock screens.

---

## 1. Bug Fixes & Issues

### P0 — Critical (security / data integrity)

#### 1.1 Spoofable `x-phone-number` "authentication"
The caller's identity is taken directly from a client-supplied header with **no verification**. `lib/phone-auth.ts:4-6` is an empty stub (`console.log("Hello")`) and `middleware.ts:31` skips all `/api` routes from auth, so the header is trusted as-is.

- `app/api/teachers/schedules/route.ts:21-29`
- `app/api/representative/schedules/route.ts:15-26, 62-73, 133-144, 210-221`
- `app/api/representative/sections/route.ts:8-20, 56-68, 123-135`
- `app/api/representative/teachers/route.ts:19-30, 87-98, 152-163`

Worst case: `representative/sections` POST/DELETE gate on `currentTeacher.user_role !== 'ADMIN'` (`route.ts:66, 133`), but the "admin" identity comes from the spoofable phone header — knowing an admin's phone number grants full section management.

**Fix:** Replace header identity with the signed session JWT (`getSession` / `getRequestUser`). Implement or delete `lib/phone-auth.ts`.

#### 1.2 Missing authentication on privileged endpoints
- `app/api/user/create-users/route.ts:5-27` — anonymous callers can create users and set `user_role: "ADMIN"` (`:16`); also returns raw `error` object to the client (`:26`).
- `app/api/sections/route.ts:5-32` (GET) and `:35-71` (POST) — no auth; GET leaks every manager's `phone_number` and `tg_username` (`:12-20`); POST persists the **unsanitized** `section_name` (`:62`) instead of the validated `sanitizedSectionName` (`:45`).
- `app/api/managers/route.ts:5-112` (POST) — no auth; anyone can create a MANAGER and link them to any section.
- `app/api/courses/route.ts:72-124` (GET) — `user` is never null-checked; unauthenticated callers get **all courses**.
- `app/api/user/get-teachers/route.ts:34-105` — no 401 on null user; unauthenticated callers get **all teachers** incl. `phone_number`, `tg_username`, `photo_url` (`:81-105`).

#### 1.3 Cron endpoints are unauthenticated and forceable
All four `/api/cron/*` routes run immediately with no `CRON_SECRET` / `x-vercel-cron` check, and three honor `?force=true` which bypasses the weekday gate:

- `app/api/cron/empty-schedule-alert/route.ts:4-16`
- `app/api/cron/schedule-notification/route.ts:4-18` (`force` at `:7`)
- `app/api/cron/sunday-reminder/route.ts:4-20` (`force` at `:7`)
- `app/api/cron/wednesday-sunday-check/route.ts:4-28` (`force` at `:7`)

**Impact:** anyone can trigger a mass Telegram/DB notification blast to all teachers and managers.

**Fix:** verify `Authorization: Bearer ${CRON_SECRET}` (or `x-vercel-cron`) in all four; remove the public `force` bypass.

#### 1.4 Cron wiring is broken
`vercel.json:2-11` schedules only **two** jobs, both `0 9 * * 3` (Wednesday 09:00 UTC = noon in Addis):

- `wednesday-sunday-check` → `runWednesdaySundayCheck` ✅
- `empty-schedule-alert` → `runEmptyScheduleAlert` ✅

Never scheduled:
- `sunday-reminder` → `runSundayReminder` ❌
- `schedule-notification` → `runSundayReminder` ❌ (copy-paste — imports `runSundayReminder` at `route.ts:2`; there is no dedicated utility)

**Consequence:** `runSundayReminder` is the *only* function that notifies **managers** about missing schedules and supports the **Friday** path (`utils/sunday-reminder.ts:97`). It never runs automatically, so manager reminders and Friday reminders are dead. The Wednesday job that *does* run only notifies teachers.

#### 1.5 Telegram token env-var mismatch (silent send failure)
- Notifications read `process.env.BOT_TOKEN` (`utils/notifications.ts:4`).
- Auth reads `process.env.TELEGRAM_API_KEY` (`app/api/auth/route.ts:16`).
- `docker-compose.yml:10` sets `NEXT_PUBLIC_TELEGRAM_BOT_TOKEN` only.

If only `TELEGRAM_API_KEY` is set, `bot` is `null` and every `sendTelegramNotification` returns `false` at `utils/notifications.ts:45-48` — the in-app DB row is still created, so the feature *looks* like it works while no Telegram message is ever delivered. The bot is a module-level singleton (`:5`), so it stays `null` for the process lifetime even if the var is later available.

#### 1.6 `JWT_SECRET` not validated
`utils/session.ts:7` — `new TextEncoder().encode(process.env.JWT_SECRET)`. If unset, it silently encodes the string `"undefined"` (9 bytes), which `jose` HS256 rejects (needs ≥32 bytes) → runtime 500 on login with no readable error. No presence/length check and no fail-fast.

#### 1.7 IDOR — managers can access resources outside their sections
- `app/api/courses/[id]/route.ts` GET/PUT/DELETE only check `['ADMIN','MANAGER']` (`:9, :32, :69`) with **no ownership check** on the course's section.
- `app/api/schedules/route.ts:51-62` — MANAGER/ADMIN branch returns **all** schedules with no section filter (contrast the correctly-scoped `app/api/managers/schedules/route.ts:49-54`).
- `app/api/teachers/route.ts:6-57` — GET returns all teachers; `sectionId` filter is client-supplied (`:26-28`), so a manager can inspect any section.
- `app/api/user/[id]/route.ts:207-218` — manager reassigning a teacher does not validate that the new `sectionIds` are within the manager's scope.

#### 1.8 Mass assignment in `PATCH /api/user/[id]`
`app/api/user/[id]/route.ts:82-85` — `data: body` passes the whole body to `prisma.user.update` with no allowlist. The sibling `PUT` (`:180-190`) whitelists correctly; `PATCH` does not.

#### 1.9 Session cookie flags too weak
Issued with only `{ expires, httpOnly: true }` (`app/api/auth/route.ts:64-65`) and re-set with only `{ name, value, httpOnly, expires }` (`utils/session.ts:36-41`). No `sameSite`, `secure`, or `path`. Should be `secure` (HTTPS) + `sameSite: 'Lax'`.

---

### P1 — High (correctness)

#### 1.10 `getSession` throws on tampered/expired cookies
`utils/session.ts:15-26` has no try/catch. An invalid/expired `session` cookie makes `jwtVerify` reject, and the error propagates:
- `middleware.ts:35` → middleware 500 instead of redirecting to login.
- API routes using `getSession(...).then(...)` → 500 instead of 401.

An attacker can trivially 500 the app with a malformed cookie. **Fix:** catch and return `null`.

#### 1.11 `tg_id` stored as `Float`
`prisma/schema.prisma:27` — `tg_id Float? @unique`. Telegram IDs commonly exceed `Number.MAX_SAFE_INTEGER` (2^53); `Number(...)` conversions (`utils/request-auth.ts:20`, `app/api/auth/route.ts:41`) corrupt large IDs. Use `BigInt` or `String`.

#### 1.12 `$disconnect()` on the shared Prisma singleton
Every Prisma alias (`@/lib/prisma`, `@/models/client`, `@/prisma/client`) re-exports the same global singleton (`lib/prisma.ts:11-13`). These routes call `prisma.$disconnect()` in `finally`, which breaks subsequent requests in the same process:
- `app/api/teachers/schedules/route.ts:61-63`
- `app/api/managers/route.ts:110-112`
- `app/api/managers/teachers/route.ts:92-94`
- `app/api/representative/schedules/route.ts:55-57, 126-128, 203-205, 244-246`
- `app/api/representative/teachers/route.ts:80-82, 145-147, 190-192`

#### 1.13 `get-managers` returns `telegram_id: undefined`
`app/api/user/get-managers/route.ts:15` maps `telegram_id: user.tg_id`, but the `select` (`:47-72`) never includes `tg_id`, so the field is always `undefined`.

#### 1.14 Stale role in JWT survives demotion
`getRequestUser` (`utils/request-auth.ts:6-8`) returns the JWT's `fetched_user` without a DB re-check. Most routes authorize off this stale `user_role`, so a demoted user keeps privileges for up to 1h (session TTL). Only `(protected)/layout.tsx:18-24` and `utils/data-access.ts:11-18` re-read the DB.

#### 1.15 Schedules POST uses an arbitrary section
`app/api/schedules/route.ts:88-101` uses `teacherSection.findFirst({ where: { teacher_id } })` — for a multi-section teacher this returns an arbitrary section, which drives both the auth check and the schedule's `section_id` (`:130`). The course is never verified to belong to that section, and `schedule_date` is not validated.

#### 1.16 Schedules PUT silently ignores `section_id`
`app/api/schedules/[id]/route.ts:93-124` accepts `section_id` but overwrites it with `teacherSection.section_id` (`:122`) — client-supplied section is silently discarded.

#### 1.17 Missing required-field validation → 500s
- `app/api/representative/schedules/route.ts:75-78, 146-149` only require `date` and `teacher_id`; `course_id` is optional at validation (`:104, :180`) but required by the schema (`prisma/schema.prisma:90`) → unhandled Prisma 500.
- `app/api/user/route.ts:22` — no validation of `user_role`/`tg_username` uniqueness/`sectionIds` existence.
- `app/api/user/route.ts:60` — `where: { user_role: query as any }` → invalid enum → 500.
- `app/api/courses/route.ts:45-56` — `section_id` existence not validated.
- `app/api/admin/bulk-upload/route.ts:63-69` — `normalizeUserRole` silently coerces unknown roles to `TEACHER`, masking typos.

#### 1.18 Manager section-check inconsistency
`managerCanAccessSection`/`managerCanAccessTeacher` correctly union `managerSection` **and** direct `section.manager_id` (`app/api/schedules/route.ts:8-26`, `app/api/user/[id]/route.ts:6-19`), but `app/api/teachers/route.ts:84-97, 189-204, 256-271` and `app/api/courses/route.ts:25-38` only check `managerSection`. Managers assigned via the direct `section.manager_id` field are treated inconsistently across endpoints.

#### 1.19 Timezone bugs in notification rendering
`utils/notifications.ts` formats times without `timeZone` (server default = UTC on Vercel):
- `:295` `toLocaleTimeString` — a 09:00 Addis class renders as "06:00".
- `:314, :336, :354` `toLocaleDateString`, `:126` and `:191` `toLocaleString` — same issue.

**Fix:** pass `timeZone: 'Africa/Addis_Ababa'` (or `APP_TIMEZONE`) explicitly.

#### 1.20 Cron time is UTC while logic is Addis
`vercel.json` fires `0 9 * * 3` = 09:00 UTC = noon Addis. If "9:00 AM Addis" was intended, use `0 6 * * 3`. The *code* computes weekday in Addis time (`getZonedParts(now, timeZone)`), so trigger-time and logic timezone are inconsistent.

---

### P2 — Medium / minor

- **Double/over-broad manager notifications** — `runEmptyScheduleAlert` sends each manager a per-section alert *and* a global report of **all** empty sections (`utils/empty-schedule-alert.ts:187-190`), and `notifyWeeklyEmptyScheduleReport` (`utils/notifications.ts:404-439`) sends every section to every manager regardless of ownership — a cross-section info leak.
- **Copy-paste route** — `app/api/cron/schedule-notification/route.ts` and `sunday-reminder/route.ts` are functionally identical (both call `runSundayReminder`).
- **Dead `force`** — `utils/empty-schedule-alert.ts:69` sets `force` but never uses it (no day gate in this function at all); the route also destructures `searchParams` without using it (`app/api/cron/empty-schedule-alert/route.ts:6`).
- **Unused `getZonedEndOfDay`** — `utils/sunday-reminder.ts:77-80` and `utils/wednesday-sunday-check.ts:77-80`.
- **Unwired notification helpers** — `notifySectionChange` (`utils/notifications.ts:89`) and `notifyUnavailability` (`:208`) are exported but never invoked.
- **Sequential sends** — `runSundayReminder` (`utils/sunday-reminder.ts:128-204`) and `runWednesdaySundayCheck` (`wednesday-sunday-check.ts:140-165`) await each recipient one-by-one; use `Promise.all` (as `notifyUnavailability` does).
- **`getRequestUser` OR-lookup ambiguity** — `utils/request-auth.ts:22-27` builds `OR: [{ tg_username }, { tg_id }]`; can resolve to the wrong user if fields disagree between rows.
- **`Notification.type` is a free string** — `prisma/schema.prisma:49`; should be an enum for the documented `info|warning|success|error`.
- **Leaked debug data** — `app/api/auth/route.ts:11-14` has a commented-out `initData` blob with a real Telegram user (`username: triviosa`, `id: 1845537164`) and signed hash.
- **PII logging** — `utils/data-access.ts:19` logs the full user object (`console.log("Inside getUserRole", user)`) on every call.
- **Error info-leak** — `app/api/courses/route.ts:122` and `app/api/admin/bulk-upload/route.ts:537` return internal `error.message`/`details` to clients.
- **Inconsistent success/error envelopes** — `{ users }`, `{ teacher }`, `{ error }`, `{ error, details }`, `{ message, error }`, etc.; creation status codes mix `200`/`201`.
- **N+1 + no transactions** — `app/api/user/create-users/route.ts:10-22` (sequential `create`) and `app/api/admin/bulk-upload/route.ts` (per-row round trips, no transaction → partial upload on failure).
- **Login updates but never registers** — `app/api/auth/route.ts:36-50` does `update` and maps `P2025` → 404 "ask admin to add you"; no self-registration path, and a `tg_id` unique collision (`P2002`) is unhandled → 500.
- **Stale script refs** — `package.json:16` (`bot:dev` → `src/index.ts`) and `scripts/test-cron-logic.ts:1` (`../generated/prisma/index.js`) point at non-existent paths.

---

## 2. Feature Additions (what's missing)

### 2.1 Teacher experience
- **Lesson details view** — no page shows a teacher the full lesson (course description, verse, objectives, materials). The components that *claim* to do this reference non-existent fields (`lesson.topic`, `lesson.materials`, `lesson.date`, `lesson.time` — `components/teacher/lesson-details.tsx:94-211`, `teacher-schedule.tsx`). Build a real details page using `schedule_date`, `course.course_name/verse/course_description/objectives`, `section.section_name`.
- **Unavailability submission** — `notifyUnavailability` (`utils/notifications.ts:208`) exists but there is no UI/endpoint for a teacher to report unavailability.

### 2.2 Manager experience
- **Functional reminders** — `components/manager/manage-reminders.tsx` is a static mock (hardcoded names/dates, no-op buttons). Wire it to real schedule data.
- **Functional calendar** — `components/manager/schedule-calendar.tsx` always renders "No Schedules Yet" (`:30`); implement actual schedule rendering.

### 2.3 Admin experience
- **Sections listing page** — there is no `admin/sections/page.tsx`; `admin/sections/new/page.tsx:8` links `cancelHref`/`onSuccessHref` to `/admin/teachers` and there is nowhere to list/edit existing sections.
- **Self-registration / invite flow** — new teachers can't onboard themselves (see 1.x login note); consider an invite/registration link or manager-driven approval flow.

### 2.4 Platform
- **`.env.example`** — required vars (`JWT_SECRET`, `TELEGRAM_API_KEY`, `BOT_TOKEN`, `DATABASE_URL`, `NEXT_PUBLIC_BASE_URL`) are undocumented.
- **Report generation** — `notes.txt:3` lists "generate report of who teaches what topics and when" as a goal; not implemented.
- **Excel template download** — `notes.txt:29` lists "send pre-organized excel template on schedule add"; templates exist under `public/templates/` but no endpoint/UI exposes them.
- **Unavailability notifications for admin+manager** — designed in `NOTIFICATION_SYSTEM.md` but never wired.

---

## 3. Dead Code & Cleanup (dedicated section)

### 3.1 The abandoned "representative" role
The Prisma schema defines only `MANAGER | ADMIN | TEACHER` (`prisma/schema.prisma:17-21`). The "representative" concept was renamed to MANAGER but never cleaned up:

- `components/representative/dashboard.tsx`, `teacher-management.tsx`, `course-management.tsx`, `schedule-management.tsx` — all dead (only self-imported).
- `app/api/representative/*` — duplicate/alternate API surface keyed off the spoofable phone header.
- `components/telegram-login-screen.tsx:35-36` routes `is_class_rep` users to `/representative`, which doesn't exist → 404.
- `components/representative/teacher-management.tsx:26` types `Teacher.id` as `number` (API returns UUID strings).

### 3.2 Orphaned components (never imported)
- `components/sidebar.tsx` — imported by `app/[locale]/(protected)/layout.tsx:4` but never rendered (layout renders `AppLayout` at `:31-33`); its nav links to non-existent routes (`:25-26, :31-32, :37-39`).
- `components/manager/add-course-form.tsx`, `add-section-form.tsx`, `add-teacher-form.tsx`, `data-entry-form.tsx`, `manage-reminders.tsx`, `schedule-calendar.tsx` — only `dashboard.tsx` is used.
- `components/teacher/teacher-schedule.tsx` and `lesson-details.tsx` — both export the **same** name `LessonDetails` (`:10` in each) → collision if ever both imported.
- `app/[locale]/(protected)/admin/teachers/EditTeacherForm.tsx`, `admin/managers/EditManagerForm.tsx`, `manager/teachers/EditTeacherForm.tsx` — never imported (edit pages use `components/forms/user-edit-form.tsx`).
- `app/[locale]/(protected)/teacher/my-schedules/columns.tsx` and `data-table.tsx` — never imported; page uses `components/schedules/my-schedules-*`.
- `components/telegram-login-screen.tsx` — dead; also broken (posts `phone_number` to an endpoint that expects `initData`, and reads a `data.teacher.*` response that never exists).

### 3.3 Latent runtime crashes in dead code
- `components/representative/schedule-management.tsx` — `handleSubmit` (`:271`) and `handleDelete` (`:479`) are referenced but **never defined** (placeholders at `:189, :191`) → `ReferenceError`.
- `components/teacher/lesson-details.tsx:211` `lesson.materials.map(...)` and `:184` `lesson.topic.toLowerCase()` — throw / render "undefined" if wired up.

### 3.4 Broken form/API contract mismatches (dead or active)
- `components/manager/add-course-form.tsx:55-58` posts only `course_name`/`verse`, but `/api/courses` requires `section_id` and `course_description` (`app/api/courses/route.ts:20-22, 41-42`).
- `components/forms/course-form.tsx:61-69` doesn't require `course_description`, but the API rejects missing descriptions.
- `components/manager/add-teacher-form.tsx:72-132` — ADMIN/MANAGER branches never call `setLoading(true)`, and MANAGER failures fall through to a misleading "Please add section name" toast (`:133`).
- `components/manager/data-entry-form.tsx:20-33` uses `id: number` (Prisma uses UUID); `parseInt(scheduleForm.teacher_id)` (`:171`) → `NaN`; calls `/api/schedules/check` (`:140`) which doesn't exist.

### 3.5 Duplicate files
- `lib/prisma.ts`, `models/client.ts`, `prisma/client.ts` — three aliases of the same singleton, imported interchangeably.
- `lib/telegram-auth.ts` (kebab-case, effectively empty) vs `utils/telegramAuth.ts` (camelCase, the real validator).
- 3 byte-identical notifications pages: `admin/notifications/page.tsx`, `manager/notifications/page.tsx`, `teacher/notifications/page.tsx`.
- Near-identical `DataTable` + `columns` copies across `admin/teachers`, `manager/teachers`, `admin/courses`, `manager/courses`, `admin/schedules`, `manager/schedules`, `admin/managers`.
- `next.config.js:22` `target: 'server'` — deprecated/ignored in Next 16.

---

## 4. Security Hardening (consolidated)

| # | Item | Location |
|---|------|----------|
| 1 | Validate `JWT_SECRET` presence & length (≥32 bytes), fail fast | `utils/session.ts:7` |
| 2 | Wrap `decrypt` in try/catch, return `null` on invalid token | `utils/session.ts:15-26` |
| 3 | Replace `x-phone-number` identity with signed session JWT | `app/api/representative/*`, `teachers/schedules` |
| 4 | Protect cron endpoints with `CRON_SECRET` / `x-vercel-cron`; remove public `force` | `app/api/cron/*` |
| 5 | Add auth to `user/create-users`, `sections`, `managers` POST, `courses` GET, `get-teachers` | various |
| 6 | Add section-scope checks (IDOR) for `courses/[id]`, `schedules` GET, `teachers` GET, `user/[id]` PUT sectionIds | various |
| 7 | Whitelist fields in `PATCH /api/user/[id]` | `app/api/user/[id]/route.ts:82-85` |
| 8 | Set `sameSite`/`secure`/`path` on session cookie | `app/api/auth/route.ts:65`, `utils/session.ts:36-41` |
| 9 | Re-validate role against DB (or shorten TTL) | `utils/request-auth.ts:6-8` |
| 10 | Change `tg_id` `Float` → `String`/`BigInt` | `prisma/schema.prisma:27` |
| 11 | Remove `$disconnect()` on shared singleton | 8+ routes (see 1.12) |
| 12 | Remove leaked debug `initData` and PII logging | `app/api/auth/route.ts:11-14`, `utils/data-access.ts:19` |
| 13 | Reconcile `BOT_TOKEN` vs `TELEGRAM_API_KEY` vs `NEXT_PUBLIC_TELEGRAM_BOT_TOKEN` | `utils/notifications.ts:4`, `app/api/auth/route.ts:16`, `docker-compose.yml:10` |

---

## 5. UI/UX Issues

- **Hardcoded locale** — `components/app-layout.tsx:141-166` nav hrefs hardcode `/am/...` while a `locale` variable exists (`:63`) but is ignored. Works only because `am` is the sole locale (`middleware.ts:11`).
- **Mixed languages** — Admin columns use Amharic (`admin/courses/columns.tsx:73-95`) while Manager columns use English (`manager/courses/columns.tsx`, `manager/teachers/columns.tsx`). Same UI is half-translated by role.
- **Two divergent filter mechanisms** — `components/filter.tsx` (correct, deletes param on "all") vs `admin/dashboard.tsx:127-139` inline `<Select>` that sends literal `?section_id=all` (`:67-72`) to endpoints that don't understand `"all"` (only `/api/courses:89` does).
- **Non-functional Profile/Settings menu** — `components/app-layout.tsx:251-258` items have no `href`/`onClick`.
- **Layout flash (CLS)** — `components/app-layout.tsx:123-125` returns `null` until `isMounted`.
- **Accessibility** — icon-only buttons lack `sr-only` labels in `admin/teachers/columns.tsx:26-27`, `admin/courses/columns.tsx:42-43`, `admin/schedules/columns.tsx:38-39`, `admin/managers/columns.tsx:21-22` (the shared `my-schedules-columns.tsx:29` does it correctly — inconsistent).
- **Inconsistent loading states** — dashboards use bare `'...'` (`manager/dashboard.tsx:142`, `admin/dashboard.tsx:153`); edit pages show bare `"Loading..."` (`admin/teachers/[id]/edit/page.tsx:36`) — no spinner/skeleton, inconsistent with `Loader2` elsewhere.
- **Header/sidebar misalignment** — header is full-width `sticky top-0` (`app-layout.tsx:185`) not offset by the 256px sidebar.
- **Mobile date input** — `components/forms/schedule-form.tsx` uses a single `datetime-local` with no mobile handling (the dead `data-entry-form.tsx:335-376` had a drawer approach).

---

## 6. Prioritized Roadmap

### P0 — Ship blockers (security + broken pipeline)
1. Fix the spoofable header auth (1.1) and close the open CORS surface.
2. Add auth to the five anonymous data endpoints (1.2).
3. Protect cron endpoints + fix cron wiring so reminders actually fire on the right days (1.3, 1.4).
4. Reconcile the Telegram token env var (1.5) so notifications actually send.
5. Validate `JWT_SECRET` (1.6) and harden session cookies (1.9).
6. Fix IDOR + mass-assignment (1.7, 1.8).

### P1 — Correctness
7. Fix `getSession` crash, `Float`→`String` tg_id, `$disconnect`, `get-managers` undefined, stale-role re-check (1.10–1.14).
8. Fix schedule section selection & PUT field handling (1.15, 1.16).
9. Fix timezone rendering + cron UTC offset (1.19, 1.20).

### P2 — Completeness & UX
10. Delete dead code (§3), especially the representative role and orphaned components.
11. Build the missing teacher lesson-details view and manager reminders/calendar (§2).
12. Add `.env.example`, admin sections listing, self-registration/invite flow (§2.4).
13. Normalize response envelopes, status codes, translations, and filter implementation (§5).

---

## Appendix — Env var single source of truth (recommended)

| Purpose | Variable (normalize to this) |
|---------|------------------------------|
| Session JWT signing | `JWT_SECRET` (≥32 bytes) |
| Telegram initData validation | `TELEGRAM_API_KEY` (bot token) |
| Telegram message sending | `BOT_TOKEN` (same value as above) |
| DB | `DATABASE_URL` |
| Deep links in notifications | `NEXT_PUBLIC_BASE_URL` / `WEB_APP_URL` |
| Cron protection | `CRON_SECRET` (new) |

> Recommendation: make `TELEGRAM_API_KEY` and `BOT_TOKEN` the same bot token, or remove one and use a single variable everywhere.
