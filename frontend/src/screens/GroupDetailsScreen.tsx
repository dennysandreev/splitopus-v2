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
      <div className="flex-none z-10 bg-white">
        <Navbar onBack={onBack} title="Детали поездки" />
        <div className="px-4 pb-4">
          <div className="bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-slate-900">
                  {trip?.name ?? "Поездка"}
                </p>
              </div>
              <div className="text-right">
                <button
                  className="mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-600 hover:bg-slate-200"
                  onClick={handleShare}
                  type="button"
                >
                  🔗
                </button>
                <p className="text-xs text-slate-500">Мой баланс</p>
                <p
                  className={`text-2xl font-semibold leading-tight ${
                    myBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {myBalance > 0 ? "+" : ""}
                  {formatMoney(myBalance)} {currency}
                </p>
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Всего в поездке: {formatMoney(totalSpent)} {currency}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-lg font-medium text-slate-700 active:bg-slate-100"
                onClick={onOpenStats}
                type="button"
              >
                📊 Статистика
              </button>
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-lg font-medium text-slate-700 active:bg-slate-100"
                onClick={onOpenDebts}
                type="button"
              >
                ⚖️ Баланс
              </button>
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-lg font-medium text-slate-700 active:bg-slate-100"
                onClick={onOpenNotes}
                type="button"
              >
                📝 Заметки
              </button>
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-lg font-medium text-slate-700 active:bg-slate-100"
                onClick={onOpenRoulette}
                type="button"
              >
                🎲 Рулетка
              </button>
            </div>

            <button
              className="mt-4 w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-[0.98]"
              onClick={onOpenAddExpense}
              type="button"
            >
              Добавить транзакцию
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto bg-slate-50 px-4 pb-4">
        <section className="space-y-3 pt-2">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filterUser === null
                  ? "bg-slate-800 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
              onClick={() => setFilterUser(null)}
              type="button"
            >
              Все
            </button>
            {currentTripMembers.map((member) => (
              <button
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filterUser === String(member.id)
                    ? "bg-slate-800 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
                key={member.id}
                onClick={() => setFilterUser(String(member.id))}
                type="button"
              >
                {member.name}
              </button>
            ))}
          </div>

          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pl-1">
            Последние оплаты
          </h2>
          
          {loading ? <p className="text-sm text-slate-500 pl-1">Загрузка...</p> : null}
          
          <div className="space-y-2">
            {filteredExpenses.map((expense) => (
              <button
                className="w-full text-left"
                key={expense.id}
                onClick={() => onOpenExpense(expense.id)}
                type="button"
              >
                <Card className="rounded-xl p-3 transition-colors hover:bg-slate-50 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                           {CATEGORY_LABELS[expense.category] ?? expense.category}
                         </span>
                         <span className="text-xs text-slate-400">•</span>
                         <span className="text-xs text-slate-500">
                           {getMemberName(currentTripMembers, expense.payerId)}
                         </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                      {formatMoney(expense.amount)} {currency}
                    </p>
                  </div>
                </Card>
              </button>
            ))}
          </div>
          
          {!loading && filteredExpenses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">Здесь пока пусто</p>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default GroupDetailsScreen;
