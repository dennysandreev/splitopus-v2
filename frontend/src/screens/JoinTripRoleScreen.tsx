import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { type JoinTripPreview, useStore } from "../store/useStore";

interface JoinTripRoleScreenProps {
  code: string;
  onBack: () => void;
  onOpenSettings: () => void;
  onJoined: (tripId: string) => void;
}

function JoinTripRoleScreen({
  code,
  onBack,
  onOpenSettings,
  onJoined,
}: JoinTripRoleScreenProps) {
  const [preview, setPreview] = useState<JoinTripPreview | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [linkRequested, setLinkRequested] = useState(false);

  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const user = useStore((state) => state.user);
  const groups = useStore((state) => state.groups);
  const joinTrip = useStore((state) => state.joinTrip);
  const fetchJoinTripPreview = useStore((state) => state.fetchJoinTripPreview);
  const requestPartnerLink = useStore((state) => state.requestPartnerLink);

  useEffect(() => {
    let active = true;

    const loadPreview = async () => {
      const data = await fetchJoinTripPreview(code);
      if (active && data) {
        setPreview(data);
      }
    };

    void loadPreview();

    return () => {
      active = false;
    };
  }, [code, fetchJoinTripPreview]);

  const participants = useMemo(() => {
    const list = preview?.participants ?? [];
    if (!user?.id) {
      return list;
    }

    return list.filter((member) => String(member.id) !== String(user.id));
  }, [preview, user?.id]);

  const handleJoinAsIndependent = async () => {
    const tripId = await joinTrip(code);
    if (tripId) {
      onJoined(tripId);
      return;
    }

    const fallbackTrip = groups.find((trip) => trip.code.toUpperCase() === code.toUpperCase());
    if (fallbackTrip) {
      onJoined(fallbackTrip.id);
      return;
    }

    alert("Не удалось вступить в поездку. Проверьте код.");
  };

  const handleRequestPartnerLink = async () => {
    if (!selectedPartnerId) {
      alert("Выберите партнера");
      return;
    }

    const ok = await requestPartnerLink(code, selectedPartnerId);
    if (ok) {
      setLinkRequested(true);
    } else {
      alert("Не удалось отправить запрос на привязку");
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar onBack={onBack} onSettings={onOpenSettings} title="Выбор роли" />
      </header>

      <main className="app-main">
        <div className="space-y-4">
          <Card className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-wide text-textMuted">Код поездки</p>
            <p className="text-lg font-semibold text-textMain">{preview?.code ?? code}</p>
            <p className="text-sm text-textMuted">
              {preview?.name ? `Поездка: ${preview.name}` : "Название поездки пока недоступно"}
            </p>
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="text-base font-semibold text-textMain">Как вы хотите участвовать?</h2>
            <Button disabled={loading} fullWidth onClick={handleJoinAsIndependent}>
              👤 Я самостоятельный участник
            </Button>
            <p className="text-xs text-textMuted">
              Полноценный участник с отдельным балансом и персональными расходами.
            </p>
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="text-base font-semibold text-textMain">💞 Присоединиться к партнеру</h2>
            <p className="text-xs text-textMuted">
              Выберите участника, к которому хотите привязаться (семейный режим).
            </p>

            {participants.length > 0 ? (
              <div className="space-y-2">
                {participants.map((member) => (
                  <label
                    className="flex items-center gap-3 rounded-input border border-borderSoft bg-white px-3 py-2"
                    htmlFor={`partner-${member.id}`}
                    key={member.id}
                  >
                    <input
                      checked={selectedPartnerId === String(member.id)}
                      id={`partner-${member.id}`}
                      onChange={() => setSelectedPartnerId(String(member.id))}
                      type="radio"
                    />
                    <span className="text-sm text-textMain">{member.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-textMuted">
                Список участников пока недоступен. Попробуйте позже.
              </p>
            )}

            <Button
              disabled={loading || participants.length === 0}
              fullWidth
              onClick={handleRequestPartnerLink}
              variant="secondary"
            >
              Отправить запрос партнеру
            </Button>

            {linkRequested ? (
              <p className="text-sm font-medium text-primary">Ожидание подтверждения...</p>
            ) : null}
          </Card>

          {loading ? <p className="text-sm text-textMuted">Загрузка...</p> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </main>
    </div>
  );
}

export default JoinTripRoleScreen;
