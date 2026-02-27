import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface GroupsScreenProps {
  onSelectGroup: (groupId: string) => void;
}

const CURRENCY_OPTIONS = ["THB", "RUB", "USD", "EUR"];

function GroupsScreen({ onSelectGroup }: GroupsScreenProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tripName, setTripName] = useState("");
  const [tripCurrency, setTripCurrency] = useState("THB");

  const groups = useStore((state) => state.groups);
  const loading = useStore((state) => state.loading);
  const createTrip = useStore((state) => state.createTrip);

  const handleCreateTrip = async () => {
    const normalizedName = tripName.trim();
    if (!normalizedName) {
      return;
    }

    await createTrip(normalizedName, tripCurrency);
    setTripName("");
    setTripCurrency("THB");
    setIsCreateOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar title="Splitopus 🐙" />
      <main className="space-y-3 p-4">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateOpen(true)} variant="secondary">
            Создать поездку
          </Button>
        </div>

        {groups.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Групп пока нет</p>
            <p className="mt-1 text-xs text-slate-400">
              Здесь будут ваши поездки и общие транзакции с друзьями.
            </p>
          </Card>
        ) : null}

        {groups.map((group) => (
          <button
            className="w-full text-left"
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            type="button"
          >
            <Card className="transition-colors hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-base font-medium text-slate-900">{group.name}</p>
                <p className="text-sm font-semibold text-emerald-600">{group.currency}</p>
              </div>
            </Card>
          </button>
        ))}
      </main>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-30 flex items-end bg-slate-900/40 p-4 sm:items-center sm:justify-center">
          <Card className="w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Новая поездка</h2>

            <div className="space-y-1.5">
              <label className="text-sm text-slate-600" htmlFor="trip-name">
                Название
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                id="trip-name"
                onChange={(event) => setTripName(event.target.value)}
                placeholder="Например, Пхукет 2026"
                type="text"
                value={tripName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-slate-600" htmlFor="trip-currency">
                Валюта
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                id="trip-currency"
                onChange={(event) => setTripCurrency(event.target.value)}
                value={tripCurrency}
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsCreateOpen(false)} variant="secondary">
                Отмена
              </Button>
              <Button disabled={loading} onClick={handleCreateTrip}>
                Создать
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default GroupsScreen;
