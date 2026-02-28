import type { ButtonHTMLAttributes, ReactNode } from "react";
import { hapticLight } from "../utils/haptics";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-soft hover:bg-secondary focus:ring-secondary/35",
  secondary:
    "border border-borderSoft bg-white text-textMain hover:bg-primary/5 focus:ring-secondary/20",
  ghost: "bg-transparent text-textMuted hover:bg-primary/10 focus:ring-secondary/20",
};

function Button({
  children,
  variant = "primary",
  className = "",
  fullWidth = false,
  ...props
}: ButtonProps) {
  const handleClick: ButtonHTMLAttributes<HTMLButtonElement>["onClick"] = (event) => {
    hapticLight();
    props.onClick?.(event);
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-cta px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      type="button"
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

export default Button;
