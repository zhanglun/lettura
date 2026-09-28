import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
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

// 数据面全部走 Tauri invoke，不再等待/存储 HTTP 端口；
// Actix 仅承载 /api/rules 与 /api/generated（外部消费的本地 RSS 供应）
root.render(<RouterProvider router={router} />);

