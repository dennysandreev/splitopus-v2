import WebApp from "@twa-dev/sdk";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface SettingsScreenProps {
  onBack: () => void;
}

function SettingsScreen({ onBack }: SettingsScreenProps) {
  const user = useStore((state) => state.user);

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar onBack={onBack} title="Настройки" />
      </header>
      <main className="app-main">
        <div className="space-y-3">
          <Card>
            <p className="text-sm text-textMuted">Пользователь</p>
            <p className="mt-1 text-base font-semibold text-textMain">
              {user ? `${user.firstName} (${user.id})` : "Не авторизован"}
            </p>
          </Card>

          <Card className="space-y-2">
            <Button
              fullWidth
              onClick={() => {
                WebApp.openTelegramLink("https://t.me/SplitopusBot");
              }}
              variant="secondary"
            >
              Открыть бота
            </Button>
            <Button
              fullWidth
              onClick={() => {
                WebApp.close();
              }}
              variant="secondary"
            >
              Закрыть Mini App
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default SettingsScreen;
