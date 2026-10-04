import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import App from "./App";
import { RouteConfig } from "./config";
import ErrorPage from "./ErrorPage";
import { ArticleContainer } from "./layout/Article";
import { FeedsPage } from "./layout/Feeds";
import { SettingPage } from "./layout/Setting";

import "./index.css";
import "./i18n";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Navigate to={RouteConfig.LOCAL_ALL} />,
      },
      {
        path: RouteConfig.LOCAL_ALL,
        element: <ArticleContainer />,
      },
      {
        path: RouteConfig.LOCAL_STARRED,
        element: <ArticleContainer />,
      },
      {
        path: RouteConfig.LOCAL_FEEDS,
        element: <FeedsPage />,
      },
      {
        path: RouteConfig.LOCAL_FEED,
        element: <FeedsPage />,
      },
      {
        path: RouteConfig.LOCAL_ARTICLE,
        element: <ArticleContainer />,
      },
      {
        path: RouteConfig.SETTINGS,
        element: <SettingPage />,
      },
    ],
  },
]);
const domNode = document.getElementById("root") as HTMLElement;
const root = createRoot(domNode);
const inTauri = Boolean((window as any).__TAURI_INTERNALS__);

function boot() {
  root.render(<RouterProvider router={router} />);
  // 首帧提交后再亮窗，避免 transparent 窗口在页面加载前裸露。
  if (inTauri) {
    requestAnimationFrame(() => {
      getCurrentWindow().show();
    });
  }
}

if (inTauri) {
  invoke("get_server_port")
    .then((port) => {
      window.localStorage.setItem("port", String(port));
    })
    .catch(() => {
      // 端口获取失败也要渲染页面；沿用上次端口，没有则回落默认值。
      if (!window.localStorage.getItem("port")) {
        window.localStorage.setItem("port", "3456");
      }
    })
    .finally(boot);
} else {
  window.localStorage.setItem("port", "3456");
  boot();
}
