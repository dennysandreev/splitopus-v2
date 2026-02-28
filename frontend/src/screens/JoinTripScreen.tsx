import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";

interface JoinTripScreenProps {
  onBack: () => void;
  onOpenSettings: () => void;
}

function JoinTripScreen({ onBack, onOpenSettings }: JoinTripScreenProps) {
  const [code, setCode] = useState("");

  const handleJoin = () => {
    if (!code.trim()) {
      alert("Введите код поездки");
      return;
    }

    alert(`Код ${code.trim()} отправлен. Интеграция API присоединения будет подключена на бэкенде.`);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar onBack={onBack} onSettings={onOpenSettings} title="Join Trip" />
      </header>
      <main className="app-main">
        <Card className="space-y-4 p-5">
          <p className="text-sm text-textMuted">Введите инвайт-код поездки</p>
          <input
            className="input-premium"
            onChange={(event) => setCode(event.target.value)}
            placeholder="Например, PHUKET26"
            type="text"
            value={code}
          />
          <Button fullWidth onClick={handleJoin}>
            Присоединиться
          </Button>
        </Card>
      </main>
    </div>
  );
}

export default JoinTripScreen;
