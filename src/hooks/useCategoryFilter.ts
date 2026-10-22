import { create } from "zustand";
import type { CategoryColor } from "@/lib/constants/categories";

export type CategoryFilterValue = CategoryColor | "ALL";

interface CategoryFilterState {
  filter: CategoryFilterValue;
  setFilter: (filter: CategoryFilterValue) => void;
}

// Local UI state only; never persisted to Supabase.
export const useCategoryFilter = create<CategoryFilterState>((set) => ({
  filter: "ALL",
  setFilter: (filter) => set({ filter }),
}));
