import { ReactNode } from "react";

interface RightPanelProps {
  expanded: boolean;
  children: ReactNode;
}

export function RightPanel({ expanded, children }: RightPanelProps) {
  return (
    <div
      data-testid="right-panel"
      className={`today-right-panel ${
        expanded ? "today-right-panel--expanded" : ""
      }`}
      style={{ width: expanded ? "var(--right-panel-expanded-width)" : "var(--right-panel-collapsed-width)" }}
    >
      {children}
    </div>
  );
}
