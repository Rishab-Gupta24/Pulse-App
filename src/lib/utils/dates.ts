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

/** Parses a local `YYYY-MM-DD` string as a local-midnight Date. */
export function fromLocalDateString(localDate: string): Date {
  return parse(localDate, "yyyy-MM-dd", new Date());
}

/** Day of week as stored in `task_templates.weekdays` (0 = Sunday, like getDay()). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Monday-first, matching the Monday–Sunday budget week. */
export const WEEKDAYS: readonly { value: Weekday; short: string; label: string }[] = [
  { value: 1, short: "M", label: "Monday" },
  { value: 2, short: "T", label: "Tuesday" },
  { value: 3, short: "W", label: "Wednesday" },
  { value: 4, short: "T", label: "Thursday" },
  { value: 5, short: "F", label: "Friday" },
  { value: 6, short: "S", label: "Saturday" },
  { value: 0, short: "S", label: "Sunday" },
];

const sameDays = (days: readonly number[], expected: number[]) =>
  days.length === expected.length && expected.every((d) => days.includes(d));

/** "Every day", "Weekdays", "Weekends" or e.g. "Mon, Wed, Fri". */
export function formatWeekdays(days: readonly number[]): string {
  if (sameDays(days, [0, 1, 2, 3, 4, 5, 6])) return "Every day";
  if (sameDays(days, [1, 2, 3, 4, 5])) return "Weekdays";
  if (sameDays(days, [0, 6])) return "Weekends";
  return WEEKDAYS.filter((d) => days.includes(d.value))
    .map((d) => d.label.slice(0, 3))
    .join(", ");
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
