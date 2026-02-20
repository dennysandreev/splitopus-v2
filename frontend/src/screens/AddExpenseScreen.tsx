import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface AddExpenseScreenProps {
  tripId: string | null;
  onBack: () => void;
}

function AddExpenseScreen({ tripId, onBack }: AddExpenseScreenProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("FOOD"); // Default category
  
  const addExpense = useStore((state) => state.addExpense);
  const loading = useStore((state) => state.loading);

  const handleSave = async () => {
    const normalizedAmount = Number(amount);

    if (!tripId || !description.trim() || Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
      return;
    }

    await addExpense({
      trip_id: tripId,
      payer_id: "12345", // TODO: Get from Telegram WebApp initData
      amount: normalizedAmount,
      description: description.trim(),
      category: category,
      split: {}, // TODO: Implement split selection
    });
    onBack();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onBack={onBack} title="Новый расход" />
      <main className="p-4 space-y-4">
        <Card className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-slate-600" htmlFor="amount">
              Сумма
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              id="amount"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              type="number"
              value={amount}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-slate-600" htmlFor="description">
              Название
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              id="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Например, Обед"
              type="text"
              value={description}
            />
          </div>
          
           <div className="space-y-1.5">
            <label className="text-sm text-slate-600" htmlFor="category">
              Категория
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none bg-white"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
                <option value="FOOD">Еда 🍔</option>
                <option value="TRANSPORT">Транспорт 🚕</option>
                <option value="HOTEL">Жилье 🏠</option>
                <option value="FUN">Развлечения 🎉</option>
                <option value="OTHER">Другое 📦</option>
            </select>
          </div>

          <Button fullWidth onClick={handleSave} disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить"}
          </Button>
        </Card>
      </main>
    </div>
  );
}

export default AddExpenseScreen;
