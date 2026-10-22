"use client";

import ExpenseItem from "@/components/expenses/ExpenseItem";
import { formatDayHeading } from "@/lib/utils/dates";
import { formatMoney, sumAmounts } from "@/lib/utils/money";
import type { Expense } from "@/types/database";

const sectionHeaderClass =
  "text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary";

function groupByDate(expenses: Expense[]): [string, Expense[]][] {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const group = groups.get(expense.expense_date) ?? [];
    group.push(expense);
    groups.set(expense.expense_date, group);
  }
  // Newest day first; rows within a day keep creation order.
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
}

/** Expense rows grouped under day headings with a per-day total. */
export default function ExpenseList({
  expenses,
  currencySymbol,
  emptyMessage,
  onDelete,
}: {
  expenses: Expense[];
  currencySymbol: string;
  emptyMessage: string;
  onDelete: (expense: Expense) => void;
}) {
  if (expenses.length === 0) {
    return (
      <p className="rounded-xl bg-surface px-4 py-6 text-[15px] text-secondary">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groupByDate(expenses).map(([date, rows]) => (
        <section key={date} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h3 className={sectionHeaderClass}>{formatDayHeading(date)}</h3>
            <span className="text-xs font-medium tabular-nums text-secondary">
              {formatMoney(sumAmounts(rows.map((r) => r.amount)), currencySymbol)}
            </span>
          </div>
          <ul className="divide-y divide-hairline overflow-hidden rounded-xl">
            {rows.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                currencySymbol={currencySymbol}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
