import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface JoinTripScreenProps {
  onBack: () => void;
  onOpenSettings: () => void;
  onJoined: (tripId: string) => void;
}

function JoinTripScreen({ onBack, onOpenSettings, onJoined }: JoinTripScreenProps) {
  const [code, setCode] = useState("");
  const loading = useStore((state) => state.loading);
  const joinTrip = useStore((state) => state.joinTrip);
  const groups = useStore((state) => state.groups);

  const handleJoin = async () => {
    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.length !== 6) {
      alert("Код должен содержать 6 символов");
      return;
    }

    const tripId = await joinTrip(normalizedCode);

    if (tripId) {
      onJoined(tripId);
      return;
    }

    const fallbackTrip = groups.find(
      (trip) => trip.code.toUpperCase() === normalizedCode,
    );

    if (fallbackTrip) {
      onJoined(fallbackTrip.id);
      return;
    }

    alert("Не удалось вступить в поездку. Проверьте код.");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar onBack={onBack} onSettings={onOpenSettings} title="Вступить в поездку" />
      </header>
      <main className="app-main">
        <Card className="space-y-4 p-5">
          <p className="text-sm text-textMuted">Введите код приглашения из 6 символов</p>
          <input
            className="input-premium uppercase"
            maxLength={6}
            onChange={(event) => setCode(event.target.value)}
            placeholder="ABC123"
            type="text"
            value={code}
          />
          <Button disabled={loading} fullWidth onClick={handleJoin}>
            Вступить
          </Button>
        </Card>
      </main>
    </div>
  );
}

export default JoinTripScreen;
