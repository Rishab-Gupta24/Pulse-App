import type { BudgetLimits } from "@/hooks/useBudget";
import type { SpendTotals } from "@/hooks/useExpenses";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

const WARNING_RATIO = 0.8;

function fillClass(spent: number, limit: number): string {
  if (spent > limit) return "bg-red";
  if (limit > 0 && spent / limit >= WARNING_RATIO) return "bg-amber";
  return "bg-green";
}

function Meter({
  label,
  spent,
  limit,
  symbol,
}: {
  label: string;
  spent: number;
  limit: number;
  symbol: string;
}) {
  const over = spent > limit;
  const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : over ? 100 : 0;
  const remaining = Math.abs(limit - spent);
  const summary = `${formatMoney(spent, symbol)} spent · ${formatMoney(remaining, symbol)} ${over ? "over" : "left"}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-medium">{label}</span>
        <span className="text-xs font-medium tabular-nums text-secondary">
          of {formatMoney(limit, symbol)}
        </span>
      </div>
      <div
        role="meter"
        aria-label={`${label}: ${summary}`}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(spent, limit)}
        className="h-2 overflow-hidden rounded-full bg-subtle"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", fillClass(spent, limit))}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className={cn(
          "text-[13px] tabular-nums",
          over ? "font-semibold text-danger" : "text-secondary",
        )}
      >
        {summary}
      </span>
    </div>
  );
}

/** Day / week / month spend vs. budget as solid progress bars. */
export default function BudgetMeters({
  totals,
  budget,
}: {
  totals: SpendTotals;
  budget: BudgetLimits;
}) {
  const symbol = budget.currency_symbol;

  return (
    <div className="flex flex-col gap-5 rounded-xl bg-surface p-4">
      <Meter label="Today's Budget" spent={totals.today} limit={budget.daily_limit} symbol={symbol} />
      <Meter label="Weekly Budget" spent={totals.week} limit={budget.weekly_limit} symbol={symbol} />
      <Meter label="Monthly Budget" spent={totals.month} limit={budget.monthly_limit} symbol={symbol} />
    </div>
  );
}
