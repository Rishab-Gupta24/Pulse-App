-- Recompute one user's daily_logs row from tasks + expenses for a local calendar date.
-- The budget snapshot is taken only when the row is first created (ADR-003);
-- the client refreshes today's snapshot when the user edits their budget.
CREATE FUNCTION public.refresh_daily_log(p_user UUID, p_date DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
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

CREATE FUNCTION public.tasks_refresh_daily_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.refresh_daily_log(OLD.user_id, OLD.task_date);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND (TG_OP = 'INSERT' OR NEW.task_date IS DISTINCT FROM OLD.task_date OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    PERFORM public.refresh_daily_log(NEW.user_id, NEW.task_date);
  END IF;
  RETURN NULL;
END;
$$;

CREATE FUNCTION public.expenses_refresh_daily_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.refresh_daily_log(OLD.user_id, OLD.expense_date);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND (TG_OP = 'INSERT' OR NEW.expense_date IS DISTINCT FROM OLD.expense_date OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    PERFORM public.refresh_daily_log(NEW.user_id, NEW.expense_date);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER tasks_refresh_daily_log
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.tasks_refresh_daily_log();

CREATE TRIGGER expenses_refresh_daily_log
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.expenses_refresh_daily_log();

-- Streaks for the signed-in user, counted back from the client's local "today".
-- Task streak: consecutive won days ending today (or yesterday while today is in progress).
-- Budget streak: 0 if today is over budget; otherwise days since the later of the last
-- over-budget day and the first logged day. Days with no row had no expenses, so they
-- count as within budget (memory.md "Zero-Spend Day Rule").
CREATE FUNCTION public.get_streaks(p_today DATE)
RETURNS TABLE (task_streak INT, budget_streak INT)
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
BEGIN
  SELECT * INTO v_today FROM public.daily_logs d WHERE d.user_id = v_user AND d.log_date = p_today;

  v_start := CASE WHEN coalesce(v_today.task_day_won, FALSE) THEN p_today ELSE p_today - 1 END;
  SELECT count(*) INTO task_streak
  FROM (
    SELECT d.log_date, row_number() OVER (ORDER BY d.log_date DESC) AS rn
    FROM public.daily_logs d
    WHERE d.user_id = v_user AND d.task_day_won AND d.log_date <= v_start
  ) won
  WHERE won.log_date = v_start - (won.rn - 1)::INT;

  IF v_today.budget_day_won IS FALSE THEN
    budget_streak := 0;
  ELSE
    SELECT min(d.log_date) INTO v_first
    FROM public.daily_logs d WHERE d.user_id = v_user AND d.log_date <= p_today;
    SELECT max(d.log_date) INTO v_last_lost
    FROM public.daily_logs d WHERE d.user_id = v_user AND d.log_date < p_today AND NOT d.budget_day_won;
    budget_streak := CASE
      WHEN v_first IS NULL THEN 0
      ELSE p_today - greatest(v_last_lost, v_first - 1)
    END;
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_daily_log(UUID, DATE) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_streaks(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_streaks(DATE) TO authenticated;
