"use client";

import { useState, type FormEvent } from "react";
import CategoryPicker from "@/components/shared/CategoryPicker";
import type { CategoryColor } from "@/lib/constants/categories";
import { EXPENSE_TITLE_MAX_LENGTH, normalizeExpenseTitle } from "@/hooks/useExpenses";
import { parseAmount } from "@/lib/utils/money";

const inputClass =
  "h-11 min-w-0 rounded-xl bg-subtle px-4 text-[17px] text-primary outline-none placeholder:text-secondary md:text-[15px]";

/** Quick expense entry: amount + label + category + "Log Expense". */
export default function AddExpenseForm({
  currencySymbol,
  onAdd,
}: {
  currencySymbol: string;
  onAdd: (title: string, amount: number, category: CategoryColor) => boolean;
}) {
  const [amountInput, setAmountInput] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryColor>("GREEN");
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
    if (onAdd(title, amount, category)) {
      setAmountInput("");
      setTitle("");
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
