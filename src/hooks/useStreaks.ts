export interface StreakCounts {
  taskStreak: number;
  budgetStreak: number;
}

// Placeholder until Phase 6 computes streaks from `daily_logs`.
export function useStreaks(): StreakCounts {
  return { taskStreak: 0, budgetStreak: 0 };
}
