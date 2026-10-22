CREATE TYPE public.category_color AS ENUM ('RED', 'BLUE', 'GREEN', 'AMBER');

CREATE TABLE public.budgets (
  user_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_limit NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  weekly_limit NUMERIC(10, 2) NOT NULL DEFAULT 140.00,
  monthly_limit NUMERIC(10, 2) NOT NULL DEFAULT 600.00,
  currency_symbol VARCHAR(5) NOT NULL DEFAULT '$',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 140),
  category public.category_color NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  category public.category_color NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  tasks_total INT NOT NULL DEFAULT 0,
  tasks_completed INT NOT NULL DEFAULT 0,
  task_day_won BOOLEAN GENERATED ALWAYS AS (tasks_total > 0 AND tasks_total = tasks_completed) STORED,
  daily_spent NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  daily_budget_snapshot NUMERIC(10, 2) NOT NULL,
  budget_day_won BOOLEAN GENERATED ALWAYS AS (daily_spent <= daily_budget_snapshot) STORED,
  UNIQUE (user_id, log_date)
);

-- Queries are always scoped to a user + date range (Rules.md §2.4)
CREATE INDEX tasks_user_date_idx ON public.tasks (user_id, task_date);
CREATE INDEX expenses_user_date_idx ON public.expenses (user_id, expense_date);
