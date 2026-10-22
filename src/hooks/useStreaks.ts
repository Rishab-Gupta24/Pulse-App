"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useBudget } from "@/hooks/useBudget";
import { toLocalDateString } from "@/lib/utils/dates";
import type { DailyLog } from "@/types/database";

export interface StreakCounts {
  taskStreak: number;
  budgetStreak: number;
  longestTaskStreak: number;
  longestBudgetStreak: number;
  totalTaskDays: number;
  totalBudgetDays: number;
}

const EMPTY_STREAKS: StreakCounts = {
  taskStreak: 0,
  budgetStreak: 0,
  longestTaskStreak: 0,
  longestBudgetStreak: 0,
  totalTaskDays: 0,
  totalBudgetDays: 0,
};

export const streaksQueryKey = (today: string) => ["streaks", today] as const;

/**
 * Task + Budget streaks (current, longest, total won days), computed in Postgres
 * (`get_streaks`) from `daily_logs`, which triggers keep in sync.
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
      if (!row) return EMPTY_STREAKS;
      return {
        taskStreak: row.task_streak,
        budgetStreak: row.budget_streak,
        longestTaskStreak: row.longest_task_streak,
        longestBudgetStreak: row.longest_budget_streak,
        totalTaskDays: row.total_task_days,
        totalBudgetDays: row.total_budget_days,
      };
    },
  });

  return data ?? EMPTY_STREAKS;
}

export const dailyLogsQueryKey = (start: string, end: string) =>
  ["daily-logs", start, end] as const;

/** `daily_logs` rows for a bounded local date range (streak line, calendar). */
export function useDailyLogs(start: string, end: string) {
  const supabase = createClient();

  const { data } = useQuery({
    queryKey: dailyLogsQueryKey(start, end),
    queryFn: async (): Promise<DailyLog[]> => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .gte("log_date", start)
        .lte("log_date", end);
      if (error) throw error;
      return data;
    },
  });

  return new Map((data ?? []).map((log) => [log.log_date, log]));
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
