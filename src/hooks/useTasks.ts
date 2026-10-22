"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { isCategoryColor, type CategoryColor } from "@/lib/constants/categories";
import { fromLocalDateString, toLocalDateString, type Weekday } from "@/lib/utils/dates";
import { showToast } from "@/hooks/useToast";
import { templatesQueryKey } from "@/hooks/useTaskTemplates";
import type { Task } from "@/types/database";

export const TASK_TITLE_MAX_LENGTH = 140;
export const TASK_NOTE_MAX_LENGTH = 200;

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

/** Trimmed note, or null when empty. Over-long notes are rejected (undefined). */
export function normalizeTaskNote(note: string): string | null | undefined {
  const trimmed = note.trim();
  if (!trimmed) return null;
  return trimmed.length > TASK_NOTE_MAX_LENGTH ? undefined : trimmed;
}

export interface NewTask {
  title: string;
  note: string;
  category: CategoryColor;
  /** Empty = one-off task for this date. */
  weekdays: Weekday[];
}

/**
 * Tasks for one local calendar day (default: today) with optimistic add / toggle /
 * delete. Loading today also creates today's instances of repeating tasks.
 * Failed mutations roll back only the affected row and show a toast.
 */
export function useTasks(date: string = toLocalDateString()) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const queryKey = tasksQueryKey(date);
  const isToday = date === toLocalDateString();

  const setTasks = (update: (tasks: TaskList) => TaskList) =>
    queryClient.setQueryData<TaskList>(queryKey, (tasks = []) => update(tasks));

  // Streaks change too: triggers refresh `daily_logs` on every task write.
  const settle = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["streaks"] }),
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] }),
    ]);

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<TaskList> => {
      if (isToday) {
        // Idempotent; a failure here should not hide the tasks that already exist.
        await supabase.rpc("materialize_tasks", { p_date: date });
      }
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
      note: task.note,
      category: task.category,
      is_completed: task.is_completed,
      task_date: task.task_date,
      template_id: task.template_id,
    });
    if (error) throw error;
  };

  const addTask = useMutation({
    mutationFn: async ({ task, weekdays }: { task: Task; weekdays: Weekday[] }) => {
      if (weekdays.length === 0) return insertTask(task);
      const { error } = await supabase.rpc("create_repeating_task", {
        p_template_id: task.template_id ?? crypto.randomUUID(),
        p_task_id: task.id,
        p_title: task.title,
        p_note: task.note,
        p_category: task.category,
        p_weekdays: weekdays,
        p_today: date,
      });
      if (error) throw error;
    },
    onMutate: async ({ task, weekdays }) => {
      await queryClient.cancelQueries({ queryKey });
      // A repeating task only gets an instance today if today is one of its days.
      const dayOfWeek = fromLocalDateString(date).getDay() as Weekday;
      if (weekdays.length === 0 || weekdays.includes(dayOfWeek)) {
        setTasks((tasks) => [...tasks, task]);
      }
    },
    onSuccess: (_data, { weekdays }) => {
      if (weekdays.length > 0) {
        void queryClient.invalidateQueries({ queryKey: templatesQueryKey });
      }
    },
    onError: (_error, { task }) => {
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
      showToast(task.template_id ? "Removed for this day." : "Task deleted.", {
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

  /** Makes a task repeat on `weekdays`, or changes the days of an existing repeat. */
  const setRepeat = useMutation({
    mutationFn: async ({ task, weekdays, templateId }: { task: Task; weekdays: Weekday[]; templateId: string }) => {
      const { error } = await supabase.rpc("make_task_repeating", {
        p_task_id: task.id,
        p_template_id: templateId,
        p_weekdays: weekdays,
      });
      if (error) throw error;
    },
    onMutate: async ({ task, templateId }) => {
      await queryClient.cancelQueries({ queryKey });
      setTasks((tasks) =>
        tasks.map((t) => (t.id === task.id ? { ...t, template_id: t.template_id ?? templateId } : t)),
      );
    },
    onError: (_error, { task }) => {
      setTasks((tasks) =>
        tasks.map((t) => (t.id === task.id ? { ...t, template_id: task.template_id } : t)),
      );
      showToast("Couldn't update repeat. Try again.");
    },
    onSettled: () =>
      Promise.all([settle(), queryClient.invalidateQueries({ queryKey: templatesQueryKey })]),
  });

  return {
    date,
    isToday,
    tasks: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    /** Returns false when the input is invalid (nothing is sent). */
    addTask: ({ title, note, category, weekdays }: NewTask): boolean => {
      const normalizedTitle = normalizeTaskTitle(title);
      const normalizedNote = normalizeTaskNote(note);
      if (!normalizedTitle || normalizedNote === undefined || !isCategoryColor(category)) {
        return false;
      }
      addTask.mutate({
        task: {
          id: crypto.randomUUID(),
          user_id: "", // Filled by the DB default (auth.uid()); not used in the UI.
          title: normalizedTitle,
          note: normalizedNote,
          category,
          is_completed: false,
          task_date: date,
          template_id: weekdays.length > 0 ? crypto.randomUUID() : null,
          created_at: new Date().toISOString(),
        },
        weekdays,
      });
      return true;
    },
    toggleTask: (task: Task) =>
      toggleTask.mutate({ id: task.id, isCompleted: !task.is_completed }),
    deleteTask: (task: Task) => deleteTask.mutate(task),
    setRepeat: (task: Task, weekdays: Weekday[]) =>
      setRepeat.mutate({ task, weekdays, templateId: task.template_id ?? crypto.randomUUID() }),
  };
}
