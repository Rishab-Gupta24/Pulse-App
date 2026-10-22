"use client";

import { useSyncExternalStore } from "react";
import { Flame, Shield, type LucideIcon } from "lucide-react";
import { useStreaks } from "@/hooks/useStreaks";
import { formatDisplayDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

const noopSubscribe = () => () => {};

/** Today's local date; empty during SSR so the server's timezone never leaks in. */
function useDisplayDate(): string {
  return useSyncExternalStore(noopSubscribe, () => formatDisplayDate(), () => "");
}

function dayLabel(count: number): string {
  return count === 1 ? "day" : "days";
}

function StreakBadge({
  icon: Icon,
  label,
  count,
  className,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-full bg-surface px-3",
        className,
      )}
      aria-label={`${label}: ${count} ${dayLabel(count)}`}
    >
      <Icon size={18} strokeWidth={1.75} aria-hidden className="text-secondary" />
      <span className="text-xs font-medium text-secondary">{label}</span>
      <span className="text-[15px] font-semibold tabular-nums">{count}</span>
    </div>
  );
}

/** Task + Budget streak pills; reused by the header (iPhone) and sidebar (Laptop). */
export function StreakBadges({ className }: { className?: string }) {
  const { taskStreak, budgetStreak } = useStreaks();

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <StreakBadge icon={Flame} label="Tasks" count={taskStreak} />
      <StreakBadge icon={Shield} label="Budget" count={budgetStreak} />
    </div>
  );
}

export default function StreakHeader({ title }: { title: string }) {
  const today = useDisplayDate();

  return (
    <header className="flex flex-col gap-3 pb-6 pt-4">
      <div>
        <p className="min-h-5 text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary">
          {today}
        </p>
        <h1 className="text-[28px] font-bold tracking-[-0.02em]">{title}</h1>
      </div>
      {/* Laptop shows streaks in the sidebar instead. */}
      <StreakBadges className="md:hidden" />
    </header>
  );
}
