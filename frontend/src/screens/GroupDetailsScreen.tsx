import { useEffect } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface GroupDetailsScreenProps {
  tripId: string;
  onBack: () => void;
  onOpenDebts: () => void;
}

function GroupDetailsScreen({ tripId, onBack, onOpenDebts }: GroupDetailsScreenProps) {
  const expenses = useStore((state) => state.expenses);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const fetchExpenses = useStore((state) => state.fetchExpenses);

  useEffect(() => {
    void fetchExpenses(tripId);
  }, [tripId, fetchExpenses]);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onBack={onBack} title="Детали поездки" />
      <main className="space-y-4 p-4">
        <Card>
          <p className="text-sm text-slate-500">Всего потрачено в группе</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totalSpent} ₽</p>
          <div className="mt-4">
            <Button onClick={onOpenDebts} variant="secondary">
              Расчет долгов
            </Button>
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Последние расходы
          </h2>
          {loading ? <p className="text-sm text-slate-500">Загрузка...</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">{expense.description}</p>
                <p className="text-sm text-slate-700">{expense.amount} ₽</p>
              </div>
            </Card>
          ))}
          {!loading && expenses.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">Расходов пока нет</p>
            </Card>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default GroupDetailsScreen;
