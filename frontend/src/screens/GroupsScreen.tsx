import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface GroupsScreenProps {
  onSelectGroup: (groupId: string) => void;
  onOpenSettings: () => void;
  onOpenJoinTrip: () => void;
}

const CURRENCY_OPTIONS = ["THB", "RUB", "USD", "EUR"];

function GroupsScreen({ onSelectGroup, onOpenSettings, onOpenJoinTrip }: GroupsScreenProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tripName, setTripName] = useState("");
  const [tripCurrency, setTripCurrency] = useState("THB");

  const groups = useStore((state) => state.groups);
  const loading = useStore((state) => state.loading);
  const createTrip = useStore((state) => state.createTrip);
  const fetchTrips = useStore((state) => state.fetchTrips);

  const handleCreateTrip = async () => {
    const normalizedName = tripName.trim();
    if (!normalizedName) {
      return;
    }

    try {
      const success = await createTrip(normalizedName, tripCurrency);
      if (!success) {
        throw new Error("Не удалось создать поездку");
      }

      setTripName("");
      setTripCurrency("THB");
      setIsCreateOpen(false);
      await fetchTrips();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ошибка создания поездки");
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar onSettings={onOpenSettings} title="Splitopus" />
        <div className="px-4 pb-4">
          <h1 className="text-2xl font-semibold text-textMain">Мои путешествия 🌍</h1>
          <p className="mt-1 text-sm text-textMuted">
            Выберите поездку, чтобы управлять расходами.
          </p>
          <div className="mt-4 flex gap-3">
            <Button className="flex-1" onClick={() => setIsCreateOpen(true)}>
              Создать поездку
            </Button>
            <Button className="flex-1" onClick={onOpenJoinTrip} variant="secondary">
              Вступить
            </Button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="space-y-3">
          {groups.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm font-medium text-textMain">Здесь будут ваши поездки</p>
              <p className="mt-2 text-xs text-textMuted">
                Создайте первую поездку или присоединитесь по коду приглашения.
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
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-textMain">{group.name}</p>
                    <p className="mt-1 text-xs text-textMuted">
                      {group.createdAt
                        ? `Создана ${new Date(group.createdAt).toLocaleDateString("ru-RU")}`
                        : `Код: ${group.code}`}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {group.currency}
                  </span>
                </div>
                <p className="mt-3 text-xs text-textMuted">
                  {typeof group.participantsCount === "number"
                    ? `Участников: ${group.participantsCount}`
                    : "Участники: обновляются после синхронизации"}
                </p>
                {group.members.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {group.members.slice(0, 5).map((member) => (
                      <span
                        className="rounded-full border border-borderSoft bg-slate-50 px-2 py-0.5 text-[11px] text-textMuted"
                        key={member}
                      >
                        {member}
                      </span>
                    ))}
                    {group.members.length > 5 ? (
                      <span className="rounded-full border border-borderSoft bg-slate-50 px-2 py-0.5 text-[11px] text-textMuted">
                        +{group.members.length - 5}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            </button>
          ))}

          {loading ? <p className="text-sm text-textMuted">Загрузка...</p> : null}
        </div>
      </main>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-slate-900/35 p-4">
          <Card className="w-full max-w-md space-y-4 p-5">
            <h2 className="text-lg font-semibold text-textMain">Новая поездка</h2>

            <div>
              <label className="mb-1.5 block text-sm text-textMuted" htmlFor="trip-name">
                Название
              </label>
              <input
                className="input-premium"
                id="trip-name"
                onChange={(event) => setTripName(event.target.value)}
                placeholder="Например, Пхукет 2026"
                type="text"
                value={tripName}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-textMuted" htmlFor="trip-currency">
                Валюта
              </label>
              <select
                className="input-premium"
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

            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setIsCreateOpen(false)} variant="secondary">
                Отмена
              </Button>
              <Button className="flex-1" disabled={loading} onClick={handleCreateTrip}>
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
