DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['budgets', 'tasks', 'expenses', 'daily_logs'] LOOP
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

    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
  END LOOP;
END $$;
