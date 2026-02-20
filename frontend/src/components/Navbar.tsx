import Button from "./Button";

interface NavbarProps {
  title: string;
  onBack?: () => void;
}

function Navbar({ title, onBack }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 bg-white/90 p-4 backdrop-blur-sm">
      {onBack ? (
        <Button onClick={onBack} variant="secondary">
          Назад
        </Button>
      ) : null}
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
    </header>
  );
}

export default Navbar;
