import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";
import { formatMoney } from "../utils/format";

interface RouletteScreenProps {
  tripId: string;
  onBack: () => void;
}

function RouletteScreen({ tripId, onBack }: RouletteScreenProps) {
  const [amount, setAmount] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayName, setDisplayName] = useState<string>("?");

  const currentTripMembers = useStore((state) => state.currentTripMembers);
  const loading = useStore((state) => state.loading);
  const fetchTripMembers = useStore((state) => state.fetchTripMembers);
  const addExpense = useStore((state) => state.addExpense);

  useEffect(() => {
    void fetchTripMembers(tripId);
  }, [tripId, fetchTripMembers]);

  const rouletteParticipants = useMemo(() => {
    const masters = new Map<string, { id: string; name: string }>();

    currentTripMembers.forEach((member) => {
      const key = member.linkedTo ? String(member.linkedTo) : String(member.id);
      if (!masters.has(key)) {
        const masterName =
          currentTripMembers.find((m) => String(m.id) === key)?.name ?? member.name;
        masters.set(key, { id: key, name: masterName });
      }
    });

    return Array.from(masters.values());
  }, [currentTripMembers]);

  const runRoulette = async () => {
    if (rouletteParticipants.length === 0 || isSpinning) {
      return;
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      alert("Введите сумму для рулетки");
      return;
    }

    setIsSpinning(true);
    let tick = 0;

    const timer = window.setInterval(() => {
      const next = rouletteParticipants[tick % rouletteParticipants.length];
      setDisplayName(next.name);
      tick += 1;
    }, 120);

    const spinDurationMs = 4000;
    window.setTimeout(async () => {
      window.clearInterval(timer);
      const winner =
        rouletteParticipants[Math.floor(Math.random() * rouletteParticipants.length)];
      setDisplayName(winner.name);

      await addExpense({
        trip_id: tripId,
        payer_id: winner.id,
        amount: normalizedAmount,
        description: `Рулетка: угощение от ${winner.name}`,
        category: "FUN",
        split: { [winner.id]: normalizedAmount },
      });

      alert(`Победитель: ${winner.name}!`);
      setIsSpinning(false);
    }, spinDurationMs);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onBack={onBack} title="Рулетка 🎲" />
      <main className="space-y-4 p-4">
        <Card className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-slate-600" htmlFor="roulette-amount">
              Сумма для угощения
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              id="roulette-amount"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Например, 500"
              step="0.1"
              type="number"
              value={amount}
            />
          </div>

          <div className="rounded-xl bg-slate-100 p-6 text-center">
            <p className="text-sm text-slate-500">Текущий выбор</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{displayName}</p>
            {amount ? (
              <p className="mt-2 text-sm text-slate-500">
                Сумма: {formatMoney(Number(amount) || 0)}
              </p>
            ) : null}
          </div>

          <Button disabled={loading || isSpinning} fullWidth onClick={runRoulette}>
            {isSpinning ? "Крутим..." : "Крутить! 🎰"}
          </Button>
        </Card>
      </main>
    </div>
  );
}

export default RouletteScreen;
