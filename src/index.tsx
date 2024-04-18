import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import reportWebVitals from "./reportWebVitals";
import { Toaster } from "./components/ui/sonner";
import App from "./App";
import ErrorPage from "./ErrorPage";
import { RouteConfig } from "./config";
import { ArticleContainer } from "./layout/Article";
import { SearchPage } from "./layout/Search";
import { LocalPage } from "./layout/Local";
import "./index.css";
import { FreshRSSPage } from "./layout/FreshRSS";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <Toaster />
        <App />
      </>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Navigate to={RouteConfig.LOCAL_TODAY} />,
      },
      {
        path: RouteConfig.LOCAL,
        element: <LocalPage />,
        children: [
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
        ],
      },
      {
        path: RouteConfig.SERVICE_FRESHRSS,
        element: <FreshRSSPage />,
      },
      {
        path: RouteConfig.SEARCH,
        element: <SearchPage />,
      },
      // {
      //   path: RouteConfig.SETTINGS,
      //   element: <SettingPage />,
      //   children: [
      //     {
      //       path: RouteConfig.SETTINGS_GENERAL,
      //       element: <General />,
      //     },
      //     {
      //       path: RouteConfig.SETTINGS_APPEARANCE,
      //       element: <Appearance />,
      //     },
      //     {
      //       path: RouteConfig.SETTINGS_SHORTCUT,
      //       element: <Shortcut />,
      //     },
      //     {
      //       path: RouteConfig.SETTINGS_FEED_MANAGER,
      //       element: <FeedManager />,
      //     },
      //     {
      //       path: RouteConfig.SETTINGS_IMPORT,
      //       element: <ImportAndExport />,
      //     },
      //   ],
      // },
    ],
  },
]);
const domNode = document.getElementById("root") as HTMLElement;
const root = createRoot(domNode);

root.render(
  <RouterProvider router={router} />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
