import { hapticLight } from "../utils/haptics";

interface NavbarProps {
  title: string;
  onBack?: () => void;
  onSettings?: () => void;
}

function Navbar({ title, onBack, onSettings }: NavbarProps) {
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
      <h1 className="truncate px-2 text-base font-semibold text-textMain">{title}</h1>
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
