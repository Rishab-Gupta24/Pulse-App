"use client";

import { useState, type FormEvent } from "react";
import CategoryPicker from "@/components/shared/CategoryPicker";
import type { CategoryColor } from "@/lib/constants/categories";
import { TASK_TITLE_MAX_LENGTH } from "@/hooks/useTasks";

/** Quick inline task creation: title + category + "Add Task". */
export default function AddTaskForm({
  onAdd,
}: {
  onAdd: (title: string, category: CategoryColor) => boolean;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryColor>("BLUE");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onAdd(title, category)) setTitle("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl bg-surface p-3"
    >
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
          className="h-11 min-w-0 flex-1 rounded-xl bg-subtle px-4 text-[17px] text-primary outline-none placeholder:text-secondary md:text-[15px]"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="h-11 shrink-0 rounded-xl bg-blue px-4 text-[15px] font-semibold text-white disabled:opacity-50"
        >
          Add Task
        </button>
      </div>
      <CategoryPicker value={category} onChange={setCategory} />
    </form>
  );
}
