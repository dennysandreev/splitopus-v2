import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
