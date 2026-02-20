import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { currentUserId, useStore } from "../store/useStore";

interface AddExpenseScreenProps {
  groupId: string | null;
  onBack: () => void;
}

function AddExpenseScreen({ groupId, onBack }: AddExpenseScreenProps) {
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const addExpense = useStore((state) => state.addExpense);

  const handleSave = () => {
    const normalizedAmount = Number(amount);

    if (!groupId || !title.trim() || Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
      return;
    }

    addExpense({
      groupId,
      title: title.trim(),
      amount: normalizedAmount,
      payerId: currentUserId,
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              id="amount"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Например, 1500"
              type="number"
              value={amount}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-slate-600" htmlFor="title">
              Название
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              id="title"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Например, Ужин"
              type="text"
              value={title}
            />
          </div>

          <Button fullWidth onClick={handleSave}>
            Сохранить
          </Button>
        </Card>
      </main>
    </div>
  );
}

export default AddExpenseScreen;
