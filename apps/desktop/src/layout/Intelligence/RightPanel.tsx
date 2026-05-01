import { ReactNode } from "react";

interface RightPanelProps {
  expanded: boolean;
  children: ReactNode;
}

export function RightPanel({ expanded, children }: RightPanelProps) {
  return (
    <div
      data-testid="right-panel"
      className="h-full border-l border-[var(--gray-4)] bg-[var(--gray-1)] overflow-hidden transition-all duration-300 ease-in-out shrink-0 flex flex-col"
      style={{ width: expanded ? "480px" : "280px" }}
    >
      {children}
    </div>
  );
}
