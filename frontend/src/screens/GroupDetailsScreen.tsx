import { useEffect, useMemo, useState } from "react";
import WebApp from "@twa-dev/sdk";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";
import { CATEGORY_LABELS, formatMoney } from "../utils/format";
import { getMemberName } from "../utils/members";

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
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const expenses = useStore((state) => state.expenses);
  const currentTripMembers = useStore((state) => state.currentTripMembers);
  const balances = useStore((state) => state.balances);
  const groups = useStore((state) => state.groups);
  const user = useStore((state) => state.user);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const fetchExpenses = useStore((state) => state.fetchExpenses);
  const fetchDebts = useStore((state) => state.fetchDebts);
  const fetchTripMembers = useStore((state) => state.fetchTripMembers);

  useEffect(() => {
    void fetchExpenses(tripId);
    void fetchDebts(tripId);
    void fetchTripMembers(tripId);
  }, [tripId, fetchExpenses, fetchDebts, fetchTripMembers]);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const trip = groups.find((group) => group.id === tripId);
  const currency = trip?.currency ?? "₽";
  const myBalance = user ? balances?.[String(user.id)] || 0 : 0;
  const filteredExpenses = useMemo(() => {
    if (!filterUser) {
      return expenses;
    }

    return expenses.filter((expense) => String(expense.payerId) === String(filterUser));
  }, [expenses, filterUser]);

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
      <header className="flex-none z-10 bg-white shadow-md">
        <Navbar onBack={onBack} title="Детали поездки" />
        <div className="px-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {trip?.name ?? "Поездка"}
              </p>
              <button
                className="mt-1 flex items-center text-xs text-slate-500 hover:text-slate-700"
                onClick={handleShare}
                type="button"
              >
                🔗 Поделиться поездкой
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">Мой баланс</p>
              <p
                className={`mt-1 text-4xl font-semibold ${
                  myBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {myBalance > 0 ? "+" : ""}
                {formatMoney(myBalance)} {currency}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Всего в поездке: {formatMoney(totalSpent)} {currency}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              <button
                className="rounded-xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-slate-100"
                onClick={onOpenStats}
                type="button"
              >
                <div className="text-lg">📊</div>
                <div className="mt-1 text-xs text-slate-600">Статистика</div>
              </button>
              <button
                className="rounded-xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-slate-100"
                onClick={onOpenDebts}
                type="button"
              >
                <div className="text-lg">⚖️</div>
                <div className="mt-1 text-xs text-slate-600">Баланс</div>
              </button>
              <button
                className="rounded-xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-slate-100"
                onClick={onOpenNotes}
                type="button"
              >
                <div className="text-lg">📝</div>
                <div className="mt-1 text-xs text-slate-600">Заметки</div>
              </button>
              <button
                className="rounded-xl bg-white px-2 py-3 text-center shadow-sm ring-1 ring-slate-100"
                onClick={onOpenRoulette}
                type="button"
              >
                <div className="text-lg">🎲</div>
                <div className="mt-1 text-xs text-slate-600">Рулетка</div>
              </button>
            </div>

            <button
              className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
              onClick={onOpenAddExpense}
              type="button"
            >
              Добавить транзакцию
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-4">
        <section className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition ${
                filterUser === null
                  ? "bg-slate-900 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
              onClick={() => setFilterUser(null)}
              type="button"
            >
              Все
            </button>
            {currentTripMembers.map((member) => (
              <button
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition ${
                  filterUser === String(member.id)
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
                key={member.id}
                onClick={() => setFilterUser(String(member.id))}
                type="button"
              >
                {member.name}
              </button>
            ))}
          </div>

          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Последние оплаты
          </h2>
          {loading ? <p className="text-sm text-slate-500">Загрузка...</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {filteredExpenses.map((expense) => (
            <button
              className="w-full text-left"
              key={expense.id}
              onClick={() => onOpenExpense(expense.id)}
              type="button"
            >
              <Card className="rounded-2xl transition-colors hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {expense.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {CATEGORY_LABELS[expense.category] ?? expense.category} ·{" "}
                      {getMemberName(currentTripMembers, expense.payerId)}
                    </p>
                  </div>
                  <p className="text-sm text-slate-700">
                    {formatMoney(expense.amount)} {currency}
                  </p>
                </div>
              </Card>
            </button>
          ))}
          {!loading && filteredExpenses.length === 0 ? (
            <Card className="rounded-2xl">
              <p className="text-sm text-slate-500">Расходов пока нет</p>
            </Card>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default GroupDetailsScreen;
