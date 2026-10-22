# Project Memory & Context Log (`memory.md`)

> **Instructions:** Update this file whenever an architectural decision is made, a schema changes, a bug is resolved, or a phase from `tasks.md` is completed.

---

## 1. Current Project Context
- **App Name:** Pulse (Daily Task & Expense Tracker)
- **Target Devices:** User's iPhone (via iOS Home Screen PWA) & Laptop (Desktop Browser)
- **Current Phase:** Phase 6 — Dual Streak Engine & Realtime Sync Complete (next: Phase 7, PWA Polish & Audit)
- **Supabase Project:** `Pulse` (ref `jlcyiuxiijticddsraje`, region `ap-south-1`, free tier). The older `Leveling` project is unrelated.
- **Design System Reference:** `https://github.com/dickwu/apple-design-skill.git` (Apple HIG + Liquid Glass specification)

---

## 2. Key Architecture Decisions (ADRs)

### ADR-001: PWA (Next.js) + Supabase over Native Swift + Electron
- **Date:** 2026-10-22
- **Context:** The app needs to work seamlessly on both an iPhone and a Laptop with real-time sync and minimal deployment friction.
- **Decision:** Build a responsive Next.js PWA backed by Supabase Realtime.
- **Consequences:** Instant deployment via Vercel, zero App Store $99/yr developer fee required for personal iPhone installation (`Add to Home Screen`), and shared codebase for both devices.

### ADR-002: Unified Color Taxonomy for Tasks and Expenses
- **Date:** 2026-10-22
- **Context:** User requested color categorization that can be reused across both tasks and budget tracking.
- **Decision:** Use a single database enum (`category_color`: `RED`, `BLUE`, `GREEN`, `AMBER`) mapped to solid Apple System Colors:
  - `RED` = Health / Fitness
  - `BLUE` = Study / Work
  - `GREEN` = Eating / Food
  - `AMBER` = Personal / Misc

### ADR-003: Dual Streak Storage via `daily_logs`
- **Date:** 2026-10-22
- **Context:** Calculating streaks dynamically across thousands of historical tasks and expenses on every render is slow and prone to timezone bugs, especially if the user changes their daily budget later.
- **Decision:** Maintain a `daily_logs` table storing each day's `daily_budget_snapshot`, `daily_spent`, `tasks_total`, and `tasks_completed`. This preserves historical streak accuracy even if the user edits their Daily Budget in the future.

### ADR-004: App Lives in Repo Root; Tailwind v4 Token Mapping
- **Date:** 2026-10-22
- **Context:** `tasks.md` 1.1 scaffolds into `pulse-app/`, but the spec files sit in the root, and the root folder name is not a valid npm package name.
- **Decision:** Scaffolded Next.js 15.5 (Tailwind v4, ESLint, no Turbopack) in the root with package name `pulse`. Surface tokens keep the `design.md` names (`--bg-canvas`, …) on `:root` and map to utilities via `@theme inline` (`bg-canvas`, `bg-surface`, `text-secondary`, `divide-hairline`). Category solids are `@theme` tokens (`--color-red|blue|green|amber`, utilities `bg-red`, `text-red`, `bg-red-soft`) with dark variants overridden on `:root` under `prefers-color-scheme: dark`. Geist font removed in favor of the system font stack. `.design-rules/` is ignored by ESLint.

### ADR-005: Supabase Schema, RLS & Auth Wiring
- **Date:** 2026-10-22
- **Context:** Phase 2 setup on a fresh Supabase project.
- **Decision:** Schema matches `Architecture.md` §4, plus `user_id DEFAULT auth.uid()` on all tables (clients can omit it on insert) and `(user_id, date)` indexes on `tasks`/`expenses`. RLS on all 4 tables with per-operation policies for `authenticated` using `(SELECT auth.uid()) = user_id`; `anon` has no table grants. All 4 tables are in the `supabase_realtime` publication. Migrations: `init_schema`, `rls_and_realtime`. `NEXT_PUBLIC_SUPABASE_ANON_KEY` holds the modern `sb_publishable_…` key. `src/middleware.ts` refreshes the session via `getClaims()` and redirects signed-out users to `/login`; `/auth/callback` exchanges the PKCE code from magic-link/confirmation emails.

