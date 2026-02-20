import { useEffect } from "react";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface GroupDetailsScreenProps {
  tripId: string;
  onBack: () => void;
}

function GroupDetailsScreen({ tripId, onBack }: GroupDetailsScreenProps) {
  const expenses = useStore((state) => state.expenses);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const fetchExpenses = useStore((state) => state.fetchExpenses);

  useEffect(() => {
    fetchExpenses(tripId);
  }, [tripId, fetchExpenses]);

  if (loading && expenses.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => fetchExpenses(tripId)} className="text-blue-500 underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onBack={onBack} title={`Поездка #${tripId.slice(0, 6)}`} />
      <main className="space-y-4 p-4 pb-20">
        <Card>
          <p className="text-sm text-slate-500">Всего потрачено</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totalSpent.toLocaleString()} ₽</p>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Последние расходы
          </h2>
          {expenses.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500 text-center py-4">Расходов пока нет 🍃</p>
            </Card>
          ) : (
            expenses.map((expense) => (
              <Card key={expense.id} className="flex justify-between items-center py-3">
                <div>
                    <p className="font-medium text-slate-900">{expense.description}</p>
                    <p className="text-xs text-slate-500">{new Date(Number(expense.createdAt) * 1000).toLocaleDateString()}</p>
                </div>
                <p className="font-semibold text-slate-700">-{expense.amount.toLocaleString()} ₽</p>
              </Card>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default GroupDetailsScreen;
