import { CATEGORIES, type CategoryColor } from "@/lib/constants/categories";
import { cn } from "@/lib/utils/cn";

/** Solid color dot always paired with its text label (Rules.md §2.3). */
export default function CategoryBadge({
  category,
  className,
}: {
  category: CategoryColor;
  className?: string;
}) {
  const { dotClass, shortLabel } = CATEGORIES[category];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-secondary",
        className,
      )}
    >
      <span className={cn("size-2 shrink-0 rounded-full", dotClass)} aria-hidden />
      {shortLabel}
    </span>
  );
}
