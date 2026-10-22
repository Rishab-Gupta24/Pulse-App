"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { isCategoryColor, type CategoryColor } from "@/lib/constants/categories";
import { getBudgetPeriods } from "@/lib/utils/dates";
import { sumAmounts } from "@/lib/utils/money";
import { useBudget } from "@/hooks/useBudget";
import { showToast } from "@/hooks/useToast";
import type { Expense, ExpenseScope } from "@/types/database";

export const EXPENSE_TITLE_MAX_LENGTH = 100;

export const expensesQueryKey = (rangeStart: string, rangeEnd: string) =>
  ["expenses", rangeStart, rangeEnd] as const;

type ExpenseList = Expense[];

const byCreatedAt = (a: Expense, b: Expense) =>
  (a.created_at ?? "").localeCompare(b.created_at ?? "");

/** Returns a trimmed, valid title or null (mirrors the DB check constraint). */
export function normalizeExpenseTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed || trimmed.length > EXPENSE_TITLE_MAX_LENGTH) return null;
  return trimmed;
}

export interface SpendTotals {
  today: number;
  week: number;
  month: number;
}

/**
 * Expenses for the current week and month (local calendar), the user's budget
 * caps, and optimistic add / delete. Failed mutations roll back the affected
 * row only and show a toast.
 */
export function useExpenses() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { budget, isLoading: budgetLoading } = useBudget();
  const periods = getBudgetPeriods();
  const queryKey = expensesQueryKey(periods.rangeStart, periods.rangeEnd);

  const setExpenses = (update: (expenses: ExpenseList) => ExpenseList) =>
    queryClient.setQueryData<ExpenseList>(queryKey, (expenses = []) => update(expenses));

  // Streaks change too: triggers refresh `daily_logs` on every expense write.
  const settle = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ["streaks"] }),
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] }),
    ]);

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<ExpenseList> => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .gte("expense_date", periods.rangeStart)
        .lte("expense_date", periods.rangeEnd)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data.map((expense) => ({ ...expense, amount: Number(expense.amount) }));
    },
  });

  // Insert with a client-generated id so the optimistic row and the stored row match.
  const insertExpense = async (expense: Expense) => {
    const { error } = await supabase.from("expenses").insert({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      expense_date: expense.expense_date,
      scope: expense.scope,
    });
    if (error) throw error;
  };

  const addExpense = useMutation({
    mutationFn: insertExpense,
    onMutate: async (expense) => {
      await queryClient.cancelQueries({ queryKey });
      setExpenses((expenses) => [...expenses, expense]);
    },
    onError: (_error, expense) => {
      setExpenses((expenses) => expenses.filter((e) => e.id !== expense.id));
      showToast("Couldn't log expense. Try again.");
    },
    onSettled: settle,
  });

  const restoreExpense = useMutation({
    mutationFn: insertExpense,
    onMutate: async (expense) => {
      await queryClient.cancelQueries({ queryKey });
      setExpenses((expenses) => [...expenses, expense].sort(byCreatedAt));
    },
    onError: (_error, expense) => {
      setExpenses((expenses) => expenses.filter((e) => e.id !== expense.id));
      showToast("Couldn't restore expense.");
    },
    onSettled: settle,
  });

  const deleteExpense = useMutation({
    mutationFn: async (expense: Expense) => {
      const { error } = await supabase.from("expenses").delete().eq("id", expense.id);
      if (error) throw error;
    },
    onMutate: async (expense) => {
      await queryClient.cancelQueries({ queryKey });
      setExpenses((expenses) => expenses.filter((e) => e.id !== expense.id));
    },
    onSuccess: (_data, expense) => {
      showToast("Expense deleted.", {
        label: "Undo",
        onClick: () => restoreExpense.mutate(expense),
      });
    },
    onError: (_error, expense) => {
      setExpenses((expenses) => [...expenses, expense].sort(byCreatedAt));
      showToast("Couldn't delete expense. Try again.");
    },
    onSettled: settle,
  });

  const expenses = query.data ?? [];
  const amountsWhere = (keep: (expense: Expense) => boolean) =>
    sumAmounts(expenses.filter(keep).map((e) => e.amount));

  // Scope decides which budgets an expense counts toward: a MONTH purchase (e.g.
  // detergent) only hits the month, WEEK hits week + month, DAY hits all three.
  const totals: SpendTotals = {
    today: amountsWhere((e) => e.scope === "DAY" && e.expense_date === periods.today),
    week: amountsWhere(
      (e) =>
        e.scope !== "MONTH" &&
        e.expense_date >= periods.weekStart &&
        e.expense_date <= periods.weekEnd,
    ),
    month: amountsWhere(
      (e) => e.expense_date >= periods.monthStart && e.expense_date <= periods.monthEnd,
    ),
  };

  return {
    expenses,
    periods,
    totals,
    budget,
    isLoading: query.isPending || budgetLoading,
    isError: query.isError,
    /** Returns false when the input is invalid (nothing is sent). */
    addExpense: (
      title: string,
      amount: number,
      category: CategoryColor,
      scope: ExpenseScope = "DAY",
    ): boolean => {
      const normalized = normalizeExpenseTitle(title);
      if (!normalized || !(amount > 0) || !isCategoryColor(category)) return false;
      addExpense.mutate({
        id: crypto.randomUUID(),
        user_id: "", // Filled by the DB default (auth.uid()); not used in the UI.
        title: normalized,
        amount,
        category,
        scope,
        expense_date: periods.today,
        created_at: new Date().toISOString(),
      });
      return true;
    },
    deleteExpense: (expense: Expense) => deleteExpense.mutate(expense),
  };
}
