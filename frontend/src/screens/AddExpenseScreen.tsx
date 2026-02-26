import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface AddExpenseScreenProps {
  tripId: string | null;
  onBack: () => void;
}

type SplitMode = "equal" | "exact";
type ExpenseCategoryCode = "FOOD" | "TRANSPORT" | "HOME" | "SHOP" | "FUN" | "OTHER";

const CATEGORY_OPTIONS: Array<{ code: ExpenseCategoryCode; label: string }> = [
  { code: "FOOD", label: "🍔 Еда" },
  { code: "TRANSPORT", label: "🚕 Транспорт" },
  { code: "HOME", label: "🏠 Жилье" },
  { code: "SHOP", label: "🛒 Магазин" },
  { code: "FUN", label: "🎉 Развлечения" },
  { code: "OTHER", label: "📦 Другое" },
];

function AddExpenseScreen({ tripId, onBack }: AddExpenseScreenProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategoryCode>("OTHER");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const user = useStore((state) => state.user);
  const currentTripMembers = useStore((state) => state.currentTripMembers);
  const addExpense = useStore((state) => state.addExpense);
  const fetchTripMembers = useStore((state) => state.fetchTripMembers);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);

  useEffect(() => {
    if (!tripId) {
      return;
    }

    void fetchTripMembers(tripId);
  }, [tripId, fetchTripMembers]);

  useEffect(() => {
    if (currentTripMembers.length === 0) {
      setSelectedMemberIds([]);
      setExactAmounts({});
      return;
    }

    setSelectedMemberIds(currentTripMembers.map((member) => member.id));
    setExactAmounts((prev) => {
      const next: Record<string, string> = {};
      currentTripMembers.forEach((member) => {
        next[member.id] = prev[member.id] ?? "";
      });
      return next;
    });
  }, [currentTripMembers]);

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const updateExactAmount = (memberId: string, value: string) => {
    setExactAmounts((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  const handleSave = async () => {
    const normalizedAmount = Number(amount);

    if (!tripId) {
      alert("Ошибка: Не выбрана поездка (группа).");
      return;
    }
    if (!user) {
      alert("Ошибка: Пользователь не авторизован.");
      return;
    }
    if (!description.trim()) {
      alert("Ошибка: Введите название расхода.");
      return;
    }
    if (Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
      alert("Ошибка: Введите корректную сумму.");
      return;
    }
    let split: Record<string, number> = {};

    if (splitMode === "equal") {
      if (selectedMemberIds.length === 0) {
        alert("Ошибка: Выберите хотя бы одного участника.");
        return;
      }

      const splitAmount = normalizedAmount / selectedMemberIds.length;
      split = Object.fromEntries(
        selectedMemberIds.map((memberId) => [memberId, splitAmount]),
      );
    } else {
      const exactSplit = Object.fromEntries(
        currentTripMembers.map((member) => {
          const value = Number(exactAmounts[member.id] ?? "");
          return [member.id, Number.isFinite(value) && value > 0 ? value : 0];
        }),
      ) as Record<string, number>;

      const exactTotal = Object.values(exactSplit).reduce((sum, value) => sum + value, 0);
      const roundedExactTotal = Number(exactTotal.toFixed(2));
      const roundedTarget = Number(normalizedAmount.toFixed(2));

      if (roundedExactTotal !== roundedTarget) {
        alert("Ошибка: Сумма точных долей должна совпадать с общей суммой.");
        return;
      }

      split = Object.fromEntries(
        Object.entries(exactSplit).filter(([, value]) => value > 0),
      );

      if (Object.keys(split).length === 0) {
        alert("Ошибка: Укажите хотя бы одну долю.");
        return;
      }
    }

    await addExpense({
      trip_id: tripId,
      payer_id: String(user.id),
      amount: normalizedAmount,
      description: description.trim(),
      category,
      split,
    });

    onBack();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onBack={onBack} title="Новый расход" />
      <main className="p-4">
        <Card className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-slate-600" htmlFor="amount">
              Сумма
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              id="amount"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Например, 1500"
              type="number"
              value={amount}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-slate-600" htmlFor="description">
              Название
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              id="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Например, Ужин"
              type="text"
              value={description}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-slate-600" htmlFor="category">
              Категория
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              id="category"
              onChange={(event) => setCategory(event.target.value as ExpenseCategoryCode)}
              value={category}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-600">Участники</p>
            {loading && currentTripMembers.length === 0 ? (
              <p className="text-sm text-slate-500">Загрузка участников...</p>
            ) : null}
            {error && currentTripMembers.length === 0 ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : null}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  splitMode === "equal"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600"
                }`}
                onClick={() => setSplitMode("equal")}
                type="button"
              >
                Поровну
              </button>
              <button
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  splitMode === "exact"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600"
                }`}
                onClick={() => setSplitMode("exact")}
                type="button"
              >
                Точная сумма
              </button>
            </div>
            <div className="space-y-2">
              {splitMode === "equal"
                ? currentTripMembers.map((member) => (
                    <label
                      className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2"
                      htmlFor={`member-${member.id}`}
                      key={member.id}
                    >
                      <input
                        checked={selectedMemberIds.includes(member.id)}
                        id={`member-${member.id}`}
                        onChange={() => toggleMember(member.id)}
                        type="checkbox"
                      />
                      <span className="text-sm text-slate-900">{member.name}</span>
                    </label>
                  ))
                : currentTripMembers.map((member) => (
                    <div
                      className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2"
                      key={member.id}
                    >
                      <span className="min-w-0 flex-1 text-sm text-slate-900">
                        {member.name}
                      </span>
                      <input
                        className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                        onChange={(event) =>
                          updateExactAmount(member.id, event.target.value)
                        }
                        placeholder="0"
                        step="0.01"
                        type="number"
                        value={exactAmounts[member.id] ?? ""}
                      />
                    </div>
                  ))}
            </div>
            {splitMode === "equal" && selectedMemberIds.length > 0 && amount ? (
              <p className="text-xs text-slate-500">
                По {(
                  Number(amount) / selectedMemberIds.length || 0
                ).toFixed(2)}{" "}
                каждому
              </p>
            ) : null}
            {splitMode === "exact" ? (
              <p className="text-xs text-slate-500">
                Сумма долей:{" "}
                {Object.values(exactAmounts).reduce((sum, value) => {
                  const num = Number(value);
                  return sum + (Number.isFinite(num) ? num : 0);
                }, 0).toFixed(2)}{" "}
                / {Number(amount || 0).toFixed(2)}
              </p>
            ) : null}
          </div>

          <Button disabled={loading} fullWidth onClick={handleSave}>
            Сохранить
          </Button>
        </Card>
      </main>
    </div>
  );
}

export default AddExpenseScreen;
