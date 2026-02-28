import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";
import { formatMoney } from "../utils/format";
import { hapticSuccess } from "../utils/haptics";

interface RouletteScreenProps {
  tripId: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

function RouletteScreen({ tripId, onBack, onOpenSettings }: RouletteScreenProps) {
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
        const masterName = currentTripMembers.find((m) => String(m.id) === key)?.name ?? member.name;
        masters.set(key, { id: key, name: masterName });
      }
    });

    return Array.from(masters.values());
  }, [currentTripMembers]);

  const runRoulette = async () => {
    if (rouletteParticipants.length === 0 || isSpinning) return;

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

    window.setTimeout(async () => {
      window.clearInterval(timer);
      const winner = rouletteParticipants[Math.floor(Math.random() * rouletteParticipants.length)];
      setDisplayName(winner.name);

      await addExpense({
        trip_id: tripId,
        payer_id: winner.id,
        amount: normalizedAmount,
        description: `Рулетка: угощение от ${winner.name}`,
        category: "FUN",
        split: { [winner.id]: normalizedAmount },
      });

      hapticSuccess();
      alert(`Победитель: ${winner.name}!`);
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar onBack={onBack} onSettings={onOpenSettings} title="Roulette" />
      </header>

      <main className="app-main">
        <Card className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm text-textMuted" htmlFor="roulette-amount">
              Сумма для угощения
            </label>
            <input
              className="input-premium"
              id="roulette-amount"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="500"
              step="0.1"
              type="number"
              value={amount}
            />
          </div>

          <div className="rounded-card border border-borderSoft bg-hero-tint p-6 text-center">
            <p className="text-sm text-textMuted">Текущий выбор</p>
            <p className="mt-2 text-3xl font-semibold text-textMain">{displayName}</p>
            {amount ? (
              <p className="mt-2 text-sm text-textMuted">Сумма: {formatMoney(Number(amount) || 0)}</p>
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
