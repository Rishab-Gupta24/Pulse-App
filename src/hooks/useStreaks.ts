"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useBudget } from "@/hooks/useBudget";
import { toLocalDateString } from "@/lib/utils/dates";

export interface StreakCounts {
  taskStreak: number;
  budgetStreak: number;
}

export const streaksQueryKey = (today: string) => ["streaks", today] as const;

/**
 * Task + Budget streaks, computed in Postgres (`get_streaks`) from `daily_logs`,
 * which triggers keep in sync with tasks and expenses.
 */
export function useStreaks(): StreakCounts {
  const supabase = createClient();
  const today = toLocalDateString();

  const { data } = useQuery({
    queryKey: streaksQueryKey(today),
    queryFn: async (): Promise<StreakCounts> => {
      const { data, error } = await supabase.rpc("get_streaks", { p_today: today });
      if (error) throw error;
      const row = data[0];
      return { taskStreak: row?.task_streak ?? 0, budgetStreak: row?.budget_streak ?? 0 };
    },
  });

  return data ?? { taskStreak: 0, budgetStreak: 0 };
}

/**
 * Upserts today's `daily_logs` row so it exists from the first app open and its
 * budget snapshot follows the current Daily Budget. Past days keep their snapshot.
 * Mount once (see `DataSync`).
 */
export function useTodayLogSnapshot() {
  const queryClient = useQueryClient();
  const { budget, isLoading, isError } = useBudget();
  const today = toLocalDateString();
  const dailyLimit = budget.daily_limit;

  useEffect(() => {
    if (isLoading || isError) return;
    let cancelled = false;

    void (async () => {
      const { error } = await createClient()
        .from("daily_logs")
        .upsert(
          { log_date: today, daily_budget_snapshot: dailyLimit },
          { onConflict: "user_id,log_date" },
        );
      if (!error && !cancelled) {
        await queryClient.invalidateQueries({ queryKey: streaksQueryKey(today) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [today, dailyLimit, isLoading, isError, queryClient]);
}
