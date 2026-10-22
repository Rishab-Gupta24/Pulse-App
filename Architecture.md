# System Architecture: Pulse

## 1. System Overview & Data Flow
Pulse uses a **Next.js (App Router) Progressive Web App (PWA)** frontend paired with **Supabase (PostgreSQL + Auth + Realtime)** as the backend-as-a-service. This architecture allows a single codebase to run natively as an installed fullscreen app on iPhone (iOS WebKit PWA) and as a responsive desktop web app on a laptop, with real-time state synchronization.

```text
+-----------------------+                  +-----------------------+
|     iPhone Client     |                  |     Laptop Client     |
|  (iOS Home Screen PWA)|                  |  (Desktop Web Browser)|
+-----------+-----------+                  +-----------+-----------+
            |                                          |
            |  1. Optimistic UI Update (Zustand/Query) |
            +--------------------+---------------------+
                                 |
                                 v
            +------------------------------------------+
            |       Supabase Client SDK (HTTPS/WSS)    |
            +--------------------+---------------------+
                                 |
         +-----------------------+-----------------------+
         | REST / RPC (Mutations)                        | WebSockets (Realtime)
         v                                               v
+------------------------+                      +------------------------+
|   Supabase PostgreSQL  | -------------------> |   Supabase Realtime    |
|  (Tables + RLS + Cron) |  WAL Broadcast       | (Syncs iPhone & Laptop)|
+------------------------+                      +------------------------+
```

---

## 2. Tech Stack Specification
- **Frontend Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 (strictly configured with Apple HIG semantic tokens & Liquid Glass backdrop rules)
- **State & Sync Management:** TanStack Query v5 (server cache + optimistic updates) + Zustand (local UI filter state)
- **Backend & Database:** Supabase (PostgreSQL 16, Row-Level Security, Supabase Realtime)
- **Authentication:** Supabase Auth (Magic Link / Passkey / Email-Password for persistent session across iPhone & Laptop)
- **Icons:** Lucide React (configured with uniform `1.75px` stroke width to match SF Symbols weight)
- **PWA Support:** `@serwist/next` or native Next.js `manifest.ts` with `apple-mobile-web-app-capable` meta tags

---

## 3. Project Directory & Folder Structure
The app lives in the repo root (see `memory.md` ADR-004).
```text
/
├── .design-rules/                  # dickwu/apple-design-skill submodule (HIG audits)
├── .githooks/pre-commit            # Runs scripts/check-secrets.mjs before every commit
├── .github/workflows/              # secret-check.yml (CI re-run of the secret scan)
├── scripts/check-secrets.mjs       # Blocks env files / keys from being committed
├── supabase/migrations/            # Every applied migration, named by recorded version
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx   # Email/password + magic link sign-in
│   │   ├── auth/callback/route.ts  # PKCE code exchange for email links
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Shell: LiquidGlassBar + DataSync + <main>
│   │   │   ├── page.tsx            # Today: StreakLine, filter, tasks | budget
│   │   │   ├── calendar/page.tsx   # Month calendar + day detail
│   │   │   ├── expenses/page.tsx   # Meters, log expense, this month's list
│   │   │   └── settings/page.tsx   # Budget limits, currency, Sign Out
│   │   ├── globals.css             # Tokens, Liquid Glass chrome, flame/celebration keyframes
│   │   ├── layout.tsx              # Root layout, viewport + iOS meta, Providers
│   │   ├── providers.tsx           # QueryClientProvider + Toaster
│   │   ├── manifest.ts             # PWA manifest
│   │   ├── icon.tsx / apple-icon.tsx  # Code-generated flat app icons
│   ├── components/
│   │   ├── layout/                 # LiquidGlassBar, StreakHeader, StreakLine, DataSync
│   │   ├── shared/                 # CategoryBadge/Filter/Picker, WeekdayPicker, BlueFlame, Toaster
│   │   ├── tasks/                  # TodayTasks (view/edit mode), TaskItem, AddTaskForm, AllDoneCelebration
│   │   ├── calendar/CalendarView.tsx
│   │   ├── expenses/               # BudgetMeters, AddExpenseForm, ExpenseItem, ExpenseList, TodayBudget, ExpensesView
│   │   └── settings/               # BudgetSettingsForm, SignOutButton
│   ├── hooks/
│   │   ├── useTasks.ts             # Tasks for one day: optimistic add/toggle/delete/repeat
│   │   ├── useTaskTemplates.ts     # Active repeating tasks; stop repeating
│   │   ├── useTaskCounts.ts        # Per-day counts for the calendar grid
│   │   ├── useExpenses.ts          # Week+month expenses, scope-aware totals
│   │   ├── useBudget.ts            # Budget caps (defaults until saved)
│   │   ├── useStreaks.ts           # get_streaks RPC, daily_logs range, today's snapshot upsert
│   │   ├── useRealtimeSync.ts      # postgres_changes → query invalidation
│   │   └── useCategoryFilter.ts / useToast.ts  # Zustand UI state
│   ├── lib/
│   │   ├── supabase/               # client.ts, server.ts, middleware.ts, env.ts
│   │   ├── constants/              # categories.ts, appIcon.tsx
│   │   └── utils/                  # dates.ts (local dates, weekdays), money.ts, cn.ts
│   ├── middleware.ts               # Session refresh + sign-in gate
│   └── types/database.ts           # Supabase-generated types + aliases
└── PRD.md · Architecture.md · Rules.md · memory.md · design.md · tasks.md
```

