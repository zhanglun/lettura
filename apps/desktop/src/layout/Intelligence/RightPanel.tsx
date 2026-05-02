import { ReactNode } from "react";

interface RightPanelProps {
  expanded: boolean;
  children: ReactNode;
}

export function RightPanel({ expanded, children }: RightPanelProps) {
  return (
    <div
      data-testid="right-panel"
      className={`h-full min-w-0 border-l border-[var(--gray-4)] overflow-hidden transition-all duration-300 ease-in-out shrink-0 flex flex-col ${
        expanded ? "bg-[var(--color-background)]" : "bg-[var(--gray-1)]"
      }`}
      style={{ width: expanded ? "var(--right-panel-expanded-width)" : "var(--right-panel-collapsed-width)" }}
    >
      {children}
    </div>
  );
}
