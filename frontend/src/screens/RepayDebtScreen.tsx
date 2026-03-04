import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";
import { formatMoney } from "../utils/format";
import { getMemberName } from "../utils/members";

interface RepayDebtScreenProps {
  tripId: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

interface RecipientOption {
  id: string;
  name: string;
  suggestedAmount?: number;
}

function RepayDebtScreen({ tripId, onBack, onOpenSettings }: RepayDebtScreenProps) {
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");

  const user = useStore((state) => state.user);
  const debts = useStore((state) => state.debts);
  const currentTripMembers = useStore((state) => state.currentTripMembers);
  const loading = useStore((state) => state.loading);
  const fetchDebts = useStore((state) => state.fetchDebts);
  const fetchTripMembers = useStore((state) => state.fetchTripMembers);
  const addExpense = useStore((state) => state.addExpense);

  useEffect(() => {
    void fetchDebts(tripId);
    void fetchTripMembers(tripId);
  }, [tripId, fetchDebts, fetchTripMembers]);

  const masterMembers = useMemo(
    () => currentTripMembers.filter((member) => !member.linkedTo),
    [currentTripMembers],
  );

  const resolveMemberId = (raw: string): string | null => {
    const byId = currentTripMembers.find((member) => String(member.id) === String(raw));
    if (byId) {
      return byId.linkedTo ? String(byId.linkedTo) : String(byId.id);
    }

    const byName = currentTripMembers.find((member) => member.name === raw);
    if (byName) {
      return byName.linkedTo ? String(byName.linkedTo) : String(byName.id);
    }

    return null;
  };

  const recipientOptions = useMemo<RecipientOption[]>(() => {
    const options: RecipientOption[] = [];
    const seen = new Set<string>();
    const userIds = new Set<string>();
    const masterIds = new Set(masterMembers.map((member) => String(member.id)));

    if (user?.id) {
      userIds.add(String(user.id));
      const myMember = currentTripMembers.find(
        (member) => String(member.id) === String(user.id),
      );
      if (myMember?.name) {
        userIds.add(myMember.name);
      }
    }

    debts.forEach((debt) => {
      if (!userIds.has(String(debt.from))) {
        return;
      }

      const resolvedId = resolveMemberId(String(debt.to));
      if (!resolvedId || seen.has(resolvedId) || !masterIds.has(String(resolvedId))) {
        return;
      }

      seen.add(resolvedId);
      options.push({
        id: resolvedId,
        name: getMemberName(currentTripMembers, resolvedId),
        suggestedAmount: debt.amount,
      });
    });

    if (options.length > 0) {
      return options;
    }

    return masterMembers
      .filter((member) => String(member.id) !== String(user?.id))
      .map((member) => ({
        id: String(member.id),
        name: member.name,
      }));
  }, [currentTripMembers, debts, masterMembers, user?.id]);

  useEffect(() => {
    if (recipientOptions.length === 0) {
      setRecipientId("");
      setAmount("");
      return;
    }

    setRecipientId((prev) => prev || recipientOptions[0].id);
    setAmount((prev) => {
      if (prev) {
        return prev;
      }
      const firstAmount = recipientOptions[0].suggestedAmount;
      return firstAmount ? String(firstAmount) : "";
    });
  }, [recipientOptions]);

  useEffect(() => {
    if (!recipientId) {
      return;
    }

    const selected = recipientOptions.find((item) => item.id === recipientId);
    if (selected?.suggestedAmount) {
      setAmount(String(selected.suggestedAmount));
    }
  }, [recipientId, recipientOptions]);

  const handleSubmit = async () => {
    const normalizedAmount = Number(amount);

    if (!user?.id) {
      alert("Пользователь не авторизован");
      return;
    }

    if (!recipientId) {
      alert("Выберите получателя");
      return;
    }

    if (Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
      alert("Введите корректную сумму");
      return;
    }

    const recipientName = getMemberName(currentTripMembers, recipientId);

    await addExpense({
      trip_id: tripId,
      payer_id: String(user.id),
      amount: normalizedAmount,
      description: `Возврат долга: ${recipientName}`,
      category: "REPAYMENT",
      split: {
        [recipientId]: normalizedAmount,
      },
    });

    onBack();
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar onBack={onBack} onSettings={onOpenSettings} title="Вернуть долг" />
      </header>
      <main className="app-main">
        <Card className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm text-textMuted" htmlFor="repay-recipient">
              Кому вернуть
            </label>
            <select
              className="input-premium"
              id="repay-recipient"
              onChange={(event) => setRecipientId(event.target.value)}
              value={recipientId}
            >
              {recipientOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                  {typeof option.suggestedAmount === "number"
                    ? ` (долг ${formatMoney(option.suggestedAmount)})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-textMuted" htmlFor="repay-amount">
              Сумма возврата
            </label>
            <input
              className="input-premium"
              id="repay-amount"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              step="0.1"
              type="number"
              value={amount}
            />
          </div>

          <Button disabled={loading || recipientOptions.length === 0} fullWidth onClick={handleSubmit}>
            Подтвердить возврат
          </Button>

          {recipientOptions.length === 0 ? (
            <p className="text-sm text-textMuted">Нет доступных получателей.</p>
          ) : null}
        </Card>
      </main>
    </div>
  );
}

export default RepayDebtScreen;
