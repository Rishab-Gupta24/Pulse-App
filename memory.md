# Project Memory & Context Log (`memory.md`)

> **Instructions:** Update this file whenever an architectural decision is made, a schema changes, a bug is resolved, or a phase from `tasks.md` is completed.

---

## 1. Current Project Context
- **App Name:** Pulse (Daily Task & Expense Tracker)
- **Target Devices:** User's iPhone (via iOS Home Screen PWA) & Laptop (Desktop Browser)
- **Current Phase:** Phase 2 — Supabase, Auth & Realtime Complete (next: Phase 3, App Shell)
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

---

## 5. Changelog
- **2026-10-22:** Initialized `PRD.md`, `Architecture.md`, `Rules.md`, `memory.md`, `design.md`, and `tasks.md`.
- **2026-10-22:** Phase 1 complete — Next.js scaffold, git repo + `.design-rules` submodule, approved deps, `globals.css` tokens + `.liquid-glass-chrome`, `src/lib/constants/categories.ts`.
- **2026-10-22:** Phase 2 complete — Supabase project `Pulse`, schema + RLS + Realtime, generated `src/types/database.ts`, Supabase browser/server/middleware clients, `/login` page and `/auth/callback` route.
