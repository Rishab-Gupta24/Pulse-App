"use client";

import CategoryFilter from "@/components/shared/CategoryFilter";
import AddTaskForm from "@/components/tasks/AddTaskForm";
import TaskItem from "@/components/tasks/TaskItem";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import { useTasks } from "@/hooks/useTasks";

const sectionHeaderClass =
  "text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary";

export default function TodayTasks() {
  const { tasks, isLoading, isError, addTask, toggleTask, deleteTask } = useTasks();
  const filter = useCategoryFilter((state) => state.filter);

  const visible = filter === "ALL" ? tasks : tasks.filter((t) => t.category === filter);
  const completed = tasks.filter((t) => t.is_completed).length;

  let emptyMessage: string | null = null;
  if (isLoading) emptyMessage = "Loading tasks…";
  else if (isError) emptyMessage = "Couldn't load tasks. Check your connection.";
  else if (tasks.length === 0) emptyMessage = "No tasks yet. Add one above.";
  else if (visible.length === 0) emptyMessage = "No tasks in this category.";

  return (
    <section className="flex flex-col gap-4">
      <AddTaskForm onAdd={addTask} />
      <CategoryFilter />

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className={sectionHeaderClass}>Tasks</h2>
          {tasks.length > 0 && (
            <span className="text-xs font-medium tabular-nums text-secondary">
              {completed} of {tasks.length} done
            </span>
          )}
        </div>

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
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
