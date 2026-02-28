import { useEffect } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";
import { formatMoney } from "../utils/format";
import { getMemberName } from "../utils/members";

interface DebtsScreenProps {
  tripId: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

function DebtsScreen({ tripId, onBack, onOpenSettings }: DebtsScreenProps) {
  const debts = useStore((state) => state.debts);
  const balances = useStore((state) => state.balances);
  const groups = useStore((state) => state.groups);
  const currentTripMembers = useStore((state) => state.currentTripMembers);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const fetchDebts = useStore((state) => state.fetchDebts);
  const fetchTripMembers = useStore((state) => state.fetchTripMembers);
  const notifyDebts = useStore((state) => state.notifyDebts);

  useEffect(() => {
    void fetchDebts(tripId);
    void fetchTripMembers(tripId);
  }, [tripId, fetchDebts, fetchTripMembers]);

  const trip = groups.find((group) => group.id === tripId);
  const currency = trip?.currency ?? "THB";

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar onBack={onBack} onSettings={onOpenSettings} title="Balance" />
      </header>

      <main className="app-main">
        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-textMuted">Баланс участников</h2>
              <Button
                className="px-3 py-2 text-xs"
                onClick={() => void notifyDebts(tripId)}
                variant="secondary"
              >
                🔔 Уведомить
              </Button>
            </div>

            {Object.keys(balances).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(balances).map(([idOrName, amount], index) => (
                  <div
                    className="flex items-center justify-between rounded-input border border-borderSoft bg-white px-3 py-2"
                    key={`${idOrName}-${index}`}
                  >
                    <p className="text-sm font-medium text-textMain">
                      {getMemberName(currentTripMembers, idOrName)}
                    </p>
                    <p className={`text-sm font-semibold ${amount >= 0 ? "text-success" : "text-danger"}`}>
                      {amount > 0 ? "+" : ""}
                      {formatMoney(amount)} {currency}
                    </p>
                  </div>
                ))}
              </div>
            ) : !loading ? (
              <p className="text-sm text-textMuted">Баланс пока недоступен</p>
            ) : null}
          </Card>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-textMuted">Расчеты</h2>
            {!loading && debts.length === 0 ? (
              <Card>
                <p className="text-center text-base font-medium text-success">Все в расчете! 🎉</p>
              </Card>
            ) : null}

            {debts.map((debt, index) => (
              <Card key={`${debt.from}-${debt.to}-${index}`}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-textMain">
                    {getMemberName(currentTripMembers, debt.from)} → {getMemberName(currentTripMembers, debt.to)}
                  </p>
                  <p className="text-base font-semibold text-textMain">
                    {formatMoney(debt.amount)} {currency}
                  </p>
                </div>
              </Card>
            ))}
          </section>

          {loading ? <p className="text-sm text-textMuted">Загрузка...</p> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </main>
    </div>
  );
}

export default DebtsScreen;
