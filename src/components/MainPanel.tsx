import { ReactNode } from "react";

export const MainPanel = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative flex flex-col w-full h-[100vh]">
      <div className="flex-1 grid grid-cols-1 p-2 pl-0 overflow-hidden">
        <div className="bg-panel flex w-full h-full flex-1 overflow-hidden rounded-md border">{children}</div>
      </div>
    </div>
  );
};
