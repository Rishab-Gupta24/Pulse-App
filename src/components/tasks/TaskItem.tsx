"use client";

import { Check, Trash2 } from "lucide-react";
import CategoryBadge from "@/components/shared/CategoryBadge";
import { CATEGORIES } from "@/lib/constants/categories";
import { cn } from "@/lib/utils/cn";
import type { Task } from "@/types/database";

/** Solid task row: 44px checkbox, title, category badge, delete button. */
export default function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const done = task.is_completed;
  const { dotClass } = CATEGORIES[task.category];

  return (
    <li className="flex items-center gap-1 bg-surface py-1 pl-1 pr-1">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Mark "${task.title}" ${done ? "incomplete" : "complete"}`}
        onClick={() => onToggle(task)}
        className="flex size-11 shrink-0 items-center justify-center"
      >
        <span
          className={cn(
            "flex size-[22px] items-center justify-center rounded-full border-[1.5px]",
            done ? cn(dotClass, "border-transparent text-white") : "border-hairline",
          )}
        >
          {done && <Check size={14} strokeWidth={3} aria-hidden />}
        </span>
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-1.5">
        <span
          className={cn(
            "break-words text-[17px] leading-[1.4] md:text-[15px]",
            done && "text-secondary line-through",
          )}
        >
          {task.title}
        </span>
        <CategoryBadge category={task.category} />
      </div>

      <button
        type="button"
        aria-label={`Delete "${task.title}"`}
        onClick={() => onDelete(task)}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-secondary hover:text-danger"
      >
        <Trash2 size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </li>
  );
}
