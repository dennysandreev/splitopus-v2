import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface ExpenseDetailsScreenProps {
  expenseId: string;
  onBack: () => void;
}

function ExpenseDetailsScreen({ expenseId, onBack }: ExpenseDetailsScreenProps) {
  const expense = useStore((state) =>
    state.expenses.find((item) => item.id === expenseId),
  );

  if (!expense) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar onBack={onBack} title="Детали расхода" />
        <main className="p-4">
          <Card>
            <p className="text-sm text-slate-500">Расход не найден</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onBack={onBack} title="Детали расхода" />
      <main className="space-y-4 p-4">
        <Card className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Сумма</p>
            <p className="text-2xl font-semibold text-slate-900">{expense.amount} ₽</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Категория</p>
              <p className="text-sm font-medium text-slate-900">{expense.category}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Кто платил</p>
              <p className="text-sm font-medium text-slate-900">
                {expense.payerName ?? expense.payerId}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Описание</p>
            <p className="text-sm text-slate-900">{expense.description}</p>
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            На кого поделено
          </h2>
          {expense.splitDetails && expense.splitDetails.length > 0 ? (
            expense.splitDetails.map((item, index) => (
              <Card key={`${item.userId ?? item.name}-${index}`}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-700">{item.amount} ₽</p>
                </div>
              </Card>
            ))
          ) : expense.split && Object.keys(expense.split).length > 0 ? (
            Object.entries(expense.split).map(([userId, amount]) => (
              <Card key={userId}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-900">{userId}</p>
                  <p className="text-sm text-slate-700">{amount} ₽</p>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-sm text-slate-500">Данные сплита недоступны</p>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}

export default ExpenseDetailsScreen;
