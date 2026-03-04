import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";

interface JoinTripScreenProps {
  onBack: () => void;
  onOpenSettings: () => void;
  onContinue: (code: string) => void;
}

function JoinTripScreen({ onBack, onOpenSettings, onContinue }: JoinTripScreenProps) {
  const [code, setCode] = useState("");

  const handleContinue = () => {
    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.length !== 6) {
      alert("Код должен содержать 6 символов");
      return;
    }

    onContinue(normalizedCode);
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
          <Button fullWidth onClick={handleContinue}>
            Продолжить
          </Button>
        </Card>
      </main>
    </div>
  );
}

export default JoinTripScreen;
