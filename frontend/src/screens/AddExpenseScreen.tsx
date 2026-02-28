import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { type TripMember, useStore } from "../store/useStore";
import { CATEGORY_LABELS, formatMoney } from "../utils/format";

interface AddExpenseScreenProps {
  tripId: string | null;
  onBack: () => void;
  onOpenSettings: () => void;
}

type SplitMode = "equal" | "exact";
type ExpenseCategoryCode = "FOOD" | "ALCOHOL" | "TRANSPORT" | "SHOP" | "FUN" | "HOME" | "OTHER";

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
    const master = group.find((item) => String(item.id) === key) ?? group[0];
    return {
      masterId: String(master.id),
      label: group.length > 1 ? `Семья ${master.name}` : master.name,
    };
  });
}

function AddExpenseScreen({ tripId, onBack, onOpenSettings }: AddExpenseScreenProps) {
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

  const memberGroups = useMemo(() => buildMemberGroups(currentTripMembers), [currentTripMembers]);

  useEffect(() => {
    if (tripId) {
      void fetchTripMembers(tripId);
    }
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

  const handleSave = async () => {
    const normalizedAmount = Number(amount);

    if (!tripId) return alert("Не выбрана поездка");
    if (!user) return alert("Пользователь не авторизован");
    if (!description.trim()) return alert("Введите название");
    if (Number.isNaN(normalizedAmount) || normalizedAmount <= 0) return alert("Введите корректную сумму");

    let split: Record<string, number> = {};

    if (splitMode === "equal") {
      if (selectedGroupMasterIds.length === 0) return alert("Выберите участников");
      const splitAmount = normalizedAmount / selectedGroupMasterIds.length;
      split = Object.fromEntries(selectedGroupMasterIds.map((id) => [id, splitAmount]));
    } else {
      const exactSplit = Object.fromEntries(
        memberGroups.map((group) => {
          const value = Number(exactAmounts[group.masterId] ?? "");
          return [group.masterId, Number.isFinite(value) && value > 0 ? value : 0];
        }),
      ) as Record<string, number>;

      const exactTotal = Number(
        Object.values(exactSplit)
          .reduce((sum, value) => sum + value, 0)
          .toFixed(2),
      );

      if (exactTotal !== Number(normalizedAmount.toFixed(2))) {
        return alert("Сумма долей должна совпадать с общей суммой");
      }

      split = Object.fromEntries(Object.entries(exactSplit).filter(([, value]) => value > 0));
      if (Object.keys(split).length === 0) return alert("Укажите хотя бы одну долю");
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
    <div className="app-shell">
      <header className="app-header">
        <Navbar onBack={onBack} onSettings={onOpenSettings} title="Добавить транзакцию" />
      </header>

      <main className="app-main pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Card className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm text-textMuted" htmlFor="amount">
              Сумма
            </label>
            <input
              className="input-premium"
              id="amount"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="1500"
              step="0.1"
              type="number"
              value={amount}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-textMuted" htmlFor="description">
              Название
            </label>
            <input
              className="input-premium"
              id="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ужин"
              type="text"
              value={description}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-textMuted" htmlFor="category">
              Категория
            </label>
            <select
              className="input-premium"
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

          <div className="rounded-input bg-primary/5 p-1">
            <div className="flex gap-2">
              <button
                className={`flex-1 rounded-input px-3 py-2 text-sm font-medium ${
                  splitMode === "equal" ? "bg-white text-textMain" : "text-textMuted"
                }`}
                onClick={() => setSplitMode("equal")}
                type="button"
              >
                Поровну
              </button>
              <button
                className={`flex-1 rounded-input px-3 py-2 text-sm font-medium ${
                  splitMode === "exact" ? "bg-white text-textMain" : "text-textMuted"
                }`}
                onClick={() => setSplitMode("exact")}
                type="button"
              >
                Точная сумма
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {splitMode === "equal"
              ? memberGroups.map((group) => (
                  <label
                    className="flex items-center gap-3 rounded-input border border-borderSoft bg-white px-3 py-2"
                    htmlFor={`member-${group.masterId}`}
                    key={group.masterId}
                  >
                    <input
                      checked={selectedGroupMasterIds.includes(group.masterId)}
                      id={`member-${group.masterId}`}
                      onChange={() =>
                        setSelectedGroupMasterIds((prev) =>
                          prev.includes(group.masterId)
                            ? prev.filter((id) => id !== group.masterId)
                            : [...prev, group.masterId],
                        )
                      }
                      type="checkbox"
                    />
                    <span className="text-sm text-textMain">{group.label}</span>
                  </label>
                ))
              : memberGroups.map((group) => (
                  <div
                    className="flex items-center gap-3 rounded-input border border-borderSoft bg-white px-3 py-2"
                    key={group.masterId}
                  >
                    <span className="flex-1 text-sm text-textMain">{group.label}</span>
                    <input
                      className="w-28 rounded-input border border-borderSoft px-2 py-1.5 text-right text-base text-textMain"
                      onChange={(event) =>
                        setExactAmounts((prev) => ({
                          ...prev,
                          [group.masterId]: event.target.value,
                        }))
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
            <p className="text-xs text-textMuted">
              По {formatMoney(Number(amount) / selectedGroupMasterIds.length || 0)} каждому
            </p>
          ) : null}

          {splitMode === "exact" ? (
            <p className="text-xs text-textMuted">
              Сумма долей: {formatMoney(
                Object.values(exactAmounts).reduce((sum, value) => {
                  const num = Number(value);
                  return sum + (Number.isFinite(num) ? num : 0);
                }, 0),
              )} / {formatMoney(Number(amount || 0))}
            </p>
          ) : null}

          <Button disabled={loading} fullWidth onClick={handleSave}>
            Сохранить
          </Button>
        </Card>
      </main>
    </div>
  );
}

export default AddExpenseScreen;
