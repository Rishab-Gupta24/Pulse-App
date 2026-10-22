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
```text
pulse-app/
├── .design-rules/                  # Cloned dickwu/apple-design-skill submodule
├── public/
│   ├── icons/                      # Apple touch icons (180x180) & PWA icons
│   └── manifest.json               # PWA configuration for iPhone Home Screen
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx      # Minimal authentication screen
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Responsive Shell (Sidebar on Laptop, TabBar on iPhone)
│   │   │   ├── page.tsx            # Unified Today View (Tasks + Daily Budget Snapshot)
│   │   │   ├── tasks/page.tsx      # Focused Task Tracker View
│   │   │   ├── expenses/page.tsx   # Expense Tracker & Day/Week/Month Budget View
│   │   │   └── settings/page.tsx   # Budget Limits & Category Configuration
│   │   ├── globals.css             # CSS variables, semantic colors, Liquid Glass utility classes
│   │   ├── layout.tsx              # Root layout, viewport meta, providers
│   │   └── manifest.ts             # Next.js PWA manifest generator
│   ├── components/
│   │   ├── layout/
│   │   │   ├── LiquidGlassBar.tsx  # Floating bottom tab bar (iPhone) / Sidebar (Laptop)
│   │   │   └── StreakHeader.tsx    # Top bar displaying Task Streak & Budget Streak
│   │   ├── shared/
│   │   │   ├── CategoryBadge.tsx   # Solid color dot + label (Red, Blue, Green, Amber)
│   │   │   └── CategoryFilter.tsx  # Horizontal pill selector for filtering by color
│   │   ├── tasks/
│   │   │   ├── TaskItem.tsx        # Single task row with checkbox, color tag, delete button
│   │   │   └── AddTaskForm.tsx     # Quick inline task creation bar
│   │   └── expenses/
│   │       ├── BudgetMeters.tsx    # Day, Week, Month solid progress bars
│   │       ├── ExpenseItem.tsx     # Single expense row with color tag, amount, delete button
│   │       └── AddExpenseForm.tsx  # Quick expense input + color category selector
│   ├── hooks/
│   │   ├── useRealtimeSync.ts      # Subscribes to Supabase Postgres changes for live sync
│   │   ├── useTasks.ts             # CRUD + optimistic mutations for tasks
│   │   ├── useExpenses.ts          # CRUD + budget calculations for expenses
│   │   └── useStreaks.ts           # Evaluates & persists Task Streak and Budget Streak
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser Supabase client
│   │   │   └── server.ts           # Server Supabase client
│   │   ├── constants/
│   │   │   └── categories.ts       # Shared Color Definitions (RED, BLUE, GREEN, AMBER)
│   │   └── utils/
│   │       └── dates.ts            # Local timezone YYYY-MM-DD boundary helpers
│   └── types/
│       └── database.ts             # TypeScript interfaces matching Supabase schema
├── PRD.md
├── Architecture.md
├── Rules.md
├── memory.md
├── design.md
└── tasks.md
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 `expenses` Table
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  category category_color NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

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
2. **Realtime Channel (`useRealtimeSync.ts`):** On mount, the app subscribes to `postgres_changes` on `tasks`, `expenses`, `budgets`, and `daily_logs`. When a change occurs on the laptop, the iPhone receives the payload and invalidates the corresponding TanStack Query key.
3. **Streak Calculation:** Streaks are calculated by counting consecutive rows in `daily_logs` backward from `today` (or `yesterday` if today is still in progress) where `task_day_won = true` (Task Streak) and `budget_day_won = true` (Budget Streak).
