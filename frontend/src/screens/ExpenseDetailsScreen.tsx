import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";
import { CATEGORY_LABELS, formatMoney } from "../utils/format";
import { getMemberName } from "../utils/members";

interface ExpenseDetailsScreenProps {
  expenseId: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

function ExpenseDetailsScreen({ expenseId, onBack, onOpenSettings }: ExpenseDetailsScreenProps) {
  const currentTripMembers = useStore((state) => state.currentTripMembers);
  const currentTripId = useStore((state) => state.currentTripId);
  const trip = useStore((state) => state.groups.find((g) => g.id === currentTripId));
  const currency = trip?.currency ?? "THB";

  const expense = useStore((state) => state.expenses.find((item) => item.id === expenseId));

  if (!expense) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <Navbar onBack={onBack} onSettings={onOpenSettings} title="Детали оплаты" />
        </header>
        <main className="app-main">
          <Card>
            <p className="text-sm text-textMuted">Расход не найден</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar onBack={onBack} onSettings={onOpenSettings} title="Детали оплаты" />
      </header>
      <main className="app-main">
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-textMuted">Сумма</p>
              <p className="mt-1 text-3xl font-semibold text-textMain">
                {formatMoney(expense.amount)} {currency}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-textMuted">Категория</p>
                <p className="text-sm font-medium text-textMain">
                  {CATEGORY_LABELS[expense.category] ?? expense.category}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-textMuted">Кто платил</p>
                <p className="text-sm font-medium text-textMain">
                  {expense.payerName ?? getMemberName(currentTripMembers, expense.payerId)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-textMuted">Описание</p>
              <p className="text-sm text-textMain">{expense.description}</p>
            </div>
          </Card>

          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-textMuted">На кого поделено</h2>
            {expense.splitDetails && expense.splitDetails.length > 0
              ? expense.splitDetails.map((item, index) => (
                  <Card key={`${item.userId ?? item.name}-${index}`}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-textMain">
                        {getMemberName(currentTripMembers, item.userId ?? item.name)}
                      </p>
                      <p className="text-sm font-semibold text-textMain">
                        {formatMoney(item.amount)} {currency}
                      </p>
                    </div>
                  </Card>
                ))
              : expense.split && Object.keys(expense.split).length > 0
                ? Object.entries(expense.split).map(([userId, amount]) => (
                    <Card key={userId}>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-textMain">
                          {getMemberName(currentTripMembers, userId)}
                        </p>
                        <p className="text-sm font-semibold text-textMain">
                          {formatMoney(amount)} {currency}
                        </p>
                      </div>
                    </Card>
                  ))
                : (
                  <Card>
                    <p className="text-sm text-textMuted">Данные сплита недоступны</p>
                  </Card>
                )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default ExpenseDetailsScreen;
