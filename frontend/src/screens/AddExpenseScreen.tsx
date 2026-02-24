import { useEffect, useState } from "react";
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
  const [category, setCategory] = useState("other");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
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
      return;
    }

    setSelectedMemberIds(currentTripMembers.map((member) => member.id));
  }, [currentTripMembers]);

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
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
    if (selectedMemberIds.length === 0) {
      alert("Ошибка: Выберите хотя бы одного участника.");
      return;
    }

    const splitAmount = normalizedAmount / selectedMemberIds.length;
    const split = Object.fromEntries(
      selectedMemberIds.map((memberId) => [memberId, splitAmount]),
    );

    await addExpense({
      trip_id: tripId,
      payer_id: String(user.id),
      amount: normalizedAmount,
      description: description.trim(),
      category: category.trim() || "other",
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
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
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              id="category"
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Например, food"
              type="text"
              value={category}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-600">Участники</p>
            {loading && currentTripMembers.length === 0 ? (
              <p className="text-sm text-slate-500">Загрузка участников...</p>
            ) : null}
            {error && currentTripMembers.length === 0 ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : null}
            <div className="space-y-2">
              {currentTripMembers.map((member) => (
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
              ))}
            </div>
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
