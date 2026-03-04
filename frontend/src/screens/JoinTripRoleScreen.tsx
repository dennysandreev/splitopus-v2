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
  const [pollExpired, setPollExpired] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);

  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const user = useStore((state) => state.user);
  const groups = useStore((state) => state.groups);
  const joinTrip = useStore((state) => state.joinTrip);
  const fetchJoinTripPreview = useStore((state) => state.fetchJoinTripPreview);
  const requestPartnerLink = useStore((state) => state.requestPartnerLink);
  const fetchUserStatus = useStore((state) => state.fetchUserStatus);
  const currentTripMembers = useStore((state) => state.currentTripMembers);
  const fetchTripMembers = useStore((state) => state.fetchTripMembers);

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

  useEffect(() => {
    if (!preview?.tripId) {
      return;
    }

    void fetchTripMembers(preview.tripId);
  }, [preview?.tripId, fetchTripMembers]);

  useEffect(() => {
    if (!linkRequested || pollExpired || !user?.id) {
      return;
    }

    let active = true;
    const startedAt = Date.now();

    const checkStatus = async () => {
      const status = await fetchUserStatus(String(user.id));
      if (!active) {
        return;
      }

      const activeTripId = status?.activeTripId ? String(status.activeTripId) : null;
      const isExpectedTrip =
        !preview?.tripId || (activeTripId && String(preview.tripId) === String(activeTripId));

      if (activeTripId && isExpectedTrip) {
        active = false;
        onJoined(activeTripId);
        return;
      }

      if (Date.now() - startedAt >= 60_000) {
        active = false;
        setPollExpired(true);
      }
    };

    void checkStatus();
    const intervalId = window.setInterval(() => {
      void checkStatus();
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [linkRequested, pollExpired, pollAttempt, user?.id, preview?.tripId, fetchUserStatus, onJoined]);

  const participants = useMemo(() => {
    if (currentTripMembers.length > 0) {
      return currentTripMembers
        .filter((member) => !member.linkedTo)
        .filter((member) => String(member.id) !== String(user?.id))
        .map((member) => ({
          id: String(member.id),
          name: member.name,
        }));
    }

    const list = preview?.participants ?? [];
    if (!user?.id) {
      return list;
    }

    return list.filter((member) => String(member.id) !== String(user.id));
  }, [currentTripMembers, preview?.participants, user?.id]);

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

    if (!preview?.tripId) {
      alert("Не удалось определить поездку. Повторите попытку.");
      return;
    }

    const ok = await requestPartnerLink(preview.tripId, code, selectedPartnerId);
    if (ok) {
      setLinkRequested(true);
      setPollExpired(false);
      setPollAttempt((value) => value + 1);
    } else {
      alert("Не удалось отправить запрос на привязку");
    }
  };

  const handleRetry = () => {
    setPollExpired(false);
    setLinkRequested(true);
    setPollAttempt((value) => value + 1);
  };

  const handleCancelWaiting = () => {
    setLinkRequested(false);
    setPollExpired(false);
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
            <Button disabled={loading || linkRequested} fullWidth onClick={handleJoinAsIndependent}>
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
                      disabled={linkRequested}
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
              disabled={
                loading ||
                participants.length === 0 ||
                linkRequested ||
                !preview?.tripId
              }
              fullWidth
              onClick={handleRequestPartnerLink}
              variant="secondary"
            >
              Отправить запрос партнеру
            </Button>

            {linkRequested ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary">Ожидание подтверждения...</p>
                {pollExpired ? (
                  <div className="flex flex-wrap gap-2">
                    <Button className="flex-1" onClick={handleRetry} variant="secondary">
                      Попробовать снова
                    </Button>
                    <Button className="flex-1" onClick={handleCancelWaiting} variant="ghost">
                      Отмена
                    </Button>
                  </div>
                ) : null}
              </div>
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
