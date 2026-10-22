"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Pencil, Repeat, Trash2, X } from "lucide-react";
import CategoryPicker from "@/components/shared/CategoryPicker";
import type { CategoryColor } from "@/lib/constants/categories";
import {
  TASK_NOTE_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  type TaskFields,
} from "@/hooks/useTasks";
import { formatWeekdays } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import type { Task, TaskTemplate } from "@/types/database";

const inputClass =
  "h-11 w-full rounded-xl bg-subtle px-4 text-[17px] text-primary outline-none placeholder:text-secondary md:text-[15px]";
const rowButtonClass =
  "flex min-h-12 w-full items-center gap-3 rounded-xl bg-surface px-4 text-left text-[17px] font-medium md:text-[15px]";

export interface TaskActionTarget {
  task: Task;
  /** Active repeat this task belongs to, if any. */
  template?: TaskTemplate;
  /** False for a projected repeat on a future day (no stored row yet). */
  stored: boolean;
}

/**
 * Edit / delete sheet for a calendar task. Bottom sheet on iPhone, centered dialog
 * on laptop. Repeating tasks offer "this day" vs "all days" for both actions.
 */
export default function TaskActionSheet({
  target,
  dayLabel,
  onClose,
  onEditDay,
  onEditAll,
  onDeleteDay,
  onDeleteAll,
}: {
  target: TaskActionTarget;
  dayLabel: string;
  onClose: () => void;
  onEditDay: (fields: TaskFields) => boolean;
  onEditAll: (fields: TaskFields) => boolean;
  onDeleteDay: () => void;
  onDeleteAll: () => void;
}) {
  const { task, template } = target;
  const repeating = Boolean(template);
  const [view, setView] = useState<"menu" | "edit" | "confirm-delete-all">("menu");
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note ?? "");
  const [category, setCategory] = useState<CategoryColor>(task.category);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape closes; focus moves into the sheet when it opens or changes view.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("input, button:not([data-close])")?.focus();
  }, [view]);

  function save(scope: "day" | "all") {
    const fields: TaskFields = { title, note: note.trim() ? note : null, category };
    const ok = scope === "all" ? onEditAll(fields) : onEditDay(fields);
    if (!ok) {
      setError("Add a title (up to 140 characters).");
      return;
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 md:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-sheet-title"
        onClick={(event) => event.stopPropagation()}
        className="liquid-glass-chrome animate-pop-in flex w-full max-w-md flex-col gap-3 rounded-t-3xl p-4 pb-[calc(16px+env(safe-area-inset-bottom))] md:rounded-3xl md:pb-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary">{dayLabel}</p>
            <h2 id="task-sheet-title" className="break-words text-[20px] font-bold tracking-[-0.01em]">
              {task.title}
            </h2>
            {template && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-secondary">
                <Repeat size={13} strokeWidth={1.75} aria-hidden />
                Repeats {formatWeekdays(template.weekdays)}
              </p>
            )}
          </div>
          <button
            type="button"
            data-close
            aria-label="Close"
            onClick={onClose}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-secondary"
          >
            <X size={20} strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        {view === "menu" && (
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => setView("edit")} className={rowButtonClass}>
              <Pencil size={18} strokeWidth={1.75} className="text-accent" aria-hidden />
              Edit Task
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteDay();
                onClose();
              }}
              className={cn(rowButtonClass, "text-danger")}
            >
              <Trash2 size={18} strokeWidth={1.75} aria-hidden />
              {repeating ? "Delete for This Day" : "Delete Task"}
            </button>
            {repeating && (
              <button
                type="button"
                onClick={() => setView("confirm-delete-all")}
                className={cn(rowButtonClass, "text-danger")}
              >
                <Repeat size={18} strokeWidth={1.75} aria-hidden />
                Delete All Repeats…
              </button>
            )}
          </div>
        )}

        {view === "confirm-delete-all" && (
          <div className="flex flex-col gap-3">
            <p className="rounded-xl bg-surface px-4 py-3 text-[15px]">
              Stops “{task.title}” repeating and removes it from today onward. Days you already
              finished keep their history.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setView("menu")}
                className="h-11 rounded-xl bg-surface text-[15px] font-semibold"
              >
                Keep It
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAll();
                  onClose();
                }}
                className="h-11 rounded-xl bg-surface text-[15px] font-semibold text-danger"
              >
                Delete All Repeats
              </button>
            </div>
          </div>
        )}

        {view === "edit" && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              save("day");
            }}
            noValidate
          >
            <label className="sr-only" htmlFor="sheet-task-title">
              Task title
            </label>
            <input
              id="sheet-task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={TASK_TITLE_MAX_LENGTH}
              placeholder="Task title"
              autoComplete="off"
              className={inputClass}
            />
            <label className="sr-only" htmlFor="sheet-task-note">
              Note
            </label>
            <input
              id="sheet-task-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={TASK_NOTE_MAX_LENGTH}
              placeholder="Note, e.g. 1 hr workout"
              autoComplete="off"
              className={inputClass}
            />
            <CategoryPicker value={category} onChange={setCategory} />
            {error && (
              <p role="alert" className="text-[13px] text-danger">
                {error}
              </p>
            )}
            {repeating ? (
              <div className="grid grid-cols-2 gap-2">
                <button type="submit" className="h-11 rounded-xl bg-surface text-[15px] font-semibold text-accent">
                  Save for This Day
                </button>
                <button
                  type="button"
                  onClick={() => save("all")}
                  className="h-11 rounded-xl bg-accent-fill text-[15px] font-semibold text-white"
                >
                  Save for All Days
                </button>
              </div>
            ) : (
              <button type="submit" className="h-11 rounded-xl bg-accent-fill text-[15px] font-semibold text-white">
                Save Task
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
