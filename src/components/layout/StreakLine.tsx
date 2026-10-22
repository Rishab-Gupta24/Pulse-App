"use client";

import { useState, useSyncExternalStore } from "react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { Shield, Trophy } from "lucide-react";
import BlueFlame from "@/components/shared/BlueFlame";
import { useDailyLogs, useStreaks } from "@/hooks/useStreaks";
import { fromLocalDateString, toLocalDateString } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

type Metric = "tasks" | "budget";

const DAYS_BEFORE = 4;
const DAYS_AFTER = 2;

type DayState = "won" | "today-open" | "missed" | "future";

const noopSubscribe = () => () => {};

/** Streak card: current + longest, a 7-day line with live flames, total won days. */
export default function StreakLine() {
  // Dates come from the device clock; render only in the browser so the server's
  // timezone never leaks into the day labels.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) {
    return <div aria-hidden className="h-[188px] rounded-2xl bg-surface" />;
  }
  return <StreakLineContent />;
}

function StreakLineContent() {
  const [metric, setMetric] = useState<Metric>("tasks");
  const streaks = useStreaks();
  const today = new Date();
  const todayKey = toLocalDateString(today);
  const days = Array.from({ length: DAYS_BEFORE + 1 + DAYS_AFTER }, (_, i) =>
    addDays(today, i - DAYS_BEFORE),
  );
  const logs = useDailyLogs(toLocalDateString(days[0]), toLocalDateString(days[days.length - 1]));

  const current = metric === "tasks" ? streaks.taskStreak : streaks.budgetStreak;
  const longest = metric === "tasks" ? streaks.longestTaskStreak : streaks.longestBudgetStreak;
  const total = metric === "tasks" ? streaks.totalTaskDays : streaks.totalBudgetDays;

  function stateFor(day: Date): DayState {
    const key = toLocalDateString(day);
    if (key > todayKey) return "future";
    const log = logs.get(key);
    if (metric === "tasks") {
      if (log?.task_day_won) return "won";
      return key === todayKey ? "today-open" : "missed";
    }
    // Budget: days without a row had no day-scoped spending (Zero-Spend Day Rule);
    // inside the current streak they are won.
    const won = log ? Boolean(log.budget_day_won) : differenceInCalendarDays(today, day) < current;
    if (won) return "won";
    return key === todayKey ? "today-open" : "missed";
  }

  return (
    <section aria-label="Streaks" className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary">Streaks</h2>
        <div role="radiogroup" aria-label="Streak type" className="flex rounded-full bg-subtle p-0.5">
          {(["tasks", "budget"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={metric === value}
              onClick={() => setMetric(value)}
              className={cn(
                "min-h-11 rounded-full px-3 text-xs font-semibold capitalize",
                metric === value ? "bg-surface text-primary" : "text-secondary",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[34px] font-bold leading-none tracking-[-0.02em] tabular-nums">{current}</p>
          <p className="mt-1 text-[13px] text-secondary">Current streak</p>
        </div>
        <div>
          <p className="text-[34px] font-bold leading-none tracking-[-0.02em] tabular-nums">{longest}</p>
          <p className="mt-1 flex items-center gap-1 whitespace-nowrap text-[13px] text-secondary">
            Longest streak
            <Trophy size={14} strokeWidth={1.75} aria-hidden />
          </p>
        </div>
      </div>

      <ol className="grid grid-cols-7 gap-1" aria-label="Last 5 days and next 2">
        {days.map((day) => {
          const state = stateFor(day);
          const key = toLocalDateString(day);
          const isToday = key === todayKey;
          return (
            <li key={key} className="flex flex-col items-center gap-1.5">
              <span
                aria-hidden
                className={cn(
                  "h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent",
                  isToday ? "border-t-accent" : "border-t-transparent",
                )}
              />
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full",
                  state === "won" && "bg-accent-fill text-white",
                  state === "today-open" && "border-2 border-dashed border-accent",
                  state === "missed" && "border-[1.5px] border-hairline",
                  state === "future" && "bg-subtle",
                )}
                aria-label={`${format(day, "EEEE")}: ${
                  state === "won" ? "won" : state === "future" ? "upcoming" : state === "today-open" ? "in progress" : "missed"
                }`}
                role="img"
              >
                {state === "won" &&
                  (metric === "tasks" ? (
                    <BlueFlame size={22} live coreClass="fill-[var(--flame-core)]" />
                  ) : (
                    <Shield size={18} strokeWidth={2} aria-hidden />
                  ))}
              </span>
              <span className={cn("text-[13px]", isToday ? "font-semibold text-primary" : "text-secondary")}>
                {format(fromLocalDateString(key), "EEEEE")}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="text-center text-[15px] text-secondary">
        Total {metric === "tasks" ? "task" : "budget"} days:{" "}
        <span className="font-semibold tabular-nums text-primary">{total}</span>
      </p>
    </section>
  );
}