---

## 4. Database Schema (Supabase PostgreSQL)

### 4.1 Shared Category Enum
```sql
CREATE TYPE category_color AS ENUM ('RED', 'BLUE', 'GREEN', 'AMBER');
-- RED   = Health / Fitness
-- BLUE  = Study / Work
-- GREEN = Eating / Food
-- AMBER = Personal / Other
```

### 4.2 `budgets` Table (One row per user)
```sql
CREATE TABLE budgets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_limit NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  weekly_limit NUMERIC(10, 2) NOT NULL DEFAULT 140.00,
  monthly_limit NUMERIC(10, 2) NOT NULL DEFAULT 600.00,
  currency_symbol VARCHAR(5) NOT NULL DEFAULT '$',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 `tasks` Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 140),
  category category_color NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 200),          -- task "bio", e.g. "1 hr workout"
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL    -- set when created from a repeat
);
```

### 4.3a `task_templates` & `template_materializations` (Repeating Tasks)
```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 140),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 200),
  category category_color NOT NULL,
  weekdays SMALLINT[] NOT NULL,          -- 0 = Sunday … 6 = Saturday (JS getDay / Postgres DOW)
  active BOOLEAN NOT NULL DEFAULT TRUE,  -- false = stopped repeating (past copies kept)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One row per (template, day) ever created, so a copy the user deleted is not re-created.
CREATE TABLE template_materializations (
  template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  task_date DATE NOT NULL,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, task_date)
);
```
Unfinished tasks are **not** carried over. Repeating tasks are created per day by `materialize_tasks(p_date)`, which the Today page calls on load. The call is idempotent and safe when two devices make it at once.

### 4.4 `expenses` Table
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  category category_color NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scope expense_scope NOT NULL DEFAULT 'DAY'   -- 'DAY' | 'WEEK' | 'MONTH'
);
```
`scope` decides which budgets an expense counts toward: `DAY` → today + week + month, `WEEK` → week + month, `MONTH` → month only. Only `DAY` expenses feed `daily_logs.daily_spent`, and so the Budget Streak.

### 4.5 `daily_logs` Table (Powers Dual Streaks reliably across devices)
```sql
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  tasks_total INT NOT NULL DEFAULT 0,
  tasks_completed INT NOT NULL DEFAULT 0,
  task_day_won BOOLEAN GENERATED ALWAYS AS (tasks_total > 0 AND tasks_total = tasks_completed) STORED,
  daily_spent NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  daily_budget_snapshot NUMERIC(10, 2) NOT NULL,
  budget_day_won BOOLEAN GENERATED ALWAYS AS (daily_spent <= daily_budget_snapshot) STORED,
  UNIQUE(user_id, log_date)
);
```

---

## 5. How Everything Connects (Cross-Device Sync & Streaks)

1. **Authentication & Row-Level Security (RLS):** Both iPhone and Laptop log into the same Supabase account. Every query is scoped automatically via `auth.uid() = user_id`.
2. **Realtime Channel (`useRealtimeSync.ts`):** On mount, the app subscribes to `postgres_changes` on `tasks`, `expenses`, `budgets`, `daily_logs` and `task_templates`. When a change occurs on the laptop, the iPhone receives the payload and invalidates the corresponding TanStack Query key.
3. **`daily_logs` Maintenance:** Triggers on `tasks` and `expenses` call `private.refresh_daily_log(user, date)`, which recomputes that day's row under a per-(user, day) advisory lock. The client only upserts today's row on app open to set the budget snapshot.
4. **Streak Calculation:** `get_streaks(p_today)` returns the current, longest and total won days for both streaks. The Task Streak counts consecutive `task_day_won` days ending today, or ending yesterday while today is in progress. The Budget Streak treats days with no row as $0-spend wins and resets on any over-budget day.

### 5.1 RPC Functions (all `SECURITY INVOKER`, so RLS applies)
| Function | Purpose |
| --- | --- |
| `get_streaks(p_today)` | Current / longest / total won days for both streaks |
| `materialize_tasks(p_date)` | Create that day's copies of active repeating tasks (idempotent) |
| `create_repeating_task(...)` | New repeating task (client-generated ids for optimistic UI); creates today's copy only if today is one of its days |
| `make_task_repeating(p_task_id, p_template_id, p_weekdays)` | Turn a task into a repeat, or change an existing repeat's days |
