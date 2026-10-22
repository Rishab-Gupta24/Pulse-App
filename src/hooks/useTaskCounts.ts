"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface DayTaskCount {
  total: number;
  done: number;
}

/** Per-day task counts for a bounded date range (calendar grid). */
export function useTaskCounts(start: string, end: string) {
  const supabase = createClient();

  const { data } = useQuery({
    // Under the ["tasks"] prefix so task mutations and realtime refresh it too.
    queryKey: ["tasks", "counts", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("task_date, is_completed, template_id")
        .gte("task_date", start)
        .lte("task_date", end);
      if (error) throw error;
      return data;
    },
  });

  const counts = new Map<string, DayTaskCount>();
  const materialized = new Set<string>(); // `${templateId}:${date}`
  for (const row of data ?? []) {
    const count = counts.get(row.task_date) ?? { total: 0, done: 0 };
    count.total += 1;
    if (row.is_completed) count.done += 1;
    counts.set(row.task_date, count);
    if (row.template_id) materialized.add(`${row.template_id}:${row.task_date}`);
  }
  return { counts, materialized };
}