### ADR-006: App Shell Structure
- **Date:** 2026-10-22
- **Context:** Phase 3 shell and shared category UI.
- **Decision:** `(dashboard)/layout.tsx` renders `LiquidGlassBar` (floating tab bar < 768px, 240px sidebar ≥ 768px) around a centered `max-w-[880px]` `<main>`. Each page renders its own `StreakHeader title=…` (date + streak pills; pills hidden on laptop because the sidebar shows them). Streak counts come from `useStreaks()` — a stub returning 0 until Phase 6. The date renders client-only via `useSyncExternalStore` so the server's timezone never shows. `.liquid-glass-chrome` sits in `@layer components` so utilities can override it. Category filter state is a Zustand store (`useCategoryFilter`); the selected pill gets an inset ring in its category color because the 12% tint is nearly invisible on dark surfaces. Categories gained `shortLabel` for pills/badges.

### ADR-007: Optimistic Task Mutations & Undo Toasts
- **Date:** 2026-10-22
- **Context:** Rules.md requires instant UI with rollback on failure and no `confirm()` dialogs.
- **Decision:** `useTasks` caches today's tasks under `["tasks", localDate]`. Inserts use a client-generated UUID so the optimistic row and stored row share an id. Failed mutations roll back only the affected row (not a whole-cache snapshot, so concurrent mutations aren't clobbered) and show a toast; every mutation invalidates the query on settle. Delete is immediate with an "Undo" toast that re-inserts the same row. Toasts are a Zustand store (`useToast` / `showToast`) rendered by a solid `Toaster` in `app/providers.tsx`, which also hosts the `QueryClientProvider`. `CategoryPicker` is the shared single-choice selector for the task and (Phase 5) expense forms. Swipe-to-delete from the PRD is not built; rows have a 44px delete button.

### ADR-008: Expense Periods, Money Math & Budget Defaults
- **Date:** 2026-10-22
- **Context:** Phase 5 needs Today / This Week / This Month totals without unbounded queries.
- **Decision:** Weeks run **Monday–Sunday**. `useExpenses` fetches one range covering both the current week and month (`getBudgetPeriods().rangeStart…rangeEnd`, so a week that starts in the previous month still counts fully) under `["expenses", rangeStart, rangeEnd]`; the Expenses page lists this month only. Amounts are summed in integer cents (`lib/utils/money.ts`) and NUMERIC values are coerced with `Number()`. `useBudget` returns the `budgets` column defaults (20 / 140 / 600 / `$`) until the user saves; saving upserts with the session's `user_id`. Meter fill: green < 80%, amber 80–100%, red when over, and the text says "over" so color is never the only signal. Today view: shared category filter above a `grid-cols-1 lg:grid-cols-2` grid (tasks left, budget right). Settings also has Sign Out (clears the query cache).

### ADR-009: Server-Maintained `daily_logs` and Streak RPC
- **Date:** 2026-10-22
- **Context:** `tasks.md` 6.1 asked the client to upsert today's `daily_logs` row on every change. That misses edits from other devices, edits to past days (the Expenses list allows deleting earlier expenses), and writes made while another tab is closed.
- **Decision:** `AFTER INSERT/UPDATE/DELETE` triggers on `tasks` and `expenses` call `private.refresh_daily_log(user, date)`, which recomputes `tasks_total`, `tasks_completed` and `daily_spent` for the row's own local date (never `NOW()`). It takes a `pg_advisory_xact_lock` per (user, day) first, so concurrent writes can't leave stale counts. Everything runs as `SECURITY INVOKER`, so RLS still applies; the `private` schema keeps the helper off the Data API. The budget snapshot is set when a row is first created; `useTodayLogSnapshot` (mounted once via `DataSync`) upserts today's row on app open and whenever the Daily Budget changes, so past days keep their snapshot. Streaks come from `get_streaks(p_today)`. **Task streak** counts consecutive won days ending today, or ending yesterday while today is still in progress. **Budget streak** is 0 if today is over budget; otherwise it is `p_today − max(last over-budget day, first logged day − 1)`, so days with no row count as $0-spend days. `useRealtimeSync` subscribes to `postgres_changes` on all 4 tables, invalidates the matching query keys, and refetches everything after a reconnect.

