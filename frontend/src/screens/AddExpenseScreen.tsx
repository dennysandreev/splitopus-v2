import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { type TripMember, useStore } from "../store/useStore";
import { CATEGORY_LABELS, formatMoney } from "../utils/format";

interface AddExpenseScreenProps {
  tripId: string | null;
  onBack: () => void;
}

type SplitMode = "equal" | "exact";
type ExpenseCategoryCode =
  | "FOOD"
  | "ALCOHOL"
  | "TRANSPORT"
  | "SHOP"
  | "FUN"
  | "HOME"
  | "OTHER";

interface MemberGroup {
  masterId: string;
  label: string;
}

const CATEGORY_OPTIONS: Array<{ code: ExpenseCategoryCode; label: string }> = [
  { code: "FOOD", label: CATEGORY_LABELS.FOOD },
  { code: "ALCOHOL", label: CATEGORY_LABELS.ALCOHOL },
  { code: "TRANSPORT", label: CATEGORY_LABELS.TRANSPORT },
  { code: "SHOP", label: CATEGORY_LABELS.SHOP },
  { code: "FUN", label: CATEGORY_LABELS.FUN },
  { code: "HOME", label: CATEGORY_LABELS.HOME },
  { code: "OTHER", label: CATEGORY_LABELS.OTHER },
];

function buildMemberGroups(members: TripMember[]): MemberGroup[] {
  const groups = new Map<string, TripMember[]>();

  members.forEach((member) => {
    const key = member.linkedTo ? String(member.linkedTo) : String(member.id);
    const bucket = groups.get(key) ?? [];
    bucket.push(member);
    groups.set(key, bucket);
  });

  return Array.from(groups.entries()).map(([key, group]) => {
    const master = group.find((m) => String(m.id) === key) ?? group[0];
    const hasLinked = group.length > 1;
    const label = hasLinked ? `Семья ${master.name}` : master.name;

    return {
      masterId: String(master.id),
      label,
    };
  });
}

function AddExpenseScreen({ tripId, onBack }: AddExpenseScreenProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategoryCode>("OTHER");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [selectedGroupMasterIds, setSelectedGroupMasterIds] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});

  const user = useStore((state) => state.user);
  const currentTripMembers = useStore((state) => state.currentTripMembers);
  const addExpense = useStore((state) => state.addExpense);
  const fetchTripMembers = useStore((state) => state.fetchTripMembers);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);

  const memberGroups = useMemo(
    () => buildMemberGroups(currentTripMembers),
    [currentTripMembers],
  );

  useEffect(() => {
    if (!tripId) {
      return;
    }

    void fetchTripMembers(tripId);
  }, [tripId, fetchTripMembers]);

  useEffect(() => {
    if (memberGroups.length === 0) {
      setSelectedGroupMasterIds([]);
      setExactAmounts({});
      return;
    }

    setSelectedGroupMasterIds(memberGroups.map((group) => group.masterId));
    setExactAmounts((prev) => {
      const next: Record<string, string> = {};
      memberGroups.forEach((group) => {
        next[group.masterId] = prev[group.masterId] ?? "";
      });
      return next;
    });
  }, [memberGroups]);

  const toggleGroup = (masterId: string) => {
    setSelectedGroupMasterIds((prev) =>
      prev.includes(masterId)
        ? prev.filter((id) => id !== masterId)
        : [...prev, masterId],
    );
  };

  const updateExactAmount = (masterId: string, value: string) => {
    setExactAmounts((prev) => ({
      ...prev,
      [masterId]: value,
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
      alert("Ошибка: Введите название транзакции.");
      return;
    }
    if (Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
      alert("Ошибка: Введите корректную сумму.");
      return;
    }

    let split: Record<string, number> = {};

    if (splitMode === "equal") {
      if (selectedGroupMasterIds.length === 0) {
        alert("Ошибка: Выберите хотя бы одного участника.");
        return;
      }

      const splitAmount = normalizedAmount / selectedGroupMasterIds.length;
      split = Object.fromEntries(
        selectedGroupMasterIds.map((masterId) => [masterId, splitAmount]),
      );
    } else {
      const exactSplit = Object.fromEntries(
        memberGroups.map((group) => {
          const value = Number(exactAmounts[group.masterId] ?? "");
          return [group.masterId, Number.isFinite(value) && value > 0 ? value : 0];
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
      <Navbar onBack={onBack} title="Новая транзакция" />
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
              step="0.1"
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
            {loading && memberGroups.length === 0 ? (
              <p className="text-sm text-slate-500">Загрузка участников...</p>
            ) : null}
            {error && memberGroups.length === 0 ? (
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
                ? memberGroups.map((group) => (
                    <label
                      className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2"
                      htmlFor={`member-${group.masterId}`}
                      key={group.masterId}
                    >
                      <input
                        checked={selectedGroupMasterIds.includes(group.masterId)}
                        id={`member-${group.masterId}`}
                        onChange={() => toggleGroup(group.masterId)}
                        type="checkbox"
                      />
                      <span className="text-sm text-slate-900">{group.label}</span>
                    </label>
                  ))
                : memberGroups.map((group) => (
                    <div
                      className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2"
                      key={group.masterId}
                    >
                      <span className="min-w-0 flex-1 text-sm text-slate-900">
                        {group.label}
                      </span>
                      <input
                        className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                        onChange={(event) =>
                          updateExactAmount(group.masterId, event.target.value)
                        }
                        placeholder="0"
                        step="0.1"
                        type="number"
                        value={exactAmounts[group.masterId] ?? ""}
                      />
                    </div>
                  ))}
            </div>

            {splitMode === "equal" && selectedGroupMasterIds.length > 0 && amount ? (
              <p className="text-xs text-slate-500">
                По {formatMoney(Number(amount) / selectedGroupMasterIds.length || 0)} каждому
              </p>
            ) : null}
            {splitMode === "exact" ? (
              <p className="text-xs text-slate-500">
                Сумма долей:{" "}
                {formatMoney(
                  Object.values(exactAmounts).reduce((sum, value) => {
                    const num = Number(value);
                    return sum + (Number.isFinite(num) ? num : 0);
                  }, 0),
                )}{" "}
                / {formatMoney(Number(amount || 0))}
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
