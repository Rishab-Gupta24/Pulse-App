import StreakHeader from "@/components/layout/StreakHeader";
import BudgetSettingsForm from "@/components/settings/BudgetSettingsForm";
import SignOutButton from "@/components/settings/SignOutButton";

const sectionHeaderClass =
  "text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary";

export default function SettingsPage() {
  return (
    <>
      <StreakHeader title="Settings" />
      <div className="flex max-w-md flex-col gap-8">
        <section className="flex flex-col gap-2">
          <h2 className={sectionHeaderClass}>Budgets</h2>
          <BudgetSettingsForm />
        </section>
        <section className="flex flex-col gap-2">
          <h2 className={sectionHeaderClass}>Account</h2>
          <SignOutButton />
        </section>
      </div>
    </>
  );
}
