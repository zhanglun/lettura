import React, { useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { appWindow } from "@tauri-apps/api/window";
import { Outlet, useNavigate } from "react-router-dom";
import { ChannelList } from "./components/Subscribes";
import { useBearStore } from "@/stores";
import * as dataAgent from "./helpers/dataAgent";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RouteConfig } from "./config";
import { ArticleContainer } from "./layout/Article";
import { SettingContainer } from "./layout/Setting";

import { General } from "./components/SettingPanel/General";
import { FeedManager } from "./components/SettingPanel/Content";
import { ImportAndExport } from "./components/SettingPanel/ImportAndExport";
import { WelcomePage } from "./components/WelcomePage";
import { Appearance } from "./components/SettingPanel/Appearance";

import "./styles/index.global.scss";
import { Shortcut } from "./components/SettingPanel/ShortCut";
import { emit, listen } from "@tauri-apps/api/event";

function App() {
  const store = useBearStore((state) => ({
    goPreviousArticle: state.goPreviousArticle,
    goNextArticle: state.goNextArticle,
    getUserConfig: state.getUserConfig,
    setLastViewRouteBeforeSetting: state.setLastViewRouteBeforeSetting,
  }));

  const navigate = useNavigate();

  useEffect(() => {
    listen("go-to-settings", () => {
      console.log(
        "%c Line:34 🍒 go-to-setting",
        "color:#fca650",
        "go-to-setting"
      );
      store.setLastViewRouteBeforeSetting(Object.assign({ ...location }));
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
    store.getUserConfig();

    dataAgent.getUserConfig().then(({ data: cfg }) => {
      const { theme, customize_style } = cfg as UserConfig;

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
      <div className="flex h-full max-h-full">
        <DndProvider backend={HTML5Backend}>
          <ChannelList />
        </DndProvider>
        <Outlet />
      </div>
    </>
  );
}

export default App;
