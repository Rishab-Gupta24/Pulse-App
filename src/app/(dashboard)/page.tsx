import StreakHeader from "@/components/layout/StreakHeader";
import TodayTasks from "@/components/tasks/TodayTasks";

// Budget snapshot column arrives in Phase 5.
export default function TodayPage() {
  return (
    <>
      <StreakHeader title="Today" />
      <TodayTasks />
    </>
  );
}
