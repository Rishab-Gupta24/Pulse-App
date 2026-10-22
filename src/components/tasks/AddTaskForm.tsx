"use client";

import { useState, type FormEvent } from "react";
import { Repeat } from "lucide-react";
import CategoryPicker from "@/components/shared/CategoryPicker";
import WeekdayPicker from "@/components/shared/WeekdayPicker";
import type { CategoryColor } from "@/lib/constants/categories";
import {
  TASK_NOTE_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  type NewTask,
} from "@/hooks/useTasks";
import { formatWeekdays, type Weekday } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

const inputClass =
  "h-11 min-w-0 rounded-xl bg-subtle px-4 text-[17px] text-primary outline-none placeholder:text-secondary md:text-[15px]";

/** Task creation: title, optional note ("1 hr workout"), category, optional repeat days. */
export default function AddTaskForm({
  onAdd,
  submitLabel = "Add Task",
}: {
  onAdd: (task: NewTask) => boolean;
  submitLabel?: string;
}) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<CategoryColor>("BLUE");
  const [repeating, setRepeating] = useState(false);
  const [weekdays, setWeekdays] = useState<Weekday[]>([]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const days = repeating ? weekdays : [];
    if (onAdd({ title, note, category, weekdays: days })) {
      setTitle("");
      setNote("");
    }
  }

  const repeatInvalid = repeating && weekdays.length === 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-surface p-3">
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="new-task-title">
          Task title
        </label>
        <input
          id="new-task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={TASK_TITLE_MAX_LENGTH}
          placeholder="New task"
          autoComplete="off"
          className={cn(inputClass, "flex-1")}
        />
        <button
          type="submit"
          disabled={!title.trim() || repeatInvalid}
          className="h-11 shrink-0 rounded-xl bg-accent-fill px-4 text-[15px] font-semibold text-white disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>

      <label className="sr-only" htmlFor="new-task-note">
        Note
      </label>
      <input
        id="new-task-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={TASK_NOTE_MAX_LENGTH}
        placeholder="Note, e.g. 1 hr workout"
        autoComplete="off"
        className={inputClass}
      />

      <CategoryPicker value={category} onChange={setCategory} />

      <button
        type="button"
        aria-pressed={repeating}
        onClick={() => setRepeating((r) => !r)}
        className={cn(
          "flex min-h-11 items-center gap-2 self-start rounded-full px-4 text-xs font-medium",
          repeating ? "bg-accent-fill text-white" : "bg-subtle text-secondary",
        )}
      >
        <Repeat size={16} strokeWidth={1.75} aria-hidden />
        {repeating && weekdays.length > 0 ? `Repeats ${formatWeekdays(weekdays)}` : "Repeat"}
      </button>
      {repeating && <WeekdayPicker value={weekdays} onChange={setWeekdays} />}
    </form>
  );
}
