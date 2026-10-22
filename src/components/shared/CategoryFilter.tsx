"use client";

import { CATEGORY_LIST } from "@/lib/constants/categories";
import {
  useCategoryFilter,
  type CategoryFilterValue,
} from "@/hooks/useCategoryFilter";
import { cn } from "@/lib/utils/cn";

const pillClass =
  "flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-medium";

/** Horizontal pill selector filtering any list by category. */
export default function CategoryFilter({ className }: { className?: string }) {
  const { filter, setFilter } = useCategoryFilter();

  const options: {
    value: CategoryFilterValue;
    label: string;
    dotClass?: string;
    activeClass: string;
    ringColor: string;
  }[] = [
    { value: "ALL", label: "All", activeClass: "bg-subtle", ringColor: "var(--text-secondary)" },
    ...CATEGORY_LIST.map((category) => ({
      value: category.key,
      label: category.shortLabel,
      dotClass: category.dotClass,
      activeClass: category.softBgClass,
      ringColor: category.cssVar,
    })),
  ];

  return (
    <div
      role="group"
      aria-label="Filter by category"
      className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0", className)}
    >
      {options.map(({ value, label, dotClass, activeClass, ringColor }) => {
        const active = filter === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => setFilter(value)}
            className={cn(
              pillClass,
              active ? cn(activeClass, "text-primary") : "bg-surface text-secondary",
            )}
            // Inset ring keeps the selection visible where the 12% tint is faint (dark mode).
            style={active ? { boxShadow: `inset 0 0 0 1px ${ringColor}` } : undefined}
          >
            {dotClass && (
              <span className={cn("size-2 rounded-full", dotClass)} aria-hidden />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}
