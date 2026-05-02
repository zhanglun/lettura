import React, { useState, useCallback, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
  if (pathname.startsWith("/local/topics")) return "hidden";
  if (pathname.startsWith("/local/starred")) return "hidden";
  if (pathname.startsWith("/search")) return "hidden";
  if (/^\/local\/feeds\/[^/]+\/articles\/[^/]+/.test(pathname)) {
    return "hidden";
  }
  if (
    pathname.startsWith("/local/all") ||
    pathname.startsWith("/local/feeds")
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

  const effectiveSidebarCollapsed =
    sidebarContext === "today" || sidebarContext === "feeds"
      ? false
      : sidebarCollapsed;
  const showSidebar = !effectiveSidebarCollapsed && sidebarContext !== "hidden";

  return (
    <div className="flex flex-row h-full bg-canvas">
      <Rail />
      <AnimatePresence initial={false}>
        {showSidebar && (
          <motion.div
            key="app-sidebar"
            className="h-full shrink-0 overflow-hidden"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
          >
            <Sidebar
              collapsed={false}
              onToggle={toggleSidebar}
              context={sidebarContext}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 overflow-hidden h-full">
        <Outlet />
      </div>
    </div>
  );
});
