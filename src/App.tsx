import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { appWindow } from "@tauri-apps/api/window";
import { emit, listen } from "@tauri-apps/api/event";

import { useBearStore } from "@/stores";
import { RouteConfig } from "./config";

import { CommandPanel } from "./command";
import { SideNav } from "./layout/SideNav";

import "./styles/index.global.scss";

function App() {
  const store = useBearStore((state) => ({
    goPreviousArticle: state.goPreviousArticle,
    goNextArticle: state.goNextArticle,
    getUserConfig: state.getUserConfig,
  }));

  const navigate = useNavigate();

  useEffect(() => {
    listen("go-to-settings", () => {
      console.log(
        "%c Line:34 🍒 go-to-setting",
        "color:#fca650",
        "go-to-setting"
      );
      navigate(RouteConfig.SETTINGS_GENERAL);

    });
  }, []);

  useEffect(() => {
    document
      .getElementById("titlebar-minimize")
      ?.addEventListener("click", () => appWindow.minimize());
    document
      .getElementById("titlebar-maximize")
      ?.addEventListener("click", () => appWindow.toggleMaximize());
    document
      .getElementById("titlebar-close")
      ?.addEventListener("click", () => appWindow.close());
  }, []);

  useEffect(() => {
    store.getUserConfig().then((cfg: UserConfig) => {
      const { theme, customize_style } = cfg;

      if (theme === "system") {
        document.documentElement.dataset.colorScheme = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches
          ? "dark"
          : "light";
      } else {
        document.documentElement.dataset.colorScheme = theme;
      }

      customize_style &&
        Object.keys(customize_style).length &&
        Object.keys(customize_style).forEach((key: string) => {
          document.documentElement.style.setProperty(
            `--reading-editable-${key.replace(/_/gi, "-")}`,
            customize_style[key as keyof CustomizeStyle] as string
          );
        });
    });
  }, []);

  return (
    <>
      <div className="flex h-full max-h-full border-t">
        <SideNav />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
      <CommandPanel />
    </>
  );
}

export default App;
