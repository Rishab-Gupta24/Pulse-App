-- Not exposed through the Data API; only the triggers call it.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

ALTER FUNCTION public.refresh_daily_log(UUID, DATE) SET SCHEMA private;
GRANT EXECUTE ON FUNCTION private.refresh_daily_log(UUID, DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.tasks_refresh_daily_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM private.refresh_daily_log(OLD.user_id, OLD.task_date);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND (TG_OP = 'INSERT' OR NEW.task_date IS DISTINCT FROM OLD.task_date OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    PERFORM private.refresh_daily_log(NEW.user_id, NEW.task_date);
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.expenses_refresh_daily_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM private.refresh_daily_log(OLD.user_id, OLD.expense_date);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND (TG_OP = 'INSERT' OR NEW.expense_date IS DISTINCT FROM OLD.expense_date OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    PERFORM private.refresh_daily_log(NEW.user_id, NEW.expense_date);
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger functions are not meant to be called via RPC.
REVOKE EXECUTE ON FUNCTION public.tasks_refresh_daily_log() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expenses_refresh_daily_log() FROM PUBLIC, anon, authenticated;
