import { invoke } from "@tauri-apps/api/core";
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

if ((window as any).__TAURI_INTERNALS__) {
  invoke("get_server_port").then((port) => {
    window.localStorage.setItem("port", String(port));
    root.render(<RouterProvider router={router} />);
  });
} else {
  window.localStorage.setItem("port", "3456");
  root.render(<RouterProvider router={router} />);
}
