"use client";

import AddExpenseForm from "@/components/expenses/AddExpenseForm";
import BudgetMeters from "@/components/expenses/BudgetMeters";
import ExpenseList from "@/components/expenses/ExpenseList";
import CategoryFilter from "@/components/shared/CategoryFilter";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import { useExpenses } from "@/hooks/useExpenses";

const sectionHeaderClass =
  "text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary";

/** Day / week / month meters plus this month's expenses grouped by day. */
export default function ExpensesView() {
  const { expenses, periods, totals, budget, isLoading, isError, addExpense, deleteExpense } =
    useExpenses();
  const filter = useCategoryFilter((state) => state.filter);

  // The fetch also covers week days in the previous month; the list shows this month only.
  const thisMonth = expenses.filter(
    (e) =>
      e.expense_date >= periods.monthStart &&
      e.expense_date <= periods.monthEnd &&
      (filter === "ALL" || e.category === filter),
  );

  let emptyMessage = "No expenses this month.";
  if (isLoading) emptyMessage = "Loading expenses…";
  else if (isError) emptyMessage = "Couldn't load expenses. Check your connection.";
  else if (filter !== "ALL") emptyMessage = "No expenses in this category this month.";

  return (
    <div className="flex flex-col gap-6">
      {isLoading ? (
        <p className="rounded-xl bg-surface px-4 py-6 text-[15px] text-secondary">
          Loading budget…
        </p>
      ) : (
        <BudgetMeters totals={totals} budget={budget} />
      )}
      <AddExpenseForm currencySymbol={budget.currency_symbol} onAdd={addExpense} />
      <section className="flex flex-col gap-4">
        <h2 className={sectionHeaderClass}>This Month</h2>
        <CategoryFilter />
        <ExpenseList
          expenses={thisMonth}
          currencySymbol={budget.currency_symbol}
          emptyMessage={emptyMessage}
          onDelete={deleteExpense}
        />
      </section>
    </div>
  );
}
