"use client";

import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useTodayLogSnapshot } from "@/hooks/useStreaks";

/** Mounts the app-wide sync side effects exactly once per signed-in session. */
export default function DataSync() {
  useRealtimeSync();
  useTodayLogSnapshot();
  return null;
}
