import { useEffect } from "react";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface DebtsScreenProps {
  tripId: string;
  onBack: () => void;
}

function DebtsScreen({ tripId, onBack }: DebtsScreenProps) {
  const debts = useStore((state) => state.debts);
  const groups = useStore((state) => state.groups);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const fetchDebts = useStore((state) => state.fetchDebts);

  useEffect(() => {
    void fetchDebts(tripId);
  }, [tripId, fetchDebts]);

  const trip = groups.find((group) => group.id === tripId);
  const currency = trip?.currency ?? "₽";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onBack={onBack} title="Расчет долгов" />
      <main className="space-y-3 p-4">
        {loading ? <p className="text-sm text-slate-500">Загрузка расчетов...</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

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
                {debt.from} {"\u2192"} {debt.to}
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {debt.amount} {currency}
              </p>
            </div>
          </Card>
        ))}
      </main>
    </div>
  );
}

export default DebtsScreen;
