"use client";

import { CATEGORY_LIST, type CategoryColor } from "@/lib/constants/categories";
import { cn } from "@/lib/utils/cn";

/** Single-choice category selector shared by the task and expense forms. */
export default function CategoryPicker({
  value,
  onChange,
  className,
}: {
  value: CategoryColor;
  onChange: (category: CategoryColor) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Category"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {CATEGORY_LIST.map((category) => {
        const selected = value === category.key;
        return (
          <button
            key={category.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(category.key)}
            className={cn(
              "flex min-h-11 items-center gap-1.5 rounded-full px-4 text-xs font-medium",
              selected
                ? cn(category.softBgClass, "text-primary")
                : "bg-subtle text-secondary",
            )}
            style={
              selected ? { boxShadow: `inset 0 0 0 1px ${category.cssVar}` } : undefined
            }
          >
            <span className={cn("size-2 rounded-full", category.dotClass)} aria-hidden />
            {category.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
