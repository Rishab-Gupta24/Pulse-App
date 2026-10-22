"use client";

import { useState, type FormEvent } from "react";
import CategoryPicker from "@/components/shared/CategoryPicker";
import type { CategoryColor } from "@/lib/constants/categories";
import { EXPENSE_TITLE_MAX_LENGTH, normalizeExpenseTitle } from "@/hooks/useExpenses";
import { parseAmount } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import type { ExpenseScope } from "@/types/database";

const inputClass =
  "h-11 min-w-0 rounded-xl bg-subtle px-4 text-[17px] text-primary outline-none placeholder:text-secondary md:text-[15px]";

export const SCOPE_OPTIONS: { value: ExpenseScope; label: string; hint: string }[] = [
  { value: "DAY", label: "Today", hint: "Counts toward today, this week and this month." },
  { value: "WEEK", label: "This Week", hint: "Lasts the week: counts toward this week and month, not today." },
  { value: "MONTH", label: "This Month", hint: "Lasts the month (e.g. detergent): counts toward this month only." },
];

/** Quick expense entry: amount + label + category + budget scope + "Log Expense". */
export default function AddExpenseForm({
  currencySymbol,
  onAdd,
}: {
  currencySymbol: string;
  onAdd: (title: string, amount: number, category: CategoryColor, scope: ExpenseScope) => boolean;
}) {
  const [amountInput, setAmountInput] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryColor>("GREEN");
  const [scope, setScope] = useState<ExpenseScope>("DAY");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = parseAmount(amountInput);
    if (amount === null) {
      setError("Enter an amount greater than 0, with up to 2 decimals.");
      return;
    }
    if (!normalizeExpenseTitle(title)) {
      setError("Add a short label for this expense.");
      return;
    }
    if (onAdd(title, amount, category, scope)) {
      setAmountInput("");
      setTitle("");
      setScope("DAY");
      setError("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-surface p-3" noValidate>
      <div className="flex gap-2">
        <label className="relative w-32 shrink-0">
          <span className="sr-only">Amount</span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[17px] text-secondary md:text-[15px]"
          >
            {currencySymbol}
          </span>
          <input
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            className={`${inputClass} w-full tabular-nums`}
            style={{ paddingLeft: `calc(1rem + ${currencySymbol.length + 0.5}ch)` }}
          />
        </label>
        <label className="flex min-w-0 flex-1">
          <span className="sr-only">Label</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={EXPENSE_TITLE_MAX_LENGTH}
            autoComplete="off"
            placeholder="Lunch, coffee…"
            className={`${inputClass} w-full`}
          />
        </label>
      </div>
      <CategoryPicker value={category} onChange={setCategory} />
      <div className="flex flex-col gap-1.5">
        <span id="expense-scope-label" className="text-xs font-medium text-secondary">
          Counts toward
        </span>
        <div
          role="radiogroup"
          aria-labelledby="expense-scope-label"
          className="grid grid-cols-3 gap-1 rounded-xl bg-subtle p-1"
        >
          {SCOPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={scope === option.value}
              onClick={() => setScope(option.value)}
              className={cn(
                "min-h-11 rounded-lg text-[13px] font-semibold",
                scope === option.value ? "bg-surface text-primary" : "text-secondary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-secondary">
          {SCOPE_OPTIONS.find((option) => option.value === scope)?.hint}
        </p>
      </div>
      <button
        type="submit"
        className="h-11 rounded-xl bg-accent-fill text-[15px] font-semibold text-white"
      >
        Log Expense
      </button>
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
