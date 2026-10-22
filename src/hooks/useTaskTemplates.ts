"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/hooks/useToast";
import type { TaskTemplate } from "@/types/database";

export const templatesQueryKey = ["templates"] as const;

/** The user's active repeating tasks (a small, bounded set). */
export function useTaskTemplates() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: templatesQueryKey,
    queryFn: async (): Promise<TaskTemplate[]> => {
      const { data, error } = await supabase
        .from("task_templates")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  /** Stops future repeats; tasks already created stay as they are. */
  const stopRepeat = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("task_templates")
        .update({ active: false })
        .eq("id", templateId);
      if (error) throw error;
    },
    onMutate: async (templateId) => {
      await queryClient.cancelQueries({ queryKey: templatesQueryKey });
      const previous = queryClient.getQueryData<TaskTemplate[]>(templatesQueryKey);
      queryClient.setQueryData<TaskTemplate[]>(templatesQueryKey, (templates = []) =>
        templates.filter((t) => t.id !== templateId),
      );
      return { previous };
    },
    onSuccess: () => showToast("Stopped repeating."),
    onError: (_error, _templateId, context) => {
      queryClient.setQueryData(templatesQueryKey, context?.previous);
      showToast("Couldn't stop repeating. Try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: templatesQueryKey }),
  });

  const templates = query.data ?? [];

  return {
    templates,
    byId: new Map(templates.map((t) => [t.id, t])),
    isLoading: query.isPending,
    stopRepeat: (templateId: string) => stopRepeat.mutate(templateId),
  };
}
