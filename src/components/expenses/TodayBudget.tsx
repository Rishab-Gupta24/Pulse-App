"use client";

import AddExpenseForm from "@/components/expenses/AddExpenseForm";
import BudgetMeters from "@/components/expenses/BudgetMeters";
import ExpenseList from "@/components/expenses/ExpenseList";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import { useExpenses } from "@/hooks/useExpenses";

const sectionHeaderClass =
  "text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary";

/** Today view's right column: budget meters, quick logging, today's expenses. */
export default function TodayBudget() {
  const { expenses, periods, totals, budget, isLoading, isError, addExpense, deleteExpense } =
    useExpenses();
  const filter = useCategoryFilter((state) => state.filter);

  const todays = expenses.filter(
    (e) => e.expense_date === periods.today && (filter === "ALL" || e.category === filter),
  );

  let emptyMessage = "No expenses today.";
  if (isLoading) emptyMessage = "Loading expenses…";
  else if (isError) emptyMessage = "Couldn't load expenses. Check your connection.";
  else if (filter !== "ALL") emptyMessage = "No expenses in this category today.";

  return (
    <section className="flex flex-col gap-4">
      <h2 className={sectionHeaderClass}>Budget</h2>
      {isLoading ? (
        <p className="rounded-xl bg-surface px-4 py-6 text-[15px] text-secondary">
          Loading budget…
        </p>
      ) : (
        <BudgetMeters totals={totals} budget={budget} />
      )}
      <AddExpenseForm currencySymbol={budget.currency_symbol} onAdd={addExpense} />
      <ExpenseList
        expenses={todays}
        currencySymbol={budget.currency_symbol}
        emptyMessage={emptyMessage}
        onDelete={deleteExpense}
      />
    </section>
  );
}
