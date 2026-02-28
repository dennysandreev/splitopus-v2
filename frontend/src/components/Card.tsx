import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`premium-card p-4 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
