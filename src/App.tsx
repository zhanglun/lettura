import React, { useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { appWindow } from "@tauri-apps/api/window";
import { Outlet } from "react-router-dom";
import { ChannelList } from "./components/ChannelList";
import { useBearStore } from "./hooks/useBearStore";
import * as dataAgent from "./helpers/dataAgent";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RouteConfig } from "./config";
import { ArticleContainer } from "./containers/Article";
import { SettingContainer } from "./containers/Setting";

import { General } from "./components/SettingPanel/General";
import { FeedManager } from "./components/SettingPanel/Content";
import { ImportAndExport } from "./components/SettingPanel/ImportAndExport";
import { WelcomePage } from "./components/WelcomePage";

import "./styles/index.global.scss";
import { Appearance } from "./components/SettingPanel/Appearance";

let a = 0;

function App() {
  a += 1;
  // fetch('http://lettura./').then((res) => {
  //   console.log(res);
  // })
  const store = useBearStore((state) => ({
    goPreviousArticle: state.goPreviousArticle,
    goNextArticle: state.goNextArticle,
    getUserConfig: state.getUserConfig,
  }));

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

    dataAgent.getUserConfig().then((cfg: any) => {
      console.log("update use config", cfg);

      const { theme, customize_style } = cfg as UserConfig;

      if (theme) {
        // document.body.dataset.palette = theme;
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

  const goPrev = (elem: HTMLElement, tagName: string) => {
    if (tagName === "a") {
    } else if (tagName === "li") {
      store.goPreviousArticle();
    }
  };

  const goNext = (elem: HTMLElement, tagName: string) => {
    if (tagName === "a") {
    } else if (tagName === "li") {
      store.goNextArticle();
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement;
    const tagName = activeElement.tagName.toLowerCase();

    switch (event.key) {
      case "ArrowDown":
      case "j":
        goNext(activeElement, tagName);
        event.preventDefault();
        break;
      case "ArrowUp":
      case "k":
        goPrev(activeElement, tagName);
        event.preventDefault();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", (e) => handleKeyPress(e));
    return () => {
      document.removeEventListener("keydown", (e) => handleKeyPress(e));
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={"/"}
          element={
            <DndProvider backend={HTML5Backend}>
              <div className="flex h-full max-h-full">
                <ChannelList />
                <Outlet />
              </div>
            </DndProvider>
          }
        >
          <Route path={"/"} element={<WelcomePage />} />
          <Route path={RouteConfig.CHANNEL} element={<ArticleContainer />} />
          <Route path={RouteConfig.SETTINGS} element={<SettingContainer />}>
            <Route path={RouteConfig.SETTINGS_GENERAL} element={<General />} />
            <Route
              path={RouteConfig.SETTINGS_APPEARANCE}
              element={<Appearance />}
            />
            <Route
              path={RouteConfig.SETTINGS_FEED_MANAGER}
              element={<FeedManager />}
            />
            <Route
              path={RouteConfig.SETTINGS_IMPORT}
              element={<ImportAndExport />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
