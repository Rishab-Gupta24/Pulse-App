"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface DayTaskCount {
  total: number;
  done: number;
}

/**
 * Per-day task counts for a bounded date range (calendar grid), plus which
 * (repeat, day) pairs are already claimed: a copy exists or the day was removed,
 * so the repeat must not be projected there.
 */
export function useTaskCounts(start: string, end: string) {
  const supabase = createClient();

  const { data } = useQuery({
    // Under the ["tasks"] prefix so task mutations and realtime refresh it too.
    queryKey: ["tasks", "counts", start, end],
    queryFn: async () => {
      const [tasks, claims] = await Promise.all([
        supabase
          .from("tasks")
          .select("task_date, is_completed")
          .gte("task_date", start)
          .lte("task_date", end),
        supabase
          .from("template_materializations")
          .select("template_id, task_date")
          .gte("task_date", start)
          .lte("task_date", end),
      ]);
      if (tasks.error) throw tasks.error;
      if (claims.error) throw claims.error;
      return { tasks: tasks.data, claims: claims.data };
    },
  });

  const counts = new Map<string, DayTaskCount>();
  for (const row of data?.tasks ?? []) {
    const count = counts.get(row.task_date) ?? { total: 0, done: 0 };
    count.total += 1;
    if (row.is_completed) count.done += 1;
    counts.set(row.task_date, count);
  }
  const claimed = new Set((data?.claims ?? []).map((c) => `${c.template_id}:${c.task_date}`));
  return { counts, claimed };
}
