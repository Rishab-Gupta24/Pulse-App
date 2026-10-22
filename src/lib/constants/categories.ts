// Single shared category taxonomy for tasks and expenses (Rules.md §1.1).
// Keys mirror the Postgres `category_color` enum.

export const CATEGORY_KEYS = ["RED", "BLUE", "GREEN", "AMBER"] as const;

export type CategoryColor = (typeof CATEGORY_KEYS)[number];

export interface Category {
  key: CategoryColor;
  label: string;
  /** Compact label for pills and badges. */
  shortLabel: string;
  /** Solid color via CSS variable; switches automatically in dark mode. */
  cssVar: string;
  /** Tailwind classes kept as literals so the compiler can detect them. */
  dotClass: string;
  textClass: string;
  softBgClass: string;
}

export const CATEGORIES: Record<CategoryColor, Category> = {
  RED: {
    key: "RED",
    label: "Health / Fitness",
    shortLabel: "Health",
    cssVar: "var(--color-red)",
    dotClass: "bg-red",
    textClass: "text-red",
    softBgClass: "bg-red-soft",
  },
  BLUE: {
    key: "BLUE",
    label: "Study / Work",
    shortLabel: "Study/Work",
    cssVar: "var(--color-blue)",
    dotClass: "bg-blue",
    textClass: "text-blue",
    softBgClass: "bg-blue-soft",
  },
  GREEN: {
    key: "GREEN",
    label: "Eating / Food",
    shortLabel: "Food",
    cssVar: "var(--color-green)",
    dotClass: "bg-green",
    textClass: "text-green",
    softBgClass: "bg-green-soft",
  },
  AMBER: {
    key: "AMBER",
    label: "Personal / Other",
    shortLabel: "Personal",
    cssVar: "var(--color-amber)",
    dotClass: "bg-amber",
    textClass: "text-amber",
    softBgClass: "bg-amber-soft",
  },
};

export const CATEGORY_LIST: readonly Category[] = CATEGORY_KEYS.map(
  (key) => CATEGORIES[key],
);

export function isCategoryColor(value: unknown): value is CategoryColor {
  return (
    typeof value === "string" &&
    (CATEGORY_KEYS as readonly string[]).includes(value)
  );
}