---

## 3. Known Edge Cases & Rules
- **Zero-Task Day Rule:** A day with `0` tasks scheduled does **not** increment the Task Streak; at least `1` task must be created and completed on that calendar day to count as a won day.
- **Zero-Spend Day Rule:** A day with `$0` spent is automatically `<= Daily Budget`, so it **does** increment the Budget Streak at the end of the day (or counts toward the active streak).
- **Budget Hierarchy Warning:** In Settings, warn the user if `Daily Budget * 7 > Weekly Budget` or `Weekly Budget * 4 > Monthly Budget`, while still allowing custom overrides.

---

## 4. Bug & Fix Log
| Date | Issue / Bug | Root Cause | Resolution |
| :--- | :--- | :--- | :--- |
| *YYYY-MM-DD* | *Template entry* | *Root cause description* | *Fix applied & files touched* |
| 2026-10-22 | `daily_logs.tasks_total` stayed 1 after deleting the day's only task | Expense and task deletes ran concurrently; each trigger recomputed from a snapshot missing the other's delete, and the last upsert won with stale counts | Added a per-(user, day) `pg_advisory_xact_lock` before recomputing in `private.refresh_daily_log`; migration `serialize_daily_log_refresh` also repaired existing rows |
| 2026-10-22 | Today page scrolled horizontally on iPhone width | Implicit grid track sized to the forms' min-content (inputs' intrinsic width) | Added `grid-cols-1` so the track is `minmax(0, 1fr)` — `src/app/(dashboard)/page.tsx` |

---

## 5. Changelog
- **2026-10-22:** Initialized `PRD.md`, `Architecture.md`, `Rules.md`, `memory.md`, `design.md`, and `tasks.md`.
- **2026-10-22:** Phase 1 complete — Next.js scaffold, git repo + `.design-rules` submodule, approved deps, `globals.css` tokens + `.liquid-glass-chrome`, `src/lib/constants/categories.ts`.
- **2026-10-22:** Phase 2 complete — Supabase project `Pulse`, schema + RLS + Realtime, generated `src/types/database.ts`, Supabase browser/server/middleware clients, `/login` page and `/auth/callback` route.
- **2026-10-22:** Phase 3 complete — `StreakHeader`, `LiquidGlassBar`, `CategoryBadge`, `CategoryFilter`, dashboard route group with Today/Expenses/Settings placeholders. Verified at 375px and 1280px in light and dark mode.
- **2026-10-22:** Phase 4 complete — `useTasks`, `AddTaskForm`, `TaskItem`, `TodayTasks`, `CategoryPicker`, toast system, Query provider. Verified add / toggle (persists across reload) / delete / undo / category filter against Supabase; failure rollback path not exercised.
- **2026-10-22:** Phase 5 complete — `useBudget`, `useExpenses`, `BudgetMeters`, `AddExpenseForm`, `ExpenseItem`, `ExpenseList`, `TodayBudget`, `ExpensesView`, Settings budget form + Sign Out. Verified logging, amount validation, green→amber→red meters, delete/undo recalculation, budget save + hierarchy warning, two-column laptop layout; test rows removed.
- **2026-10-22:** Phase 6 complete — migrations `daily_logs_sync_and_streaks`, `move_refresh_daily_log_to_private`, `serialize_daily_log_refresh`; `useStreaks`, `useTodayLogSnapshot`, `useRealtimeSync`, `DataSync`. Verified streak logic in a rolled-back SQL run (task 2→3 when today completes; budget 3 after an over-budget day), and in two browser tabs that add/complete/delete and over-budget changes appear in the other tab and update both streaks.
