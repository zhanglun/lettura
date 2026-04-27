import { ReactNode } from "react";

interface MainProps {
  children: ReactNode;
}

export function Main({ children }: MainProps) {
  return (
    <div className="flex-1 min-w-0 h-full overflow-hidden">
      {children}
    </div>
  );
}
