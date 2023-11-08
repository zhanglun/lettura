import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import reportWebVitals from "./reportWebVitals";
import { Toaster } from "./components/ui/Toaster";
import App from "./App";
import "./index.css";
import ErrorPage from "./ErrorPage";
import { ArticleContainer } from "./layout/Article";
import { RouteConfig } from "./config";
import { General } from "./components/SettingPanel/General";
import { Appearance } from "./components/SettingPanel/Appearance";
import { Shortcut } from "./components/SettingPanel/ShortCut";
import { FeedManager } from "./components/SettingPanel/Content";
import { ImportAndExport } from "./components/SettingPanel/ImportAndExport";
import { SettingDialog } from "./components/SettingPanel/DialogMode";
import { WelcomePage } from "./components/WelcomePage";

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
        element: <WelcomePage />
      },
      {
        path: RouteConfig.TODAY,
        element: <ArticleContainer />,
      },
      {
        path: RouteConfig.ALL,
        element: <ArticleContainer />,
      },
      {
        path: RouteConfig.CHANNEL,
        element: <ArticleContainer />,
      },
      {
        path: RouteConfig.SETTINGS,
        element: <SettingDialog />,
        children: [
          {
            path: RouteConfig.SETTINGS_GENERAL,
            element: <General />,
          },
          {
            path: RouteConfig.SETTINGS_APPEARANCE,
            element: <Appearance />,
          },
          {
            path: RouteConfig.SETTINGS_SHORTCUT,
            element: <Shortcut />,
          },
          {
            path: RouteConfig.SETTINGS_FEED_MANAGER,
            element: <FeedManager />,
          },
          {
            path: RouteConfig.SETTINGS_IMPORT,
            element: <ImportAndExport />,
          },
        ],
      },
    ],
  },
]);
const domNode = document.getElementById("root") as HTMLElement;
const root = createRoot(domNode);

root.render(
  <RouterProvider router={router} />
  // <>
  //   <Toaster />
  //   <App />
  // </>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
