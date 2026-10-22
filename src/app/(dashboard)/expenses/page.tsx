import StreakHeader from "@/components/layout/StreakHeader";
import CategoryFilter from "@/components/shared/CategoryFilter";

// Budget meters and expense list arrive in Phase 5.
export default function ExpensesPage() {
  return (
    <>
      <StreakHeader title="Expenses" />
      <CategoryFilter />
    </>
  );
}
