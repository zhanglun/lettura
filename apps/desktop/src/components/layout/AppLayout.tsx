import React, { useState, useCallback, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Rail } from "./Rail";
import { Sidebar, SidebarContext } from "./Sidebar";

const SIDEBAR_COLLAPSED_KEY = "lettura_sidebar_collapsed";

function getInitialCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored === "true";
  } catch {
    return false;
  }
}

function getSidebarContext(pathname: string): SidebarContext {
  if (pathname.startsWith("/local/today")) return "today";
  if (pathname.startsWith("/local/topics")) return "topics";
  if (
    pathname.startsWith("/local/all") ||
    pathname.startsWith("/local/feeds") ||
    pathname.startsWith("/local/starred")
  )
    return "feeds";
  return "default";
}

export const AppLayout = React.memo(function () {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialCollapsed);
  const location = useLocation();

  const sidebarContext = useMemo(
    () => getSidebarContext(location.pathname),
    [location.pathname],
  );

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  return (
    <div className="flex flex-row h-full bg-canvas">
      <Rail />
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} context={sidebarContext} />
      <div className="flex-1 overflow-hidden h-full">
        <Outlet />
      </div>
    </div>
  );
});
