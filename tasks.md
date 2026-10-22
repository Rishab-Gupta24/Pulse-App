# Step-by-Step Build Roadmap (`tasks.md`)

> **How to use:** Complete these tasks sequentially. Mark `[x]` as each step is verified, and log any architectural changes in `memory.md`.

---

## Phase 1: Project Initialization & Design Guardrails
- [x] **1.1** Initialize Next.js 15 App Router project with TypeScript and Tailwind CSS:
  `npx create-next-app@latest pulse-app --typescript --tailwind --app --src-dir`
- [x] **1.2** Add `dickwu/apple-design-skill` into the project for HIG/Liquid Glass design audits:
  `git submodule add https://github.com/dickwu/apple-design-skill.git .design-rules`
- [x] **1.3** Install approved dependencies:
  `npm install @supabase/supabase-js @supabase/ssr @tanstack/react-query zustand lucide-react date-fns clsx tailwind-merge`
- [x] **1.4** Configure `src/app/globals.css` with plain semantic color variables (`--bg-canvas`, `--bg-surface`, `--color-red`, `--color-blue`, `--color-green`, `--color-amber`) and the `.liquid-glass-chrome` class from `design.md`.
- [x] **1.5** Create `src/lib/constants/categories.ts` exporting the unified color taxonomy (`RED` = Health/Fitness, `BLUE` = Study/Work, `GREEN` = Eating/Food, `AMBER` = Personal).

---

## Phase 2: Supabase Database, Auth & Realtime Setup
- [x] **2.1** Create a new Supabase project and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
- [x] **2.2** Run the SQL migrations from `Architecture.md` in the Supabase SQL Editor to create:
  - `category_color` ENUM
  - `budgets` table
  - `tasks` table
  - `expenses` table
  - `daily_logs` table
- [x] **2.3** Enable Row-Level Security (RLS) policies on all 4 tables (`auth.uid() = user_id`) and enable **Supabase Realtime** replication for `tasks`, `expenses`, `budgets`, and `daily_logs`.
- [x] **2.4** Build `src/lib/supabase/client.ts` and `src/app/(auth)/login/page.tsx` with a minimalist email/password + magic link login form so iPhone and Laptop share the same authenticated user account.

---

## Phase 3: Minimalist App Shell & Liquid Glass Navigation
- [x] **3.1** Build `src/components/layout/StreakHeader.tsx` displaying today's formatted date and two solid badge counters: **🔥 Task Streak (`X` days)** and **🛡️ Budget Streak (`Y` days)** using `tabular-nums`.
- [x] **3.2** Build `src/components/layout/LiquidGlassBar.tsx`:
  - Renders a floating Liquid Glass bottom tab bar on iPhone (`<768px`) respecting `env(safe-area-inset-bottom)`.
  - Converts into a clean left sidebar on Laptop (`>=768px`).
- [x] **3.3** Build `src/components/shared/CategoryBadge.tsx` and `CategoryFilter.tsx` allowing the user to filter any view by `ALL`, `RED (Health)`, `BLUE (Study/Work)`, `GREEN (Food)`, or `AMBER (Personal)`.

---

## Phase 4: Daily Task Tracker Module
- [x] **4.1** Create `src/hooks/useTasks.ts` with TanStack Query for fetching today's tasks and performing optimistic `addTask`, `toggleTask`, and `deleteTask` mutations.
- [x] **4.2** Build `src/components/tasks/AddTaskForm.tsx`:
  - Single clean text input + 4 solid color selector pills (`RED`, `BLUE`, `GREEN`, `AMBER`) + `"Add Task"` button.
- [x] **4.3** Build `src/components/tasks/TaskItem.tsx`:
  - Solid opaque surface row (`--bg-surface`), `44x44px` accessible checkbox, task title (strikethrough + muted opacity when completed), solid category badge, and delete button.

---

## Phase 5: Multi-Horizon Expense & Budget Tracker Module
- [ ] **5.1** Create `src/hooks/useExpenses.ts` to fetch expenses for the current Month, current Week, and Today, along with the user's configured limits from `budgets`.
- [ ] **5.2** Build `src/components/expenses/BudgetMeters.tsx`:
  - Three minimalist horizontal progress bars (**Today's Budget**, **Weekly Budget**, **Monthly Budget**).
  - Bar fill uses solid `--color-green` when `< 80%`, solid `--color-amber` when `80%–100%`, and solid `--color-red` if over budget.
  - Displays exact `"$X spent · $Y left"` using `tabular-nums`.
- [ ] **5.3** Build `src/components/expenses/AddExpenseForm.tsx` and `ExpenseItem.tsx`:
  - Numeric input (`inputMode="decimal"` for iPhone numeric keypad), title input, and the exact same 4 category color pills (`RED`, `BLUE`, `GREEN`, `AMBER`).
  - Expense list grouped cleanly with category color badge, amount, and delete button.
- [ ] **5.4** Build `src/app/(dashboard)/settings/page.tsx` allowing the user to set and save their **Daily Budget**, **Weekly Budget**, and **Monthly Budget**.

---

## Phase 6: Dual Streak Engine & Real-Time Cross-Device Sync
- [ ] **6.1** Create `src/hooks/useStreaks.ts`:
  - Automatically upserts today's row in `daily_logs` whenever tasks or expenses change.
  - Computes consecutive days where `task_day_won = true` (Task Streak) and `budget_day_won = true` (Budget Streak).
- [ ] **6.2** Create `src/hooks/useRealtimeSync.ts`:
  - Listens to Supabase `postgres_changes` channel and invalidates React Query caches so mutations on the Laptop appear on the iPhone in real time without refreshing.

---

## Phase 7: iPhone PWA Polish & Final HIG Audit
- [ ] **7.1** Configure `src/app/manifest.ts` and iOS meta tags (`apple-mobile-web-app-capable="yes"`, `apple-mobile-web-app-status-bar-style="default"`, `viewport-fit=cover`) so installing the app via Safari **"Add to Home Screen"** on iPhone launches it fullscreen without browser toolbars.
- [ ] **7.2** Run a design audit against `.design-rules/SKILL.md` (`dickwu/apple-design-skill`):
  - Verify zero gradients exist anywhere in the codebase.
  - Verify Liquid Glass is applied only to the floating navigation bar/modals and never on content rows.
  - Verify all touch targets on iPhone are `>= 44x44px` and text contrast passes WCAG AA (`4.5:1`).
- [ ] **7.3** Deploy to Vercel and test live bidirectional sync between iPhone and Laptop.
