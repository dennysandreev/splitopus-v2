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
}

function DebtsScreen({ tripId, onBack }: DebtsScreenProps) {
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
  const currency = trip?.currency ?? "₽";

  const handleNotify = async () => {
    await notifyDebts(tripId);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50">
      <header className="flex-none z-10 bg-slate-50">
        <Navbar onBack={onBack} title="Баланс поездки" />
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
        {loading ? <p className="text-sm text-slate-500">Загрузка расчетов...</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Баланс участников
            </h2>
            <Button onClick={handleNotify} variant="secondary">
              🔔 Отправить расчет всем
            </Button>
          </div>

          {Object.keys(balances).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(balances).map(([idOrName, amount], index) => (
                <div
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                  key={`${idOrName}-${index}`}
                >
                  <p className="text-sm font-medium text-slate-900">
                    {getMemberName(currentTripMembers, idOrName)}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      amount >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {amount > 0 ? "+" : ""}
                    {formatMoney(amount)} {currency}
                  </p>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <p className="text-sm text-slate-500">Баланс пока недоступен</p>
          ) : null}
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Расчеты
          </h2>
          {!loading && debts.length === 0 ? (
            <Card>
              <p className="text-center text-base font-medium text-emerald-600">
                Все в расчете! 🎉
              </p>
            </Card>
          ) : null}

          {debts.map((debt, index) => (
            <Card key={`${debt.from}-${debt.to}-${index}`}>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-slate-900">
                  {getMemberName(currentTripMembers, debt.from)} {"\u2192"}{" "}
                  {getMemberName(currentTripMembers, debt.to)}
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatMoney(debt.amount)} {currency}
                </p>
              </div>
            </Card>
          ))}
        </section>
        </div>
      </main>
    </div>
  );
}

export default DebtsScreen;
