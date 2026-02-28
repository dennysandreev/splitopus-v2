import Button from "../components/Button";

interface AuthFallbackScreenProps {
  onOpenSettings: () => void;
}

function AuthFallbackScreen({ onOpenSettings }: AuthFallbackScreenProps) {
  return (
    <div className="app-shell p-6">
      <div className="absolute right-4 top-4">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-borderSoft bg-white text-textMain"
          onClick={onOpenSettings}
          type="button"
        >
          ⚙
        </button>
      </div>
      <div className="premium-card mx-auto mt-16 w-full max-w-md p-6 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-hero-tint" />
        <h1 className="mt-4 text-xl font-semibold text-textMain">Откройте через Telegram</h1>
        <p className="mt-2 text-sm text-textMuted">
          Для авторизации Mini App должен быть запущен из Telegram-бота.
        </p>
        <div className="mt-5 space-y-2">
          <a className="block" href="https://t.me/SplitopusBot" rel="noreferrer" target="_blank">
            <Button fullWidth>Открыть бота</Button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default AuthFallbackScreen;
