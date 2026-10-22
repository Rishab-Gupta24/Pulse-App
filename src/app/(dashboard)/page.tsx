import StreakHeader from "@/components/layout/StreakHeader";
import CategoryFilter from "@/components/shared/CategoryFilter";

// Task list and budget snapshot arrive in Phases 4–5.
export default function TodayPage() {
  return (
    <>
      <StreakHeader title="Today" />
      <CategoryFilter />
      <section className="mt-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary">
          Tasks
        </h2>
        <p className="mt-2 rounded-xl bg-surface px-4 py-6 text-[15px] text-secondary">
          No tasks yet.
        </p>
      </section>
    </>
  );
}
