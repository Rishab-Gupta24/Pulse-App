import StreakHeader from "@/components/layout/StreakHeader";
import CategoryFilter from "@/components/shared/CategoryFilter";
import TodayBudget from "@/components/expenses/TodayBudget";
import TodayTasks from "@/components/tasks/TodayTasks";

// Laptop: tasks left, budget right (design.md §5). iPhone: stacked.
export default function TodayPage() {
  return (
    <>
      <StreakHeader title="Today" />
      <CategoryFilter className="mb-6" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <TodayTasks />
        <TodayBudget />
      </div>
    </>
  );
}
