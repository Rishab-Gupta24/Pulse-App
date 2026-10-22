"use client";

import { useCallback, useState } from "react";
import { Pencil, Repeat } from "lucide-react";
import WeekdayPicker from "@/components/shared/WeekdayPicker";
import AddTaskForm from "@/components/tasks/AddTaskForm";
import AllDoneCelebration from "@/components/tasks/AllDoneCelebration";
import TaskItem from "@/components/tasks/TaskItem";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import { useStreaks } from "@/hooks/useStreaks";
import { useTasks } from "@/hooks/useTasks";
import { useTaskTemplates } from "@/hooks/useTaskTemplates";
import type { Weekday } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import type { Task } from "@/types/database";

const sectionHeaderClass =
  "text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary";

/**
 * Today's tasks. View mode: tick tasks off (celebrates when the last one is done).
 * Edit mode: add, delete and set repeats; completion is locked.
 */
export default function TodayTasks() {
  const { tasks, isLoading, isError, addTask, toggleTask, deleteTask, setRepeat } = useTasks();
  const { byId: templates, stopRepeat } = useTaskTemplates();
  const { taskStreak } = useStreaks();
  const filter = useCategoryFilter((state) => state.filter);

  const [editing, setEditing] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDays, setBulkDays] = useState<Weekday[]>([0, 1, 2, 3, 4, 5, 6]);
  const [celebration, setCelebration] = useState<{ streak: number } | null>(null);
  const closeCelebration = useCallback(() => setCelebration(null), []);

  const visible = filter === "ALL" ? tasks : tasks.filter((t) => t.category === filter);
  const completed = tasks.filter((t) => t.is_completed).length;
  const oneOffTasks = tasks.filter((t) => !t.template_id || !templates.has(t.template_id));

  function handleToggle(task: Task) {
    const finishesDay =
      !task.is_completed && tasks.every((t) => t.id === task.id || t.is_completed);
    toggleTask(task);
    // While today is unfinished, taskStreak counts through yesterday, so +1.
    if (finishesDay) setCelebration({ streak: taskStreak + 1 });
  }

  function applyBulkRepeat() {
    oneOffTasks.forEach((task) => setRepeat(task, bulkDays));
    setBulkOpen(false);
  }

  let emptyMessage: string | null = null;
  if (isLoading) emptyMessage = "Loading tasks…";
  else if (isError) emptyMessage = "Couldn't load tasks. Check your connection.";
  else if (tasks.length === 0)
    emptyMessage = editing ? "No tasks yet. Add one above." : "No tasks yet. Tap Edit to add some.";
  else if (visible.length === 0) emptyMessage = "No tasks in this category.";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className={sectionHeaderClass}>Tasks</h2>
          {tasks.length > 0 && (
            <span className="text-xs font-medium tabular-nums text-secondary">
              {completed} of {tasks.length} done
            </span>
          )}
        </div>
        <button
          type="button"
          aria-pressed={editing}
          onClick={() => {
            setEditing((e) => !e);
            setBulkOpen(false);
          }}
          className={cn(
            "flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold",
            editing ? "bg-accent-fill text-white" : "bg-surface text-accent",
          )}
        >
          {!editing && <Pencil size={16} strokeWidth={1.75} aria-hidden />}
          {editing ? "Done Editing" : "Edit"}
        </button>
      </div>

      {editing && (
        <>
          <p className="text-[13px] text-secondary">
            Editing: add, delete or repeat tasks. Ticking tasks off is paused until you tap Done Editing.
          </p>
          <AddTaskForm onAdd={addTask} />
          {oneOffTasks.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl bg-surface p-3">
              <button
                type="button"
                aria-expanded={bulkOpen}
                onClick={() => setBulkOpen((o) => !o)}
                className="flex min-h-11 items-center gap-2 self-start rounded-full bg-subtle px-4 text-xs font-medium text-secondary"
              >
                <Repeat size={16} strokeWidth={1.75} aria-hidden />
                Repeat Today&apos;s Tasks…
              </button>
              {bulkOpen && (
                <>
                  <p className="text-[13px] text-secondary">
                    Copies {oneOffTasks.length} one-off {oneOffTasks.length === 1 ? "task" : "tasks"} to
                    the days you pick. Future days get them automatically.
                  </p>
                  <WeekdayPicker value={bulkDays} onChange={setBulkDays} />
                  <button
                    type="button"
                    disabled={bulkDays.length === 0}
                    onClick={applyBulkRepeat}
                    className="h-11 rounded-xl bg-accent-fill text-[15px] font-semibold text-white disabled:opacity-50"
                  >
                    Repeat {oneOffTasks.length} {oneOffTasks.length === 1 ? "Task" : "Tasks"}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {emptyMessage ? (
        <p className="rounded-xl bg-surface px-4 py-6 text-[15px] text-secondary">
          {emptyMessage}
        </p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-xl">
          {visible.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              template={task.template_id ? templates.get(task.template_id) : undefined}
              editing={editing}
              onToggle={handleToggle}
              onDelete={deleteTask}
              onSetRepeat={setRepeat}
              onStopRepeat={stopRepeat}
            />
          ))}
        </ul>
      )}

      <AllDoneCelebration
        open={celebration !== null}
        streak={celebration?.streak ?? 0}
        onClose={closeCelebration}
      />
    </section>
  );
}
