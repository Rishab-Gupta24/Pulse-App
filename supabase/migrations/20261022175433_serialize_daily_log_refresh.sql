-- Concurrent writes for the same user + day (e.g. deleting a task and an expense at
-- once) each recomputed from a snapshot missing the other's change, and the last
-- upsert won with stale counts. Take a per-(user, day) transaction lock first; the
-- following statement gets a fresh snapshot that includes the other side's commit.
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
    (SELECT coalesce(sum(e.amount), 0) FROM public.expenses e WHERE e.user_id = p_user AND e.expense_date = p_date),
    coalesce((SELECT b.daily_limit FROM public.budgets b WHERE b.user_id = p_user), 20.00)
  ON CONFLICT (user_id, log_date) DO UPDATE SET
    tasks_total = EXCLUDED.tasks_total,
    tasks_completed = EXCLUDED.tasks_completed,
    daily_spent = EXCLUDED.daily_spent;
EXCEPTION
  -- The user is being deleted (cascade); nothing to log.
  WHEN foreign_key_violation THEN NULL;
END;
$$;

-- Repair rows written before this fix.
SELECT private.refresh_daily_log(d.user_id, d.log_date) FROM public.daily_logs d;
