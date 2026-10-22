"use client";

import { Trash2 } from "lucide-react";
import CategoryBadge from "@/components/shared/CategoryBadge";
import { formatMoney } from "@/lib/utils/money";
import type { Expense } from "@/types/database";

/** Solid expense row: label + category badge, amount, delete button. */
export default function ExpenseItem({
  expense,
  currencySymbol,
  onDelete,
}: {
  expense: Expense;
  currencySymbol: string;
  onDelete: (expense: Expense) => void;
}) {
  return (
    <li className="flex items-center gap-3 bg-surface py-1 pl-4 pr-1">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-1.5">
        <span className="break-words text-[17px] leading-[1.4] md:text-[15px]">
          {expense.title}
        </span>
        <CategoryBadge category={expense.category} />
      </div>
      <span className="shrink-0 text-[17px] font-semibold tabular-nums md:text-[15px]">
        {formatMoney(expense.amount, currencySymbol)}
      </span>
      <button
        type="button"
        aria-label={`Delete "${expense.title}"`}
        onClick={() => onDelete(expense)}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-secondary hover:text-danger"
      >
        <Trash2 size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </li>
  );
}
