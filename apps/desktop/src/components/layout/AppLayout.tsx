import { ReactNode } from "react";
import { Rail } from "./Rail";
import { Sidebar } from "./Sidebar";
import { Main } from "./Main";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-row h-full bg-canvas">
      <Rail />
      <Sidebar />
      <Main>{children}</Main>
    </div>
  );
}
