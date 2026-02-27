import { useEffect } from "react";
import WebApp from "@twa-dev/sdk";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";
import { CATEGORY_LABELS, formatMoney } from "../utils/format";

interface GroupDetailsScreenProps {
  tripId: string;
  onBack: () => void;
  onOpenDebts: () => void;
  onOpenStats: () => void;
  onOpenNotes: () => void;
  onOpenRoulette: () => void;
  onOpenAddExpense: () => void;
  onOpenExpense: (expenseId: string) => void;
}

function GroupDetailsScreen({
  tripId,
  onBack,
  onOpenDebts,
  onOpenStats,
  onOpenNotes,
  onOpenRoulette,
  onOpenAddExpense,
  onOpenExpense,
}: GroupDetailsScreenProps) {
  const expenses = useStore((state) => state.expenses);
  const balances = useStore((state) => state.balances);
  const groups = useStore((state) => state.groups);
  const user = useStore((state) => state.user);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const fetchExpenses = useStore((state) => state.fetchExpenses);
  const fetchDebts = useStore((state) => state.fetchDebts);

  useEffect(() => {
    void fetchExpenses(tripId);
    void fetchDebts(tripId);
  }, [tripId, fetchExpenses, fetchDebts]);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const trip = groups.find((group) => group.id === tripId);
  const currency = trip?.currency ?? "₽";
  const myBalance = user ? balances?.[String(user.id)] || 0 : 0;

  useEffect(() => {
    console.log("Balances:", balances, "My ID:", user?.id);
  }, [balances, user]);

  const handleShare = () => {
    if (!trip?.code || !trip?.name) {
      return;
    }

    const botStartLink = `https://t.me/SplitopusBot?start=${trip.code}`;
    const shareText = encodeURIComponent(
      `Присоединяйся к поездке "${trip.name}" в Splitopus! 🌴\nКод: ${trip.code}\n👉 ${botStartLink}`,
    );
    const shareUrl = encodeURIComponent(botStartLink);
    WebApp.openTelegramLink(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50">
      <header className="flex-none z-10 bg-slate-50">
        <Navbar onBack={onBack} title="Детали поездки" />
        <div className="p-4 pt-0">
        <Card className="bg-slate-50">
          <p className="text-base font-semibold text-slate-900">{trip?.name ?? "Поездка"}</p>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Код поездки: {trip?.code ?? "—"}
            </p>
            <Button onClick={handleShare} variant="secondary">
              Поделиться
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Всего</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {formatMoney(totalSpent)} {currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Мой баланс</p>
              <p
                className={`mt-1 text-2xl font-semibold ${
                  myBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {myBalance > 0 ? "+" : ""}
                {formatMoney(myBalance)} {currency}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={onOpenDebts} variant="secondary">
              Баланс поездки
            </Button>
            <Button onClick={onOpenStats} variant="secondary">
              Статистика 📊
            </Button>
            <Button onClick={onOpenNotes} variant="secondary">
              Заметки 📝
            </Button>
            <Button onClick={onOpenRoulette} variant="secondary">
              Рулетка 🎲
            </Button>
          </div>
        </Card>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 pt-0">

        <section className="space-y-3 pb-20">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Последние оплаты
          </h2>
          {loading ? <p className="text-sm text-slate-500">Загрузка...</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {expenses.map((expense) => (
            <button
              className="w-full text-left"
              key={expense.id}
              onClick={() => onOpenExpense(expense.id)}
              type="button"
            >
              <Card className="transition-colors hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {expense.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {CATEGORY_LABELS[expense.category] ?? expense.category}
                    </p>
                  </div>
                  <p className="text-sm text-slate-700">
                    {formatMoney(expense.amount)} {currency}
                  </p>
                </div>
              </Card>
            </button>
          ))}
          {!loading && expenses.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">Расходов пока нет</p>
            </Card>
          ) : null}
        </section>
      </main>

      <button
        aria-label="Добавить расход"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-3xl leading-none text-white shadow-lg hover:bg-slate-800"
        onClick={onOpenAddExpense}
        type="button"
      >
        +
      </button>
    </div>
  );
}

export default GroupDetailsScreen;
