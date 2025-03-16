import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { invoke } from "@tauri-apps/api";

import reportWebVitals from "./reportWebVitals";
import App from "./App";
import ErrorPage from "./ErrorPage";
import { RouteConfig } from "./config";
import { ArticleContainer } from "./layout/Article";
import { SearchPage } from "./layout/Search";
import { FreshRSSPage } from "./layout/FreshRSS";

import "./index.css";
import { listen } from "@tauri-apps/api/event";

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
        element: <Navigate to={RouteConfig.LOCAL_TODAY} />,
      },
      // {
      //   path: RouteConfig.LOCAL,
      //   element: <LocalPage />,
      //   children: [
      {
        path: RouteConfig.LOCAL_TODAY,
        element: <ArticleContainer />,
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
        path: RouteConfig.LOCAL_FEED,
        element: <ArticleContainer />,
      },
      //   ],
      // },
      {
        path: RouteConfig.SERVICE_FRESHRSS,
        element: <FreshRSSPage />,
      },
      {
        path: RouteConfig.SEARCH,
        element: <SearchPage />,
      },
    ],
  },
]);
const domNode = document.getElementById("root") as HTMLElement;
const root = createRoot(domNode);

if (typeof window.__TAURI_IPC__ === 'function') {
  invoke("get_server_port").then((port) => {
    console.log("🚀 ~ invoke ~ port:", port);
    window.localStorage.setItem("port", port as string);
    root.render(<RouterProvider router={router} />);
  });
} else {
  window.localStorage.setItem("port", "3456");
  root.render(<RouterProvider router={router} />);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
