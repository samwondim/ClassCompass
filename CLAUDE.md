# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Class Compass is a Telegram Mini App for Sunday school class management: managers/admins build curricula, schedule classes, and assign teachers; teachers view their schedules and receive Telegram notifications. It's a Next.js 16 (App Router) application backed by PostgreSQL via Prisma, embedded in Telegram as a Mini App (login is via Telegram `initData`, not a standalone web login).

## Commands

```bash
npm run dev              # Next dev server
npm run build             # Next build (prisma generate runs first via postinstall)
npm run start             # Next production server
npm run lint               # next lint

npm run test                # vitest (watch mode)
npm run test:run            # vitest run (single pass, use this in CI/scripting)
npx vitest run path/to/file.test.ts   # run a single test file
npx vitest run -t "test name"          # run tests matching a name

npm run db:migrate        # prisma migrate deploy
npx prisma migrate dev    # create/apply a new migration locally
npx prisma studio         # inspect the DB
npx prisma db seed        # run prisma/seed.ts (configured under "prisma.seed" in package.json)
```

Tests live beside the code they cover (e.g. `app/api/__tests__/`, `utils/__tests__/`) and run against Node (see `vitest.config.ts`); the `@` alias resolves to the repo root.

Note: `bot:dev`/`bot:build` scripts in `package.json` reference `src/index.ts`, but no `src/` directory exists in this repo — Telegram bot interactions (auth, notifications) are implemented inside the Next.js app (`utils/telegramAuth.ts`, `utils/notifications.ts`, API routes), not a separate bot process. Don't assume a standalone bot entrypoint exists.

## Architecture

### Auth: Telegram-only, JWT session cookie

There is no username/password login. The flow is:

1. The Telegram client sends `initData` (see `utils/telegramAuth.ts`'s `validateTelegramWebAppData`) to `POST /api/auth`, which HMAC-validates it against `TELEGRAM_API_KEY` and looks up the matching `User` by `tg_username`/`tg_id`.
2. On success, a signed JWT (`utils/session.ts`, via `jose`) is stored in an httpOnly `session` cookie containing `fetched_user` (role, name, ids) and an expiry (`SESSION_DURATION` = 1 hour).
3. `utils/request-auth.ts#getRequestUser` is the canonical way for API routes to identify the caller: it re-fetches the user from the DB by the session's `user_id` (never trusts stale role data in the JWT), and falls back to validating `x-telegram-init-data` header directly if there's no session. **Never trust client-supplied headers like `x-phone-number` for identity** — there's a regression test for this in `app/api/__tests__/` guarding against exactly that.
4. A local dev-only bypass exists (`devLogin` body param on `/api/auth`), gated by `NODE_ENV !== 'production'` AND `ALLOW_DEV_LOGIN=true`/`NEXT_PUBLIC_DEV_LOGIN=true` — it looks up a seeded user by `tg_username` with no Telegram validation. Never allow this path in production.

`middleware.ts` combines `next-intl` locale routing with role-based route protection: it reads the session, and for paths under `/admin`, `/manager`, `/teacher` redirects away if the session's role doesn't match. It also handles CORS (reflecting an allowlist of origins, including ngrok tunnels in dev) since the Mini App may load cross-origin during development.

### Roles

Three roles (`UserRole` enum: `ADMIN`, `MANAGER`, `TEACHER`) each get a parallel route tree and UI:
- `app/[locale]/(protected)/admin/...`, `.../manager/...`, `.../teacher/...`
- Corresponding component folders: `components/admin/`, `components/manager/`, `components/teacher/`
- Admins/managers manage sections, courses, curriculum units, schedules, and teacher/manager assignments; teachers mostly view their own schedules and unavailability.
- Manager access to a section can come from either `Section.manager_id` (direct) or the `ManagerSection` join table — always use `utils/access.ts` (`getManagerSectionIds`, `managerCanAccessSection`, `managerCanAccessTeacher`) rather than querying `Section.manager_id` directly, or you'll miss delegated access.

### i18n

Only Amharic (`am`) is a live locale — `i18n/requests.ts` forces any `en` request to `am` ("guard against stale 'en' links"), and `middleware.ts`'s `next-intl` config only lists `am` with `localePrefix: 'always'`. All routes are under `app/[locale]/...` but in practice `locale` is always `am`. `messages/en.json` exists but isn't wired up as a selectable locale — don't assume adding English is just a config flip.

### Data model (`prisma/schema.prisma`)

Core entities: `User` (role-tagged, keyed by Telegram identity) → `Section` (a class/cohort) → `CurriculumUnit` → `Course` (a single lesson, with `lesson_plan` JSON, `objectives`, `resources`) → `Schedule` (a course taught by a teacher in a section on a date). `TeacherSection`/`ManagerSection` are join tables for many-to-many section assignment. `Notification` rows back the in-app notification bell (see below). `Resource` (FILE/LINK/IMAGE/VIDEO) attaches to a course and/or section, uploaded via Vercel Blob (`BLOB_READ_WRITE_TOKEN`).

### API conventions

- Route handlers live under `app/api/**/route.ts`, one file per resource, using Next's App Router `GET`/`POST`/`PUT`/`DELETE` exports.
- Use `utils/response.ts` helpers (`ok`, `created`, `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `serverError`) for consistent JSON responses in new/LMS-area endpoints.
- Cron endpoints (`app/api/cron/sunday-reminder`, `app/api/cron/empty-schedule-alert`) are triggered by Vercel Cron (see `vercel.json`) and are gated by `utils/cron-auth.ts#isAuthorizedCronRequest`, which accepts either `Authorization: Bearer $CRON_SECRET` or Vercel's injected `x-vercel-cron: 1` header.

### Notifications

Two channels, both driven from the same trigger points (schedule create/update/delete in `app/api/schedules/**`): a Telegram DM sent via the bot token, and a row in the `Notification` table surfaced through `GET/PATCH/DELETE /api/notifications` and the notification bell in `components/app-layout.tsx`. See `utils/notifications.ts`. When adding new notification triggers, follow the existing pattern (function per trigger type, e.g. `notifySectionChange`, `notifyUnavailability`) rather than inlining Telegram calls at call sites.

### UI stack

shadcn/ui (`components.json`, `components/ui/`) on Radix primitives, Tailwind CSS v3 (not v4 — see `FIXES.md` for why), `@tanstack/react-table` for data tables (each role's list pages pair a `page.tsx` with a `columns.tsx`), `next-themes` for dark mode, `sonner`/`react-hot-toast` for toasts.

## Environment

See `.env.example` for the full list. Notable ones: `JWT_SECRET` (≥32 chars, session signing), `TELEGRAM_API_KEY`/`BOT_TOKEN` (initData validation + bot messages), `CRON_SECRET`, `NEXT_PUBLIC_DEV_LOGIN`/`ALLOW_DEV_LOGIN` (dev-only login bypass, must stay false in production), `BLOB_READ_WRITE_TOKEN` (Vercel Blob for resources), `APP_TIMEZONE` (defaults to `Africa/Addis_Ababa`, used for reminder scheduling).
