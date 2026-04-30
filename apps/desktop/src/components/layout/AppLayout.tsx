import React, { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { Rail } from "./Rail";
import { Sidebar } from "./Sidebar";

const SIDEBAR_COLLAPSED_KEY = "lettura_sidebar_collapsed";

function getInitialCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored === "true";
  } catch {
    return false;
  }
}

export const AppLayout = React.memo(function () {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialCollapsed);

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
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className="flex-1 overflow-hidden h-full">
        <Outlet />
      </div>
    </div>
  );
});
