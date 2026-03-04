import { useEffect, useMemo, useState } from "react";
import WebApp from "@twa-dev/sdk";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";
import { CATEGORY_LABELS, formatMoney } from "../utils/format";
import { hapticLight } from "../utils/haptics";
import { getMemberName } from "../utils/members";

interface GroupDetailsScreenProps {
  tripId: string;
  onBack: () => void;
  onGoGroups: () => void;
  onOpenDebts: () => void;
  onOpenStats: () => void;
  onOpenNotes: () => void;
  onOpenRoulette: () => void;
  onOpenAddExpense: () => void;
  onOpenExpense: (expenseId: string) => void;
  onOpenSettings: () => void;
}

function GroupDetailsScreen({
  tripId,
  onBack,
  onGoGroups,
  onOpenDebts,
  onOpenStats,
  onOpenNotes,
  onOpenRoulette,
  onOpenAddExpense,
  onOpenExpense,
  onOpenSettings,
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
  const leaveTrip = useStore((state) => state.leaveTrip);
  const deleteTrip = useStore((state) => state.deleteTrip);

  useEffect(() => {
    void fetchExpenses(tripId);
    void fetchDebts(tripId);
    void fetchTripMembers(tripId);
  }, [tripId, fetchExpenses, fetchDebts, fetchTripMembers]);

  const trip = groups.find((group) => group.id === tripId);
  const currency = trip?.currency ?? "THB";
  const myBalance = user ? balances?.[String(user.id)] || 0 : 0;
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const isCreator = Boolean(trip && user && String(trip.creatorId) === String(user.id));

  const filteredExpenses = useMemo(() => {
    if (!filterUser) {
      return expenses;
    }

    return expenses.filter((expense) => String(expense.payerId) === String(filterUser));
  }, [expenses, filterUser]);

  const linkedGroups = useMemo(() => {
    const buckets = new Map<string, string[]>();

    currentTripMembers.forEach((member) => {
      const key = member.linkedTo ? String(member.linkedTo) : String(member.id);
      const list = buckets.get(key) ?? [];
      list.push(member.name);
      buckets.set(key, list);
    });

    return Array.from(buckets.entries())
      .map(([masterId, names]) => {
        const masterName =
          currentTripMembers.find((member) => String(member.id) === masterId)?.name ??
          names[0];
        const uniqNames = Array.from(new Set([masterName, ...names]));
        return uniqNames;
      })
      .filter((names) => names.length > 1);
  }, [currentTripMembers]);

  const handleShare = () => {
    if (!trip?.code || !trip?.name) {
      return;
    }

    hapticLight();
    const botStartLink = `https://t.me/splitopus_bot?start=${trip.code}`;
    const shareText = encodeURIComponent(
      `Присоединяйся к поездке "${trip.name}" в Splitopus! 🌴\nКод: ${trip.code}\n👉 ${botStartLink}`,
    );
    const shareUrl = encodeURIComponent(botStartLink);
    WebApp.openTelegramLink(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`);
  };

  const handleTripAction = async () => {
    if (!trip) {
      return;
    }

    if (isCreator) {
      const confirmed = window.confirm(
        "Вы точно хотите удалить поездку? Это действие нельзя отменить.",
      );
      if (!confirmed) {
        return;
      }

      try {
        await deleteTrip(trip.id);
        onGoGroups();
      } catch {
        alert("Не удалось удалить поездку.");
      }
      return;
    }

    const confirmed = window.confirm("Выйти из поездки?");
    if (!confirmed) {
      return;
    }

    try {
      await leaveTrip(trip.id);
      onGoGroups();
    } catch (error) {
      if (error instanceof Error && error.message === "BALANCE_NOT_ZERO") {
        alert("Сначала рассчитайтесь с долгами! Ваш баланс должен быть 0.");
        return;
      }

      alert("Не удалось покинуть поездку.");
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar onBack={onBack} onSettings={onOpenSettings} title="Детали поездки" />
      </header>

      <main className="app-main pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        <Card className="relative overflow-hidden p-5">
          <div className="pointer-events-none absolute inset-0 bg-hero-tint" />
          <div className="relative">
            <p className="text-sm font-medium text-textMuted">Мой баланс</p>
            <p
              className={`mt-1 text-4xl font-bold tracking-tight ${
                myBalance >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {myBalance > 0 ? "+" : ""}
              {formatMoney(myBalance)} {currency}
            </p>
            <p className="mt-2 text-sm text-textMuted">Всего в поездке: {formatMoney(totalSpent)} {currency}</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button className="h-14 text-base" onClick={onOpenStats} variant="secondary">
                📊 Статистика
              </Button>
              <Button className="h-14 text-base" onClick={onOpenDebts} variant="secondary">
                ⚖️ Баланс
              </Button>
              <Button className="h-14 text-base" onClick={onOpenNotes} variant="secondary">
                📝 Заметки
              </Button>
              <Button className="h-14 text-base" onClick={onOpenRoulette} variant="secondary">
                🎲 Рулетка
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                className="min-w-[132px] rounded-full border border-primary bg-primary/5 px-4 py-2 text-xs font-medium text-primary transition hover:bg-primary/10"
                onClick={handleShare}
                type="button"
              >
                🔗 Поделиться
              </button>
              <button
                className="min-w-[164px] rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                disabled={loading}
                onClick={() => void handleTripAction()}
                type="button"
              >
                {isCreator ? "🗑 Удалить поездку" : "🚪 Покинуть поездку"}
              </button>
            </div>
          </div>
        </Card>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            className={`chip-pill shrink-0 ${
              filterUser === null
                ? "bg-primary text-white"
                : "bg-white text-textMuted border border-borderSoft"
            }`}
            onClick={() => {
              hapticLight();
              setFilterUser(null);
            }}
            type="button"
          >
            Все
          </button>
          {currentTripMembers.map((member) => (
            <button
              className={`chip-pill shrink-0 ${
                filterUser === String(member.id)
                  ? "bg-primary text-white"
                  : "bg-white text-textMuted border border-borderSoft"
              }`}
              key={member.id}
              onClick={() => {
                hapticLight();
                setFilterUser(String(member.id));
              }}
              type="button"
            >
              {member.name}
            </button>
          ))}
        </div>

        {linkedGroups.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {linkedGroups.map((names, index) => (
              <span
                className="rounded-full border border-borderSoft bg-white px-3 py-1 text-xs text-textMuted"
                key={`${names.join("-")}-${index}`}
              >
                {names.join(" + ")}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-textMuted">
            Последние оплаты
          </h2>

          {loading ? <p className="px-1 text-sm text-textMuted">Загрузка...</p> : null}

          {filteredExpenses.map((expense) => (
            <button
              className="w-full text-left"
              key={expense.id}
              onClick={() => {
                hapticLight();
                onOpenExpense(expense.id);
              }}
              type="button"
            >
              <Card className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-textMain">
                      {expense.description}
                    </p>
                    <p className="mt-1 text-xs text-textMuted">
                      {CATEGORY_LABELS[expense.category] ?? expense.category} ·{" "}
                      {getMemberName(currentTripMembers, expense.payerId)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-textMain">
                    {formatMoney(expense.amount)} {currency}
                  </p>
                </div>
              </Card>
            </button>
          ))}

          {!loading && filteredExpenses.length === 0 ? (
            <Card>
              <p className="text-center text-sm text-textMuted">Пока нет оплат</p>
            </Card>
          ) : null}
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 mx-auto w-full max-w-xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto">
          <Button className="w-full" onClick={onOpenAddExpense}>
            Добавить транзакцию
          </Button>
        </div>
      </div>
    </div>
  );
}

export default GroupDetailsScreen;
