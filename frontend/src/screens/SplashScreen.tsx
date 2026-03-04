import logoMark from "../assets/brand/logo-mark.svg";

interface SplashScreenProps {
  onOpenSettings: () => void;
}

function SplashScreen({ onOpenSettings }: SplashScreenProps) {
  return (
    <div className="app-shell items-center justify-center px-6">
      <div className="absolute right-4 top-4">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-borderSoft bg-white text-textMain"
          onClick={onOpenSettings}
          type="button"
        >
          ⚙
        </button>
      </div>
      <div className="premium-card w-full max-w-sm p-8 text-center">
        <img alt="Splitopus" className="mx-auto h-16 w-16 rounded-2xl shadow-soft" src={logoMark} />
        <h1 className="mt-4 text-2xl font-semibold text-textMain">Splitopus</h1>
        <p className="mt-2 text-sm text-textMuted">Умный учет расходов в Telegram</p>
      </div>
    </div>
  );
}

export default SplashScreen;
