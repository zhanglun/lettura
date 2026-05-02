import { ReactNode } from "react";

export const MainPanel = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[var(--color-panel-solid)]">
      <div className="flex h-full w-full flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};
