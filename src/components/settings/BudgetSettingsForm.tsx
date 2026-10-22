"use client";

import { useState, type FormEvent } from "react";
import {
  CURRENCY_SYMBOL_MAX_LENGTH,
  useBudget,
  type BudgetLimits,
} from "@/hooks/useBudget";
import { parseAmount } from "@/lib/utils/money";

const inputClass =
  "h-11 w-full rounded-xl bg-subtle px-4 text-[17px] text-primary tabular-nums outline-none md:text-[15px]";
const labelClass = "text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary";

type LimitField = "daily_limit" | "weekly_limit" | "monthly_limit";

const LIMIT_FIELDS: { key: LimitField; label: string }[] = [
  { key: "daily_limit", label: "Daily Budget" },
  { key: "weekly_limit", label: "Weekly Budget" },
  { key: "monthly_limit", label: "Monthly Budget" },
];

/** Soft warnings from memory.md "Budget Hierarchy Warning"; saving is still allowed. */
function hierarchyWarnings(daily: number | null, weekly: number | null, monthly: number | null) {
  const warnings: string[] = [];
  if (daily !== null && weekly !== null && daily * 7 > weekly) {
    warnings.push("Daily Budget × 7 is more than your Weekly Budget.");
  }
  if (weekly !== null && monthly !== null && weekly * 4 > monthly) {
    warnings.push("Weekly Budget × 4 is more than your Monthly Budget.");
  }
  return warnings;
}

function Form({
  initial,
  isSaving,
  onSave,
}: {
  initial: BudgetLimits;
  isSaving: boolean;
  onSave: (limits: BudgetLimits) => void;
}) {
  const [values, setValues] = useState<Record<LimitField, string>>({
    daily_limit: initial.daily_limit.toFixed(2),
    weekly_limit: initial.weekly_limit.toFixed(2),
    monthly_limit: initial.monthly_limit.toFixed(2),
  });
  const [symbol, setSymbol] = useState(initial.currency_symbol);
  const [error, setError] = useState("");

  const parsed = {
    daily_limit: parseAmount(values.daily_limit, { allowZero: true }),
    weekly_limit: parseAmount(values.weekly_limit, { allowZero: true }),
    monthly_limit: parseAmount(values.monthly_limit, { allowZero: true }),
  };
  const warnings = hierarchyWarnings(parsed.daily_limit, parsed.weekly_limit, parsed.monthly_limit);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { daily_limit, weekly_limit, monthly_limit } = parsed;
    if (daily_limit === null || weekly_limit === null || monthly_limit === null) {
      setError("Each budget must be a number with up to 2 decimals.");
      return;
    }
    const currency_symbol = symbol.trim();
    if (!currency_symbol || currency_symbol.length > CURRENCY_SYMBOL_MAX_LENGTH) {
      setError(`Currency symbol must be 1–${CURRENCY_SYMBOL_MAX_LENGTH} characters.`);
      return;
    }
    setError("");
    onSave({ daily_limit, weekly_limit, monthly_limit, currency_symbol });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-surface p-4" noValidate>
      {LIMIT_FIELDS.map(({ key, label }) => (
        <label key={key} className="flex flex-col gap-1.5">
          <span className={labelClass}>{label}</span>
          <input
            value={values[key]}
            onChange={(event) => setValues((v) => ({ ...v, [key]: event.target.value }))}
            inputMode="decimal"
            autoComplete="off"
            className={inputClass}
          />
        </label>
      ))}

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Currency Symbol</span>
        <input
          value={symbol}
          onChange={(event) => setSymbol(event.target.value)}
          maxLength={CURRENCY_SYMBOL_MAX_LENGTH}
          autoComplete="off"
          className={`${inputClass} w-24`}
        />
      </label>

      {warnings.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-xl bg-amber-soft px-4 py-3 text-[13px] text-primary">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="h-11 rounded-xl bg-accent-fill text-[15px] font-semibold text-white disabled:opacity-50"
      >
        Save Budgets
      </button>
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

export default function BudgetSettingsForm() {
  const { budget, isLoading, isError, saveBudget, isSaving } = useBudget();

  if (isLoading) {
    return <p className="rounded-xl bg-surface px-4 py-6 text-[15px] text-secondary">Loading budgets…</p>;
  }
  if (isError) {
    return (
      <p className="rounded-xl bg-surface px-4 py-6 text-[15px] text-secondary">
        Couldn&apos;t load budgets. Check your connection.
      </p>
    );
  }
  return <Form initial={budget} isSaving={isSaving} onSave={saveBudget} />;
}
