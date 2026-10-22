"use client";

import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

type SyncedTable = "tasks" | "expenses" | "budgets" | "daily_logs" | "task_templates";

// Query-key prefixes to refetch when a table changes on any device.
const INVALIDATIONS: Record<SyncedTable, QueryKey[]> = {
  tasks: [["tasks"], ["streaks"], ["daily-logs"]],
  expenses: [["expenses"], ["streaks"], ["daily-logs"]],
  budgets: [["budget"]],
  daily_logs: [["streaks"], ["daily-logs"]],
  task_templates: [["templates"]],
};

/**
 * Subscribes to Postgres changes (RLS-scoped to the signed-in user) and
 * invalidates the matching TanStack Query caches so edits on one device show
 * up on the others without a refresh. Mount once (see `DataSync`).
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const invalidate = (keys: QueryKey[]) =>
      keys.forEach((queryKey) => void queryClient.invalidateQueries({ queryKey }));

    let channel = supabase.channel("pulse-sync");
    for (const table of Object.keys(INVALIDATIONS) as SyncedTable[]) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => invalidate(INVALIDATIONS[table]),
      );
    }

    let hasSubscribed = false;
    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      // After a reconnect, refetch anything that may have changed while offline.
      if (hasSubscribed) invalidate(Object.values(INVALIDATIONS).flat());
      hasSubscribed = true;
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
