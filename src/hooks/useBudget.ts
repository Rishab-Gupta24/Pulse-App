"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/hooks/useToast";
import type { Budget } from "@/types/database";

export type BudgetLimits = Pick<
  Budget,
  "daily_limit" | "weekly_limit" | "monthly_limit" | "currency_symbol"
>;

/** Mirrors the `budgets` column defaults until the user saves their own. */
export const DEFAULT_BUDGET: BudgetLimits = {
  daily_limit: 20,
  weekly_limit: 140,
  monthly_limit: 600,
  currency_symbol: "$",
};

export const CURRENCY_SYMBOL_MAX_LENGTH = 5;

export const budgetQueryKey = ["budget"] as const;

// PostgREST may return NUMERIC as strings; coerce defensively.
const toLimits = (row: Budget): BudgetLimits => ({
  daily_limit: Number(row.daily_limit),
  weekly_limit: Number(row.weekly_limit),
  monthly_limit: Number(row.monthly_limit),
  currency_symbol: row.currency_symbol,
});

/** The user's budget caps (defaults when none are saved yet). */
export function useBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: budgetQueryKey,
    queryFn: async (): Promise<BudgetLimits | null> => {
      const { data, error } = await supabase.from("budgets").select("*").maybeSingle();
      if (error) throw error;
      return data ? toLimits(data) : null;
    },
  });

  const saveBudget = useMutation({
    mutationFn: async (limits: BudgetLimits) => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase
        .from("budgets")
        .upsert({ ...limits, user_id: userId, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onMutate: async (limits) => {
      await queryClient.cancelQueries({ queryKey: budgetQueryKey });
      const previous = queryClient.getQueryData<BudgetLimits | null>(budgetQueryKey);
      queryClient.setQueryData<BudgetLimits | null>(budgetQueryKey, limits);
      return { previous };
    },
    onSuccess: () => showToast("Budgets saved."),
    onError: (_error, _limits, context) => {
      queryClient.setQueryData(budgetQueryKey, context?.previous ?? null);
      showToast("Couldn't save budgets. Try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: budgetQueryKey }),
  });

  return {
    budget: query.data ?? DEFAULT_BUDGET,
    isSaved: Boolean(query.data),
    isLoading: query.isPending,
    isError: query.isError,
    saveBudget: (limits: BudgetLimits) => saveBudget.mutate(limits),
    isSaving: saveBudget.isPending,
  };
}
