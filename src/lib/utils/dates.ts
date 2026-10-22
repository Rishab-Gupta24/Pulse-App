import { format } from "date-fns";

// Calendar days are always the user's local day, never UTC (Rules.md §1.3).

/** Local `YYYY-MM-DD` string for queries and inserts. */
export function toLocalDateString(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

/** e.g. "Thursday, October 22". */
export function formatDisplayDate(date: Date = new Date()): string {
  return format(date, "EEEE, MMMM d");
}
