import { hapticLight } from "../utils/haptics";
import logoMark from "../assets/brand/logo-mark.svg";

interface NavbarProps {
  title: string;
  onBack?: () => void;
  onSettings?: () => void;
}

function Navbar({ title, onBack, onSettings }: NavbarProps) {
  const showLogo = title === "Splitopus";

  return (
    <header className="flex items-center justify-between px-4 py-3">
      <div className="flex w-10 items-center justify-start">
        {onBack ? (
          <button
            aria-label="Назад"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-borderSoft bg-white text-textMain"
            onClick={() => {
              hapticLight();
              onBack();
            }}
            type="button"
          >
            ←
          </button>
        ) : null}
      </div>
      <h1 className="inline-flex items-center gap-2 truncate px-2 text-base font-semibold text-textMain">
        {showLogo ? (
          <img alt="Splitopus" className="h-6 w-6 rounded-lg" src={logoMark} />
        ) : null}
        <span className="truncate">{title}</span>
      </h1>
      <div className="flex w-10 items-center justify-end">
        {onSettings ? (
          <button
            aria-label="Настройки"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-borderSoft bg-white text-textMain"
            onClick={() => {
              hapticLight();
              onSettings();
            }}
            type="button"
          >
            ⚙
          </button>
        ) : (
          <span className="inline-flex h-9 w-9" />
        )}
      </div>
    </header>
  );
}

export default Navbar;
