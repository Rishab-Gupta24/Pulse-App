"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { isCategoryColor, type CategoryColor } from "@/lib/constants/categories";
import { toLocalDateString } from "@/lib/utils/dates";
import { showToast } from "@/hooks/useToast";
import type { Task } from "@/types/database";

export const TASK_TITLE_MAX_LENGTH = 140;

export const tasksQueryKey = (date: string) => ["tasks", date] as const;

type TaskList = Task[];

const byCreatedAt = (a: Task, b: Task) =>
  (a.created_at ?? "").localeCompare(b.created_at ?? "");

/** Returns a trimmed, valid title or null (mirrors the DB check constraint). */
export function normalizeTaskTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed || trimmed.length > TASK_TITLE_MAX_LENGTH) return null;
  return trimmed;
}

/**
 * Today's tasks (local calendar day) with optimistic add / toggle / delete.
 * Failed mutations roll back only the affected row and show a toast.
 */
export function useTasks() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const date = toLocalDateString();
  const queryKey = tasksQueryKey(date);

  const setTasks = (update: (tasks: TaskList) => TaskList) =>
    queryClient.setQueryData<TaskList>(queryKey, (tasks = []) => update(tasks));

  // Streaks change too: triggers refresh `daily_logs` on every task write.
  const settle = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ["streaks"] }),
    ]);

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<TaskList> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("task_date", date)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Insert with a client-generated id so the optimistic row and the stored row match.
  const insertTask = async (task: Task) => {
    const { error } = await supabase.from("tasks").insert({
      id: task.id,
      title: task.title,
      category: task.category,
      is_completed: task.is_completed,
      task_date: task.task_date,
    });
    if (error) throw error;
  };

  const addTask = useMutation({
    mutationFn: insertTask,
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey });
      setTasks((tasks) => [...tasks, task]);
    },
    onError: (_error, task) => {
      setTasks((tasks) => tasks.filter((t) => t.id !== task.id));
      showToast("Couldn't add task. Try again.");
    },
    onSettled: settle,
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ is_completed: isCompleted })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey });
      setTasks((tasks) =>
        tasks.map((t) => (t.id === id ? { ...t, is_completed: isCompleted } : t)),
      );
    },
    onError: (_error, { id, isCompleted }) => {
      setTasks((tasks) =>
        tasks.map((t) => (t.id === id ? { ...t, is_completed: !isCompleted } : t)),
      );
      showToast("Couldn't update task. Try again.");
    },
    onSettled: settle,
  });

  const restoreTask = useMutation({
    mutationFn: insertTask,
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey });
      setTasks((tasks) => [...tasks, task].sort(byCreatedAt));
    },
    onError: (_error, task) => {
      setTasks((tasks) => tasks.filter((t) => t.id !== task.id));
      showToast("Couldn't restore task.");
    },
    onSettled: settle,
  });

  const deleteTask = useMutation({
    mutationFn: async (task: Task) => {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) throw error;
    },
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey });
      setTasks((tasks) => tasks.filter((t) => t.id !== task.id));
    },
    onSuccess: (_data, task) => {
      showToast("Task deleted.", {
        label: "Undo",
        onClick: () => restoreTask.mutate(task),
      });
    },
    onError: (_error, task) => {
      setTasks((tasks) => [...tasks, task].sort(byCreatedAt));
      showToast("Couldn't delete task. Try again.");
    },
    onSettled: settle,
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    /** Returns false when the input is invalid (nothing is sent). */
    addTask: (title: string, category: CategoryColor): boolean => {
      const normalized = normalizeTaskTitle(title);
      if (!normalized || !isCategoryColor(category)) return false;
      addTask.mutate({
        id: crypto.randomUUID(),
        user_id: "", // Filled by the DB default (auth.uid()); not used in the UI.
        title: normalized,
        category,
        is_completed: false,
        task_date: date,
        created_at: new Date().toISOString(),
      });
      return true;
    },
    toggleTask: (task: Task) =>
      toggleTask.mutate({ id: task.id, isCompleted: !task.is_completed }),
    deleteTask: (task: Task) => deleteTask.mutate(task),
  };
}
