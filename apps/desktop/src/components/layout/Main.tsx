import { Outlet } from "react-router-dom";

export function Main() {
  return (
    <div className="flex-1 overflow-hidden h-full">
      <Outlet />
    </div>
  );
}
