"use client";

import { useState } from "react";
import { Check, Pencil, Repeat, Trash2 } from "lucide-react";
import CategoryBadge from "@/components/shared/CategoryBadge";
import WeekdayPicker from "@/components/shared/WeekdayPicker";
import { useLongPress } from "@/hooks/useLongPress";
import { CATEGORIES } from "@/lib/constants/categories";
import { formatWeekdays, type Weekday } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import type { Task, TaskTemplate } from "@/types/database";

/**
 * Solid task row. View mode: 44px checkbox toggles completion.
 * Edit mode: completion is locked; delete and repeat controls appear.
 */
export default function TaskItem({
  task,
  template,
  editing = false,
  onToggle,
  onDelete,
  onSetRepeat,
  onStopRepeat,
  onOpenActions,
}: {
  task: Task;
  /** Active template when this task repeats. */
  template?: TaskTemplate;
  editing?: boolean;
  onToggle?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onSetRepeat?: (task: Task, weekdays: Weekday[]) => void;
  onStopRepeat?: (templateId: string) => void;
  /**
   * Calendar: opens the task's action sheet. Always reachable by long-press /
   * right-click; with `editing`, an explicit pencil button is shown too.
   */
  onOpenActions?: (task: Task) => void;
}) {
  const done = task.is_completed;
  const { dotClass } = CATEGORIES[task.category];
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [days, setDays] = useState<Weekday[]>(() => (template?.weekdays ?? []) as Weekday[]);
  const canToggle = !editing && Boolean(onToggle);
  const longPress = useLongPress(onOpenActions ? () => onOpenActions(task) : null);

  return (
    <li className="bg-surface">
      <div
        {...longPress}
        className={cn(
          "flex items-center gap-1 py-1 pl-1 pr-1",
          // Long-press must not start text selection or the iOS callout menu.
          onOpenActions && "select-none [-webkit-touch-callout:none]",
        )}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-disabled={!canToggle}
          aria-label={
            canToggle
              ? `Mark "${task.title}" ${done ? "incomplete" : "complete"}`
              : `"${task.title}" is ${done ? "done" : "not done"}`
          }
          onClick={() => canToggle && onToggle?.(task)}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center",
            !canToggle && "cursor-default opacity-40",
          )}
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
          {task.note && (
            <span className="break-words text-[13px] leading-[1.4] text-secondary">{task.note}</span>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <CategoryBadge category={task.category} />
            {template && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary">
                <Repeat size={12} strokeWidth={1.75} aria-hidden />
                {formatWeekdays(template.weekdays)}
              </span>
            )}
          </div>
        </div>

        {editing && onOpenActions && (
          <button
            type="button"
            aria-label={`Edit or delete "${task.title}"`}
            aria-haspopup="dialog"
            onClick={() => onOpenActions(task)}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-accent hover:bg-subtle"
          >
            <Pencil size={18} strokeWidth={1.75} aria-hidden />
          </button>
        )}
        {editing && onSetRepeat && (
          <button
            type="button"
            aria-label={`Repeat "${task.title}"`}
            aria-expanded={repeatOpen}
            onClick={() => setRepeatOpen((open) => !open)}
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              repeatOpen || template ? "text-accent" : "text-secondary",
            )}
          >
            <Repeat size={18} strokeWidth={1.75} aria-hidden />
          </button>
        )}
        {editing && onDelete && (
          <button
            type="button"
            aria-label={template ? `Remove "${task.title}" for this day` : `Delete "${task.title}"`}
            onClick={() => onDelete(task)}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-secondary hover:text-danger"
          >
            <Trash2 size={18} strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>

      {editing && repeatOpen && onSetRepeat && (
        <div className="flex flex-col gap-3 px-3 pb-3">
          <WeekdayPicker value={days} onChange={setDays} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={days.length === 0}
              onClick={() => {
                onSetRepeat(task, days);
                setRepeatOpen(false);
              }}
              className="h-11 rounded-xl bg-accent-fill px-4 text-[15px] font-semibold text-white disabled:opacity-50"
            >
              Save Repeat
            </button>
            {template && onStopRepeat && (
              <button
                type="button"
                onClick={() => {
                  onStopRepeat(template.id);
                  setRepeatOpen(false);
                }}
                className="h-11 rounded-xl bg-subtle px-4 text-[15px] font-semibold text-danger"
              >
                Stop Repeating
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
