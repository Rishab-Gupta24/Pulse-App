-- Phase 8: task notes, repeating tasks, expense budget scope, streak statistics.

-- 1. Task notes ("bio"), e.g. "1 hr workout".
ALTER TABLE public.tasks
  ADD COLUMN note TEXT CHECK (note IS NULL OR char_length(note) <= 200);

-- 2. Repeating tasks. A template repeats on the given weekdays
--    (0 = Sunday … 6 = Saturday, matching JS getDay() and Postgres DOW).
CREATE TABLE public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 140),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 200),
  category public.category_color NOT NULL,
  weekdays SMALLINT[] NOT NULL CHECK (
    cardinality(weekdays) BETWEEN 1 AND 7 AND weekdays <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::SMALLINT[]
  ),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX task_templates_user_idx ON public.task_templates (user_id) WHERE active;

ALTER TABLE public.tasks
  ADD COLUMN template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL;

-- One row per (template, day) ever created, so a repeating task the user deleted
-- for a day is not re-created when the app reloads.
CREATE TABLE public.template_materializations (
  template_id UUID NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  task_date DATE NOT NULL,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, task_date)
);

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['task_templates', 'template_materializations'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format(
      'CREATE POLICY "Users read own %1$s" ON public.%1$I FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format(
      'CREATE POLICY "Users insert own %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format(
      'CREATE POLICY "Users update own %1$s" ON public.%1$I FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format(
      'CREATE POLICY "Users delete own %1$s" ON public.%1$I FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id)', t);
  END LOOP;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.task_templates;

-- Creates today's instances of the user's active templates for p_date (the client's
-- local day). Idempotent and safe when two devices call it at once.
CREATE FUNCTION public.materialize_tasks(p_date DATE)
RETURNS INT
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH due AS (
    SELECT t.id, t.title, t.note, t.category
    FROM public.task_templates t
    WHERE t.user_id = auth.uid()
      AND t.active
      AND extract(dow FROM p_date)::SMALLINT = ANY (t.weekdays)
  ),
  claimed AS (
    INSERT INTO public.template_materializations (template_id, task_date)
    SELECT id, p_date FROM due
    ON CONFLICT DO NOTHING
    RETURNING template_id
  ),
  created AS (
    INSERT INTO public.tasks (title, note, category, task_date, template_id)
    SELECT d.title, d.note, d.category, p_date, d.id
    FROM due d JOIN claimed c ON c.template_id = d.id
    RETURNING 1
  )
  SELECT count(*)::INT FROM created;
$$;

-- New repeating task. Ids come from the client so the optimistic row matches.
-- Today's instance is created only when today is one of the chosen weekdays.
CREATE FUNCTION public.create_repeating_task(
  p_template_id UUID,
  p_task_id UUID,
  p_title TEXT,
  p_note TEXT,
  p_category public.category_color,
  p_weekdays SMALLINT[],
  p_today DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.task_templates (id, title, note, category, weekdays)
  VALUES (p_template_id, p_title, p_note, p_category, p_weekdays);

  IF extract(dow FROM p_today)::SMALLINT = ANY (p_weekdays) THEN
    INSERT INTO public.template_materializations (template_id, task_date)
    VALUES (p_template_id, p_today);
    INSERT INTO public.tasks (id, title, note, category, task_date, template_id)
    VALUES (p_task_id, p_title, p_note, p_category, p_today, p_template_id);
  END IF;
END;
$$;

-- Turns an existing task into a repeating one (or changes its repeat days).
-- p_template_id is used only when the task has no template yet.
CREATE FUNCTION public.make_task_repeating(p_task_id UUID, p_template_id UUID, p_weekdays SMALLINT[])
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_task public.tasks%ROWTYPE;
  v_template UUID;
BEGIN
  SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_task.template_id IS NOT NULL THEN
    v_template := v_task.template_id;
    UPDATE public.task_templates SET weekdays = p_weekdays, active = TRUE WHERE id = v_template;
  ELSE
    v_template := p_template_id;
    INSERT INTO public.task_templates (id, title, note, category, weekdays)
    VALUES (v_template, v_task.title, v_task.note, v_task.category, p_weekdays);
    UPDATE public.tasks SET template_id = v_template WHERE id = p_task_id;
  END IF;

  INSERT INTO public.template_materializations (template_id, task_date)
  VALUES (v_template, v_task.task_date)
  ON CONFLICT DO NOTHING;

  RETURN v_template;
END;
$$;

-- 3. Expense budget scope: a monthly purchase (detergent) counts toward the month
--    only; a weekly one toward the week and month; a daily one toward all three.
CREATE TYPE public.expense_scope AS ENUM ('DAY', 'WEEK', 'MONTH');
ALTER TABLE public.expenses
  ADD COLUMN scope public.expense_scope NOT NULL DEFAULT 'DAY';

-- Daily spend (and so the Budget streak) only counts day-scoped expenses.
CREATE OR REPLACE FUNCTION private.refresh_daily_log(p_user UUID, p_date DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text || ':' || p_date::text, 0));

  INSERT INTO public.daily_logs (user_id, log_date, tasks_total, tasks_completed, daily_spent, daily_budget_snapshot)
  SELECT
    p_user,
    p_date,
    (SELECT count(*) FROM public.tasks t WHERE t.user_id = p_user AND t.task_date = p_date),
    (SELECT count(*) FROM public.tasks t WHERE t.user_id = p_user AND t.task_date = p_date AND t.is_completed),
    (SELECT coalesce(sum(e.amount), 0) FROM public.expenses e
      WHERE e.user_id = p_user AND e.expense_date = p_date AND e.scope = 'DAY'),
    coalesce((SELECT b.daily_limit FROM public.budgets b WHERE b.user_id = p_user), 20.00)
  ON CONFLICT (user_id, log_date) DO UPDATE SET
    tasks_total = EXCLUDED.tasks_total,
    tasks_completed = EXCLUDED.tasks_completed,
    daily_spent = EXCLUDED.daily_spent;
EXCEPTION
  WHEN foreign_key_violation THEN NULL;
END;
$$;

-- 4. Streak statistics for the streak line: current, longest and total won days.
DROP FUNCTION public.get_streaks(DATE);
CREATE FUNCTION public.get_streaks(p_today DATE)
RETURNS TABLE (
  task_streak INT,
  budget_streak INT,
  longest_task_streak INT,
  longest_budget_streak INT,
  total_task_days INT,
  total_budget_days INT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_today public.daily_logs%ROWTYPE;
  v_start DATE;
  v_first DATE;
  v_last_lost DATE;
  v_lost_count INT;
BEGIN
  SELECT * INTO v_today FROM public.daily_logs d WHERE d.user_id = v_user AND d.log_date = p_today;

  -- Task streak: consecutive won days ending today, or yesterday while today is in progress.
  v_start := CASE WHEN coalesce(v_today.task_day_won, FALSE) THEN p_today ELSE p_today - 1 END;
  SELECT count(*) INTO task_streak
  FROM (
    SELECT d.log_date, row_number() OVER (ORDER BY d.log_date DESC) AS rn
    FROM public.daily_logs d
    WHERE d.user_id = v_user AND d.task_day_won AND d.log_date <= v_start
  ) won
  WHERE won.log_date = v_start - (won.rn - 1)::INT;

  SELECT coalesce(max(run), 0), coalesce(sum(run), 0) INTO longest_task_streak, total_task_days
  FROM (
    SELECT count(*)::INT AS run
    FROM (
      SELECT d.log_date - (row_number() OVER (ORDER BY d.log_date))::INT AS grp
      FROM public.daily_logs d
      WHERE d.user_id = v_user AND d.task_day_won AND d.log_date <= p_today
    ) s
    GROUP BY grp
  ) runs;

  -- Budget: days with no row had no day-scoped spending, so they count as won.
  SELECT min(d.log_date) INTO v_first
  FROM public.daily_logs d WHERE d.user_id = v_user AND d.log_date <= p_today;

  IF v_first IS NULL THEN
    budget_streak := 0;
    longest_budget_streak := 0;
    total_budget_days := 0;
  ELSE
    SELECT max(d.log_date), count(*) INTO v_last_lost, v_lost_count
    FROM public.daily_logs d
    WHERE d.user_id = v_user AND d.log_date <= p_today AND NOT d.budget_day_won;

    budget_streak := CASE
      WHEN v_today.budget_day_won IS FALSE THEN 0
      ELSE p_today - greatest(v_last_lost, v_first - 1)
    END;

    SELECT coalesce(max(nxt - b - 1), 0) INTO longest_budget_streak
    FROM (
      SELECT b, lead(b) OVER (ORDER BY b) AS nxt
      FROM (
        SELECT v_first - 1 AS b
        UNION
        SELECT d.log_date FROM public.daily_logs d
        WHERE d.user_id = v_user AND d.log_date <= p_today AND NOT d.budget_day_won
        UNION
        SELECT p_today + 1
      ) breaks
    ) gaps
    WHERE nxt IS NOT NULL;

    total_budget_days := (p_today - v_first + 1) - v_lost_count;
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_streaks(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_streaks(DATE) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.materialize_tasks(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.materialize_tasks(DATE) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_repeating_task(UUID, UUID, TEXT, TEXT, public.category_color, SMALLINT[], DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_repeating_task(UUID, UUID, TEXT, TEXT, public.category_color, SMALLINT[], DATE) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.make_task_repeating(UUID, UUID, SMALLINT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.make_task_repeating(UUID, UUID, SMALLINT[]) TO authenticated;
