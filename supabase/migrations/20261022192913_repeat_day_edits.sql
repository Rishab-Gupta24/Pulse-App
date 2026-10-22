-- Phase 9: edit / delete scheduled and repeating tasks from the calendar.

-- Security fix: a materialization row may only reference the caller's own template.
-- Before, the policy checked only user_id, so someone who knew another user's
-- template UUID could claim (template, day) and block that user's copy.
DROP POLICY "Users insert own template_materializations" ON public.template_materializations;
CREATE POLICY "Users insert own template_materializations" ON public.template_materializations
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.task_templates t
      WHERE t.id = template_id AND t.user_id = (SELECT auth.uid())
    )
  );

-- Edit one future day of a repeat that has no copy yet: claim the day and create
-- the copy with the edited fields in one step. Fails if the day is already
-- claimed (copy exists or was removed), so the client refreshes instead.
CREATE FUNCTION public.create_task_for_repeat_day(
  p_template_id UUID,
  p_date DATE,
  p_task_id UUID,
  p_title TEXT,
  p_note TEXT,
  p_category public.category_color
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.template_materializations (template_id, task_date)
  VALUES (p_template_id, p_date);
  INSERT INTO public.tasks (id, title, note, category, task_date, template_id)
  VALUES (p_task_id, p_title, p_note, p_category, p_date, p_template_id);
END;
$$;

-- "Save for all days": update the repeat and every copy from today on.
-- Past days keep what they were.
CREATE FUNCTION public.update_repeating_task(
  p_template_id UUID,
  p_today DATE,
  p_title TEXT,
  p_note TEXT,
  p_category public.category_color
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.task_templates
  SET title = p_title, note = p_note, category = p_category
  WHERE id = p_template_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Repeating task not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.tasks
  SET title = p_title, note = p_note, category = p_category
  WHERE template_id = p_template_id AND task_date >= p_today;
END;
$$;

-- "Delete all repeats": stop the repeat and remove its upcoming copies. Today's
-- copy is removed only if it isn't done, so finished days keep their history.
CREATE FUNCTION public.delete_repeating_task(p_template_id UUID, p_today DATE)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_deleted INT;
BEGIN
  UPDATE public.task_templates SET active = FALSE WHERE id = p_template_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Repeating task not found' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.tasks
  WHERE template_id = p_template_id
    AND (task_date > p_today OR (task_date = p_today AND NOT is_completed));
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_task_for_repeat_day(UUID, DATE, UUID, TEXT, TEXT, public.category_color) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_task_for_repeat_day(UUID, DATE, UUID, TEXT, TEXT, public.category_color) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.update_repeating_task(UUID, DATE, TEXT, TEXT, public.category_color) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_repeating_task(UUID, DATE, TEXT, TEXT, public.category_color) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_repeating_task(UUID, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_repeating_task(UUID, DATE) TO authenticated;
