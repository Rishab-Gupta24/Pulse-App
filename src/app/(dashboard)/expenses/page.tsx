import StreakHeader from "@/components/layout/StreakHeader";
import ExpensesView from "@/components/expenses/ExpensesView";

export default function ExpensesPage() {
  return (
    <>
      <StreakHeader title="Expenses" />
      <ExpensesView />
    </>
  );
}
