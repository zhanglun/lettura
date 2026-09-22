import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { Toaster } from "sonner";
import { invoke } from "@tauri-apps/api/core";

import App from "./App";
import ErrorPage from "./ErrorPage";
import { RouteConfig } from "./config";
import { ArticleContainer } from "./layout/Article";
import { SettingPage } from "./layout/Setting";
import { FeedsPage } from "./layout/Feeds";

import "./index.css";
import "./i18n";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <App />
        <Toaster />
      </>
    ),
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

if (typeof (window as any).__TAURI_INTERNALS__ !== "undefined") {
  invoke("get_server_port").then((port) => {
    window.localStorage.setItem("port", port as string);
    root.render(<RouterProvider router={router} />);
  });
} else {
  window.localStorage.setItem("port", "3456");
  root.render(<RouterProvider router={router} />);
}

