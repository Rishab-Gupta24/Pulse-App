import {
  endOfMonth,
  endOfWeek,
  format,
  isToday,
  isYesterday,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";

// Calendar days are always the user's local day, never UTC (Rules.md §1.3).

/** Weeks run Monday–Sunday for the weekly budget. */
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

/** Local `YYYY-MM-DD` string for queries and inserts. */
export function toLocalDateString(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

/** e.g. "Thursday, October 22". */
export function formatDisplayDate(date: Date = new Date()): string {
  return format(date, "EEEE, MMMM d");
}

/** "Today", "Yesterday", or e.g. "Tuesday, October 20" for a `YYYY-MM-DD` string. */
export function formatDayHeading(localDate: string): string {
  const date = parse(localDate, "yyyy-MM-dd", new Date());
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return formatDisplayDate(date);
}

export interface BudgetPeriods {
  today: string;
  weekStart: string;
  weekEnd: string;
  monthStart: string;
  monthEnd: string;
  /** Smallest range covering both the current week and month. */
  rangeStart: string;
  rangeEnd: string;
}

export function getBudgetPeriods(date: Date = new Date()): BudgetPeriods {
  const weekStart = toLocalDateString(startOfWeek(date, WEEK_OPTIONS));
  const weekEnd = toLocalDateString(endOfWeek(date, WEEK_OPTIONS));
  const monthStart = toLocalDateString(startOfMonth(date));
  const monthEnd = toLocalDateString(endOfMonth(date));

  // YYYY-MM-DD strings compare correctly as plain strings.
  return {
    today: toLocalDateString(date),
    weekStart,
    weekEnd,
    monthStart,
    monthEnd,
    rangeStart: weekStart < monthStart ? weekStart : monthStart,
    rangeEnd: weekEnd > monthEnd ? weekEnd : monthEnd,
  };
}
